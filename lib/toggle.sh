#!/bin/bash
# Zai config toggle for Claude Code.
#
# Thin shell wrappers over `node index.js`. All settings.json logic lives once in
# index.js / lib/settings.js, so bash, the native TUI and npx share one
# implementation. Source this file, then use:
#   zai-on / zai-off / zai-status / zai-edit
#
# Usage: source ~/DataStore/me/claude/zai/toggle.sh

ZAI_DIR="${ZAI_DIR:-$HOME/DataStore/me/claude/zai}"
ZAI_INDEX="$ZAI_DIR/index.js"

# Point index.js at the same env.sh the shell user edits (ZAI_ROOT/env.sh),
# instead of its own default (~/.zai/env.sh).
_zai_node() { ZAI_ROOT="$ZAI_DIR" node "$ZAI_INDEX" "$@"; }

zai-on()     { _zai_node on; }
zai-off()    { _zai_node off; }
zai-status() { _zai_node status; }
zai-edit()   { "${EDITOR:-nano}" "$ZAI_DIR/env.sh"; }
