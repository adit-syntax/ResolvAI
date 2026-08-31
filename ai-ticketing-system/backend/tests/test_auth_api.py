import pytest

@pytest.mark.asyncio
async def test_login_success(async_client):
    res = await async_client.post("/api/auth/login", json={"email": "admin@gmail.com", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["email"] == "admin@gmail.com"

@pytest.mark.asyncio
async def test_login_invalid_password(async_client):
    res = await async_client.post("/api/auth/login", json={"email": "admin@gmail.com", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Incorrect" in res.json()["detail"]

import uuid

@pytest.mark.asyncio
async def test_self_registration(async_client):
    email = f"test_register_{uuid.uuid4().hex[:8]}@example.com"
    res = await async_client.post("/api/auth/register", json={
        "name": "Test New User",
        "email": email,
        "password": "strongPassword123"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["role"] == "user"
    assert "access_token" in data

@pytest.mark.asyncio
async def test_google_oauth_token_exchange(async_client):
    email = "google_user_demo@gmail.com"
    res = await async_client.post("/api/auth/google", json={
        "name": "Google User Demo",
        "email": email,
        "access_token": "mock_google_oauth_token"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "user"
    assert data["email"] == email
    assert "access_token" in data

@pytest.mark.asyncio
async def test_me_endpoint(async_client, admin_auth_headers):
    res = await async_client.get("/api/auth/me", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert data["email"] == "admin@gmail.com"
