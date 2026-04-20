#!/usr/bin/env bash
set -euo pipefail

VERSION="0.1.0"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS=("compile-wiki" "ask-wiki" "lint-wiki")

usage() {
    cat <<EOF
Usage: $(basename "$0") <platform>

Install PersonalKnowledgeBase skills for your AI coding assistant.

Platforms:
  cursor    → ~/.cursor/skills/
  claude    → ~/.claude/skills/
  copilot   → ~/.copilot/skills/

What it does:
  1. Creates symlinks from <target>/compile-wiki, ask-wiki, lint-wiki
     pointing back to this repo's skills/ directory.
  2. Creates raw/ and output/ directories if they don't exist.

Examples:
  ./setup.sh cursor          # set up for Cursor IDE
  ./setup.sh claude          # set up for Claude Code
  ./setup.sh cursor claude   # set up for both at once

To uninstall:
  ./setup.sh --uninstall cursor
EOF
    exit 1
}

resolve_target_dir() {
    case "$1" in
        cursor)  echo "$HOME/.cursor/skills" ;;
        claude)  echo "$HOME/.claude/skills" ;;
        copilot) echo "$HOME/.copilot/skills" ;;
        *)
            echo "Unknown platform: $1" >&2
            echo "Supported: cursor, claude, copilot" >&2
            return 1
            ;;
    esac
}

install_platform() {
    local platform="$1"
    local target_dir
    target_dir="$(resolve_target_dir "$platform")" || return 1

    echo "[$platform] Installing skills (v$VERSION) to $target_dir"
    mkdir -p "$target_dir"

    for skill in "${SKILLS[@]}"; do
        local src="$REPO_DIR/skills/$skill"
        local dst="$target_dir/$skill"

        if [ -L "$dst" ]; then
            local existing
            existing="$(readlink -f "$dst")"
            if [ "$existing" = "$src" ]; then
                echo "  $skill → already linked (skipped)"
                continue
            fi
            echo "  $skill → updating symlink (was: $existing)"
            rm "$dst"
        elif [ -d "$dst" ]; then
            echo "  $skill → WARNING: directory exists and is NOT a symlink."
            echo "           Back it up manually if needed, then re-run."
            continue
        fi

        ln -s "$src" "$dst"
        echo "  $skill → linked"
    done

    echo "[$platform] Done."
    echo ""
}

uninstall_platform() {
    local platform="$1"
    local target_dir
    target_dir="$(resolve_target_dir "$platform")" || return 1

    echo "[$platform] Removing skill symlinks from $target_dir"
    for skill in "${SKILLS[@]}"; do
        local dst="$target_dir/$skill"
        if [ -L "$dst" ]; then
            rm "$dst"
            echo "  $skill → removed"
        elif [ -e "$dst" ]; then
            echo "  $skill → skipped (not a symlink, won't touch it)"
        else
            echo "  $skill → not found (skipped)"
        fi
    done
    echo "[$platform] Uninstalled."
    echo ""
}

# --- Main ---

[ $# -eq 0 ] && usage

UNINSTALL=false
PLATFORMS=()

for arg in "$@"; do
    case "$arg" in
        --uninstall) UNINSTALL=true ;;
        --help|-h)   usage ;;
        *)           PLATFORMS+=("$arg") ;;
    esac
done

[ ${#PLATFORMS[@]} -eq 0 ] && usage

if $UNINSTALL; then
    for p in "${PLATFORMS[@]}"; do
        uninstall_platform "$p"
    done
    exit 0
fi

# Create local directories
mkdir -p "$REPO_DIR/raw" "$REPO_DIR/output"

# Disconnect from the template origin to prevent accidental pushes
if git -C "$REPO_DIR" remote get-url origin 2>/dev/null | grep -qi "PersonalKnowledgeBaseCreator"; then
    echo "Disconnecting from template repository to prevent accidental pushes..."
    git -C "$REPO_DIR" remote rename origin template-origin
    echo "  origin → renamed to 'template-origin'"
    echo "  To push your wiki to your own repo, run:"
    echo "    git remote add origin <your-repo-url>"
    echo ""
fi

for p in "${PLATFORMS[@]}"; do
    install_platform "$p"
done

echo "Setup complete. Skills are symlinked — git pull updates them automatically."
echo ""
echo "Quick start:"
echo "  1. Edit AGENTS.md and fill in your focus areas"
echo "  2. Drop files into raw/"
echo "  3. Open in your AI assistant and say: 'Compile the wiki'"
echo "  4. Browse wiki/ in Obsidian"
