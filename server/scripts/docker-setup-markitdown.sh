#!/usr/bin/env bash
# Creates /app/.markitdown-src and /app/.venv-markitdown (Linux paths) for Docker.
set -euo pipefail

APP_DIR="${APP_DIR:-/app}"
REPO_DIR="${MARKITDOWN_REPO_DIR:-${APP_DIR}/.markitdown-src}"
VENV_DIR="${MARKITDOWN_VENV_DIR:-${APP_DIR}/.venv-markitdown}"

cd "$APP_DIR"

if ! command -v git >/dev/null 2>&1; then
	echo "git is required for MarkItDown setup"
	exit 1
fi

if [ ! -d "${REPO_DIR}/.git" ]; then
	echo "Cloning MarkItDown into ${REPO_DIR}"
	git clone --depth 1 https://github.com/microsoft/markitdown.git "${REPO_DIR}"
else
	echo "MarkItDown repo already present at ${REPO_DIR}"
fi

echo "Creating virtual environment at ${VENV_DIR}"
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip setuptools wheel
"${VENV_DIR}/bin/pip" install \
	"${REPO_DIR}/packages/markitdown[all]" \
	"${REPO_DIR}/packages/markitdown-ocr" \
	openai

echo "MarkItDown ready: ${VENV_DIR}/bin/python"
