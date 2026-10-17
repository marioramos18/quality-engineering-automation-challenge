import os
from collections.abc import Iterator

import pytest
from playwright.sync_api import APIRequestContext, Playwright


@pytest.fixture(scope="session")
def api_client(playwright: Playwright) -> Iterator[APIRequestContext]:
    """Provide a reusable API request context for the test session."""
    base_url = os.getenv(
        "BOOKER_BASE_URL",
        "https://restful-booker.herokuapp.com",
    )
    context = playwright.request.new_context(
        base_url=base_url,
        timeout=20_000,
    )
    yield context
    context.dispose()
