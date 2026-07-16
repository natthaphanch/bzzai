'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  needsOneMillionWindow,
  applyEnable,
  applyDisable,
  readStatus,
  WINDOW_KEY,
  ONE_MILLION_WINDOW,
} = require('../lib/settings');

// ---------------------------------------------------------------------------
// needsOneMillionWindow — case-insensitive detection of the [1m] suffix
// ---------------------------------------------------------------------------

test('needsOneMillionWindow: true when a model carries the lowercase [1m] suffix', () => {
  assert.equal(needsOneMillionWindow(['glm-4.5-air', 'glm-5.2[1m]', 'glm-5.2']), true);
});

test('needsOneMillionWindow: true for uppercase [1M] (case-insensitive)', () => {
  assert.equal(needsOneMillionWindow(['glm-5.2[1M]']), true);
});

test('needsOneMillionWindow: false when no model carries the suffix', () => {
  assert.equal(needsOneMillionWindow(['glm-4.5-air', 'glm-5.2', 'glm-5.1']), false);
});

test('needsOneMillionWindow: false for an empty list', () => {
  assert.equal(needsOneMillionWindow([]), false);
});

test('needsOneMillionWindow: tolerates undefined input', () => {
  assert.equal(needsOneMillionWindow(undefined), false);
});

test('needsOneMillionWindow: ignores non-string entries', () => {
  assert.equal(needsOneMillionWindow([null, 42, undefined]), false);
});

// ---------------------------------------------------------------------------
// applyEnable — writes the Zai env block into settings and manages the window
// ---------------------------------------------------------------------------

const CONFIG_1M = {
  authToken: 'tok-123',
  baseUrl: 'https://api.z.ai/api/anthropic',
  timeoutMs: '3000000',
  haikuModel: 'glm-4.5-air',
  sonnetModel: 'glm-5.2[1m]',
  opusModel: 'glm-5.2[1m]',
};

const CONFIG_PLAIN = { ...CONFIG_1M, sonnetModel: 'glm-5.2', opusModel: 'glm-5.2' };

test('applyEnable: writes every Zai env var', () => {
  const out = applyEnable({ env: {} }, CONFIG_1M);
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, 'tok-123');
  assert.equal(out.env.ANTHROPIC_BASE_URL, 'https://api.z.ai/api/anthropic');
  assert.equal(out.env.API_TIMEOUT_MS, '3000000');
  assert.equal(out.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-4.5-air');
  assert.equal(out.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5.2[1m]');
  assert.equal(out.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.2[1m]');
});

test('applyEnable: sets the 1M window when a [1m] model is configured', () => {
  const out = applyEnable({ env: {} }, CONFIG_1M);
  assert.equal(out.env[WINDOW_KEY], ONE_MILLION_WINDOW);
});

test('applyEnable: removes a stale window when downgrading to a non-[1m] model', () => {
  const out = applyEnable({ env: { [WINDOW_KEY]: '1000000' } }, CONFIG_PLAIN);
  assert.equal(WINDOW_KEY in out.env, false);
});

test('applyEnable: preserves unrelated env keys', () => {
  const out = applyEnable({ env: { KEEP_ME: 'yes' } }, CONFIG_1M);
  assert.equal(out.env.KEEP_ME, 'yes');
});

test('applyEnable: creates the env object when settings has none', () => {
  const out = applyEnable({}, CONFIG_1M);
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, 'tok-123');
});

test('applyEnable: tolerates a null settings object', () => {
  const out = applyEnable(null, CONFIG_1M);
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, 'tok-123');
});

// ---------------------------------------------------------------------------
// applyDisable — clears the Zai env block and always drops the window
// ---------------------------------------------------------------------------

test('applyDisable: blanks every Zai env var', () => {
  const out = applyDisable({ env: { ANTHROPIC_AUTH_TOKEN: 'tok', ANTHROPIC_BASE_URL: 'u' } });
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, '');
  assert.equal(out.env.ANTHROPIC_BASE_URL, '');
  assert.equal(out.env.API_TIMEOUT_MS, '');
  assert.equal(out.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, '');
  assert.equal(out.env.ANTHROPIC_DEFAULT_SONNET_MODEL, '');
  assert.equal(out.env.ANTHROPIC_DEFAULT_OPUS_MODEL, '');
});

test('applyDisable: deletes the window key', () => {
  const out = applyDisable({ env: { [WINDOW_KEY]: '1000000' } });
  assert.equal(WINDOW_KEY in out.env, false);
});

test('applyDisable: preserves unrelated env keys', () => {
  const out = applyDisable({ env: { KEEP_ME: 'yes' } });
  assert.equal(out.env.KEEP_ME, 'yes');
});

test('applyDisable: creates the env object when settings has none', () => {
  const out = applyDisable({});
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, '');
});

test('applyDisable: tolerates a null settings object', () => {
  const out = applyDisable(null);
  assert.equal(out.env.ANTHROPIC_AUTH_TOKEN, '');
});

// ---------------------------------------------------------------------------
// readStatus — enabled only when the token is a non-empty string
// ---------------------------------------------------------------------------

test('readStatus: enabled with url when a real token is present', () => {
  const status = readStatus({ env: { ANTHROPIC_AUTH_TOKEN: 'tok', ANTHROPIC_BASE_URL: 'https://x' } });
  assert.deepEqual(status, { enabled: true, url: 'https://x' });
});

test('readStatus: url falls back to "unknown" when base url is blank', () => {
  const status = readStatus({ env: { ANTHROPIC_AUTH_TOKEN: 'tok', ANTHROPIC_BASE_URL: '' } });
  assert.deepEqual(status, { enabled: true, url: 'unknown' });
});

test('readStatus: disabled when the token is an empty string', () => {
  assert.deepEqual(readStatus({ env: { ANTHROPIC_AUTH_TOKEN: '' } }), { enabled: false });
});

test('readStatus: disabled when the token is only whitespace', () => {
  assert.deepEqual(readStatus({ env: { ANTHROPIC_AUTH_TOKEN: '   ' } }), { enabled: false });
});

test('readStatus: disabled when env has no token', () => {
  assert.deepEqual(readStatus({ env: {} }), { enabled: false });
});

test('readStatus: disabled when settings has no env', () => {
  assert.deepEqual(readStatus({}), { enabled: false });
});

test('readStatus: disabled when settings is null', () => {
  assert.deepEqual(readStatus(null), { enabled: false });
});
