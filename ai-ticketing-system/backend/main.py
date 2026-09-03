"""
FastAPI Application Entry Point
ResolvAI — Main Server (Production-Ready)
"""

from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limiter import limiter
import json
import asyncio
from typing import List, Optional

from database import engine, SessionLocal, Base
from models import *  # registers all ORM models
from seed_data import seed_employees
from routers import tickets, employees, analytics, settings, knowledge
from routers import auth as auth_router


# ─── WebSocket Connection Manager ────────────────────────────────────────────
# Shared manager lives in realtime.py so routers can broadcast without importing
# main (which would be a circular import).
from realtime import manager


# ─── Background SLA automation ────────────────────────────────────────────────

async def _sla_sweep_loop():
    """Periodically run SLA escalation + waiting-queue sweeps.

    These were previously manual-only admin endpoints; running them on a timer
    means SLA breaches get actioned and queued tickets get promoted without
    someone clicking a button.
    """
    # ponytail: runs in-process in every worker — fine for a single instance.
    # Add leader election or a dedicated cron service if you scale to many workers.
    interval = int(os.getenv("SLA_SWEEP_INTERVAL_SECONDS", "300"))
    while True:
        try:
            await asyncio.sleep(interval)
            db = SessionLocal()
            try:
                await tickets.check_escalations(db=db, current_user=None)
                tickets.check_waiting_tickets(db=db, current_user=None)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[SLA Sweep] error: {e}")


# ─── Demo account seed ───────────────────────────────────────────────────────

def _seed_demo_users(db):
    """
    Create the demo accounts on development/staging startup (idempotent).
    Disabled in production unless explicitly enabled via SEED_DEMO_USERS=true.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    seed_allowed = os.getenv("SEED_DEMO_USERS", "false").lower() == "true" or env != "production"
    if not seed_allowed:
        print("[Startup] Production environment detected: Default demo accounts skipped for security.")
        return

    from models import User, Employee
    from auth_utils import get_password_hash

    # Ensure Support Agent exists in Employee directory
    emp_support = db.query(Employee).filter(Employee.email == "employee@company.com").first()
    if not emp_support:
        emp_support = Employee(
            name="Support Agent",
            email="employee@company.com",
            department="IT",
            role="Support Specialist",
            skill_tags="access,general,support,vpn",
            avg_resolution_time=2.0,
            current_ticket_load=0,
            availability="Available",
        )
        db.add(emp_support)
        db.flush()

    demo_accounts = [
        {"name": "Admin User",    "email": "admin@gmail.com",       "password": "admin123",    "role": "admin"},
        {"name": "Support Agent", "email": "employee@company.com",  "password": "employee123", "role": "employee"},
        {"name": "Demo User",     "email": "user@gmail.com",        "password": "user123",     "role": "user"},
        # Extra employee accounts that match seeded Employee records
        {"name": "Alice Chen",    "email": "alice.chen@company.com","password": "employee123", "role": "employee"},
        {"name": "Sarah Dev",     "email": "sarah.dev@resolvai.internal", "password": "employee123", "role": "employee"},
        {"name": "Admin Internal","email": "admin@resolvai.internal","password": "admin123",   "role": "admin"},
    ]

    for acct in demo_accounts:
        emp_match = db.query(Employee).filter(Employee.email.ilike(acct["email"])).first()
        emp_id = emp_match.id if emp_match else None
        existing = db.query(User).filter(User.email == acct["email"]).first()
        if not existing:
            user = User(
                name=acct["name"],
                email=acct["email"],
                hashed_password=get_password_hash(acct["password"]),
                role=acct["role"],
                employee_id=emp_id,
            )
            db.add(user)
        elif not existing.employee_id and emp_id:
            existing.employee_id = emp_id

    try:
        db.commit()
        print("[Startup] Demo user accounts ready.")
    except Exception as e:
        db.rollback()
        print(f"[Startup] Demo user seed warning: {e}")


# ─── App Lifecycle ────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables for zero-config local/dev startup. In production Alembic
    # ('alembic upgrade head') owns the schema; create_all is idempotent
    # (checkfirst) so it's a no-op once migrations have run.
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables created / verified.")

    # Seed employee + user data
    db = SessionLocal()
    try:
        seed_employees(db)
        _seed_demo_users(db)
    finally:
        db.close()

    # Real-time broadcasts + background SLA sweeps need the running event loop.
    manager.loop = asyncio.get_running_loop()
    sweep_task = asyncio.create_task(_sla_sweep_loop())

    print("[Startup] ResolvAI ready.")
    print("[Startup] API docs: http://localhost:8000/docs")

    yield

    sweep_task.cancel()
    print("[Shutdown] Closing connections...")


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="ResolvAI — Smart AI Ticketing System",
    description="Production-grade AI-powered internal helpdesk.",
    version="2.0.0",
    lifespan=lifespan,
    # Disable Swagger/ReDoc in production for security (optional)
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") != "production" else None,
    redoc_url=None,
)

# ─── Rate Limiting ────────────────────────────────────────────────────────────

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ────────────────────────────────────────────────────────────────────
# Read from env. Falls back to permissive localhost-only for local dev.

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://localhost:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth_router.router)
app.include_router(tickets.router)
app.include_router(employees.router)
app.include_router(analytics.router)
app.include_router(settings.router)
app.include_router(knowledge.router)


# ─── WebSocket ───────────────────────────────────────────────────────────────

from auth_utils import decode_token
from jose import JWTError

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    """Authenticated WebSocket endpoint for real-time ticket alerts and updates."""
    if token:
        try:
            decode_token(token)  # raises JWTError on invalid/expired token
        except JWTError:
            await websocket.close(code=1008)  # 1008: Policy Violation
            return
    elif os.getenv("ENVIRONMENT") == "production":
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "ack", "message": "received"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResolvAI Ticketing System",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


# Expose WS manager for routers
app.state.ws_manager = manager


# ─── Dev Server ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
