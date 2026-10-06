#!/usr/bin/env bash
# Simulates a flaky check: fails about half the time.
set -euo pipefail

echo "Attempt ${BUILDKITE_RETRY_COUNT:-0}"
if (( RANDOM % 2 )); then
  echo "Unlucky roll, failing so Buildkite retries this job."
  exit 1
fi
echo "Passed."
