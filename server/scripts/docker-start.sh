#!/usr/bin/env bash
set -euo pipefail

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