"""Prevent authentication-negative requests against shared environments."""

from urllib.parse import urlsplit


def require_isolated_auth(base_url: str, opt_in: str | None) -> None:
    url = urlsplit(base_url)
    if (
        opt_in != "1"
        or url.scheme not in ("http", "https")
        or url.hostname not in ("127.0.0.1", "localhost", "::1")
        or url.username
        or url.password
        or url.path not in ("", "/")
        or url.query
        or url.fragment
    ):
        raise ValueError(
            "Authentication-negative tests require a disposable loopback API "
            "and BOOKER_ALLOW_NEGATIVE_AUTH=1. Run python scripts/run_api.py."
        )
