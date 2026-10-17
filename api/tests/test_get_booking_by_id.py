from playwright.sync_api import APIRequestContext, APIResponse


def test_get_existing_booking_by_id(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
) -> None:
    """Validate retrieving a previously created booking."""
    # Arrange
    _, booking_id = created_booking

    # Act
    response = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )

    # Assert: HTTP status
    assert response.status == 200, (
        f"Expected 200, received {response.status}"
    )

    # Assert: Content-Type
    content_type = response.headers.get("content-type", "")
    assert content_type.startswith("application/json")

    # Assert: data integrity
    booking = response.json()
    assert isinstance(booking, dict)
    assert booking == booking_payload
