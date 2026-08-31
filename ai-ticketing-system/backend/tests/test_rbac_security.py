import pytest

@pytest.mark.asyncio
async def test_analytics_rbac(async_client, user_auth_headers, employee_auth_headers):
    # Unauth -> 401
    assert (await async_client.get("/api/analytics/overview")).status_code == 401
    # Customer -> 403
    assert (await async_client.get("/api/analytics/overview", headers=user_auth_headers)).status_code == 403
    # Staff -> 200
    assert (await async_client.get("/api/analytics/overview", headers=employee_auth_headers)).status_code == 200

@pytest.mark.asyncio
async def test_settings_admin_only(async_client, user_auth_headers, employee_auth_headers, admin_auth_headers):
    # Customer and employee blocked
    assert (await async_client.get("/api/settings/")).status_code == 401
    assert (await async_client.get("/api/settings/", headers=user_auth_headers)).status_code == 403
    assert (await async_client.get("/api/settings/", headers=employee_auth_headers)).status_code == 403

    # Admin allowed
    res = await async_client.get("/api/settings/", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "slack_webhook_url" in data
    assert "groq_model" in data

@pytest.mark.asyncio
async def test_employee_directory_rbac(async_client, user_auth_headers, employee_auth_headers, admin_auth_headers):
    # Customer blocked from employee list
    assert (await async_client.get("/api/employees/", headers=user_auth_headers)).status_code == 403

    # Staff allowed to read employee list
    assert (await async_client.get("/api/employees/", headers=employee_auth_headers)).status_code == 200

    import uuid
    new_emp_payload = {
        "name": "Test Engineer",
        "email": f"test.engineer.{uuid.uuid4().hex[:8]}@company.com",
        "role": "Software Engineer",
        "department": "Engineering",
        "skills": ["python", "fastapi"],
    }
    assert (await async_client.post("/api/employees/", json=new_emp_payload, headers=employee_auth_headers)).status_code == 403
    res_admin = await async_client.post("/api/employees/", json=new_emp_payload, headers=admin_auth_headers)
    assert res_admin.status_code == 200
