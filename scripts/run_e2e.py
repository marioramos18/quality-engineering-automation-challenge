"""Run the complete E2E suite in a disposable, private Toolshop environment."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tags", help="Optional Cucumber tag expression")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    reports = root / "reports" / "e2e-isolated"
    reports.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["HOST_UID"] = str(os.getuid() if hasattr(os, "getuid") else 1000)
    env["HOST_GID"] = str(os.getgid() if hasattr(os, "getgid") else 1000)
    compose = [
        "docker",
        "compose",
        "-p",
        f"quality-e2e-{uuid.uuid4().hex[:10]}",
        "-f",
        str(root / "web" / "isolated" / "compose.yaml"),
    ]

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
            "Docker Linux unavailable. Start Docker Engine/Desktop and verify "
            "'docker info' and 'docker compose version'. On Windows, select "
            f"Linux containers. Details: {error}",
            file=sys.stderr,
        )
        return 2

    # Only generated files owned by this executor; avoid stale success reports
    # after an environment setup failure.
    for name in ("e2e-report.html", "junit.xml", "cucumber.log", "services.log"):
        artifact = reports / name
        if artifact.is_file():
            artifact.unlink()
    diagnostics = reports / "catalog-diagnostics"
    if diagnostics.is_dir():
        shutil.rmtree(diagnostics)

    result = 1
    try:
        run(compose + ["build", "tests"])
        run(
            compose
            + [
                "up",
                "-d",
                "--wait",
                "--wait-timeout",
                "360",
                "database",
                "api",
                "gateway",
                "ui",
            ]
        )
        # This project name is unique; only its newly created database is reset.
        run(
            compose
            + [
                "exec",
                "-T",
                "api",
                "php",
                "artisan",
                "migrate:fresh",
                "--seed",
                "--force",
            ]
        )
        run(compose + ["run", "--rm", "--no-deps", "tests", "npx", "tsc", "--noEmit"])
        run(
            compose
            + [
                "run",
                "--rm",
                "--no-deps",
                "tests",
                "node",
                "--import",
                "tsx",
                "--test",
                "tests/isolation.test.ts",
            ]
        )
        command = compose + ["run", "--rm", "--no-deps", "tests", "npm", "test"]
        if args.tags:
            command += ["--", "--tags", args.tags]
        with (reports / "cucumber.log").open(
            "w", encoding="utf-8"
        ) as log, subprocess.Popen(
            command,
            cwd=root,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        ) as process:
            assert process.stdout is not None
            for line in process.stdout:
                print(line, end="", flush=True)
                log.write(line)
            if process.wait() != 0:
                raise subprocess.CalledProcessError(process.returncode, command)
        result = 0
    except subprocess.CalledProcessError as error:
        result = error.returncode
    except KeyboardInterrupt:
        result = 130
    finally:
        with (reports / "services.log").open("w", encoding="utf-8") as log:
            subprocess.run(
                compose + ["logs", "--no-color"],
                cwd=root,
                env=env,
                stdout=log,
                stderr=subprocess.STDOUT,
                check=False,
            )
        cleanup = subprocess.run(
            compose + ["down", "--volumes", "--remove-orphans"],
            cwd=root,
            env=env,
            check=False,
        )
        if cleanup.returncode and result == 0:
            result = cleanup.returncode
    return result


if __name__ == "__main__":
    sys.exit(main())
