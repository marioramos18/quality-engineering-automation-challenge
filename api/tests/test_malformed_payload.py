from playwright.sync_api import APIRequestContext, APIResponse

INVALID_JSON = '{"firstname": "QA", '


def test_post_rejects_malformed_json(
    api_client: APIRequestContext,
) -> None:
    """POST must reject syntactically invalid JSON."""
    response = api_client.post(
        "/booking",
        data=INVALID_JSON,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    # express.json() rejects malformed JSON before the booking handler.
    assert response.status == 400, (
        f"Malformed JSON was not correctly rejected. "
        f"HTTP {response.status}. Body: {response.text()}"
    )
    assert response.headers.get("content-type", "").startswith("text/plain")
    assert response.text() == "Bad Request"


def test_put_rejects_malformed_json_without_modifying_booking(
    api_client: APIRequestContext,
    created_booking: tuple[APIResponse, int],
    booking_payload: dict,
    auth_token: str,
) -> None:
    """A malformed PUT request must preserve the original booking."""
    _, booking_id = created_booking

    response = api_client.put(
        f"/booking/{booking_id}",
        data=INVALID_JSON,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cookie": f"token={auth_token}",
        },
    )

    assert response.status == 400, (
        f"Expected malformed JSON rejection, got HTTP "
        f"{response.status}. Body: {response.text()}"
    )
    assert response.headers.get("content-type", "").startswith("text/plain")
    assert response.text() == "Bad Request"

    get_response = api_client.get(
        f"/booking/{booking_id}",
        headers={"Accept": "application/json"},
    )
    assert get_response.status == 200
    assert get_response.json() == booking_payload
