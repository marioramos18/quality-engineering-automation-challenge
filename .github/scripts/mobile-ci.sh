#!/usr/bin/env bash
set -euo pipefail

mkdir -p reports/mobile
appium_pid=

cleanup() {
  local result=$?
  trap - EXIT
  set +e
  if [[ -n "$appium_pid" ]]; then
    kill "$appium_pid"
    wait "$appium_pid"
  fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Keep the proven APK installation and launch checks before the Appium tests.
bash .github/scripts/mobile-smoke.sh

appium --address 127.0.0.1 --port 4723 --log-level info > reports/mobile/appium.log 2>&1 &
appium_pid=$!

deadline=$((SECONDS + 60))
until curl --fail --silent --max-time 2 http://127.0.0.1:4723/status |
  python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin)["value"]["ready"] else 1)' >/dev/null 2>&1; do
  if ! kill -0 "$appium_pid" 2>/dev/null; then
    echo '::error::Appium exited before reporting readiness.'
    exit 1
  fi
  if (( SECONDS >= deadline )); then
    echo '::error::Appium did not become ready within 60 seconds.'
    exit 1
  fi
  sleep 1
done

uv run --locked --only-group mobile pytest mobile/tests -v \
  --html=reports/mobile/report.html --self-contained-html \
  --junitxml=reports/mobile/junit.xml \
  2>&1 | tee reports/mobile/pytest.log
