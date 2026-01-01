#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git config core.hooksPath "${ROOT_DIR}/.githooks"
chmod +x "${ROOT_DIR}/.githooks/pre-commit" "${ROOT_DIR}/.githooks/pre-push"

echo "Git hooks installed at ${ROOT_DIR}/.githooks"
