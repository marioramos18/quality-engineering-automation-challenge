import os
import subprocess
import sys
from pathlib import Path

import pytest

from api.safety import require_isolated_auth


@pytest.mark.parametrize(
    "url,opt_in",
    [
        ("https://restful-booker.herokuapp.com", "1"),
        ("http://localhost.attacker.example", "1"),
        ("http://127.0.0.1", None),
        ("http://127.0.0.1", "0"),
        ("http://127.0.0.1/path", "1"),
        ("http://user:pass@localhost", "1"),
        ("http://localhost?target=external", "1"),
        ("ftp://localhost", "1"),
    ],
)
def test_negative_auth_rejects_unsafe_target(url, opt_in):
    with pytest.raises(ValueError, match="disposable loopback"):
        require_isolated_auth(url, opt_in)


@pytest.mark.parametrize(
    "url", ["http://127.0.0.1:12345", "http://localhost:3001", "http://[::1]:3001/"]
)
def test_negative_auth_accepts_explicit_loopback(url):
    require_isolated_auth(url, "1")


def test_public_negative_auth_is_blocked_during_collection():
    env = {
        **os.environ,
        "BOOKER_BASE_URL": "https://restful-booker.herokuapp.com",
        "BOOKER_ALLOW_NEGATIVE_AUTH": "1",
    }
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "api/tests/test_auth_negative.py",
            "--collect-only",
            "-q",
        ],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 4
    assert (
        "Authentication-negative tests require a disposable loopback" in result.stderr
    )
