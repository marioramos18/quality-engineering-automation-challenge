from playwright.sync_api import APIRequestContext


def test_get_bookings_returns_valid_response(
    api_client: APIRequestContext,
) -> None:
    """Validate the contract of the booking listing endpoint."""
    # Arrange / Act
    response = api_client.get("/booking")

    # Assert: HTTP status
    assert response.status == 200, (
        f"Expected HTTP 200, received {response.status}. "
        f"Response: {response.text()}"
    )

    # Assert: Content-Type
    content_type = response.headers.get("content-type", "")
    assert content_type.startswith("application/json"), (
        f"Unexpected Content-Type: {content_type}"
    )

    # Assert: response body
    bookings = response.json()
    assert isinstance(bookings, list), (
        "The API must return a list of bookings."
    )
    for booking in bookings:
        assert isinstance(booking, dict)
        assert isinstance(booking.get("bookingid"), int)
