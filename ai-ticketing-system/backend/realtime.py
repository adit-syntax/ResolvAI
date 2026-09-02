"""
realtime.py — WebSocket connection manager + thread-safe broadcast.

`notify()` schedules a broadcast on the main event loop and is safe to call from
any thread (FastAPI runs sync routes in a threadpool), so route handlers can
signal "tickets changed" without blocking and without awaiting.

Security: we broadcast only a generic signal (e.g. {"type": "tickets_updated"}),
never ticket contents — connected clients refetch through the authorized REST
API, which enforces per-user scoping/RBAC.
"""

import asyncio
from typing import List, Optional

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Set once at app startup so notify() can schedule work onto the loop
        # from any thread. None until then (e.g. during unit tests).
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def _broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    def notify(self, message: dict):
        """Fire-and-forget broadcast, safe to call from sync or async code."""
        loop = self.loop
        if loop is None:
            return  # app not started (e.g. during tests) — nothing to notify
        asyncio.run_coroutine_threadsafe(self._broadcast(message), loop)


# Shared singleton used by the /ws endpoint (main.py) and all routers.
manager = ConnectionManager()
