"""Run the regression or every executable test suite."""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path


def mobile_preflight() -> list[str]:
    problems = []
    if platform.system() != "Linux":
        problems.append("mobile requires Linux or WSL with an Android emulator")
    for command in ("bash", "adb", "appium", "uv", "curl", "timeout"):
        if shutil.which(command) is None:
            problems.append(f"{command} is unavailable on PATH")
    apk = os.environ.get("APK_PATH")
    if not apk or not Path(apk).is_file():
        problems.append("APK_PATH must point to the verified Android APK")
    if shutil.which("adb"):
        try:
            devices = subprocess.run(
                ["adb", "devices"],
                capture_output=True,
                text=True,
                timeout=10,
                check=True,
            ).stdout
            if not any(line.endswith("\tdevice") for line in devices.splitlines()):
                problems.append("no ready Android device found by adb")
        except (OSError, subprocess.SubprocessError):
            problems.append("adb devices did not complete successfully")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scope", choices=("regression", "all"))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if args.scope == "all":
        problems = mobile_preflight()
        if problems:
            print("Mobile prerequisites missing:", file=sys.stderr)
            for problem in problems:
                print(f"- {problem}", file=sys.stderr)
            return 2
    results: dict[str, int] = {}
    commands = [
        ("test-api", [sys.executable, str(root / "scripts" / "run_api.py")]),
        ("test-e2e", [sys.executable, str(root / "scripts" / "run_e2e.py")]),
    ]
    if args.scope == "all":
        commands.extend(
            [
                (
                    "test-load-smoke",
                    [sys.executable, str(root / "scripts" / "run_load.py"), "smoke"],
                ),
                (
                    "test-load",
                    [sys.executable, str(root / "scripts" / "run_load.py"), "load"],
                ),
                (
                    "test-mobile",
                    ["bash", str(root / ".github" / "scripts" / "mobile-ci.sh")],
                ),
            ]
        )
    for name, command in commands:
        print(f"Running {name}", flush=True)
        results[name] = subprocess.run(command, cwd=root, check=False).returncode
    print(" | ".join(f"{name}: {code}" for name, code in results.items()), flush=True)
    return next((code for code in results.values() if code != 0), 0)


if __name__ == "__main__":
    sys.exit(main())
