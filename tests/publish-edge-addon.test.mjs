import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  API_ORIGIN,
  EdgePublishError,
  assertCredentials,
  buildCertificationNotes,
  operationIdFromLocation,
  publishEdgeAddon,
  redact,
  retryDelayMs,
  versionFromZipName
} from '../tools/publish-edge-addon.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), 'utf8');

const productId = 'd34f98f5-f9b7-42b1-bebb-98707202b21d';
const clientId = '43e71dc6-289e-4042-8965-e130ee9a2524';
const apiKey = 'super-secret-edge-api-key';
const uploadOperationId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const publishOperationId = '11111111-2222-4333-8444-555555555555';
const zipBytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);

function response({ status, body, headers = {}, statusText }) {
  const headerMap = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    status,
    statusText: statusText || (status === 202 ? 'Accepted' : 'OK'),
    headers: { get: (name) => headerMap.get(String(name).toLowerCase()) ?? null },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
  };
}

function operation(id, status, extra = {}) {
  return {
    id,
    createdTime: '2026-01-01T00:00:00Z',
    lastUpdatedTime: '2026-01-01T00:00:01Z',
    status,
    message: extra.message ?? null,
    errorCode: extra.errorCode ?? null,
    errors: extra.errors ?? null
  };
}

function mockFetch(handlers) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    const handler = handlers.shift();
    assert.ok(handler, `unexpected request ${init.method || 'GET'} ${url}`);
    return handler(url, init);
  };
  return { calls, fetchImpl };
}

function credentials(overrides = {}) {
  return {
    productId,
    clientId,
    apiKey,
    zipBytes,
    notes: 'PageDye v1.2.3\nhttps://github.com/OnyxAxisOwO/PageDye/releases/tag/v1.2.3\n\n### ✨ v1.2.3 更新日志\n- 修复对比度',
    sleep: async () => {},
    timeoutMs: 60_000,
    intervalMs: 1,
    ...overrides
  };
}

test('operation ids are taken from Location and never used as a request URL', () => {
  assert.equal(operationIdFromLocation(uploadOperationId), uploadOperationId);
  assert.equal(
    operationIdFromLocation(`https://evil.example/steal?next=${uploadOperationId}`),
    uploadOperationId
  );
  assert.equal(
    operationIdFromLocation(`/v1/products/${productId}/submissions/draft/package/operations/${uploadOperationId}`),
    uploadOperationId
  );
  assert.throws(() => operationIdFromLocation(''), /Location header/);
  assert.throws(() => operationIdFromLocation('https://evil.example/no-id'), /operation id/);
});

test('certification notes keep the changelog and release link, and truncate safely', () => {
  const notes = buildCertificationNotes({
    version: 'v1.2.3',
    releaseUrl: 'https://github.com/OnyxAxisOwO/PageDye/releases/tag/v1.2.3',
    changelog: '### ✨ v1.2.3 更新日志\n- 修复对比度'
  });
  assert.match(notes, /PageDye v1\.2\.3/);
  assert.match(notes, /releases\/tag\/v1\.2\.3/);
  assert.match(notes, /修复对比度/);

  const placeholder = buildCertificationNotes({
    version: 'v9.9.9',
    releaseUrl: 'https://example.test/releases/tag/v9.9.9',
    changelog: '_No CHANGELOG.md entry found for v9.9.9._'
  });
  assert.match(placeholder, /v9\.9\.9/);
  assert.doesNotMatch(placeholder, /No CHANGELOG/);

  const truncated = buildCertificationNotes({ changelog: '字'.repeat(50), maxLength: 30 });
  assert.ok(truncated.length <= 30);
  assert.match(truncated, /truncated/);
  assert.equal(versionFromZipName('pagedye-edge-v1.2.3.zip'), 'v1.2.3');
});

test('credential checks name the missing secret and do not echo the supplied values', () => {
  assert.throws(() => assertCredentials({ productId: '', clientId, apiKey }), /EDGE_PRODUCT_ID/);
  const listingId = 'jdfkphphagodkilembkklhnepbnnkihh';
  assert.throws(
    () => assertCredentials({ productId: listingId, clientId, apiKey }),
    (error) => {
      assert.match(error.message, /store listing id/);
      assert.doesNotMatch(error.message, new RegExp(listingId));
      return true;
    }
  );
  assert.throws(() => assertCredentials({ productId, clientId: 'not-a-guid', apiKey }), /EDGE_CLIENT_ID/);
});

test('redaction and retry-after parsing', () => {
  assert.equal(redact(`key ${apiKey} id ${productId}`, [apiKey, productId]), 'key [redacted] id [redacted]');
  assert.equal(retryDelayMs('12', 1000), 12_000);
  assert.equal(retryDelayMs('not-a-date', 1500), 1500);
  const now = () => Date.parse('2026-01-01T00:00:00Z');
  assert.equal(retryDelayMs('Thu, 01 Jan 2026 00:00:05 GMT', 1000, now), 5000);
});

test('publish uploads the zip, polls both operations, and posts JSON notes', async () => {
  const logs = [];
  const { calls, fetchImpl } = mockFetch([
    () => response({ status: 202, body: '', headers: { location: `https://evil.example/ops/${uploadOperationId}` } }),
    () => response({ status: 200, body: operation(uploadOperationId, 'InProgress') }),
    () => response({
      status: 200,
      body: operation(uploadOperationId, 'Succeeded', { message: 'Successfully updated package to pagedye-edge-v1.2.3.zip' })
    }),
    () => response({ status: 202, body: '', headers: { location: publishOperationId } }),
    () => response({
      status: 202,
      body: operation(publishOperationId, 'Succeeded', { message: 'Successfully created submission with ID 123' })
    })
  ]);

  const result = await publishEdgeAddon(credentials({
    fetchImpl,
    log: (line) => logs.push(line)
  }));

  assert.deepEqual(result, { uploadOperationId, publishOperationId });
  assert.equal(calls.length, 5);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].url, `${API_ORIGIN}/v1/products/${productId}/submissions/draft/package`);
  assert.equal(calls[0].init.headers.Authorization, `ApiKey ${apiKey}`);
  assert.equal(calls[0].init.headers['X-ClientID'], clientId);
  assert.equal(calls[0].init.headers['Content-Type'], 'application/zip');
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(Buffer.from(calls[0].init.body).readUInt16BE(0), 0x504b);

  assert.equal(
    calls[1].url,
    `${API_ORIGIN}/v1/products/${productId}/submissions/draft/package/operations/${uploadOperationId}`
  );
  assert.ok(calls.every((call) => call.url.startsWith(API_ORIGIN)));

  assert.equal(calls[3].init.method, 'POST');
  assert.equal(calls[3].url, `${API_ORIGIN}/v1/products/${productId}/submissions`);
  assert.equal(calls[3].init.headers['Content-Type'], 'application/json');
  assert.match(JSON.parse(calls[3].init.body).notes, /修复对比度/);
  assert.equal(
    calls[4].url,
    `${API_ORIGIN}/v1/products/${productId}/submissions/operations/${publishOperationId}`
  );
  assert.ok(logs.some((line) => line.includes('Package upload succeeded')));
  assert.ok(logs.every((line) => !line.includes(apiKey) && !line.includes(clientId)));
});

test('a failed package operation reports the response body without the API key', async () => {
  const leaked = `validation failed for ${apiKey}`;
  const { fetchImpl } = mockFetch([
    () => response({ status: 202, body: '', headers: { location: uploadOperationId } }),
    () => response({
      status: 200,
      body: operation(uploadOperationId, 'Failed', {
        message: leaked,
        errorCode: 'SubmissionValidationError',
        errors: ['manifest version already exists']
      })
    })
  ]);

  await assert.rejects(
    () => publishEdgeAddon(credentials({ fetchImpl })),
    (error) => {
      assert.ok(error instanceof EdgePublishError);
      assert.match(error.message, /SubmissionValidationError/);
      assert.match(error.message, /manifest version already exists/);
      assert.match(error.message, /\[redacted\]/);
      assert.doesNotMatch(error.message, new RegExp(apiKey));
      return true;
    }
  );
});

test('HTTP failures include the response body and a redirect is not followed', async () => {
  const denied = mockFetch([
    () => response({ status: 401, statusText: 'Unauthorized', body: `expired ${apiKey}` })
  ]);
  await assert.rejects(
    () => publishEdgeAddon(credentials({ fetchImpl: denied.fetchImpl })),
    (error) => {
      assert.match(error.message, /HTTP 401/);
      assert.match(error.message, /72 days/);
      assert.match(error.message, /\[redacted\]/);
      assert.doesNotMatch(error.message, new RegExp(apiKey));
      return true;
    }
  );

  const redirected = mockFetch([
    () => response({ status: 302, statusText: 'Found', body: '', headers: { location: 'https://evil.example/key' } })
  ]);
  await assert.rejects(
    () => publishEdgeAddon(credentials({ fetchImpl: redirected.fetchImpl })),
    /Redirects are not followed/
  );
  assert.equal(redirected.calls.length, 1);
});

test('retryable responses are retried until the operation succeeds', async () => {
  let sleeps = 0;
  const { calls, fetchImpl } = mockFetch([
    () => response({ status: 202, body: '', headers: { location: uploadOperationId } }),
    () => response({ status: 429, statusText: 'Too Many Requests', body: 'slow down', headers: { 'retry-after': '1' } }),
    () => response({ status: 200, body: operation(uploadOperationId, 'Succeeded', { message: 'ok' }) }),
    () => response({ status: 202, body: '', headers: { location: publishOperationId } }),
    () => response({ status: 200, body: operation(publishOperationId, 'Succeeded', { message: 'created' }) })
  ]);
  await publishEdgeAddon(credentials({
    fetchImpl,
    sleep: async () => {
      sleeps += 1;
    }
  }));
  assert.equal(sleeps, 1);
  assert.equal(calls[2].init.method, 'GET');
  assert.match(calls[2].url, /\/draft\/package\/operations\//);
});

test('an operation that stays InProgress stops at the polling deadline', async () => {
  let polls = 0;
  const { fetchImpl } = mockFetch([
    () => response({ status: 202, body: '', headers: { location: uploadOperationId } }),
    () => response({ status: 200, body: operation(uploadOperationId, 'Succeeded', { message: 'ok' }) }),
    () => response({ status: 202, body: '', headers: { location: publishOperationId } }),
    () => {
      polls += 1;
      return response({ status: 200, body: operation(publishOperationId, 'InProgress') });
    }
  ]);
  let clock = 0;
  await assert.rejects(
    () => publishEdgeAddon(credentials({
      fetchImpl,
      timeoutMs: 10,
      now: () => clock,
      sleep: async () => {
        clock += 20;
      }
    })),
    /Publish submission timed out after 1 attempt\(s\); last status was InProgress/
  );
  assert.equal(polls, 1);
});

test('the release workflow publishes the built Edge zip with the v1.1 API', () => {
  const workflow = read('.github/workflows/release.yml');
  assert.match(workflow, /publish-edge:/);
  assert.match(workflow, /needs:\s*release/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /actions\/download-artifact@v4/);
  assert.match(workflow, /EDGE_PRODUCT_ID/);
  assert.match(workflow, /EDGE_CLIENT_ID/);
  assert.match(workflow, /EDGE_API_KEY/);
  assert.match(workflow, /skip_edge_publish/);
  assert.match(workflow, /tools\/publish-edge-addon\.mjs/);
  assert.match(workflow, /::notice/);
  assert.doesNotMatch(workflow, /login\.microsoftonline\.com/);
  assert.doesNotMatch(workflow, /Bearer /);
  const files = workflow.match(/FILES="([^"]+)"/)[1].split(/\s+/);
  assert.ok(!files.includes('tools'));
  assert.equal(files.includes('scripts'), true);
});
