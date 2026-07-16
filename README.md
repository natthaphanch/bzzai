# BZZAI Helper

Switch between **Zai API** and **Anthropic Default** in Claude Code with TUI Menu

---

## Requirements

- **Node.js ≥ 14** — required for every entry point: `npx bzzai-helper`, the
  `bzzai` command, and `source toggle.sh`. They all share one Node implementation
  (`lib/settings.js`), so the shell wrappers call `node index.js` under the hood.
- `jq` is no longer required.

---

## Quick Start (npx)

No installation required - run directly:

```bash
# First run - creates config file automatically
npx bzzai-helper

# Edit API key
nano ~/.zai/env.sh

# Usage
npx bzzai-helper        # Open TUI menu
npx bzzai-helper on     # Enable Zai
npx bzzai-helper off    # Disable Zai
npx bzzai-helper status # Check status
```

---

## Manual Install

```bash
# Clone repo
git clone https://github.com/Natthaphan/bzzai.git ~/bzzai
cd ~/bzzai

# Add to PATH
echo 'export PATH="$PATH:~/bzzai/bin"' >> ~/.zshrc
source ~/.zshrc

# Usage
bzzai on
bzzai off
bzzai status
bzzai menu
```

**No build step — edits are live.** This is plain Node.js. After editing
`index.js`, `lib/settings.js`, or the shell wrappers in your cloned copy, the next
`bzzai …` (or `zai-on` / `zai-off` if you `source toggle.sh`) runs your changes
immediately — no compile or reinstall. Run `npm test` to check them.

---

## Updating

Get the newest published version:

```bash
# npx — npx caches, so pin @latest to force the newest
npx bzzai-helper@latest

# Manual install / source toggle.sh — just pull, no build or npm install needed
cd ~/bzzai && git pull
```

---

## API Key Configuration

Create `~/.zai/env.sh` (auto-created on first run):

```bash
mkdir -p ~/.zai
nano ~/.zai/env.sh
```

```bash
ZAI_AUTH_TOKEN="your-api-key-here"
ZAI_BASE_URL="https://api.z.ai/api/anthropic"
ZAI_TIMEOUT_MS="3000000"

# Model mapping: which GLM model backs each Anthropic slot
ZAI_HAIKU_MODEL="glm-4.5-air"
ZAI_SONNET_MODEL="glm-5.2[1m]"
ZAI_OPUS_MODEL="glm-5.2[1m]"

ZAI_DEBUG="0"
```

The `[1m]` suffix selects GLM-5.2's full **1M-token context**. When any model uses
it, enabling Zai also sets `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000` in
`settings.json` (and removes it again on `off` or when you drop the suffix). Use
plain `glm-5.2` for the standard context. All three model vars are optional — the
values above are the defaults.

---

## Important: Avoid Signature Errors ⚠️

When switching **from Zai back to Anthropic**, you may encounter:

```
Invalid signature in thinking block
```

**Solution:** Run `/compact` or `/clear` in Claude Code before switching.

```bash
# Before running: bzzai off
/compact
# or
/clear
```

| Switch Path | Need /compact? |
|------------|----------------|
| Anthropic → Zai (`bzzai on`) | No |
| Zai → Anthropic (`bzzai off`) | **Yes** |

---

## TUI Menu

```
    ╔═════════════════════════════════╗
    ║     BZZAI Toggle Menu           ║
    ╚═════════════════════════════════╝

    Status: [OFF] Zai DISABLED

    ─────────────────────────────────────

    > Enable Zai     Switch to Zai API
      Disable Zai    Switch back to Anthropic
      Check Status   Show current status
      Edit Config    Edit API config
      Quit           Exit

    ↑↓ Navigate  Enter Select  q Quit
```

---

## License

MIT
