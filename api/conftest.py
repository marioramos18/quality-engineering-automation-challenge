import os
from collections.abc import Iterator
from datetime import date, timedelta
from uuid import uuid4

import pytest
from playwright.sync_api import APIRequestContext, APIResponse, Playwright


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


@pytest.fixture
def booking_payload() -> dict:
    """Generate valid and independent booking test data."""
    checkin = date.today() + timedelta(days=1)
    checkout = checkin + timedelta(days=3)
    return {
        "firstname": "QA",
        "lastname": f"Automation{uuid4().hex[:8]}",
        "totalprice": 150,
        "depositpaid": True,
        "bookingdates": {
            "checkin": checkin.isoformat(),
            "checkout": checkout.isoformat(),
        },
        "additionalneeds": "Breakfast",
    }


@pytest.fixture(scope="session")
def auth_token(api_client: APIRequestContext) -> str:
    """Authenticate once for booking cleanup during the test session."""
    username = os.getenv("BOOKER_USERNAME", "admin")
    password = os.getenv("BOOKER_PASSWORD", "password123")
    response = api_client.post(
        "/auth",
        data={
            "username": username,
            "password": password,
        },
        headers={"Accept": "application/json"},
    )
    assert response.status == 200, (
        f"Authentication request failed: HTTP {response.status}"
    )
    token = response.json().get("token")
    assert isinstance(token, str) and token, (
        "Authentication did not return a valid token."
    )
    return token


@pytest.fixture
def created_booking(
    api_client: APIRequestContext,
    booking_payload: dict,
    auth_token: str,
) -> Iterator[tuple[APIResponse, int]]:
    """Create a booking and remove it after the test."""
    response = api_client.post(
        "/booking",
        data=booking_payload,
        headers={"Accept": "application/json"},
    )
    assert response.status == 200, (
        f"Failed to create booking: {response.status}"
    )
    booking_id = response.json().get("bookingid")
    assert type(booking_id) is int and booking_id > 0
    try:
        yield response, booking_id
    finally:
        # Check whether the booking still exists.
        existing = api_client.get(f"/booking/{booking_id}")
        if existing.status != 404:
            assert existing.status == 200, (
                f"Cleanup precheck failed: {existing.status}"
            )
            deletion = api_client.delete(
                f"/booking/{booking_id}",
                headers={"Cookie": f"token={auth_token}"},
            )
            assert deletion.status == 201, (
                f"Booking {booking_id} cleanup failed: "
                f"HTTP {deletion.status}"
            )
