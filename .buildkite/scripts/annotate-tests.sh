#!/usr/bin/env bash
# Downloads the test step's reports and posts a summary annotation on the build.
set -euo pipefail

buildkite-agent artifact download "reports/**/*" . --step test || {
  buildkite-agent annotate --style error --context tests \
    "Test step produced no reports. Check the :vitest: Test log."
  exit 0
}

junit="reports/junit.xml"
coverage="reports/coverage/coverage-summary.json"

# Root <testsuites> element carries the totals.
root=$(grep -m1 -o '<testsuites[^>]*>' "$junit")
attr() { sed -nE "s/.* $1=\"([0-9.]+)\".*/\1/p" <<<"$root"; }
tests=$(attr tests)
failures=$(attr failures)
errors=$(attr errors)
failed=$(( ${failures:-0} + ${errors:-0} ))

lines="n/a"
if [[ -f "$coverage" ]]; then
  lines=$(node -e 'console.log(require(process.argv[1]).total.lines.pct + "%")' "$PWD/$coverage")
fi

style="success"
[[ "$failed" -gt 0 ]] && style="error"

buildkite-agent annotate --style "$style" --context tests <<MD
### Test results

| Tests | Failed | Line coverage |
|---|---|---|
| ${tests} | ${failed} | ${lines} |

Full JUnit and HTML coverage reports are under this build's **Artifacts** tab (\`reports/\`).
MD
