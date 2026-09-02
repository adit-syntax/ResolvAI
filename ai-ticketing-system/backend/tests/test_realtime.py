"""
Tests for realtime broadcast + the SLA sweep scheduler contract.
"""

import asyncio
import pytest

from realtime import ConnectionManager
from database import SessionLocal
from routers import tickets


class _FakeWS:
    """Minimal stand-in for a Starlette WebSocket."""
    def __init__(self):
        self.sent = []

    async def accept(self):
        pass

    async def send_json(self, msg):
        self.sent.append(msg)


@pytest.mark.asyncio
async def test_notify_broadcasts_to_connected_clients():
    mgr = ConnectionManager()
    mgr.loop = asyncio.get_running_loop()
    ws = _FakeWS()
    await mgr.connect(ws)

    mgr.notify({"type": "tickets_updated"})
    await asyncio.sleep(0.05)  # let the scheduled broadcast run

    assert {"type": "tickets_updated"} in ws.sent


@pytest.mark.asyncio
async def test_notify_is_noop_before_startup():
    # loop unset (as during app-less unit tests) must not raise
    ConnectionManager().notify({"type": "tickets_updated"})


@pytest.mark.asyncio
async def test_sla_sweeps_callable_outside_request():
    """The scheduler calls these directly with a plain session + no user."""
    db = SessionLocal()
    try:
        esc = await tickets.check_escalations(db=db, current_user=None)
        wait = tickets.check_waiting_tickets(db=db, current_user=None)
    finally:
        db.close()
    assert "message" in esc
    assert "promoted" in wait and "still_waiting" in wait
