from copy import deepcopy

import pytest
from playwright.sync_api import APIRequestContext, APIResponse


@pytest.mark.parametrize(
    "missing_field",
    [
        "firstname",
        "lastname",
        "totalprice",
        "depositpaid",
        "bookingdates",
    ],
    ids=[
        "missing-firstname",
        "missing-lastname",
        "missing-totalprice",
        "missing-depositpaid",
        "missing-bookingdates",
    ],
)
def test_put_rejects_missing_required_field(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
    auth_token: str,
    missing_field: str,
) -> None:
    """Reject incomplete updates without changing booking data."""
    _, booking_id = created_booking
    invalid_payload = deepcopy(booking_payload)
    invalid_payload.pop(missing_field)

    response = api_client.put(
        f"/booking/{booking_id}",
        data=invalid_payload,
        headers={
            "Accept": "application/json",
            "Cookie": f"token={auth_token}",
        },
    )

    assert response.status in (400, 422), (
        f"Missing field: {missing_field}. "
        f"Expected HTTP 400/422, got {response.status}. "
        f"Body: {response.text()}"
    )

    get_response = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )
    assert get_response.status == 200
    assert get_response.json() == booking_payload


def test_post_rejects_missing_firstname(
    api_client: APIRequestContext,
    booking_payload: dict,
    auth_token: str,
) -> None:
    """POST must reject a booking without firstname."""
    invalid_payload = deepcopy(booking_payload)
    invalid_payload.pop("firstname")

    response = api_client.post(
        "/booking",
        data=invalid_payload,
        headers={"Accept": "application/json"},
    )

    try:
        assert response.status in (400, 422), (
            f"Expected validation error, got HTTP {response.status}. "
            f"Body: {response.text()}"
        )
    finally:
        # Defensive cleanup if the API unexpectedly created a booking.
        if response.status in (200, 201):
            content_type = response.headers.get("content-type", "")
            if content_type.startswith("application/json"):
                body = response.json()
                booking_id = body.get("bookingid")
                if type(booking_id) is int:
                    deletion = api_client.delete(
                        f"/booking/{booking_id}",
                        headers={"Cookie": f"token={auth_token}"},
                    )
                    assert deletion.status == 201
