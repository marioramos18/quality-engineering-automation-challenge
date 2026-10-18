import pytest
from playwright.sync_api import APIRequestContext


@pytest.mark.parametrize(
    "credentials",
    [
        {
            "username": "invalid-user",
            "password": "invalid-password",
        },
        {
            "username": "",
            "password": "",
        },
    ],
    ids=["invalid-credentials", "empty-credentials"],
)
def test_auth_rejects_invalid_credentials(
    api_client: APIRequestContext,
    credentials: dict,
) -> None:
    """Invalid credentials must not produce an authentication token."""
    # Act
    response = api_client.post(
        "/auth",
        data=credentials,
        headers={"Accept": "application/json"},
    )

    # Assert: observed API contract
    assert response.status == 200, (
        f"Unexpected HTTP status: {response.status}"
    )

    content_type = response.headers.get("content-type", "")
    assert content_type.startswith("application/json")

    body = response.json()
    assert isinstance(body, dict)
    assert body.get("reason") == "Bad credentials"

    # Security assertion: no valid token must be issued
    assert "token" not in body
