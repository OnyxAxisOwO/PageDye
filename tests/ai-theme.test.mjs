import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(import.meta.url);
const aiTheme = require(resolve(root, 'scripts/ai-theme.js'));
const storageSchema = require(resolve(root, 'scripts/storage-schema.js'));

// scripts/page-profile.js assigns to `window` (it runs as an injected page
// script, not in the service worker), so it has no CommonJS export to require.
// Its selector helpers are pure, so a bare object standing in for `window` is
// enough to reach them without booting jsdom.
function loadPageProfile() {
  const source = readFileSync(resolve(root, 'scripts/page-profile.js'), 'utf8');
  const fakeWindow = {};
  new Function('window', source)(fakeWindow);
  return fakeWindow.PageDyeProfile;
}

const SAMPLE_PROFILE = {
  hostname: 'example.com',
  path: '/',
  base: { backgroundColor: '#ffffff', textColor: '#1f2328', isDark: false },
  accentColors: ['#0969da'],
  containers: [
    { selector: '#main-panel', textColor: '#1f2328', coverage: 0.4, matchCount: 1 },
    { selector: 'header.site-header', textColor: '#ffffff', coverage: 0.1, matchCount: 1 }
  ]
};

// The opening turn of a conversation: enough to build a request from when a
// test only cares about where it is sent and how it is authenticated.
const FIRST_TURN = [{ role: 'user', content: '' }];

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

const SAMPLE_THEME = {
  themeName: 'Quiet Harbor',
  rationale: 'Muted blues that keep the dark body text readable.',
  light: {
    angle: 135,
    stops: [{ color: '#dbeafe', position: 0 }, { color: '#eff6ff', position: 100 }],
    opacity: 85,
    blur: 0
  },
  dark: {
    angle: 135,
    stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }],
    opacity: 90,
    blur: 0
  },
  frostedGlass: [{ selector: '#main-panel', opacity: 70, blur: 14 }]
};

test('generated settings survive normalizeSiteSettings intact', () => {
  const settings = aiTheme.toSiteSettings(SAMPLE_THEME, SAMPLE_PROFILE);
  const normalized = storageSchema.normalizeSiteSettings(settings);

  assert.ok(normalized, 'settings were rejected by the storage schema');
  assert.equal(normalized.type, 'color');
  assert.equal(normalized.mode, 'auto');
  assert.equal(normalized.light.gradient.stops[0].color, '#dbeafe');
  assert.equal(normalized.dark.gradient.stops[1].color, '#1e293b');
  assert.equal(normalized.light.opacity, 85);
  assert.equal(normalized.frostedGlass.length, 1);
  assert.equal(normalized.frostedGlass[0].selector, '#main-panel');
});

test('frosted-glass selectors the model invented are dropped', () => {
  const theme = {
    ...SAMPLE_THEME,
    frostedGlass: [
      { selector: '#main-panel', opacity: 70, blur: 14 },
      { selector: '.totally-made-up', opacity: 70, blur: 14 }
    ]
  };
  const settings = aiTheme.toSiteSettings(theme, SAMPLE_PROFILE);

  assert.deepEqual(settings.frostedGlass.map((entry) => entry.selector), ['#main-panel']);
});

test('a selector carrying a CSS injection never reaches storage', () => {
  // Structured output guarantees a string, not a safe one, and the profile
  // itself is built from a page that could be hostile — so the selector filter
  // in toSiteSettings is not the security boundary. normalizeSiteSettings is:
  // it drops the offending frosted-glass entry while keeping the rest of the
  // theme, so one bad selector degrades the result instead of discarding it.
  const hostile = 'div {} body { display: none }';
  const hostileProfile = {
    ...SAMPLE_PROFILE,
    containers: [
      { selector: hostile, textColor: '#000000' },
      { selector: '#main-panel', textColor: '#1f2328' }
    ]
  };
  const theme = {
    ...SAMPLE_THEME,
    frostedGlass: [
      { selector: hostile, opacity: 70, blur: 14 },
      { selector: '#main-panel', opacity: 60, blur: 10 }
    ]
  };
  const normalized = storageSchema.normalizeSiteSettings(aiTheme.toSiteSettings(theme, hostileProfile));

  assert.deepEqual(normalized.frostedGlass.map((entry) => entry.selector), ['#main-panel']);
  assert.ok(!JSON.stringify(normalized).includes('display: none'));
});

test('theme schema constrains gradient stops to hex colors', () => {
  const stopSchema = aiTheme.THEME_SCHEMA.properties.light.properties.stops.items;

  assert.equal(stopSchema.properties.color.pattern, '^#[0-9a-fA-F]{6}$');
  assert.equal(stopSchema.additionalProperties, false);
  assert.equal(aiTheme.THEME_SCHEMA.additionalProperties, false);
});

test('the API key is excluded from exported backups', () => {
  const backup = storageSchema.buildBackup({
    [storageSchema.KEYS.aiConfig]: { apiKey: 'sk-ant-secret', model: 'claude-opus-5' },
    'example.com': { type: 'color', value: '#ffffff' }
  }, '0.10.1');

  assert.ok(!JSON.stringify(backup).includes('sk-ant-secret'));
  assert.ok(!Object.prototype.hasOwnProperty.call(backup.sites, storageSchema.KEYS.aiConfig));
});

test('build-generated class names are rejected as selector material', () => {
  const { isUsableClass } = loadPageProfile();

  // Regression: these are real class names sampled from github.com. The first
  // pattern set missed them because it required a lowercase start and no
  // hyphen, so a selector pinned to a build hash would have been saved and
  // silently stopped matching on the site's next deploy.
  assert.equal(isUsableClass('MarketingHeader-module__root__Tk7n3'), false);
  assert.equal(isUsableClass('DirectoryContent-module__Box_3__gl6dE'), false);
  assert.equal(isUsableClass('css-1a2b3c'), false);
  assert.equal(isUsableClass('styles_title__x7Kd2'), false);

  // Hand-written names must survive, including hyphenated utility classes
  // whose digits would look like a hash to a naive check.
  assert.equal(isUsableClass('HeaderMktg'), true);
  assert.equal(isUsableClass('bgColor-muted'), true);
  assert.equal(isUsableClass('col-md-6'), true);
  assert.equal(isUsableClass('p-1'), true);
  assert.equal(isUsableClass('card__body'), true);
});

test('a config saved before providers existed still resolves to Anthropic', () => {
  const migrated = aiTheme.normalizeConfig({ apiKey: '  sk-ant-x  ', model: 'claude-sonnet-5' });

  assert.equal(migrated.provider, 'anthropic');
  assert.equal(migrated.apiKey, 'sk-ant-x');
  assert.equal(migrated.model, 'claude-sonnet-5');
  assert.equal(migrated.baseUrl, '');
});

test('an empty config falls back to the provider default model', () => {
  assert.equal(aiTheme.normalizeConfig({}).model, 'claude-opus-5');
  assert.equal(aiTheme.normalizeConfig({ provider: 'openai' }).model, '');
});

test('base URL validation refuses to send the API key over plaintext', () => {
  // The key is sent to whatever host this resolves to, so anything that is not
  // https (or loopback, for a local Ollama/vLLM) has to be rejected outright.
  assert.throws(() => aiTheme.normalizeBaseUrl('http://evil.example.com', 'https://x'), /https/);
  assert.throws(() => aiTheme.normalizeBaseUrl('https://user:pw@example.com', 'https://x'), /credentials/);
  assert.throws(() => aiTheme.normalizeBaseUrl('not a url', 'https://x'), /Invalid base URL/);

  assert.equal(aiTheme.normalizeBaseUrl('http://localhost:11434', 'https://x'), 'http://localhost:11434');
  assert.equal(aiTheme.normalizeBaseUrl('https://api.deepseek.com/', 'https://x'), 'https://api.deepseek.com');
  assert.equal(aiTheme.normalizeBaseUrl('', 'https://fallback.example'), 'https://fallback.example');
});

test('anthropic requests target /v1/messages without doubling an existing /v1', () => {
  const plain = aiTheme.buildChatRequest(aiTheme.normalizeConfig({ apiKey: 'k' }), SAMPLE_PROFILE, FIRST_TURN);
  assert.equal(plain.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(plain.headers['x-api-key'], 'k');
  assert.equal(plain.headers['anthropic-version'], '2023-06-01');

  const alreadyVersioned = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ apiKey: 'k', baseUrl: 'https://proxy.example/v1' }),
    SAMPLE_PROFILE,
    FIRST_TURN
  );
  assert.equal(alreadyVersioned.url, 'https://proxy.example/v1/messages');
});

test('openai-compatible requests use bearer auth and a strict-safe schema', () => {
  const request = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ provider: 'openai', apiKey: 'k', model: 'gpt-4o', baseUrl: 'https://openrouter.ai/api/v1' }),
    SAMPLE_PROFILE,
    FIRST_TURN
  );

  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.headers.authorization, 'Bearer k');
  assert.equal(request.headers['x-api-key'], undefined);

  // Strict structured-output mode 400s on these keywords, so they must not
  // survive into the OpenAI request even though the canonical schema has them.
  const serialized = JSON.stringify(request.body.response_format);
  for (const keyword of ['pattern', 'minimum', 'maximum', 'minItems', 'maxItems']) {
    assert.ok(!serialized.includes(`"${keyword}"`), `strict schema still carries ${keyword}`);
  }
  assert.ok(serialized.includes('"additionalProperties":false'));
});

test('the user request and standing preference both reach the prompt', () => {
  const request = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ apiKey: 'k', stylePrompt: 'Prefer muted colors.' }),
    SAMPLE_PROFILE,
    [{ role: 'user', content: 'make it cyberpunk' }]
  );
  const prompt = request.body.messages[0].content;

  assert.match(prompt, /Standing preferences from the user:\nPrefer muted colors\./);
  assert.match(prompt, /What the user asked for:\nmake it cyberpunk/);
  // The page profile is attacker-controlled; the user's own words must come
  // after it so a page cannot appear to be speaking for the user.
  assert.ok(prompt.indexOf('Page profile') < prompt.indexOf('make it cyberpunk'));
});

test('a refinement replays the previous theme as the assistant turn it was', () => {
  const previousTheme = aiTheme.sanitizeTheme({
    themeName: 'Quiet Harbor',
    light: { angle: 135, opacity: 85, blur: 0, stops: [{ color: '#dbeafe', position: 0 }, { color: '#eff6ff', position: 100 }] },
    dark: { angle: 135, opacity: 90, blur: 0, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }] },
    frostedGlass: []
  });
  const messages = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ apiKey: 'k' }),
    SAMPLE_PROFILE,
    [
      { role: 'user', content: 'design something calm' },
      { role: 'assistant', reply: 'Muted blues.', themeChanged: true, theme: previousTheme },
      { role: 'user', content: 'darker' }
    ]
  ).body.messages;

  assert.deepEqual(messages.map((message) => message.role), ['user', 'assistant', 'user']);
  // The previous palette has to be visible for "darker" to mean darker than
  // THIS rather than darker than average, and it is replayed in the answer
  // shape it arrived in so the model reads it as its own last design.
  assert.ok(messages[1].content.includes('#dbeafe'));
  assert.deepEqual(JSON.parse(messages[1].content).theme.themeName, 'Quiet Harbor');
  assert.equal(messages[2].content, 'darker');
});

test('a first-run prompt carries the profile and nothing the user did not say', () => {
  const request = aiTheme.buildChatRequest(aiTheme.normalizeConfig({ apiKey: 'k' }), SAMPLE_PROFILE, FIRST_TURN);
  const prompt = request.body.messages[0].content;

  assert.equal(request.body.messages.length, 1);
  assert.match(prompt, /Design a PageDye theme/);
  assert.ok(prompt.includes('#main-panel'), 'the page profile has to reach the model');
  // Nothing typed means no empty labelled sections cluttering the prompt.
  assert.ok(!prompt.includes('Standing preferences'));
  assert.ok(!prompt.includes('What the user'));
});

test('an over-long standing preference is capped before it is stored or sent', () => {
  const config = aiTheme.normalizeConfig({ apiKey: 'k', stylePrompt: 'x'.repeat(5000) });

  assert.equal(config.stylePrompt.length, 2000);
});

test('temperature and max tokens are unset by default, and clamped to a sane range when given', () => {
  const blank = aiTheme.normalizeConfig({ apiKey: 'k' });
  assert.equal(blank.temperature, null);
  assert.equal(blank.maxTokens, null);

  const clamped = aiTheme.normalizeConfig({ apiKey: 'k', temperature: 9, maxTokens: 50000000 });
  assert.equal(clamped.temperature, 2);
  assert.equal(clamped.maxTokens, 1000000);

  const negative = aiTheme.normalizeConfig({ apiKey: 'k', temperature: -3, maxTokens: -5 });
  assert.equal(negative.temperature, 0);
  // Zero and negative are not a token count, so they fall back to unset
  // (the request builder's own default) rather than sending max_tokens: 0.
  assert.equal(negative.maxTokens, null);

  const typed = aiTheme.normalizeConfig({ apiKey: 'k', temperature: '0.4', maxTokens: '2048' });
  assert.equal(typed.temperature, 0.4);
  assert.equal(typed.maxTokens, 2048);
});

test('temperature and max tokens reach the request body only when set', () => {
  const bare = aiTheme.buildChatRequest(aiTheme.normalizeConfig({ apiKey: 'k' }), SAMPLE_PROFILE, FIRST_TURN);
  assert.equal(bare.body.max_tokens, 8000);
  assert.equal('temperature' in bare.body, false);

  const tuned = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ provider: 'openai', apiKey: 'k', model: 'm', temperature: 0.4, maxTokens: 2048 }),
    SAMPLE_PROFILE,
    FIRST_TURN
  );
  assert.equal(tuned.body.max_tokens, 2048);
  assert.equal(tuned.body.temperature, 0.4);
});

test('a custom request body adds parameters but cannot override what the turn depends on', () => {
  const config = aiTheme.normalizeConfig({
    provider: 'openai',
    apiKey: 'k',
    model: 'real-model',
    maxTokens: 500,
    extraBody: JSON.stringify({ top_p: 0.9, model: 'sneaky-model', max_tokens: 1, messages: 'not messages' })
  });
  const request = aiTheme.buildChatRequest(config, SAMPLE_PROFILE, FIRST_TURN);

  // The user's own field, not covered by any dedicated control, comes
  // through untouched.
  assert.equal(request.body.top_p, 0.9);
  // Everything the turn depends on to work is assigned after the spread and
  // wins regardless of what the custom JSON also named.
  assert.equal(request.body.model, 'real-model');
  assert.equal(request.body.max_tokens, 500);
  assert.ok(Array.isArray(request.body.messages));
});

test('invalid JSON in the custom request body is dropped rather than failing the request', () => {
  const config = aiTheme.normalizeConfig({ apiKey: 'k', extraBody: '{not valid json' });
  const request = aiTheme.buildChatRequest(config, SAMPLE_PROFILE, FIRST_TURN);

  assert.equal(request.body.model, config.model);
  assert.equal(request.body.max_tokens, 8000);
});

test('extraBodyLooksValid mirrors what parseExtraBody actually accepts', () => {
  assert.equal(aiTheme.extraBodyLooksValid(''), true, 'blank is not an error');
  assert.equal(aiTheme.extraBodyLooksValid('   '), true, 'whitespace-only is not an error');
  assert.equal(aiTheme.extraBodyLooksValid('{"top_p": 0.9}'), true);
  assert.equal(aiTheme.extraBodyLooksValid('{not valid json'), false);
  // A JSON array parses fine but is not an object to merge into the body, so
  // it is flagged the same as invalid JSON rather than silently doing nothing.
  assert.equal(aiTheme.extraBodyLooksValid('[1, 2, 3]'), false);
});

// A minimal stand-in for chrome.storage.local: an in-memory object plus the
// same get/set shape loadConfig/saveConfig call. Real enough to exercise the
// encrypt-at-rest round trip without booting the extension pages.
function memoryStore(initial = {}) {
  const data = { ...initial };
  return {
    async get(keys) {
      if (keys == null || typeof keys === 'undefined') return { ...data };
      if (typeof keys === 'string') return Object.prototype.hasOwnProperty.call(data, keys) ? { [keys]: data[keys] } : {};
      const out = {};
      for (const key of keys) if (Object.prototype.hasOwnProperty.call(data, key)) out[key] = data[key];
      return out;
    },
    async set(patch) { Object.assign(data, patch); },
    raw: data
  };
}

test('encryptApiKey defaults to off and is otherwise passed through as a plain boolean', () => {
  assert.equal(aiTheme.normalizeConfig({ apiKey: 'k' }).encryptApiKey, false);
  assert.equal(aiTheme.normalizeConfig({ apiKey: 'k', encryptApiKey: true }).encryptApiKey, true);
  assert.equal(aiTheme.normalizeConfig({ apiKey: 'k', encryptApiKey: 'yes' }).encryptApiKey, false);
});

test('saveConfig encrypts the key at rest when the toggle is on, and loadConfig reads it back', async () => {
  const store = memoryStore();
  await aiTheme.saveConfig({ apiKey: 'sk-secret', model: 'claude-opus-5', encryptApiKey: true }, store);

  const stored = store.raw['__pagedye_ai_config__'];
  assert.equal(stored.apiKey, '', 'the plaintext key never lands in storage once encryption is on');
  assert.ok(stored.apiKeyEnc && typeof stored.apiKeyEnc.iv === 'string' && typeof stored.apiKeyEnc.ct === 'string');
  assert.ok(!JSON.stringify(stored).includes('sk-secret'), 'the secret does not appear anywhere in the stored record');

  const loaded = await aiTheme.loadConfig(store);
  assert.equal(loaded.apiKey, 'sk-secret');
  assert.equal(loaded.encryptApiKey, true);
});

test('turning encryption on migrates an already-stored plaintext key without the caller re-entering it', async () => {
  const store = memoryStore({ __pagedye_ai_config__: { apiKey: 'sk-existing', model: 'claude-opus-5' } });

  const merged = await aiTheme.saveConfig({ encryptApiKey: true }, store);
  assert.equal(merged.apiKey, 'sk-existing', 'the caller still sees the plaintext value in the returned config');

  const stored = store.raw['__pagedye_ai_config__'];
  assert.equal(stored.apiKey, '');
  assert.ok(stored.apiKeyEnc);

  const loaded = await aiTheme.loadConfig(store);
  assert.equal(loaded.apiKey, 'sk-existing');
});

test('turning encryption back off reverts the stored record to plain text', async () => {
  const store = memoryStore();
  await aiTheme.saveConfig({ apiKey: 'sk-secret', encryptApiKey: true }, store);
  await aiTheme.saveConfig({ encryptApiKey: false }, store);

  const stored = store.raw['__pagedye_ai_config__'];
  assert.equal(stored.apiKey, 'sk-secret');
  assert.equal('apiKeyEnc' in stored, false);

  const loaded = await aiTheme.loadConfig(store);
  assert.equal(loaded.apiKey, 'sk-secret');
  assert.equal(loaded.encryptApiKey, false);
});

test('the same device key material decrypts across separate loadConfig calls', async () => {
  const store = memoryStore();
  await aiTheme.saveConfig({ apiKey: 'sk-one', encryptApiKey: true }, store);

  // Two independent reads, as two different extension pages would each do,
  // both have to land on the same plaintext using the one stored device key.
  const a = await aiTheme.loadConfig(store);
  const b = await aiTheme.loadConfig(store);
  assert.equal(a.apiKey, 'sk-one');
  assert.equal(b.apiKey, 'sk-one');

  // Saving again re-encrypts with a fresh IV rather than reusing one.
  await aiTheme.saveConfig({ apiKey: 'sk-two', encryptApiKey: true }, store);
  const ivAfterFirst = store.raw['__pagedye_ai_config__'].apiKeyEnc.iv;
  await aiTheme.saveConfig({ model: 'claude-sonnet-5' }, store);
  const ivAfterSecond = store.raw['__pagedye_ai_config__'].apiKeyEnc.iv;
  assert.notEqual(ivAfterFirst, ivAfterSecond);
});

test('a corrupted encrypted key degrades to empty rather than throwing', async () => {
  const store = memoryStore({
    __pagedye_ai_config__: { encryptApiKey: true, apiKeyEnc: { iv: 'not-base64!!', ct: 'also-not-base64!!' } }
  });

  const loaded = await aiTheme.loadConfig(store);
  assert.equal(loaded.apiKey, '');
});

test('with no storage area available, loadConfig hands back defaults instead of throwing', async () => {
  const loaded = await aiTheme.loadConfig(null);
  assert.equal(loaded.apiKey, '');
  assert.equal(loaded.encryptApiKey, false);
});

test('chat hands the theme back so the next turn can refine it', async () => {
  const result = await withMockApi(
    () => ({ payload: { content: [{ type: 'text', text: MODEL_REPLY }] } }),
    (baseUrl) => aiTheme.chat({
      config: { provider: 'anthropic', apiKey: 'k', model: 'claude-opus-5', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'warmer' }]
    })
  );

  assert.ok(result.theme, 'no theme returned to refine from');
  assert.equal(result.theme.light.stops[0].color, '#dbeafe');
});

test('a base URL pasted as the full endpoint is not doubled', () => {
  // Regression: providers document the full endpoint, so that is what gets
  // pasted. Appending the path produced
  // https://api.groq.com/openai/v1/chat/completions/chat/completions.
  const groq = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({
      provider: 'openai',
      apiKey: 'k',
      model: 'openai/gpt-oss-120b',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions'
    }),
    SAMPLE_PROFILE,
    FIRST_TURN
  );
  assert.equal(groq.url, 'https://api.groq.com/openai/v1/chat/completions');

  const anthropicFull = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ apiKey: 'k', baseUrl: 'https://api.anthropic.com/v1/messages' }),
    SAMPLE_PROFILE,
    FIRST_TURN
  );
  assert.equal(anthropicFull.url, 'https://api.anthropic.com/v1/messages');
});

test('every way a user might write the endpoint resolves to the same URL', () => {
  // There is no way to tell a user which of these three forms is "correct",
  // so all of them have to work.
  for (const base of ['https://api.groq.com/openai/v1', 'https://api.groq.com/openai/v1/', 'https://api.groq.com/openai/v1/chat/completions']) {
    assert.equal(
      aiTheme.buildChatRequest(aiTheme.normalizeConfig({ provider: 'openai', apiKey: 'k', model: 'm', baseUrl: base }), SAMPLE_PROFILE, FIRST_TURN).url,
      'https://api.groq.com/openai/v1/chat/completions',
      `failed for ${base}`
    );
  }
  for (const base of ['https://api.anthropic.com', 'https://api.anthropic.com/', 'https://api.anthropic.com/v1', 'https://api.anthropic.com/v1/messages']) {
    assert.equal(
      aiTheme.buildChatRequest(aiTheme.normalizeConfig({ apiKey: 'k', baseUrl: base }), SAMPLE_PROFILE, FIRST_TURN).url,
      'https://api.anthropic.com/v1/messages',
      `failed for ${base}`
    );
  }
});

test('replies are read from both provider response shapes', () => {
  assert.equal(
    aiTheme.extractReply('anthropic', { content: [{ type: 'text', text: '{"a":1}' }] }),
    '{"a":1}'
  );
  assert.equal(
    aiTheme.extractReply('openai', { choices: [{ message: { content: '{"a":1}' } }] }),
    '{"a":1}'
  );
  assert.throws(() => aiTheme.extractReply('anthropic', { stop_reason: 'refusal' }), /declined/);
  assert.throws(() => aiTheme.extractReply('openai', { choices: [{ message: { refusal: 'nope' } }] }), /nope/);
});

test('a reply wrapped in a markdown fence is still recovered', () => {
  // Endpoints that ignore the schema request usually still return the object,
  // just fenced or with a sentence in front of it.
  assert.deepEqual(aiTheme.parseJsonLoosely('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(aiTheme.parseJsonLoosely('Here you go:\n{"a":1}\nHope that helps.'), { a: 1 });
  assert.throws(() => aiTheme.parseJsonLoosely('no object here'), /not valid JSON/);
});

test('out-of-range values from a server that ignored the schema are clamped locally', () => {
  const theme = aiTheme.sanitizeTheme({
    themeName: 'x',
    rationale: 'y',
    light: {
      angle: 999,
      opacity: 400,
      blur: -20,
      // Short hex is legal CSS but not something buildGradientCss accepts, and
      // the unparseable stop must be dropped rather than rendered as white.
      stops: [{ color: '#abc', position: 250 }, { color: 'chartreuse', position: 50 }, { color: '#123456', position: -5 }]
    },
    dark: { angle: 90, opacity: 50, blur: 0, stops: [{ color: '#000000', position: 0 }, { color: '#111111', position: 100 }] },
    frostedGlass: []
  });

  assert.equal(theme.light.angle, 360);
  assert.equal(theme.light.opacity, 100);
  assert.equal(theme.light.blur, 0);
  assert.deepEqual(theme.light.stops, [
    { color: '#123456', position: 0 },
    { color: '#aabbcc', position: 100 }
  ]);
});

test('a gradient the model botched fails loudly instead of painting white', () => {
  assert.throws(() => aiTheme.sanitizeTheme({
    light: { stops: [{ color: 'not-a-color', position: 0 }] },
    dark: { stops: [{ color: '#000000', position: 0 }, { color: '#111111', position: 100 }] }
  }), /unusable light gradient/);
});

test('a solid color slot survives as a plain value, not a gradient', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    light: { colorMode: 'solid', solidColor: '#112233' },
    dark: { colorMode: 'solid', solidColor: '#eeeeee' }
  });
  const settings = storageSchema.normalizeSiteSettings(aiTheme.toSiteSettings(theme, SAMPLE_PROFILE));

  assert.equal(settings.mode, 'auto');
  assert.equal(settings.light.colorMode, 'solid');
  assert.equal(settings.light.value, '#112233');
  assert.equal(settings.light.gradient, undefined);
  assert.equal(settings.dark.value, '#eeeeee');
});

test('an explicit request to turn the background off produces an inert layer', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    disableBackground: true,
    // Deliberately unusable, to prove the discarded slots cannot sink the turn.
    light: { stops: [{ color: 'not-a-color', position: 0 }] }
  });
  const settings = storageSchema.normalizeSiteSettings(aiTheme.toSiteSettings(theme, SAMPLE_PROFILE));

  assert.equal(settings.type, 'none');
  assert.equal(settings.mode, 'single');
  assert.deepEqual(settings.frostedGlass, []);
});

test('a time-of-day schedule becomes a timeRange with the right period count', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    scheduleMode: 'timeRange',
    timeRange: [
      { name: 'Morning', start: 6, end: 12, colorMode: 'solid', solidColor: '#fff7ed' },
      { name: 'Night', start: 20, end: 6, colorMode: 'gradient', angle: 180, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }] }
    ]
  });
  const settings = storageSchema.normalizeSiteSettings(aiTheme.toSiteSettings(theme, SAMPLE_PROFILE));

  assert.equal(settings.mode, 'timeRange');
  assert.equal(settings.timeRange.items.length, 2);
  assert.equal(settings.timeRange.items[0].name, 'Morning');
  assert.equal(settings.timeRange.items[0].value, '#fff7ed');
  assert.equal(settings.timeRange.items[1].gradient.stops[0].color, '#0f172a');
});

test('a single time period fails loudly instead of a silent one-period schedule', () => {
  assert.throws(() => aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    scheduleMode: 'timeRange',
    timeRange: [{ name: 'Only', start: 0, end: 24, colorMode: 'solid', solidColor: '#ffffff' }]
  }), /fewer than two time periods/);
});

test('a slideshow slide can be one of the attached pictures', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    scheduleMode: 'slideshow',
    slideshowInterval: '1h',
    slideshowOrder: 'random',
    slideshow: [
      { colorMode: 'image', imageIndex: 2, fit: 'cover', fixed: true },
      { colorMode: 'solid', solidColor: '#334155' }
    ]
  });
  const settings = storageSchema.normalizeSiteSettings(
    aiTheme.toSiteSettings(theme, SAMPLE_PROFILE, [{ dataUrl: PNG }, { dataUrl: JPEG }])
  );

  assert.equal(settings.mode, 'slideshow');
  assert.equal(settings.slideshow.interval, '1h');
  assert.equal(settings.slideshow.order, 'random');
  assert.equal(settings.slideshow.items[0].type, 'image');
  assert.equal(settings.slideshow.items[0].value, JPEG, 'index 2 is the second picture the model was shown');
  assert.equal(settings.slideshow.items[1].value, '#334155');
});

test('a slideshow image slide the history no longer has degrades instead of failing', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    scheduleMode: 'slideshow',
    slideshow: [
      { colorMode: 'image', imageIndex: 1, fit: 'cover', fixed: true },
      { colorMode: 'solid', solidColor: '#334155' }
    ]
  });
  const settings = aiTheme.toSiteSettings(theme, SAMPLE_PROFILE, []);

  assert.equal(settings.slideshow.items[0].type, 'none');
});

test('hue and invert ride on the image layer only when actually used', () => {
  const on = aiTheme.toSiteSettings(
    aiTheme.sanitizeTheme({ ...SAMPLE_THEME, wallpaperImage: { use: true, index: 1, hue: 200, invert: 30 } }),
    SAMPLE_PROFILE,
    [{ dataUrl: PNG }]
  );
  assert.deepEqual(on.light.filters, { brightness: 100, contrast: 100, grayscale: 0, hue: 200, invert: 30 });

  const off = aiTheme.toSiteSettings(
    aiTheme.sanitizeTheme({ ...SAMPLE_THEME, wallpaperImage: { use: true, index: 1 } }),
    SAMPLE_PROFILE,
    [{ dataUrl: PNG }]
  );
  assert.ok(!('filters' in off.light), 'an untouched picture still carries no filter block');
});

test('the page\'s current background is offered as a numbered picture alongside attachments', () => {
  const theme = aiTheme.sanitizeTheme({ ...SAMPLE_THEME, wallpaperImage: { use: true, index: 1 } });
  const images = aiTheme.collectAllImages(
    [{ role: 'user', content: 'add frosted glass', images: [{ dataUrl: JPEG }] }],
    { dataUrl: PNG, name: 'current' }
  );

  assert.deepEqual(images.map((image) => image.number), [1, 2]);
  assert.equal(images[0].isCurrent, true);

  // wallpaperImage.index === 1 now means "the current background", through
  // the exact same mechanism as pointing at an upload.
  const settings = aiTheme.toSiteSettings(theme, SAMPLE_PROFILE, images);
  assert.equal(settings.value, PNG);
});

test('the current background is not evicted by the attachment recency cap', () => {
  const manyAttachments = Array.from({ length: 8 }, (_, i) => ({
    role: 'user',
    images: [{ dataUrl: `data:image/png;base64,attachment${i}` }]
  }));
  const images = aiTheme.collectAllImages(manyAttachments, { dataUrl: PNG });

  assert.equal(images.length, aiTheme.MAX_IMAGES_PER_REQUEST);
  assert.equal(images[0].dataUrl, PNG);
  assert.equal(images[0].isCurrent, true);
});

test('the current background is described to the model as an image block on the first turn', () => {
  const request = aiTheme.buildChatRequest(
    aiTheme.normalizeConfig({ apiKey: 'k' }),
    SAMPLE_PROFILE,
    [{ role: 'user', content: 'add frosted glass over this' }],
    { dataUrl: PNG, name: 'wallpaper.png' }
  );
  const content = request.body.messages[0].content;

  assert.ok(content.some((block) => block.type === 'text' && /CURRENT background/.test(block.text)));
  assert.ok(content.some((block) => block.type === 'image'));
});

// Drives the real chat() against a loopback server standing in for the
// API. Covers everything the live path does except the remote model itself:
// request construction, auth headers, per-provider response parsing, local
// sanitization, and the translation into storage shape. It also exercises the
// http-on-localhost branch of the base-URL rule, which is how a local Ollama
// or vLLM instance is reached.
async function withMockApi(handler, run) {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const reply = handler({ url: req.url, headers: req.headers, body: JSON.parse(body || '{}') });
      res.writeHead(reply.status || 200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(reply.payload));
    });
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((done) => server.close(done));
  }
}

const MODEL_REPLY = JSON.stringify({
  themeName: 'Quiet Harbor',
  rationale: 'Muted blues.',
  light: { angle: 135, stops: [{ color: '#dbeafe', position: 0 }, { color: '#eff6ff', position: 100 }], opacity: 85, blur: 0 },
  dark: { angle: 135, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }], opacity: 90, blur: 0 },
  frostedGlass: [{ selector: '#main-panel', opacity: 70, blur: 14 }, { selector: '.invented', opacity: 50, blur: 5 }]
});

test('end-to-end chat against an Anthropic-shaped endpoint', async () => {
  const seen = {};
  const result = await withMockApi(({ url, headers, body }) => {
    Object.assign(seen, { url, apiKey: headers['x-api-key'], version: headers['anthropic-version'], model: body.model });
    return { payload: { content: [{ type: 'text', text: MODEL_REPLY }] } };
  }, (baseUrl) => aiTheme.chat({
    config: { provider: 'anthropic', apiKey: 'test-key', model: 'claude-opus-5', baseUrl },
    profile: SAMPLE_PROFILE,
    turns: FIRST_TURN
  }));

  assert.equal(seen.url, '/v1/messages');
  assert.equal(seen.apiKey, 'test-key');
  assert.equal(seen.version, '2023-06-01');
  assert.equal(result.theme.themeName, 'Quiet Harbor');
  assert.equal(result.settings.light.gradient.stops[0].color, '#dbeafe');
  assert.deepEqual(result.settings.frostedGlass.map((e) => e.selector), ['#main-panel']);
  assert.ok(storageSchema.normalizeSiteSettings(result.settings));
});

test('end-to-end chat against an OpenAI-compatible endpoint', async () => {
  const seen = {};
  const result = await withMockApi(({ url, headers, body }) => {
    Object.assign(seen, { url, auth: headers.authorization, model: body.model });
    // Fenced output, as a server that ignored response_format would send.
    return { payload: { choices: [{ message: { content: '```json\n' + MODEL_REPLY + '\n```' } }] } };
  }, (baseUrl) => aiTheme.chat({
    config: { provider: 'openai', apiKey: 'test-key', model: 'deepseek-chat', baseUrl },
    profile: SAMPLE_PROFILE,
    turns: FIRST_TURN
  }));

  assert.equal(seen.url, '/chat/completions');
  assert.equal(seen.auth, 'Bearer test-key');
  assert.equal(seen.model, 'deepseek-chat');
  assert.equal(result.settings.dark.gradient.stops[1].color, '#1e293b');
  assert.ok(storageSchema.normalizeSiteSettings(result.settings));
});

test('a provider that rejects json_schema is retried without it', async () => {
  // Compatible endpoints disagree about structured-output support. Failing the
  // whole generation over a quality hint would rule out providers that work.
  const attempts = [];
  const result = await withMockApi(({ body }) => {
    attempts.push(!!body.response_format);
    if (body.response_format) {
      return { status: 400, payload: { error: { message: "'response_format.json_schema' is not supported for this model" } } };
    }
    return { payload: { choices: [{ message: { content: MODEL_REPLY } }] } };
  }, (baseUrl) => aiTheme.chat({
    config: { provider: 'openai', apiKey: 'k', model: 'openai/gpt-oss-120b', baseUrl },
    profile: SAMPLE_PROFILE,
    turns: FIRST_TURN
  }));

  assert.deepEqual(attempts, [true, false], 'expected one schema attempt then one without');
  assert.equal(result.theme.themeName, 'Quiet Harbor');
});

test('a 400 unrelated to the schema is not retried', async () => {
  let calls = 0;
  await assert.rejects(
    withMockApi(() => {
      calls++;
      return { status: 400, payload: { error: { message: 'model not found' } } };
    }, (baseUrl) => aiTheme.chat({
      config: { provider: 'openai', apiKey: 'k', model: 'nope', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: FIRST_TURN
    })),
    /model not found/
  );
  assert.equal(calls, 1, 'a non-schema 400 must not burn a second request');
});

test('an API error body is surfaced instead of a bare status code', async () => {
  await assert.rejects(
    withMockApi(
      () => ({ status: 500, payload: { error: { message: 'overloaded' } } }),
      (baseUrl) => aiTheme.chat({
        config: { provider: 'anthropic', apiKey: 'k', model: 'claude-opus-5', baseUrl },
        profile: SAMPLE_PROFILE,
        turns: FIRST_TURN
      })
    ),
    /overloaded/
  );
});

test('an auth failure names the provider and endpoint the key was sent to', async () => {
  // "invalid x-api-key" alone cannot distinguish a bad key from a key sent to
  // the wrong service, which is the far more common misconfiguration.
  await assert.rejects(
    withMockApi(
      () => ({ status: 401, payload: { error: { message: 'invalid x-api-key' } } }),
      (baseUrl) => aiTheme.chat({
        config: { provider: 'anthropic', apiKey: 'bad', model: 'claude-opus-5', baseUrl },
        profile: SAMPLE_PROFILE,
        turns: FIRST_TURN
      })
    ),
    (error) => {
      assert.match(error.message, /invalid x-api-key/);
      assert.match(error.message, /sent as anthropic to http:\/\/127\.0\.0\.1:\d+\/v1\/messages/);
      assert.ok(!error.message.includes('bad'), 'the key itself must never appear in an error');
      return true;
    }
  );
});

test('page profile is injected on demand rather than on every page load', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
  const contentScripts = manifest.content_scripts.flatMap((entry) => entry.js || []);

  assert.ok(!contentScripts.includes('scripts/page-profile.js'));
  assert.match(readFileSync(resolve(root, 'scripts/background.js'), 'utf8'), /scripts\/page-profile\.js/);
});

test('a theme that says nothing about run mode leaves the page alone', () => {
  // toSiteSettings is reachable with a theme that never went through
  // sanitizeTheme, so every field added to it has to default to "unchanged".
  const settings = aiTheme.toSiteSettings(SAMPLE_THEME, SAMPLE_PROFILE);

  assert.equal(settings.deepCompat, false, 'Enhanced must not switch itself on');
  assert.equal(settings.deepCompatAggressive, false);
  assert.equal(settings.targetSelector, '');
  assert.equal(settings.light.effectEnabled, false);
});

test('run mode, target selector and effect reach the stored settings', () => {
  const theme = aiTheme.sanitizeTheme({
    ...SAMPLE_THEME,
    runMode: 'strong',
    runModeExclude: '.modal, [role=dialog]',
    targetSelector: '#main-panel',
    effect: { enabled: true, kind: 'aurora', colorScheme: 'custom', color: '#88ccff', bgColor: '#0b1020', density: 30, speed: 20, text: '' }
  });
  const settings = aiTheme.toSiteSettings(theme, SAMPLE_PROFILE);
  const normalized = storageSchema.normalizeSiteSettings(settings);
  assert.ok(normalized, 'the storage schema rejected the settings');

  assert.equal(normalized.deepCompat, true);
  assert.equal(normalized.deepCompatAggressive, true, 'strong is the aggressive one');
  assert.equal(normalized.deepCompatExclude, '.modal, [role=dialog]');
  assert.equal(normalized.targetSelector, '#main-panel');

  // content.js reads the effect off whichever layer it draws, not off the
  // root, so both schemes have to carry it.
  for (const layer of [normalized.light, normalized.dark]) {
    assert.equal(layer.effectEnabled, true);
    assert.equal(layer.effect, 'aurora');
    assert.equal(layer.effectColor, '#88ccff');
    assert.equal(layer.effectDensity, 30);
  }
});

test('a target selector the model invented is dropped like a frosted one', () => {
  const theme = aiTheme.sanitizeTheme({ ...SAMPLE_THEME, targetSelector: '.invented-panel' });
  assert.equal(aiTheme.toSiteSettings(theme, SAMPLE_PROFILE).targetSelector, '');
});

test('an unknown effect name turns the overlay off instead of storing it', () => {
  // The renderer draws nothing for a name it does not have, which would read
  // as PageDye being broken rather than as a bad guess.
  const theme = aiTheme.sanitizeTheme({ ...SAMPLE_THEME, effect: { enabled: true, kind: 'kaleidoscope' } });
  assert.equal(theme.effect.enabled, false);
  assert.equal(aiTheme.toSiteSettings(theme, SAMPLE_PROFILE).light.effectEnabled, false);
});

test('a run-mode exclude carrying a CSS injection never reaches storage', () => {
  const theme = aiTheme.sanitizeTheme({ ...SAMPLE_THEME, runMode: 'enhanced', runModeExclude: '.a{} body{display:none}' });
  assert.equal(theme.runModeExclude, '');
});

test('PageDye preferences are only accepted in the shapes the settings page accepts', () => {
  const good = aiTheme.sanitizePreferences({
    accent: 'teal',
    reduceMotion: true,
    diagnostics: false,
    pauseShortcut: { code: 'KeyK', ctrlKey: false, altKey: true, shiftKey: true, metaKey: false }
  });
  assert.equal(good.accent, 'teal');
  assert.equal(good.reduceMotion, true);
  assert.equal(good.diagnostics, false);
  assert.equal(good.pauseShortcut.code, 'KeyK');

  // A swatch that is not on the grid, and a shortcut with no modifier — which
  // would swallow ordinary typing on every page.
  assert.equal(aiTheme.sanitizePreferences({ accent: 'chartreuse' }), null);
  assert.equal(aiTheme.sanitizePreferences({ pauseShortcut: { code: 'KeyK' } }), null);
  assert.equal(aiTheme.sanitizePreferences(null), null);

  // A custom accent needs a real hex to mean anything.
  assert.equal(aiTheme.sanitizePreferences({ accent: 'custom', accentColor: 'blue-ish' }), null);
  assert.equal(aiTheme.sanitizePreferences({ accent: 'custom', accentColor: '#112233' }).accentColor, '#112233');
});

test('a preference proposal is only read when the answer flagged one', () => {
  const withFlag = aiTheme.sanitizeChatReply({
    reply: 'Switched the dashboard to teal.',
    themeChanged: false,
    preferencesChanged: true,
    preferences: { accent: 'teal' }
  });
  assert.deepEqual(withFlag.preferences, { accent: 'teal' });

  // Echoing the current state back must not put an apply button in front of
  // the user for a change nobody asked for.
  const echoed = aiTheme.sanitizeChatReply({
    reply: 'Nothing to change.',
    themeChanged: false,
    preferencesChanged: false,
    preferences: { accent: 'teal' }
  });
  assert.equal(echoed.preferences, null);
});

test('AI responses never carry executable custom effect code', () => {
  const sanitized = aiTheme.sanitizeChatReply({
    reply: 'I can help.',
    themeChanged: false,
    customEffectChanged: true,
    customEffect: { name: 'Breathing Dot', code: 'return { draw(){} };' }
  });

  assert.equal(sanitized.customEffect, undefined);
  assert.equal(sanitized.customEffectChanged, undefined);
  assert.equal(aiTheme.CHAT_SCHEMA.properties.customEffect, undefined);
  assert.doesNotMatch(aiTheme.CHAT_SCHEMA.required.join(','), /customEffect/);
});

test('applying preferences merges into the stored theme instead of replacing it', async () => {
  const prefsApi = require(resolve(root, 'scripts/shared/ai-preferences.js'));
  const store = {
    // A dashboard the user has already customised. A proposal about the accent
    // must not throw the rest of it away.
    __pagedye_ui_theme__: { accent: 'blue', pageBgImage: 'data:image/png;base64,x', disableAnimation: false }
  };
  const local = {
    async get(key) { return key in store ? { [key]: store[key] } : {}; },
    async set(patch) { Object.assign(store, patch); }
  };

  await prefsApi.apply(local, { accent: 'teal', reduceMotion: true, diagnostics: true }, aiTheme);

  assert.equal(store.__pagedye_ui_theme__.accent, 'teal');
  assert.equal(store.__pagedye_ui_theme__.disableAnimation, true);
  assert.equal(store.__pagedye_ui_theme__.pageBgImage, 'data:image/png;base64,x', 'the background image survived');
  assert.equal(store.__pagedye_debug_mode__, true);
  assert.equal('__pagedye_pause_shortcut__' in store, false, 'a key the proposal said nothing about is left alone');
});

test('applying refuses a proposal that sanitizes down to nothing', async () => {
  const prefsApi = require(resolve(root, 'scripts/shared/ai-preferences.js'));
  const store = {};
  const local = {
    async get() { return {}; },
    async set(patch) { Object.assign(store, patch); }
  };

  await assert.rejects(() => prefsApi.apply(local, { accent: 'chartreuse' }, aiTheme));
  assert.deepEqual(store, {}, 'nothing may be written for a rejected proposal');
});

test('a custom accent is stored the way the Appearance picker stores one', () => {
  const clean = aiTheme.sanitizePreferences({ accent: 'custom', accentColor: '#3366AA' });
  assert.equal(clean.accent, 'custom');
  assert.equal(clean.accentColor, '#3366aa');
});

// --- streaming ---------------------------------------------------------------

// The reply arrives inside a JSON object that is still being written, so the
// visible half has to be readable from a document that stops anywhere.
test('the visible reply is readable out of a half-written JSON answer', () => {
  const { partialReply } = aiTheme;

  assert.equal(partialReply('{"rep'), '', 'nothing until the key is complete');
  assert.equal(partialReply('{"reply"'), '', 'nothing until the value starts');
  assert.equal(partialReply('{"reply": "给你配'), '给你配');
  assert.equal(partialReply('{"reply":"done","themeChanged":false}'), 'done');

  // Escapes: a complete one is decoded, a half-received one waits rather than
  // rendering a stray backslash the next chunk would have completed.
  assert.equal(partialReply('{"reply":"line one\\nline two'), 'line one\nline two');
  assert.equal(partialReply('{"reply":"a quote \\" inside'), 'a quote " inside');
  assert.equal(partialReply('{"reply":"trailing\\'), 'trailing');
  assert.equal(partialReply('{"reply":"unicode \\u4f60\\u597d'), 'unicode 你好');

  // The value stops at its own closing quote, not at something later in the doc.
  assert.equal(partialReply('{"reply":"first","rationale":"second"}'), 'first');
});

// Emits one SSE frame per chunk, so a test can watch text arrive in pieces.
async function withEventStream(frames, run, { contentType = 'text/event-stream' } = {}) {
  const server = createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
      res.writeHead(200, { 'content-type': contentType });
      for (const frame of frames) res.write(`data: ${JSON.stringify(frame)}\n\n`);
      res.end();
    });
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((done) => server.close(done));
  }
}

function anthropicFrames(text) {
  return [...text].map((char) => ({ type: 'content_block_delta', delta: { type: 'text_delta', text: char } }));
}

function openAiFrames(text) {
  return [...text].map((char) => ({ choices: [{ delta: { content: char } }] }));
}

const STREAMED_ANSWER = JSON.stringify({
  reply: 'Muted blues, and nothing else changed.',
  themeChanged: true,
  theme: {
    themeName: 'Quiet Harbor',
    rationale: 'Muted blues.',
    light: { angle: 135, stops: [{ color: '#dbeafe', position: 0 }, { color: '#eff6ff', position: 100 }], opacity: 85, blur: 0 },
    dark: { angle: 135, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }], opacity: 90, blur: 0 },
    frostedGlass: []
  }
});

for (const [provider, frames] of [['anthropic', anthropicFrames], ['openai', openAiFrames]]) {
  test(`a ${provider} stream delivers the reply in pieces and the same answer at the end`, async () => {
    const seen = [];
    const result = await withEventStream(frames(STREAMED_ANSWER), (baseUrl) => aiTheme.chatStream({
      config: { provider, apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'quiet blues please' }],
      onReply: (text) => seen.push(text)
    }));

    assert.ok(seen.length > 1, 'the reply should arrive in more than one piece');
    // Monotonic: every delta is the previous one plus what just arrived.
    for (let i = 1; i < seen.length; i += 1) {
      assert.ok(seen[i].startsWith(seen[i - 1]), 'each delta must extend the last');
    }
    assert.equal(seen[seen.length - 1], 'Muted blues, and nothing else changed.');

    // And the finished turn is exactly what the one-shot path would have given.
    assert.equal(result.reply, 'Muted blues, and nothing else changed.');
    assert.equal(result.themeChanged, true);
    assert.ok(storageSchema.normalizeSiteSettings(result.settings), 'the settings must still validate');
  });
}

test('an endpoint that cannot stream falls back to a one-shot turn', async () => {
  // Most self-hosted OpenAI-compatible servers answer a stream request with an
  // ordinary JSON body. That must cost the streaming, not the answer.
  let calls = 0;
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      calls += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: STREAMED_ANSWER } }] }));
    });
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));

  try {
    const seen = [];
    const result = await aiTheme.chatStream({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl: `http://127.0.0.1:${server.address().port}` },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'quiet blues please' }],
      onReply: (text) => seen.push(text)
    });

    assert.deepEqual(seen, [], 'nothing may be shown as streamed when it was not');
    assert.equal(result.reply, 'Muted blues, and nothing else changed.');
    assert.equal(calls, 2, 'one attempt at streaming, then the one-shot retry');
  } finally {
    await new Promise((done) => server.close(done));
  }
});

test('a mid-stream error from the API fails the turn instead of half-answering', async () => {
  const frames = [
    ...anthropicFrames('{"reply":"half a th'),
    { type: 'error', error: { message: 'Overloaded' } }
  ];
  await assert.rejects(
    () => withEventStream(frames, (baseUrl) => aiTheme.chatStream({
      config: { provider: 'anthropic', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hi' }]
    })),
    /Overloaded/
  );
});

// A turn that designs nothing sends no theme at all. It used to have to repeat
// the previous one verbatim, which cost thousands of output tokens to answer
// "hello" and — because a model that has just written a whole theme rarely then
// says it changed nothing — put an apply button under the greeting.
const QUESTION_ANSWER = JSON.stringify({
  reply: '你好！想改哪里？',
  themeChanged: false,
  theme: null,
  preferencesChanged: false,
  preferences: null
});

test('a turn that only answers a question carries no theme and no card', async () => {
  const result = await withMockApi(
    () => ({ payload: { choices: [{ message: { content: QUESTION_ANSWER } }] } }),
    (baseUrl) => aiTheme.chat({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: '你好' }]
    })
  );

  assert.equal(result.reply, '你好！想改哪里？');
  assert.equal(result.theme, null);
  assert.equal(result.themeChanged, false);
  assert.equal(result.settings, null, 'no settings means no apply button');
});

test('a claimed change with no theme is not turned into an apply button', async () => {
  const answer = JSON.stringify({ reply: 'ok', themeChanged: true, theme: null, preferencesChanged: false, preferences: null });
  const result = await withMockApi(
    () => ({ payload: { choices: [{ message: { content: answer } }] } }),
    (baseUrl) => aiTheme.chat({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hm' }]
    })
  );

  assert.equal(result.themeChanged, false, 'the flag follows the theme, not the claim');
  assert.equal(result.settings, null);
});

test('the chat schema makes the theme nullable without dropping it from required', async () => {
  const bodies = {};
  for (const provider of ['openai', 'anthropic']) {
    await withMockApi(({ body }) => {
      bodies[provider] = body;
      return {
        payload: provider === 'anthropic'
          ? { content: [{ type: 'text', text: QUESTION_ANSWER }] }
          : { choices: [{ message: { content: QUESTION_ANSWER } }] }
      };
    }, (baseUrl) => aiTheme.chat({
      config: { provider, apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hi' }]
    }));
  }

  // Strict mode wants every property listed in `required`, so "nothing here"
  // has to be a null value rather than a missing key.
  const strict = bodies.openai.response_format.json_schema.schema;
  assert.deepEqual(strict.properties.theme.type, ['object', 'null']);
  assert.deepEqual(strict.properties.preferences.type, ['object', 'null']);
  assert.ok(strict.required.includes('theme') && strict.required.includes('preferences'));

  const anthropic = bodies.anthropic.output_config.format.schema;
  assert.deepEqual(anthropic.properties.theme.type, ['object', 'null']);
  assert.ok(anthropic.required.includes('theme'));
});

test('a reasoning model thinks in the open instead of into the answer', async () => {
  // The reasoning quotes the schema's own field name and contains a brace:
  // scanning the whole buffer would show the model's thinking as the reply, and
  // the brace would be taken for the start of the JSON.
  const thought = 'The user said hi. I will fill "reply" politely, theme stays null. {no theme}';
  const answer = JSON.stringify({ reply: 'Hi there.', themeChanged: false, theme: null, preferencesChanged: false, preferences: null });
  const thinking = [];
  const replies = [];

  const result = await withEventStream(
    openAiFrames(`<think>${thought}</think>${answer}`),
    (baseUrl) => aiTheme.chatStream({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hi' }],
      onReply: (text) => replies.push(text),
      onThinking: (text) => thinking.push(text)
    })
  );

  assert.equal(result.reply, 'Hi there.');
  assert.equal(result.thinking, thought);
  assert.ok(thinking.length > 1, 'the thinking should arrive in pieces too');
  assert.ok(replies.every((text) => thought.indexOf(text) === -1), 'no reasoning may be shown as the reply');
  assert.equal(replies[replies.length - 1], 'Hi there.');
});

test('reasoning sent as its own field is picked up as well', async () => {
  const answer = JSON.stringify({ reply: 'Done.', themeChanged: false, theme: null, preferencesChanged: false, preferences: null });
  const frames = [
    { choices: [{ delta: { reasoning_content: 'weighing two palettes' } }] },
    ...openAiFrames(answer)
  ];

  const result = await withEventStream(frames, (baseUrl) => aiTheme.chatStream({
    config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
    profile: SAMPLE_PROFILE,
    turns: [{ role: 'user', content: 'hi' }]
  }));

  assert.equal(result.thinking, 'weighing two palettes');
  assert.equal(result.reply, 'Done.');
});

test('a turn reports whether it streamed, why it did not, and what it cost', async () => {
  const answer = JSON.stringify({ reply: 'Done.', themeChanged: false, theme: null, preferencesChanged: false, preferences: null });

  const streamed = await withEventStream(
    [...openAiFrames(answer), { choices: [], usage: { prompt_tokens: 1200, completion_tokens: 40 } }],
    (baseUrl) => aiTheme.chatStream({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hi' }]
    })
  );

  assert.equal(streamed.streamed, true);
  assert.equal(streamed.streamFallback, '', 'nothing to explain when it streamed');
  assert.equal(streamed.stats.inputTokens, 1200);
  assert.equal(streamed.stats.outputTokens, 40);
  assert.ok(streamed.stats.firstTokenMs !== null, 'the first token was seen, so it was timed');

  // An endpoint that answers a stream request with ordinary JSON: the answer
  // survives, and the turn says why it arrived all at once.
  const fallback = await withMockApi(
    () => ({ payload: { choices: [{ message: { content: answer } }], usage: { prompt_tokens: 1200, completion_tokens: 40 } } }),
    (baseUrl) => aiTheme.chatStream({
      config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl },
      profile: SAMPLE_PROFILE,
      turns: [{ role: 'user', content: 'hi' }]
    })
  );

  assert.equal(fallback.streamed, false);
  assert.match(fallback.streamFallback, /application\/json/);
  assert.equal(fallback.stats.firstTokenMs, null, 'nothing was streamed, so there is no first-token time');
  assert.equal(fallback.stats.outputTokens, 40);
});

test('the streaming toggle skips the request that would have to be retried', async () => {
  let calls = 0;
  const answer = JSON.stringify({ reply: 'Done.', themeChanged: false, theme: null, preferencesChanged: false, preferences: null });
  const result = await withMockApi(({ body }) => {
    calls += 1;
    assert.ok(!body.stream, 'no stream may be asked for when the user turned it off');
    return { payload: { choices: [{ message: { content: answer } }] } };
  }, (baseUrl) => aiTheme.chatStream({
    config: { provider: 'openai', apiKey: 'sk-test', model: 'm', baseUrl, streaming: false },
    profile: SAMPLE_PROFILE,
    turns: [{ role: 'user', content: 'hi' }]
  }));

  assert.equal(calls, 1, 'one request, not a stream attempt and a retry');
  assert.equal(result.streamed, false);
  assert.equal(result.streamFallback, '', 'this is what was asked for, not a downgrade');
});
