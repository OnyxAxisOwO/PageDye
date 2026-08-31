import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const firefoxManifest = JSON.parse(readFileSync(join(root, 'manifest.firefox.json'), 'utf8'));
const failures = [];

if (manifest.manifest_version === 3 && manifest.background && typeof manifest.background.service_worker !== 'string') {
  failures.push('Manifest V3 background.service_worker must be a file path string');
}
if (manifest.background?.scripts) failures.push('Edge manifest must not contain background.scripts');
if (!Array.isArray(firefoxManifest.background?.scripts) || firefoxManifest.background.scripts.length === 0) {
  failures.push('Firefox manifest must contain background.scripts');
}
if (firefoxManifest.background?.service_worker) failures.push('Firefox manifest must not contain background.service_worker');

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

for (const file of walk(root).filter((file) => ['.js', '.mjs'].includes(extname(file)))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`Syntax error in ${relative(root, file)}:\n${result.stderr}`);
}

function assetsFor(source) {
  return [
    source.action?.default_popup,
    source.options_ui?.page,
    source.background?.service_worker,
    ...(source.background?.scripts || []),
    ...(source.sandbox?.pages || []),
    ...(source.content_scripts || []).flatMap((entry) => entry.js || []),
    ...(source.web_accessible_resources || []).flatMap((entry) => entry.resources || []),
    ...Object.values(source.action?.default_icon || {}),
    ...Object.values(source.icons || {})
  ].filter(Boolean);
}
const manifestAssets = [...new Set([...assetsFor(manifest), ...assetsFor(firefoxManifest)])];
for (const asset of manifestAssets) {
  const path = join(root, asset);
  try {
    if (statSync(path).size === 0) failures.push(`Manifest asset is empty: ${asset}`);
  } catch (_) {
    failures.push(`Manifest asset is missing: ${asset}`);
  }
}

const releaseWorkflow = readFileSync(join(root, '.github/workflows/release.yml'), 'utf8');
const releaseFiles = releaseWorkflow.match(/FILES="([^"]+)"/)?.[1].split(/\s+/) || [];
for (const asset of manifestAssets) {
  const packaged = releaseFiles.some((entry) => asset === entry || asset.startsWith(`${entry}/`));
  if (!packaged) failures.push(`Release package omits manifest asset: ${asset}`);
}
for (const entry of releaseFiles) {
  const path = join(root, entry);
  try {
    if (statSync(path).isDirectory()) {
      for (const file of walk(path)) {
        if (statSync(file).size === 0) failures.push(`Release package contains an empty file: ${relative(root, file)}`);
      }
    } else if (statSync(path).size === 0) {
      failures.push(`Release package contains an empty file: ${entry}`);
    }
  } catch (_) {
    failures.push(`Release package root is missing: ${entry}`);
  }
}

function pngSize(file) {
  const buffer = readFileSync(file);
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) throw new Error('invalid PNG signature');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
for (const size of [16, 48, 128]) {
  try {
    const dimensions = pngSize(join(root, `icons/icon${size}.png`));
    if (dimensions[0] !== size || dimensions[1] !== size) failures.push(`icon${size}.png is ${dimensions.join('x')}`);
  } catch (error) {
    failures.push(`icon${size}.png: ${error.message}`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (packageJson.version !== manifest.version) failures.push('package.json and manifest.json versions differ');
if (firefoxManifest.version !== manifest.version) failures.push('Edge and Firefox manifest versions differ');
const versionTargets = ['popup/popup.html', 'options/options.html', 'site/index.html', 'userscript/pagedye.user.js'];
for (const target of versionTargets) {
  if (!readFileSync(join(root, target), 'utf8').includes(manifest.version)) failures.push(`${target} does not contain ${manifest.version}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`PageDye ${manifest.version}: syntax, resources, release package, icons, and versions are valid.`);
