#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEST_SCRIPT="$SCRIPT_DIR/test-export-concurrency.mjs"

PROJECT_ROOT="${1:-$(pwd)}"
MAX_RUNS="${2:-0}"

if ! [[ "$MAX_RUNS" =~ ^[0-9]+$ ]]; then
  echo "[loop] maxRuns must be a non-negative integer: $MAX_RUNS" >&2
  exit 2
fi

pass=0
fail=0
run=0

while true; do
  run=$((run + 1))
  echo "[loop] run #$run"

  if node "$TEST_SCRIPT" "$PROJECT_ROOT"; then
    pass=$((pass + 1))
    echo "[loop] passed run #$run (pass=$pass)"
  else
    fail=$((fail + 1))
    echo "[loop] failed at run #$run (pass=$pass, fail=$fail)" >&2
    exit 1
  fi

  if [ "$MAX_RUNS" -gt 0 ] && [ "$run" -ge "$MAX_RUNS" ]; then
    break
  fi
done

echo "[loop] completed without failure (pass=$pass, fail=$fail)"
