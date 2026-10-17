from playwright.sync_api import APIResponse


def test_create_booking_with_valid_data(
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
) -> None:
    """Validate booking creation and response integrity."""
    response, booking_id = created_booking

    assert response.status == 200

    content_type = response.headers.get("content-type", "")
    assert content_type.startswith("application/json")

    body = response.json()
    assert body["bookingid"] == booking_id
    assert body["booking"] == booking_payload
