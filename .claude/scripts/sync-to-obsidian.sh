#!/usr/bin/env bash
# sync-to-obsidian.sh
# Called by Claude Code hooks to sync the latest session to the Obsidian vault.
# Safe to run even if Obsidian is closed — obsidian-sync.mjs exits 0 in that case.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT" || exit 0

node obsidian-sync.mjs --auto 2>/dev/null || true
