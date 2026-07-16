# Zai Toggle Script - ChangeLog

## 2026-07-16 - GLM-5.2[1m] models + unified Node implementation

### Changed

- **Default models** are now `glm-5.2[1m]` for Sonnet/Opus (Haiku stays
  `glm-4.5-air`). When any configured model carries the `[1m]` suffix, enabling
  Zai sets `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` in `settings.json` so Claude
  Code uses GLM's full 1M-token context. The key is removed again when you
  downgrade to a non-`[1m]` model or run `zai-off`.
- **Single source of truth.** The settings.json logic (enable / disable / status /
  1M-window) previously existed in four copies — `toggle.sh`, `lib/toggle.sh`,
  `menu.sh` (bash/jq) and `index.js` (Node). It now lives once in
  `lib/settings.js`, consumed by `index.js`. The shell scripts are thin wrappers
  that call `node index.js on|off|status`, and `toggle.sh` just sources
  `lib/toggle.sh`. (net −225 / +56 lines)

### Fixed

- `[1m]` detection is now case-insensitive — `glm-5.2[1M]` triggers the 1M window
  too.
- `zai-status` no longer reports ENABLED after `zai-off`. The old bash check
  (`jq -e .env.ANTHROPIC_AUTH_TOKEN`) treated an empty-string token as truthy;
  status now flows through `readStatus`, which reads a blank token as DISABLED.

### Tests

- Added `test/settings.test.js` (unit) and `test/cli.test.js` (end-to-end CLI).
  `npm test` runs both; `npm run test:coverage` enforces 100% line / branch /
  function coverage on `lib/settings.js`.

### Note

- The shell entry point (`source toggle.sh`) now requires **Node.js** (≥ 14), like
  the `npx` and `bzzai` paths — the jq-only shell implementation was replaced by
  the single Node implementation.

---

## 2025-01-12 - Initial Setup

### What was done

1. **Created toggle script system** at `~/.config/zai/` (later moved to `~/DataStore/me/claude/zai/`)
   - `toggle.sh` - Main script with zai-on, zai-off, zai-status, zai-edit functions
   - `env.sh` - Template file for Zai API configuration
   - `alias.sh` - Shell aliases and functions

2. **Modified `~/.zshrc`**
   - Added: `source ~/.config/zai/alias.sh`
   - Location: Line 212-213

3. **Modified `~/.claude/settings.json`**
   - Removed hardcoded API keys (security improvement)
   - Added `CLAUDE_ENV_FILE` pointing to `~/.claude/session-env.sh`
   - Added `SessionStart` hook to load zai config on startup

4. **Created helper files**
   - `~/.claude/session-env.sh` - Runtime env file (auto-generated)

### Migration

- Scripts moved from `~/.config/zai/` → `~/DataStore/me/claude/zai/`
- Update `.zshrc` to point to new location

---

## Security Note

**IMPORTANT:** Old API key was exposed during setup. Please:
1. Revoke the old key: `<redacted — revoked>`
2. Generate a new key from Zai dashboard
3. Update `ZAI_AUTH_TOKEN` in `env.sh`
