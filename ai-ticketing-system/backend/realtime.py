"""
realtime.py — WebSocket connection manager + distributed Redis Pub/Sub synchronizer.

Features:
1. Local in-memory connection pooling for connected WebSocket clients.
2. Distributed Redis Pub/Sub cross-pod synchronization when REDIS_URL is configured.
3. Graceful in-memory fallback when REDIS_URL is absent or Redis is unreachable.
4. Thread-safe `notify()` fire-and-forget broadcast callable from sync or async handlers.

Security: We broadcast only generic action signals (e.g. {"type": "tickets_updated"}),
never sensitive ticket contents — clients refetch via the authorized REST API with RBAC.
"""

import os
import json
import asyncio
from typing import List, Optional
from fastapi import WebSocket

REDIS_URL = os.getenv("REDIS_URL")
PUBSUB_CHANNEL = os.getenv("REALTIME_PUBSUB_CHANNEL", "resolvai:realtime:events")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self._redis_client = None
        self._pubsub_task: Optional[asyncio.Task] = None
        self.is_distributed: bool = False

    async def start(self):
        """Initialize Redis Pub/Sub listener if REDIS_URL is configured."""
        if not REDIS_URL:
            return

        try:
            import redis.asyncio as aioredis
            self._redis_client = aioredis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            # Test connectivity
            await self._redis_client.ping()
            self.is_distributed = True
            print(f"[Realtime] Connected to Redis Pub/Sub at {REDIS_URL.split('@')[-1]}")

            # Spawn background subscription listener
            self._pubsub_task = asyncio.create_task(self._redis_subscriber_loop())
        except Exception as e:
            print(f"[Realtime] Redis connection skipped/unavailable ({e}). Operating in in-memory mode.")
            self._redis_client = None
            self.is_distributed = False

    async def stop(self):
        """Gracefully stop background listeners and close Redis connections."""
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except (asyncio.CancelledError, Exception):
                pass
            self._pubsub_task = None

        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass
            self._redis_client = None
            self.is_distributed = False

    async def _redis_subscriber_loop(self):
        """Continuously listen to the distributed pub/sub channel and broadcast locally."""
        while True:
            try:
                pubsub = self._redis_client.pubsub()
                await pubsub.subscribe(PUBSUB_CHANNEL)
                async for raw_message in pubsub.listen():
                    if raw_message and raw_message.get("type") == "message":
                        data_str = raw_message.get("data")
                        if data_str:
                            try:
                                message = json.loads(data_str)
                                await self._broadcast_local(message)
                            except Exception as parse_err:
                                print(f"[Realtime PubSub] Parse error: {parse_err}")
            except asyncio.CancelledError:
                break
            except Exception as conn_err:
                print(f"[Realtime PubSub] Connection error: {conn_err}. Reconnecting in 3s...")
                await asyncio.sleep(3)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def _broadcast_local(self, message: dict):
        """Broadcast payload directly to all WebSockets connected to this instance."""
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    async def _publish_or_broadcast(self, message: dict):
        """Publish to Redis channel if distributed, otherwise broadcast directly."""
        if self.is_distributed and self._redis_client:
            try:
                await self._redis_client.publish(PUBSUB_CHANNEL, json.dumps(message))
                return
            except Exception as pub_err:
                print(f"[Realtime] Redis publish error: {pub_err}. Falling back to local broadcast.")
        
        # Local in-memory fallback
        await self._broadcast_local(message)

    def notify(self, message: dict):
        """Fire-and-forget broadcast, safe to call from sync routes or background threads."""
        loop = self.loop
        if loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._publish_or_broadcast(message), loop)


# Shared singleton used by the /ws endpoint (main.py) and all routers.
manager = ConnectionManager()
