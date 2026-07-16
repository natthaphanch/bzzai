#!/bin/bash
# Entry point kept stable for `source ~/DataStore/me/claude/zai/toggle.sh`.
# The real wrappers live once in lib/toggle.sh.

ZAI_DIR="${ZAI_DIR:-$HOME/DataStore/me/claude/zai}"
source "$ZAI_DIR/lib/toggle.sh"
