"""
Unit and integration tests for Employee Dashboard endpoints:
- GET /api/employees/me/dashboard
- PATCH /api/employees/me/availability
"""

import pytest


@pytest.mark.asyncio
async def test_employee_dashboard_endpoint(async_client, employee_auth_headers):
    """Employee should successfully fetch their personalized dashboard."""
    resp = await async_client.get(
        "/api/employees/me/dashboard",
        headers=employee_auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert "live_tickets" in data
    assert "past_tickets" in data
    assert "department_queue" in data
    assert "employee" in data
    assert "total_assigned" in data["metrics"]
    assert "resolution_rate" in data["metrics"]
    assert "sla_compliance_rate" in data["metrics"]
    assert "category_breakdown" in data["metrics"]
    assert "severity_breakdown" in data["metrics"]


@pytest.mark.asyncio
async def test_employee_availability_toggle(async_client, employee_auth_headers):
    """Employee can update their availability status in real-time."""
    # Set to Busy
    resp = await async_client.patch(
        "/api/employees/me/availability",
        json={"availability": "Busy"},
        headers=employee_auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["availability"] == "Busy"

    # Set to Available
    resp2 = await async_client.patch(
        "/api/employees/me/availability",
        json={"availability": "Available"},
        headers=employee_auth_headers
    )
    assert resp2.status_code == 200
    assert resp2.json()["availability"] == "Available"

    # Invalid status should return 400
    resp_invalid = await async_client.patch(
        "/api/employees/me/availability",
        json={"availability": "InvalidStatus"},
        headers=employee_auth_headers
    )
    assert resp_invalid.status_code == 400


@pytest.mark.asyncio
async def test_user_cannot_access_employee_dashboard(async_client, user_auth_headers):
    """End-user cannot access employee dashboard."""
    resp = await async_client.get(
        "/api/employees/me/dashboard",
        headers=user_auth_headers
    )
    assert resp.status_code == 403
