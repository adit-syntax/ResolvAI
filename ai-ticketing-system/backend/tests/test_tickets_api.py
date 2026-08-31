import pytest

@pytest.mark.asyncio
async def test_create_ticket_authenticated(async_client, user_auth_headers):
    payload = {
        "title": "Need VPN Access Setup",
        "description": "My VPN access profile is not connecting to the secure gateway.",
        "user_email": "user@gmail.com",
    }
    res = await async_client.post("/api/tickets/", json=payload, headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_email"] == "user@gmail.com"
    assert "id" in data
    assert data["status"] in ["New", "Assigned", "Resolved"]

@pytest.mark.asyncio
async def test_create_ticket_unauthenticated(async_client):
    payload = {
        "title": "Unauthenticated Ticket",
        "description": "This request should be blocked.",
        "user_email": "attacker@example.com",
    }
    res = await async_client.post("/api/tickets/", json=payload)
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_customer_ticket_list_scoping(async_client, user_auth_headers):
    res = await async_client.get("/api/tickets/", headers=user_auth_headers)
    assert res.status_code == 200
    tickets = res.json()
    for t in tickets:
        assert t["user_email"].lower() == "user@gmail.com"

@pytest.mark.asyncio
async def test_internal_notes_access_control(async_client, user_auth_headers, employee_auth_headers):
    # Customer user should be rejected (403)
    res_user = await async_client.get("/api/tickets/1/notes", headers=user_auth_headers)
    assert res_user.status_code == 403

    # Employee should be allowed (200)
    res_emp = await async_client.get("/api/tickets/1/notes", headers=employee_auth_headers)
    assert res_emp.status_code == 200
    assert isinstance(res_emp.json(), list)

@pytest.mark.asyncio
async def test_suggestions_access_control(async_client, user_auth_headers, employee_auth_headers):
    # Customer user rejected (403)
    res_user = await async_client.get("/api/tickets/1/suggestions", headers=user_auth_headers)
    assert res_user.status_code == 403

    # Staff allowed (200)
    res_emp = await async_client.get("/api/tickets/1/suggestions", headers=employee_auth_headers)
    assert res_emp.status_code == 200
    assert isinstance(res_emp.json(), list)
