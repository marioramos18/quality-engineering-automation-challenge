import pytest
from playwright.sync_api import APIRequestContext, APIResponse


@pytest.mark.parametrize(
    "cookie",
    [None, "token=invalid-token"],
    ids=["without-token", "invalid-token"],
)
def test_update_booking_without_valid_auth_is_denied(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
    cookie: str | None,
) -> None:
    """An unauthorized request must not update an existing booking."""
    _, booking_id = created_booking

    # Prepare different data without modifying the original payload
    modified_payload = {
        **booking_payload,
        "firstname": "UnauthorizedUpdate",
    }
    headers = {"Accept": "application/json"}
    if cookie is not None:
        headers["Cookie"] = cookie

    # Act
    response = api_client.put(
        f"/booking/{booking_id}",
        data=modified_payload,
        headers=headers,
    )

    # Assert: operation is denied
    assert response.status == 403, (
        f"Expected HTTP 403, received {response.status}"
    )

    # Assert: original data has not been modified
    get_response = api_client.get(f"/booking/{booking_id}")
    assert get_response.status == 200
    assert get_response.json() == booking_payload


@pytest.mark.parametrize(
    "cookie",
    [None, "token=invalid-token"],
    ids=["without-token", "invalid-token"],
)
def test_delete_booking_without_valid_auth_is_denied(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
    cookie: str | None,
) -> None:
    """An unauthorized request must not delete an existing booking."""
    _, booking_id = created_booking
    headers = {}
    if cookie is not None:
        headers["Cookie"] = cookie

    # Act
    response = api_client.delete(
        f"/booking/{booking_id}",
        headers=headers,
    )

    # Assert: operation is denied
    assert response.status == 403, (
        f"Expected HTTP 403, received {response.status}"
    )

    # Assert: booking must still exist
    get_response = api_client.get(f"/booking/{booking_id}")
    assert get_response.status == 200
    assert get_response.json() == booking_payload
