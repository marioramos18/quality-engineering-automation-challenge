from copy import deepcopy

from playwright.sync_api import APIRequestContext, APIResponse


def test_update_existing_booking_with_valid_data(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
    auth_token: str,
) -> None:
    """Validate updating a booking and persisting its changes."""
    # Arrange
    _, booking_id = created_booking
    updated_payload = deepcopy(booking_payload)
    updated_payload["firstname"] = "Updated"
    updated_payload["totalprice"] = 375
    updated_payload["additionalneeds"] = "Late checkout"
    headers = {
        "Accept": "application/json",
        "Cookie": f"token={auth_token}",
    }

    # Act
    response = api_client.put(
        f"/booking/{booking_id}",
        data=updated_payload,
        headers=headers,
    )

    # Assert: response contract
    assert response.status == 200, (
        f"Expected 200, received {response.status}: {response.text()}"
    )
    content_type = response.headers.get("content-type", "")
    assert content_type.startswith("application/json")
    assert response.json() == updated_payload

    # Assert: changes persisted
    persisted = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )
    assert persisted.status == 200
    assert persisted.json() == updated_payload
