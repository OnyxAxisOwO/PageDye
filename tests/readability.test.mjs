// Covers scripts/shared/readability.js — the contrast check that runs with no
// API key, and the only place PageDye judges its own output.
//
// The ratios asserted here are WCAG 2.x values anyone can reproduce in a
// browser's devtools contrast panel, which is the point: a number this module
// reports has to be the same number the user would get checking it themselves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(import.meta.url);
const readability = require(resolve(root, 'scripts/shared/readability.js'));

const round = (value) => Math.round(value * 100) / 100;

test('contrast ratios match the values a devtools panel reports', () => {
  assert.equal(round(readability.contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(round(readability.contrastRatio('#ffffff', '#ffffff')), 1);
  // The canonical AA boundary grey: #767676 is the darkest grey that still
  // passes 4.5:1 on white, which is why it is the value to pin.
  assert.ok(readability.contrastRatio('#767676', '#ffffff') >= 4.5);
  assert.ok(readability.contrastRatio('#777777', '#ffffff') < 4.5);
  // Order must not matter — the ratio is defined lighter-over-darker.
  assert.equal(
    round(readability.contrastRatio('#1f2328', '#ffffff')),
    round(readability.contrastRatio('#ffffff', '#1f2328'))
  );
  assert.equal(readability.contrastRatio('not a color', '#ffffff'), null);
});

test('blending is source-over, the way a browser composites an rgba background', () => {
  assert.equal(readability.blendOver('#000000', 0.5, '#ffffff'), '#808080');
  assert.equal(readability.blendOver('#ff0000', 1, '#ffffff'), '#ff0000');
  assert.equal(readability.blendOver('#ff0000', 0, '#ffffff'), '#ffffff');
  // Out-of-range alphas clamp rather than producing channels outside 0-255.
  assert.equal(readability.blendOver('#000000', 5, '#ffffff'), '#000000');
  assert.equal(readability.blendOver('#000000', -2, '#ffffff'), '#ffffff');
});

test('a wallpaper is judged through its own opacity, one color per gradient stop', () => {
  // 50% black over a white page is mid-grey, not black: the check has to model
  // what actually reaches the eye, not the color the user picked.
  assert.deepEqual(
    readability.wallpaperColors({ colors: ['#000000', '#ff0000'], opacity: 50, pageBackground: '#ffffff' }),
    ['#808080', '#ff8080']
  );
  // No wallpaper still leaves the page's own background under the text.
  assert.deepEqual(readability.wallpaperColors({ colors: [], pageBackground: '#101010' }), ['#101010']);
});

test('the failure PageDye can actually cause is caught', () => {
  // A dark photo-ish wallpaper under a barely-there frosted panel, with the
  // site's near-black body text on top. This is the exact combination the AI
  // prompt spends most of its words preventing.
  const [finding] = readability.check({
    frostedGlass: [{ selector: '#main', opacity: 25 }],
    wallpaper: { colors: ['#101820'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: '#1f2328' }]
  });

  assert.equal(finding.selector, '#main');
  assert.ok(finding.ratio < 3, `expected an unreadable ratio, got ${finding.ratio}`);
  assert.equal(finding.severe, true);
});

test('an untinted panel is judged in both schemes, because the renderer swaps it', () => {
  // Untinted frosted glass is near-white in light mode and near-black in dark.
  // Dark text over a light wallpaper is fine in light mode and gone in dark, so
  // a check that only looked at the current scheme would miss half of it.
  const [finding] = readability.check({
    frostedGlass: [{ selector: '#main', opacity: 90 }],
    wallpaper: { colors: ['#ffffff'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: '#1f2328' }]
  });

  assert.ok(finding, 'the dark-mode half of an untinted panel is still a real page');
  assert.equal(finding.scheme, 'dark');

  // A tint is one fixed color in both schemes, so it is reported as `both`.
  const [tinted] = readability.check({
    frostedGlass: [{ selector: '#main', opacity: 90, color: '#101010' }],
    wallpaper: { colors: ['#ffffff'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: '#1f2328' }]
  });
  assert.equal(tinted.scheme, 'both');
});

test('a readable combination reports nothing, and worst comes first', () => {
  assert.deepEqual(readability.check({
    frostedGlass: [{ selector: '#main', opacity: 95, color: '#ffffff' }],
    wallpaper: { colors: ['#101820'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: '#1f2328' }]
  }), []);

  const findings = readability.check({
    frostedGlass: [
      { selector: '#tight', opacity: 60, color: '#8a8a8a' },
      { selector: '#gone', opacity: 10, color: '#1f2328' }
    ],
    wallpaper: { colors: ['#1f2328'], opacity: 100, pageBackground: '#ffffff' },
    containers: [
      { selector: '#tight', textColor: '#1f2328' },
      { selector: '#gone', textColor: '#1f2328' }
    ]
  });
  assert.equal(findings[0].selector, '#gone', 'the worst offender is reported first');
  assert.ok(findings[0].ratio <= findings[1].ratio);
});

test('what cannot be judged is not guessed at', () => {
  // A selector the profile never saw, and a container whose text color could
  // not be read. Both have to stay silent: a warning the user cannot act on,
  // about a panel that may not exist, is worse than no warning.
  assert.deepEqual(readability.check({
    frostedGlass: [{ selector: '#invented', opacity: 10 }],
    wallpaper: { colors: ['#101820'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: '#1f2328' }]
  }), []);

  assert.deepEqual(readability.check({
    frostedGlass: [{ selector: '#main', opacity: 10 }],
    wallpaper: { colors: ['#101820'], opacity: 100, pageBackground: '#ffffff' },
    containers: [{ selector: '#main', textColor: null }]
  }), []);

  assert.deepEqual(readability.check({}), []);
});
