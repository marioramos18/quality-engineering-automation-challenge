import pytest
from playwright.sync_api import APIRequestContext


@pytest.mark.parametrize(
    "booking_id",
    [
        "999999999999999",
        "not-a-valid-id",
    ],
    ids=["nonexistent-numeric-id", "invalid-id-format"],
)
def test_get_nonexistent_booking_returns_404(
    api_client: APIRequestContext,
    booking_id: str,
) -> None:
    """GET must not return a booking for an unknown identifier."""
    response = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )

    assert response.status == 404, (
        f"Expected HTTP 404 for booking ID {booking_id}, "
        f"received {response.status}. Body: {response.text()}"
    )
    assert response.headers.get("content-type", "").startswith("text/plain")
    assert response.text() == "Not Found"


@pytest.mark.parametrize(
    "method",
    ["POST", "DELETE"],
)
def test_unsupported_http_method_is_rejected(
    api_client: APIRequestContext,
    method: str,
) -> None:
    """Unsupported methods on the health endpoint must be rejected."""
    response = api_client.fetch("/ping", method=method)

    # Only GET /ping exists; app.js sends 404 for unmatched routes.
    assert response.status == 404, (
        f"Expected HTTP 404 for {method} /ping, "
        f"received {response.status}. Body: {response.text()}"
    )
    assert response.headers.get("content-type", "").startswith("text/plain")
    assert response.text() == "Not Found"
