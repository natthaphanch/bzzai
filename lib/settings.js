'use strict';

/**
 * Single source of truth for the Zai <-> Anthropic settings.json transformation.
 *
 * These functions are pure: they take (and return) plain settings objects and a
 * config, doing no file I/O. index.js wires them to disk; the shell scripts call
 * index.js. Keeping the logic here means one implementation and one place to test.
 */

const WINDOW_KEY = 'CLAUDE_CODE_AUTO_COMPACT_WINDOW';
const ONE_MILLION_WINDOW = '1000000';

// The [1m] suffix requests GLM's 1M-token context; Claude Code only uses it when
// the auto-compact window is raised to match. Detection is case-insensitive so
// "[1m]" and "[1M]" behave the same.
function needsOneMillionWindow(models) {
  return (models || []).some(
    (model) => typeof model === 'string' && model.toLowerCase().includes('[1m]')
  );
}

function ensureEnv(settings) {
  const next = settings && typeof settings === 'object' ? settings : {};
  next.env = next.env || {};
  return next;
}

function applyEnable(settings, config) {
  const next = ensureEnv(settings);
  next.env.ANTHROPIC_AUTH_TOKEN = config.authToken;
  next.env.ANTHROPIC_BASE_URL = config.baseUrl;
  next.env.API_TIMEOUT_MS = config.timeoutMs;
  next.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.haikuModel;
  next.env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.sonnetModel;
  next.env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.opusModel;
  if (needsOneMillionWindow([config.haikuModel, config.sonnetModel, config.opusModel])) {
    next.env[WINDOW_KEY] = ONE_MILLION_WINDOW;
  } else {
    delete next.env[WINDOW_KEY];
  }
  return next;
}

function applyDisable(settings) {
  const next = ensureEnv(settings);
  // Blank (not delete) the toggled keys so Claude Code reloads the session env.
  next.env.ANTHROPIC_AUTH_TOKEN = '';
  next.env.ANTHROPIC_BASE_URL = '';
  next.env.API_TIMEOUT_MS = '';
  next.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = '';
  next.env.ANTHROPIC_DEFAULT_SONNET_MODEL = '';
  next.env.ANTHROPIC_DEFAULT_OPUS_MODEL = '';
  delete next.env[WINDOW_KEY];
  return next;
}

// Enabled only when the token is a real, non-empty string. A blank token means
// zai-off ran, so an empty string must read as DISABLED.
function readStatus(settings) {
  const token = settings && settings.env ? settings.env.ANTHROPIC_AUTH_TOKEN : undefined;
  if (typeof token !== 'string' || token.trim().length === 0) {
    return { enabled: false };
  }
  return { enabled: true, url: settings.env.ANTHROPIC_BASE_URL || 'unknown' };
}

module.exports = {
  needsOneMillionWindow,
  applyEnable,
  applyDisable,
  readStatus,
  WINDOW_KEY,
  ONE_MILLION_WINDOW,
};
