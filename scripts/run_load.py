"""Run k6 against a disposable local mock API on Linux, macOS or Windows."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", choices=["smoke", "load"])
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    vus = env.get("PERF_VUS", "10") if args.profile == "smoke" else "500"
    duration = env.get("PERF_DURATION", "15s") if args.profile == "smoke" else "5m"
    if not re.fullmatch(r"[1-9][0-9]*", vus) or not re.fullmatch(
        r"[1-9][0-9]*[sm]", duration
    ):
        parser.error("PERF_VUS must be positive and PERF_DURATION must use s or m")
    env.update(
        HOST_UID=str(os.getuid() if hasattr(os, "getuid") else 1000),
        HOST_GID=str(os.getgid() if hasattr(os, "getgid") else 1000),
        LOAD_VUS=vus,
        LOAD_DURATION=duration,
        RUN_PROFILE=args.profile,
    )
    compose = [
        "docker",
        "compose",
        "-p",
        f"quality-load-{uuid.uuid4().hex[:10]}",
        "-f",
        str(root / "performance" / "compose.yaml"),
    ]
    (root / "reports" / "performance").mkdir(parents=True, exist_ok=True)

    def run(command: list[str], **kwargs) -> subprocess.CompletedProcess:
        return subprocess.run(command, cwd=root, env=env, check=True, **kwargs)

    try:
        if (
            run(
                ["docker", "info", "--format", "{{.OSType}}"],
                capture_output=True,
                text=True,
            ).stdout.strip()
            != "linux"
        ):
            raise RuntimeError("Docker must use Linux containers.")
        run(["docker", "compose", "version"])
    except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
        print(
            f"Docker Linux unavailable. Start Docker Engine/Desktop and check docker info. {error}",
            file=sys.stderr,
        )
        return 2

    result = 1
    try:
        run(
            compose
            + ["up", "--build", "--wait", "--wait-timeout", "120", "-d", "mock-api"]
        )
        run(compose + ["run", "--rm", "--no-deps", "k6"])
        result = 0
    except subprocess.CalledProcessError as error:
        result = error.returncode
    except KeyboardInterrupt:
        result = 130
    finally:
        cleanup = subprocess.run(
            compose + ["down", "--remove-orphans"], cwd=root, env=env, check=False
        )
        if cleanup.returncode and result == 0:
            result = cleanup.returncode
    return result


if __name__ == "__main__":
    sys.exit(main())
