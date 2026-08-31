import os
import sys
import asyncio
import httpx

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app, _seed_demo_users
from database import SessionLocal, Base, engine

async def test_full_production_readiness():
    print("=== STARTING COMPREHENSIVE PRODUCTION HARDENING VERIFICATION ===")
    
    # Trigger DB creation and demo user seeding
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_demo_users(db)
    finally:
        db.close()

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Obtain Tokens for Admin, Employee, and User
        res_admin = await client.post("/api/auth/login", json={"email": "admin@gmail.com", "password": "admin123"})
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        admin_token = res_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res_emp = await client.post("/api/auth/login", json={"email": "employee@company.com", "password": "employee123"})
        assert res_emp.status_code == 200, f"Emp login failed: {res_emp.text}"
        emp_token = res_emp.json()["access_token"]
        emp_headers = {"Authorization": f"Bearer {emp_token}"}

        res_user = await client.post("/api/auth/login", json={"email": "user@gmail.com", "password": "user123"})
        assert res_user.status_code == 200, f"User login failed: {res_user.text}"
        user_token = res_user.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        print("[OK] Authentication tokens generated for Admin, Employee, and User")

        # 2. Verify Ticket Creation is Authenticated
        # Unauthenticated create -> 401
        r_create_unauth = await client.post("/api/tickets/", json={"title": "Test Ticket", "description": "Needs assistance", "user_email": "user@gmail.com"})
        assert r_create_unauth.status_code == 401, f"Expected 401, got {r_create_unauth.status_code}"

        # Authenticated user create -> 200
        r_create_auth = await client.post("/api/tickets/", json={"title": "User Ticket", "description": "Billing inquiry on my account invoice", "user_email": "user@gmail.com"}, headers=user_headers)
        assert r_create_auth.status_code == 200, f"Create failed: {r_create_auth.text}"
        created_ticket_id = r_create_auth.json()["id"]
        print(f"[OK] Authenticated ticket creation verified (Ticket ID #{created_ticket_id})")

        # 3. Verify Ticket List & Read Access Scoping
        # Unauthenticated list -> 401
        assert (await client.get("/api/tickets/")).status_code == 401
        # Regular user list -> 200 (only user's tickets returned)
        r_user_list = await client.get("/api/tickets/", headers=user_headers)
        assert r_user_list.status_code == 200
        for t in r_user_list.json():
            assert t["user_email"].lower() == "user@gmail.com", f"Leaked ticket for {t['user_email']} to customer user!"
        print("[OK] Ticket list properly filtered and scoped for end user")

        # 4. Verify Internal Notes & Suggestions are Restricted to Employees/Admins
        # Regular user trying to read notes -> 403 Forbidden
        assert (await client.get(f"/api/tickets/{created_ticket_id}/notes", headers=user_headers)).status_code == 403
        # Employee reading notes -> 200
        assert (await client.get(f"/api/tickets/{created_ticket_id}/notes", headers=emp_headers)).status_code == 200

        # Regular user trying to read suggestions -> 403 Forbidden
        assert (await client.get(f"/api/tickets/{created_ticket_id}/suggestions", headers=user_headers)).status_code == 403
        # Employee reading suggestions -> 200
        assert (await client.get(f"/api/tickets/{created_ticket_id}/suggestions", headers=emp_headers)).status_code == 200
        print("[OK] Internal notes & suggestions strictly restricted to staff (403 for customers)")

        # 5. Verify Employee Directory Routes are Restricted
        assert (await client.get("/api/employees/")).status_code == 401
        assert (await client.get("/api/employees/", headers=user_headers)).status_code == 403
        assert (await client.get("/api/employees/active-tickets", headers=user_headers)).status_code == 403
        assert (await client.get("/api/employees/departments/list", headers=user_headers)).status_code == 403
        assert (await client.get("/api/employees/1", headers=user_headers)).status_code == 403
        assert (await client.get("/api/employees/", headers=emp_headers)).status_code == 200
        print("[OK] Employee directory completely secured from unauthenticated & regular users")

        # 6. Verify Admin Maintenance Endpoints (reset-seed)
        r_reset = await client.post("/api/tickets/reset-seed", headers=admin_headers)
        assert r_reset.status_code == 200, f"Reset seed failed: {r_reset.text}"
        print("[OK] /api/tickets/reset-seed successfully executed by Admin")

        # 7. Rate Limiting Test (Login endpoint 10/min)
        hit_429 = False
        for i in range(15):
            r_rate = await client.post("/api/auth/login", json={"email": "user@gmail.com", "password": "user123"})
            if r_rate.status_code == 429:
                hit_429 = True
                print(f"[OK] Rate limiting triggered HTTP 429 Too Many Requests on request #{i+1}")
                break
        assert hit_429, "Rate limiter did not trigger 429 after 10 requests!"

    print("\n=== ALL SECURITY AND PRODUCTION HARDENING TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(test_full_production_readiness())
