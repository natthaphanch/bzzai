'use strict';

// End-to-end coverage of the `node index.js on|off|status` path that the shell
// wrappers (toggle.sh / menu.sh) now delegate to. Each test drives the real CLI
// against a throwaway ZAI_ROOT + settings.json, so nothing touches ~/.claude.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const INDEX = path.join(__dirname, '..', 'index.js');

const ENV_1M = [
  'ZAI_AUTH_TOKEN="tok-abc"',
  'ZAI_BASE_URL="https://api.z.ai/api/anthropic"',
  'ZAI_TIMEOUT_MS="3000000"',
  'ZAI_HAIKU_MODEL="glm-4.5-air"',
  'ZAI_SONNET_MODEL="glm-5.2[1m]"',
  'ZAI_OPUS_MODEL="glm-5.2[1m]"',
  '',
].join('\n');

const ENV_PLAIN = ENV_1M.replace(/glm-5\.2\[1m\]/g, 'glm-5.2');

function makeWorkspace(envBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bzzai-cli-'));
  const zaiRoot = path.join(dir, 'zai');
  fs.mkdirSync(zaiRoot, { recursive: true });
  fs.writeFileSync(path.join(zaiRoot, 'env.sh'), envBody);
  const settings = path.join(dir, 'settings.json');
  // A pre-existing unrelated key proves the toggle only touches its own env vars.
  fs.writeFileSync(settings, JSON.stringify({ env: { KEEP_ME: 'yes' } }, null, 2));
  return { zaiRoot, settings };
}

function run(cmd, ws) {
  return execFileSync('node', [INDEX, cmd], {
    encoding: 'utf8',
    env: { ...process.env, ZAI_ROOT: ws.zaiRoot, CLAUDE_SETTINGS: ws.settings },
  });
}

function readEnv(ws) {
  return JSON.parse(fs.readFileSync(ws.settings, 'utf8')).env;
}

test('cli on: writes token, models and the 1M window', () => {
  const ws = makeWorkspace(ENV_1M);
  run('on', ws);
  const env = readEnv(ws);
  assert.equal(env.ANTHROPIC_AUTH_TOKEN, 'tok-abc');
  assert.equal(env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5.2[1m]');
  assert.equal(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW, '1000000');
  assert.equal(env.KEEP_ME, 'yes');
});

test('cli on: writes no window for a non-[1m] config', () => {
  const ws = makeWorkspace(ENV_PLAIN);
  run('on', ws);
  assert.equal('CLAUDE_CODE_AUTO_COMPACT_WINDOW' in readEnv(ws), false);
});

test('cli off: clears the token and drops the window, keeping other keys', () => {
  const ws = makeWorkspace(ENV_1M);
  run('on', ws);
  run('off', ws);
  const env = readEnv(ws);
  assert.equal(env.ANTHROPIC_AUTH_TOKEN, '');
  assert.equal('CLAUDE_CODE_AUTO_COMPACT_WINDOW' in env, false);
  assert.equal(env.KEEP_ME, 'yes');
});

test('cli status: ENABLED after on, DISABLED after off', () => {
  const ws = makeWorkspace(ENV_1M);
  run('on', ws);
  assert.match(run('status', ws), /ENABLED/);
  run('off', ws);
  assert.match(run('status', ws), /DISABLED/);
});
