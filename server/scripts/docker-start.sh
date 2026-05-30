#!/usr/bin/env bash
set -euo pipefail

# Use the venv baked into the image (Linux). Ignore invalid host paths e.g. Windows Scripts\python.exe.
DOCKER_PYTHON="/app/.venv-markitdown/bin/python"
if [[ ! -x "${DOC_PARSER_PYTHON_PATH:-}" ]]; then
	if [[ -n "${DOC_PARSER_PYTHON_PATH:-}" ]]; then
		echo "DOC_PARSER_PYTHON_PATH is not executable (${DOC_PARSER_PYTHON_PATH}); using ${DOCKER_PYTHON}"
	fi
	export DOC_PARSER_PYTHON_PATH="${DOCKER_PYTHON}"
fi
export DOC_PARSER_SCRIPT_PATH="${DOC_PARSER_SCRIPT_PATH:-/app/src/services/python/parse_document.py}"

api_pid=""
worker_pid=""

cleanup() {
  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
  fi

  if [[ -n "$worker_pid" ]]; then
    kill "$worker_pid" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Running database migrations"
bunx prisma migrate deploy

echo "Starting API server"
bun src/index.ts &
api_pid=$!

echo "Starting background workers"
bun src/worker.ts &
worker_pid=$!

wait -n "$api_pid" "$worker_pid"