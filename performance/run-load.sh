#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
exec python3 scripts/run_load.py "${1:?Expected smoke or load}"
