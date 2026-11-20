"""
test_enterprise_suite.py — Unit & integration tests for Enterprise Production modules:
1. Distributed WebSocket Pub/Sub state manager
2. Persistent Knowledge Base vector synchronization
3. SOC-2 AI Audit Logging & Telemetry API
"""

import pytest
from database import SessionLocal
from models import KnowledgeArticle, AIAuditLog, User
from rag_engine import rag_engine
from realtime import ConnectionManager
from ai_service import record_ai_audit


def test_persistent_knowledge_article_sync():
    """Verify that knowledge articles and vector embeddings synchronize with the database."""
    db = SessionLocal()
    try:
        rag_engine.sync_with_db(db)
        articles_in_db = db.query(KnowledgeArticle).filter(KnowledgeArticle.is_active == True).all()
        assert len(articles_in_db) >= 5
        # Verify first article has JSON embedding
        sample = articles_in_db[0]
        assert sample.embedding_json is not None
        assert sample.id in rag_engine.dense_embeddings
    finally:
        db.close()


def test_ai_audit_log_recording():
    """Verify that AI operations are recorded for SOC-2 auditability."""
    db = SessionLocal()
    try:
        initial_count = db.query(AIAuditLog).count()

        record_ai_audit(
            db=db,
            ticket_id=None,
            operation="triage",
            model_used="llama-3.3-70b-versatile",
            latency_ms=842.5,
            prompt_tokens=180,
            completion_tokens=45,
            pii_detected=True,
            pii_count=1,
            rag_citation="KB-AUTH-101",
            confidence_score=0.96,
            decision_outcome="auto_resolved",
        )
        db.commit()

        new_count = db.query(AIAuditLog).count()
        assert new_count == initial_count + 1

        last_log = db.query(AIAuditLog).order_by(AIAuditLog.id.desc()).first()
        assert last_log.model_used == "llama-3.3-70b-versatile"
        assert last_log.pii_detected is True
        assert last_log.estimated_cost_usd > 0
    finally:
        db.close()


def test_realtime_connection_manager_state():
    """Verify ConnectionManager fallback and state handling."""
    mgr = ConnectionManager()
    assert mgr.is_distributed is False
    assert len(mgr.active_connections) == 0

    # Notification should not crash when loop is None
    mgr.notify({"type": "test_event"})
