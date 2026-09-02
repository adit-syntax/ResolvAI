import os
import sys
import pytest
import pytest_asyncio
import httpx

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app, _seed_demo_users
from database import Base, engine, SessionLocal
from seed_data import seed_employees

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed the same fixtures the app creates on startup so the suite is
        # self-contained (does not depend on a pre-existing ticketing.db).
        seed_employees(db)
        _seed_demo_users(db)
    finally:
        db.close()
    yield

@pytest_asyncio.fixture
async def async_client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        yield client

from auth_utils import create_access_token

@pytest.fixture
def admin_auth_headers():
    token = create_access_token({"sub": "1", "role": "admin", "email": "admin@gmail.com", "name": "Admin User"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def employee_auth_headers():
    token = create_access_token({"sub": "2", "role": "employee", "email": "employee@company.com", "name": "Support Agent"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user_auth_headers():
    token = create_access_token({"sub": "3", "role": "user", "email": "user@gmail.com", "name": "Demo User"})
    return {"Authorization": f"Bearer {token}"}
