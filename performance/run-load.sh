#!/usr/bin/env bash
set -euo pipefail

profile="${1:?Expected smoke or load}"

case "$profile" in
  smoke)
    load_vus="${PERF_VUS:-10}"
    load_duration="${PERF_DURATION:-15s}"
    ;;
  load)
    load_vus=500
    load_duration=5m
    ;;
  *)
    printf 'Unknown load profile: %s\n' "$profile" >&2
    exit 2
    ;;
esac

if [[ ! "$load_vus" =~ ^[1-9][0-9]*$ ]] || [[ ! "$load_duration" =~ ^[1-9][0-9]*(s|m)$ ]]; then
  printf 'PERF_VUS must be positive and PERF_DURATION must use s or m.\n' >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
mkdir -p reports/performance

export HOST_UID="$(id -u)"
export HOST_GID="$(id -g)"
export LOAD_VUS="$load_vus"
export LOAD_DURATION="$load_duration"
export RUN_PROFILE="$profile"

project="quality-load-${HOST_UID}-$$"
compose=(docker compose -p "$project" -f performance/compose.yaml)

cleanup() {
  original_status=$?
  trap - EXIT
  if ! "${compose[@]}" down --remove-orphans; then
    printf 'Docker Compose cleanup failed.\n' >&2
    if (( original_status == 0 )); then
      original_status=1
    fi
  fi
  exit "$original_status"
}
trap cleanup EXIT

"${compose[@]}" up --build --wait -d mock-api
"${compose[@]}" run --rm --no-deps k6
