from playwright.sync_api import APIRequestContext, APIResponse


def test_delete_existing_booking(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    auth_token: str,
) -> None:
    """Validate deletion and confirm the booking no longer exists."""
    # Arrange: booking created by the fixture
    _, booking_id = created_booking

    # Act: delete the booking
    response = api_client.delete(
        f"/booking/{booking_id}",
        headers={
            "Cookie": f"token={auth_token}",
        },
    )

    # Assert: deletion response
    assert response.status == 201, (
        f"Expected HTTP 201, received {response.status}. "
        f"Response: {response.text()}"
    )

    # The demonstration API may return an empty body or "Created".
    body = response.text().strip()
    assert body in ("", "Created"), (
        f"Unexpected deletion response body: {body!r}"
    )

    if body:
        content_type = response.headers.get("content-type", "")
        assert content_type.startswith("text/plain"), (
            f"Unexpected Content-Type: {content_type}"
        )

    # Assert: booking must no longer be accessible
    get_response = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )
    assert get_response.status == 404, (
        f"Booking {booking_id} still appears accessible. "
        f"HTTP {get_response.status}"
    )
