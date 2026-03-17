#!/bin/sh
#
# Installer for the Scorable CLI
#
# Installs @root-signals/scorable-cli globally via npm, making the
# 'scorable' command available system-wide.
#
# Usage:
#   curl -sSL https://scorable.ai/cli/install.sh | sh
#

set -e

# --- Configuration ---
PACKAGE="@root-signals/scorable-cli"
INSTALL_NAME="scorable"
MIN_NODE_MAJOR=20

# --- Helper Functions ---
command_exists() {
  command -v "$@" >/dev/null 2>&1
}

node_version_ok() {
  node_major=$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
  [ -n "$node_major" ] && [ "$node_major" -ge "$MIN_NODE_MAJOR" ]
}

# --- Main Installation Logic ---
main() {
  OS=$(uname -s)
  case "$OS" in
    Linux|Darwin) ;;
    *)
      echo "Error: Unsupported operating system '$OS'." >&2
      echo "This installer is designed for Linux and macOS." >&2
      exit 1
      ;;
  esac

  echo "Installing the Scorable CLI..."

  # Check for Node.js >= 18
  if ! command_exists node; then
    echo "Error: Node.js is not installed." >&2
    echo "Install it from https://nodejs.org/ (version $MIN_NODE_MAJOR or higher required)." >&2
    exit 1
  fi

  if ! node_version_ok; then
    echo "Error: Node.js $MIN_NODE_MAJOR or higher is required (current: $(node --version))." >&2
    echo "Update at https://nodejs.org/" >&2
    exit 1
  fi

  # Check for npm
  if ! command_exists npm; then
    echo "Error: npm is not installed." >&2
    echo "npm is bundled with Node.js — reinstalling Node.js should fix this." >&2
    exit 1
  fi

  echo "Node.js $(node --version) detected."
  echo "Installing $PACKAGE globally..."

  npm install -g "$PACKAGE"

  echo ""
  echo "Scorable CLI installed successfully!"
  echo "Run it with: SCORABLE_API_KEY=<your-api-key> $INSTALL_NAME judge list"
  echo ""
  echo "To uninstall, run: npm uninstall -g $PACKAGE"
}

# --- Run ---
main
