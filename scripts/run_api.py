"""Run API regression or the known finding in a disposable Restful Booker."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import uuid
from contextlib import ExitStack
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--finding",
        action="store_true",
        help="Run API-001 only; preserve its exit code",
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    reports = (
        root
        / "reports"
        / ("api-quality-findings" if args.finding else "api-regression")
    )
    reports.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    compose = [
        "docker",
        "compose",
        "-p",
        f"quality-api-{uuid.uuid4().hex[:10]}",
        "-f",
        str(root / "api" / "isolated" / "compose.yaml"),
    ]

    def run(command: list[str], **kwargs) -> subprocess.CompletedProcess:
        return subprocess.run(command, cwd=root, env=env, check=True, **kwargs)

    # Never leave success reports from an older run after a preflight failure.
    for name in (
        "report.html",
        "junit.xml",
        "pytest.log",
        "services.log",
        "environment.txt",
    ):
        (reports / name).unlink(missing_ok=True)
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
        run(["uv", "sync", "--locked", "--dev"])
        run(["uv", "run", "--locked", "ruff", "check", "api", "scripts", "tests"])
    except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
        print(
            f"API prerequisites unavailable. Verify Docker Engine/Desktop (Linux containers), "
            f"Compose v2, Python 3.12 and uv. Details: {error}",
            file=sys.stderr,
        )
        return 2

    result = 1
    try:
        run(compose + ["up", "-d", "--wait", "--wait-timeout", "120"])
        binding = run(
            compose + ["port", "booker", "3001"], capture_output=True, text=True
        ).stdout.strip()
        if not re.fullmatch(r"127\.0\.0\.1:[0-9]+", binding):
            raise RuntimeError("API port must be bound only to IPv4 loopback.")
        # Override inherited public configuration only for this fresh container.
        env.update(
            BOOKER_BASE_URL=f"http://{binding}",
            BOOKER_ALLOW_NEGATIVE_AUTH="1",
        )
        # The container uses only its own public demo account, never host secrets.
        env.pop("BOOKER_USERNAME", None)
        env.pop("BOOKER_PASSWORD", None)
        (reports / "environment.txt").write_text(
            f"Target: {env['BOOKER_BASE_URL']}\nDisposable Docker project: {compose[3]}\n",
            encoding="utf-8",
        )
        selection = (
            [
                "api/tests/test_required_fields_negative.py::test_post_rejects_missing_firstname",
                "-m",
                "quality_finding",
            ]
            if args.finding
            else ["api/tests", "-m", "not quality_finding"]
        )
        command = [
            "uv",
            "run",
            "--locked",
            "--env-file",
            str(root / "api" / "isolated" / "credentials.env"),
            "pytest",
            *selection,
            "-v",
            f"--html={reports / 'report.html'}",
            "--self-contained-html",
            f"--junitxml={reports / 'junit.xml'}",
        ]
        with ExitStack() as stack:
            log = stack.enter_context(
                (reports / "pytest.log").open("w", encoding="utf-8")
            )
            process = stack.enter_context(
                subprocess.Popen(
                    command,
                    cwd=root,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                )
            )
            assert process.stdout is not None
            for line in process.stdout:
                print(line, end="", flush=True)
                log.write(line)
            result = process.wait()
    except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
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
