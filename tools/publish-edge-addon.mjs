#!/usr/bin/env node
/**
 * Publish a PageDye Edge package with the Microsoft Edge Add-ons Publish API v1.1.
 *
 * Docs: https://learn.microsoft.com/microsoft-edge/extensions/update/api/using-addons-api
 * Reference: https://learn.microsoft.com/microsoft-edge/extensions/update/api/addons-api-reference
 *
 * v1.1 authenticates with `Authorization: ApiKey <key>` and `X-ClientID: <client id>`.
 * The older OAuth client-secret flow is retired.
 *
 * Flow: POST the zip, poll the package operation until Succeeded, POST the
 * submission notes, poll the publish operation until Succeeded. "Succeeded" on
 * the publish operation means Partner Center accepted the submission. Store
 * review continues after that.
 *
 * The overview describes certification notes as JSON. Its curl sample writes
 * `{ "notes"="text value" }`, which is not JSON; this client sends
 * `{"notes":"..."}` with `Content-Type: application/json`.
 *
 * Credentials come from the environment only (EDGE_PRODUCT_ID, EDGE_CLIENT_ID,
 * EDGE_API_KEY) so they are not placed on the command line.
 */

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export const API_ORIGIN = 'https://api.addons.microsoftedge.microsoft.com';
const GUID_TEXT = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
export const GUID_PATTERN = new RegExp(`^${GUID_TEXT}$`);
const STORE_LISTING_ID = /^[a-p]{32}$/;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 15 * 1000;
const UPLOAD_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_REQUEST_TIMEOUT_MS = 60 * 1000;
const MAX_NOTES_LENGTH = 8000;
const MAX_ERROR_BODY = 100_000;
const MAX_ZIP_BYTES = 100 * 1024 * 1024;
const MAX_ATTEMPTS = 80;

const ERROR_HINTS = {
  InProgressSubmission: 'A submission for this product is already in review.',
  NoModulesUpdated: 'The draft has no package change to publish. The manifest version needs to differ from the package already in the store.',
  CreateNotAllowed: 'The Publish API updates an existing product. Publish the extension once in Partner Center before using the API.',
  UnpublishInProgress: 'An unpublish is still running for this product.',
  ModuleStateUnPublishable: 'Partner Center reports a module that cannot be published.',
  SubmissionValidationError: 'Partner Center rejected the submission during validation.'
};

export class EdgePublishError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'EdgePublishError';
    this.status = details.status;
    this.body = details.body;
  }
}

export function redact(text, secrets) {
  let out = String(text ?? '');
  const values = [...secrets]
    .filter((secret) => typeof secret === 'string' && secret.length >= 6)
    .sort((a, b) => b.length - a.length);
  for (const secret of values) out = out.split(secret).join('[redacted]');
  return out;
}

export function operationIdFromLocation(location) {
  if (typeof location !== 'string' || location.trim() === '') {
    throw new EdgePublishError('The 202 response did not include a Location header with an operation id.');
  }
  const value = location.trim();
  // A full operation URL also contains the product id. The operation id is the
  // GUID after /operations/, or otherwise the last GUID in the header. The
  // header is never requested as a URL.
  const marked = value.match(new RegExp(`/operations/(${GUID_TEXT})(?![0-9a-fA-F-])`));
  if (marked) return marked[1];
  const matches = value.match(new RegExp(GUID_TEXT, 'g'));
  if (!matches) {
    throw new EdgePublishError('The Location header did not include an operation id. The operation URL is built from that id on the Add-ons API host.');
  }
  return matches[matches.length - 1];
}

export function retryDelayMs(retryAfter, fallbackMs, now = Date.now()) {
  if (retryAfter == null || retryAfter === '') return fallbackMs;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 120_000);
  const date = Date.parse(retryAfter);
  if (Number.isFinite(date)) return Math.min(Math.max(0, date - now()), 120_000);
  return fallbackMs;
}

export function versionFromZipName(zipPath) {
  const match = basename(zipPath).match(/^pagedye-edge-(.+)\.zip$/i);
  return match ? match[1] : '';
}

export function buildCertificationNotes({ changelog = '', releaseUrl = '', version = '', maxLength = MAX_NOTES_LENGTH } = {}) {
  const header = [
    version ? `PageDye ${version}` : 'PageDye',
    releaseUrl,
    'Automated submission from the PageDye release workflow.'
  ].filter(Boolean).join('\n');
  const body = String(changelog).replace(/^\uFEFF/, '').trim();
  const missing = body === '' || body.startsWith('_No CHANGELOG.md entry');
  let notes = missing ? header : `${header}\n\n${body}`;
  if (notes.length > maxLength) {
    const suffix = '\n…(truncated)';
    notes = `${notes.slice(0, Math.max(0, maxLength - suffix.length)).trimEnd()}${suffix}`;
  }
  return notes;
}

export function assertCredentials({ productId, clientId, apiKey }) {
  const missing = [];
  if (!productId) missing.push('EDGE_PRODUCT_ID');
  if (!clientId) missing.push('EDGE_CLIENT_ID');
  if (!apiKey) missing.push('EDGE_API_KEY');
  if (missing.length > 0) {
    throw new EdgePublishError(`Missing Edge Add-ons credential(s): ${missing.join(', ')}.`);
  }
  if (STORE_LISTING_ID.test(productId)) {
    throw new EdgePublishError('EDGE_PRODUCT_ID is the public store listing id. Use the Partner Center product GUID from Microsoft Edge → Overview → Extension identity (the GUID between microsoftedge/ and /packages in that page URL).');
  }
  if (!GUID_PATTERN.test(productId)) {
    throw new EdgePublishError('EDGE_PRODUCT_ID must be the Partner Center product GUID from Microsoft Edge → Overview → Extension identity.');
  }
  if (!GUID_PATTERN.test(clientId)) {
    throw new EdgePublishError('EDGE_CLIENT_ID must be the Client ID GUID from Partner Center → Microsoft Edge → Publish API.');
  }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error) {
  const parts = [error?.stack || error?.message || String(error)];
  if (error?.cause) parts.push(String(error.cause?.stack || error.cause));
  return parts.join('\nCaused by: ');
}

function assertApiUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new EdgePublishError('Refusing to call an invalid Add-ons API URL.');
  }
  if (parsed.origin !== API_ORIGIN || parsed.protocol !== 'https:') {
    throw new EdgePublishError('Refusing to send Edge Add-ons credentials to a host other than the Add-ons Publish API.');
  }
  return parsed.toString();
}

function productPath(productId, suffix) {
  return `${API_ORIGIN}/v1/products/${encodeURIComponent(productId)}${suffix}`;
}

async function readBody(response) {
  const text = await response.text();
  if (text.length <= MAX_ERROR_BODY) return text;
  return `${text.slice(0, MAX_ERROR_BODY)}\n…(truncated)`;
}

function httpFailure(label, response, body, secrets) {
  const visible = redact(body, secrets).trim();
  const reason = `${response.status} ${response.statusText || ''}`.trim();
  let hint = '';
  if (response.status === 401 || response.status === 403) {
    hint = ' The API key or client id was rejected. Publish API keys expire about every 72 days and have to be rotated in Partner Center.';
  } else if (response.status === 404) {
    hint = ' The product id or operation id was not found for these credentials.';
  } else if (response.status === 429) {
    hint = ' The Publish API rate limit was hit.';
  }
  const detail = visible ? `\n${visible}` : '';
  return new EdgePublishError(`${label} failed: HTTP ${reason}.${hint}${detail}`, {
    status: response.status,
    body: visible
  });
}

async function apiRequest({ url, method, headers, body, fetchImpl, requestTimeoutMs, label, secrets }) {
  const target = assertApiUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  if (typeof timer.unref === 'function') timer.unref();
  let response;
  try {
    response = await fetchImpl(target, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new EdgePublishError(`${label} timed out after ${requestTimeoutMs}ms.`);
    }
    throw new EdgePublishError(`${label} could not reach the Add-ons Publish API: ${redact(error?.message || error, secrets)}`);
  } finally {
    clearTimeout(timer);
  }
  if (response.status >= 300 && response.status < 400) {
    throw new EdgePublishError(`${label} returned HTTP ${response.status}. Redirects are not followed.`);
  }
  return response;
}

function operationStatus(parsed) {
  return String(parsed?.status || '').toLowerCase();
}

function formatOperationFailure(label, parsed, secrets) {
  const detail = redact(JSON.stringify({
    status: parsed.status ?? null,
    message: parsed.message ?? null,
    errorCode: parsed.errorCode ?? null,
    errors: parsed.errors ?? null
  }, null, 2), secrets);
  const hint = ERROR_HINTS[parsed.errorCode];
  return `${label} failed.${hint ? ` ${hint}` : ''}\n${detail}`;
}

async function pollOperation({ url, headers, fetchImpl, sleep, now, timeoutMs, intervalMs, label, secrets }) {
  const deadline = now() + timeoutMs;
  let lastStatus = 'not started';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1 && now() >= deadline) {
      throw new EdgePublishError(`${label} timed out after ${attempt - 1} attempt(s); last status was ${lastStatus}.`);
    }
    const response = await apiRequest({
      url,
      method: 'GET',
      headers,
      fetchImpl,
      requestTimeoutMs: POLL_REQUEST_TIMEOUT_MS,
      label,
      secrets
    });
    const body = await readBody(response);
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    if (retryable) {
      lastStatus = `HTTP ${response.status}`;
      if (now() >= deadline) throw httpFailure(label, response, body, secrets);
      const delay = retryDelayMs(response.headers?.get?.('retry-after'), intervalMs, now);
      await sleep(Math.min(delay, Math.max(0, deadline - now())));
      continue;
    }
    if (response.status !== 200 && response.status !== 202) {
      throw httpFailure(label, response, body, secrets);
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new EdgePublishError(`${label} returned a non-JSON body (HTTP ${response.status}).\n${redact(body, secrets)}`);
    }
    const status = operationStatus(parsed);
    if (status === 'succeeded') {
      const message = parsed.message ? `: ${redact(String(parsed.message), secrets)}` : '';
      return { parsed, message, attempt };
    }
    if (status === 'failed') {
      throw new EdgePublishError(formatOperationFailure(label, parsed, secrets), { body: redact(body, secrets) });
    }
    if (status !== 'inprogress') {
      throw new EdgePublishError(`${label} returned unexpected status ${JSON.stringify(parsed.status ?? null)}.\n${redact(body, secrets)}`);
    }
    lastStatus = 'InProgress';
    if (now() >= deadline || attempt === MAX_ATTEMPTS) {
      throw new EdgePublishError(`${label} timed out after ${attempt} attempt(s); last status was InProgress.`);
    }
    await sleep(Math.min(intervalMs, Math.max(0, deadline - now())));
  }
  throw new EdgePublishError(`${label} timed out; last status was ${lastStatus}.`);
}

function assertZip(bytes) {
  if (!bytes || bytes.length < 4) throw new EdgePublishError('The Edge package is empty.');
  if (bytes.length > MAX_ZIP_BYTES) throw new EdgePublishError('The Edge package is larger than 100 MB.');
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new EdgePublishError('The Edge package is not a zip file.');
}

async function acceptedOperationId(response, label, secrets) {
  const body = await readBody(response);
  if (response.status !== 202) throw httpFailure(label, response, body, secrets);
  return operationIdFromLocation(response.headers?.get?.('location') || response.headers?.get?.('Location'));
}

export async function publishEdgeAddon({
  productId,
  clientId,
  apiKey,
  zipBytes,
  notes,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
  now = Date.now,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  log = () => {}
}) {
  const credentials = {
    productId: String(productId || '').trim(),
    clientId: String(clientId || '').trim(),
    apiKey: String(apiKey || '').trim()
  };
  assertCredentials(credentials);
  assertZip(zipBytes);
  const secrets = [credentials.apiKey, credentials.clientId, credentials.productId];
  const headers = {
    Authorization: `ApiKey ${credentials.apiKey}`,
    'X-ClientID': credentials.clientId
  };
  const zip = zipBytes instanceof Uint8Array ? zipBytes : new Uint8Array(zipBytes);

  log(`Uploading Edge package (${zip.byteLength} bytes).`);
  const upload = await apiRequest({
    url: productPath(credentials.productId, '/submissions/draft/package'),
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/zip' },
    body: zip,
    fetchImpl,
    requestTimeoutMs: UPLOAD_TIMEOUT_MS,
    label: 'Package upload',
    secrets
  });
  const uploadOperationId = await acceptedOperationId(upload, 'Package upload', secrets);
  log(`Package upload accepted (operation ${uploadOperationId}).`);
  const uploaded = await pollOperation({
    url: productPath(credentials.productId, `/submissions/draft/package/operations/${uploadOperationId}`),
    headers,
    fetchImpl,
    sleep,
    now,
    timeoutMs,
    intervalMs,
    label: 'Package upload',
    secrets
  });
  log(`Package upload succeeded${uploaded.message}.`);

  const certificationNotes = String(notes || '').trim() || 'Automated submission from the PageDye release workflow.';
  log(`Submitting publish request (${certificationNotes.length} characters of certification notes).`);
  const publish = await apiRequest({
    url: productPath(credentials.productId, '/submissions'),
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: certificationNotes }),
    fetchImpl,
    requestTimeoutMs: POLL_REQUEST_TIMEOUT_MS,
    label: 'Publish submission',
    secrets
  });
  const publishOperationId = await acceptedOperationId(publish, 'Publish submission', secrets);
  log(`Publish request accepted (operation ${publishOperationId}).`);
  const published = await pollOperation({
    url: productPath(credentials.productId, `/submissions/operations/${publishOperationId}`),
    headers,
    fetchImpl,
    sleep,
    now,
    timeoutMs,
    intervalMs,
    label: 'Publish submission',
    secrets
  });
  log(`Publish submission succeeded${published.message}. Microsoft Edge will review it before the store listing updates.`);
  return {
    uploadOperationId,
    publishOperationId
  };
}

function parseArgs(argv) {
  const args = { zip: '', notesFile: '', help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--zip') args.zip = argv[++index] || '';
    else if (arg === '--notes-file') args.notesFile = argv[++index] || '';
    else throw new EdgePublishError(`Unknown argument: ${arg}`);
  }
  return args;
}

const USAGE = `Usage: node tools/publish-edge-addon.mjs --zip <pagedye-edge-VERSION.zip> --notes-file <release_notes.md>

Reads EDGE_PRODUCT_ID, EDGE_CLIENT_ID, and EDGE_API_KEY from the environment.
Optional: EDGE_RELEASE_URL, EDGE_VERSION.`;

async function main() {
  const productId = process.env.EDGE_PRODUCT_ID ?? '';
  const clientId = process.env.EDGE_CLIENT_ID ?? '';
  const apiKey = process.env.EDGE_API_KEY ?? '';
  const secrets = [apiKey, clientId, productId];
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(USAGE);
      return;
    }
    if (!args.zip) throw new EdgePublishError('Missing --zip <pagedye-edge-VERSION.zip>.');
    if (!args.notesFile) throw new EdgePublishError('Missing --notes-file <release_notes.md>.');
    const zipBytes = await readFile(args.zip);
    const changelog = await readFile(args.notesFile, 'utf8');
    const notes = buildCertificationNotes({
      changelog,
      releaseUrl: process.env.EDGE_RELEASE_URL || '',
      version: process.env.EDGE_VERSION || versionFromZipName(args.zip)
    });
    await publishEdgeAddon({
      productId,
      clientId,
      apiKey,
      zipBytes,
      notes,
      log: (message) => console.log(redact(message, secrets))
    });
  } catch (error) {
    console.error(redact(errorText(error), secrets));
    process.exitCode = 1;
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main();
}
