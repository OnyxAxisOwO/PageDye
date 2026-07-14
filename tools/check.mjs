import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const failures = [];

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

const manifestAssets = [
  manifest.action?.default_popup,
  manifest.options_ui?.page,
  manifest.background?.service_worker,
  ...(manifest.sandbox?.pages || []),
  ...manifest.content_scripts.flatMap((entry) => entry.js || []),
  ...(manifest.web_accessible_resources || []).flatMap((entry) => entry.resources || []),
  ...Object.values(manifest.action?.default_icon || {}),
  ...Object.values(manifest.icons || {})
].filter(Boolean);
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
const versionTargets = ['popup/popup.html', 'options/options.html', 'site/index.html', 'userscript/pagedye.user.js'];
for (const target of versionTargets) {
  if (!readFileSync(join(root, target), 'utf8').includes(manifest.version)) failures.push(`${target} does not contain ${manifest.version}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`PageDye ${manifest.version}: syntax, resources, release package, icons, and versions are valid.`);
