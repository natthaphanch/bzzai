#!/bin/bash
# Zai config toggle script for Claude Code
# Usage: source ~/DataStore/me/claude/zai/toggle.sh && zai-on / zai-off / zai-status

ZAI_DEBUG="${ZAI_DEBUG:-0}"
_zai_log() { [[ "$ZAI_DEBUG" == "1" ]] && echo "[$(date +%H:%M:%S.%3N)] $1"; }

_zai_log "Script started"

ZAI_DIR="${ZAI_DIR:-$HOME/DataStore/me/claude/zai}"
ZAI_ENV_TEMPLATE="$ZAI_DIR/env.sh"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"

_zai_log "Loading env template..."
# Source env template to get values
if [[ -f "$ZAI_ENV_TEMPLATE" ]]; then
  source "$ZAI_ENV_TEMPLATE"
fi
_zai_log "Env template loaded"

zai-on() {
  _zai_log "zai-on: Updating settings.json..."

  # Use jq to add env vars to settings.json
  local tmp_file=$(mktemp)
  jq --arg token "$ZAI_AUTH_TOKEN" \
     --arg url "$ZAI_BASE_URL" \
     --arg timeout "$ZAI_TIMEOUT_MS" \
     --arg haiku "${ZAI_HAIKU_MODEL:-glm-4.5-air}" \
     --arg sonnet "${ZAI_SONNET_MODEL:-glm-5-turbo}" \
     --arg opus "${ZAI_OPUS_MODEL:-glm-5.1}" \
     '.env.ANTHROPIC_AUTH_TOKEN = $token
      | .env.ANTHROPIC_BASE_URL = $url
      | .env.API_TIMEOUT_MS = $timeout
      | .env.ANTHROPIC_DEFAULT_HAIKU_MODEL = $haiku
      | .env.ANTHROPIC_DEFAULT_SONNET_MODEL = $sonnet
      | .env.ANTHROPIC_DEFAULT_OPUS_MODEL = $opus' \
     "$CLAUDE_SETTINGS" > "$tmp_file" && mv "$tmp_file" "$CLAUDE_SETTINGS"

  _zai_log "zai-on: Done"
  echo "✓ Zai config ENABLED"
  echo "  Restart Claude session to apply changes"
}

zai-off() {
  _zai_log "zai-off: Updating settings.json..."

  # Use jq to set env vars to empty (not delete) to force Claude to reload
  local tmp_file=$(mktemp)
  jq '.env.ANTHROPIC_AUTH_TOKEN = ""
      | .env.ANTHROPIC_BASE_URL = ""
      | del(.env.API_TIMEOUT_MS)
      | .env.ANTHROPIC_DEFAULT_HAIKU_MODEL = ""
      | .env.ANTHROPIC_DEFAULT_SONNET_MODEL = ""
      | .env.ANTHROPIC_DEFAULT_OPUS_MODEL = ""' \
     "$CLAUDE_SETTINGS" > "$tmp_file" && mv "$tmp_file" "$CLAUDE_SETTINGS"

  _zai_log "zai-off: Done"
  echo "✓ Zai config DISABLED (using default Anthropic)"
  echo "  Restart Claude session to apply changes"
}

zai-status() {
  if jq -e '.env.ANTHROPIC_AUTH_TOKEN' "$CLAUDE_SETTINGS" > /dev/null 2>&1; then
    local url=$(jq -r '.env.ANTHROPIC_BASE_URL // "not set"' "$CLAUDE_SETTINGS")
    echo "🟢 Zai: ENABLED"
    echo "   Base URL: $url"
    echo "   Settings: $CLAUDE_SETTINGS"
  else
    echo "⚪ Zai: DISABLED (default Anthropic)"
  fi
}

zai-edit() {
  echo "Opening $ZAI_ENV_TEMPLATE in editor..."
  ${EDITOR:-nano} "$ZAI_ENV_TEMPLATE"
}

_zai_log "Script ready"
