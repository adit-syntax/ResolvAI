"""
Knowledge Base & GenAI Router — /api/knowledge
Endpoints for:
- RAG Knowledge Base CRUD and Semantic Search Playground
- Live Incident & Outage Clustering
- Semantic Duplicate Detection
- Autonomous Agent Thought & Tool Trace
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from database import get_db
from models import Ticket
from auth_utils import require_auth, require_employee_or_admin
from rag_engine import rag_engine, SEED_KNOWLEDGE_ARTICLES
from clustering_engine import clustering_engine
from agent_tools import react_agent
from guardrails import PIISanitizer

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge & GenAI"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = 3
    alpha: float = 0.65


class ArticleCreate(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=3)
    category: str
    content: str = Field(..., min_length=10)
    tags: List[str] = []


class PIISanitizeRequest(BaseModel):
    text: str


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/articles")
def list_articles():
    """List all articles in the Knowledge Base vector index."""
    return rag_engine.articles


@router.post("/articles", status_code=201)
def create_article(data: ArticleCreate, current_user=Depends(require_employee_or_admin)):
    """Add a new article and immediately re-index vector & BM25 embeddings."""
    art_id = data.id or f"KB-CUSTOM-{len(rag_engine.articles)+1:03d}"
    new_article = {
        "id": art_id,
        "title": data.title.strip(),
        "category": data.category,
        "content": data.content.strip(),
        "tags": data.tags,
    }
    rag_engine.ingest_articles([new_article])
    return new_article


@router.post("/query")
def query_knowledge_rag(data: RAGQueryRequest, current_user=Depends(require_auth)):
    """
    RAG Semantic Playground:
    Retrieves top relevant chunks via Hybrid (Dense + BM25) search
    and generates a grounded answer with citations.
    """
    results = rag_engine.generate_grounded_answer(query=data.query, top_k=data.top_k)
    return results


@router.get("/incidents")
def get_live_incidents(db: Session = Depends(get_db), current_user=Depends(require_employee_or_admin)):
    """
    Real-time semantic clustering across active tickets.
    Returns detected multi-user incident spikes and outage clusters.
    """
    active_tickets = db.query(Ticket).filter(
        Ticket.status.in_(["New", "Assigned", "In Progress", "Pending Info"])
    ).all()

    ticket_dicts = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "severity": t.severity,
            "user_email": t.user_email,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in active_tickets
    ]

    clusters = clustering_engine.detect_incident_clusters(ticket_dicts)
    return clusters


@router.get("/duplicates/{ticket_id}")
def get_semantic_duplicates(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin)
):
    """Find semantic duplicates for a specific ticket using vector cosine similarity."""
    target = db.get(Ticket, ticket_id)
    if not target:
        raise HTTPException(status_code=404, detail="Ticket not found")

    other_tickets = db.query(Ticket).filter(Ticket.id != ticket_id).all()
    candidate_dicts = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "severity": t.severity,
            "user_email": t.user_email,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in other_tickets
    ]

    target_dict = {
        "id": target.id,
        "title": target.title,
        "description": target.description,
        "category": target.category,
    }

    duplicates = clustering_engine.find_duplicate_tickets(target_dict, candidate_dicts)
    return duplicates


@router.get("/agent-trace/{ticket_id}")
async def get_agent_trace(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin)
):
    """
    Run or retrieve the autonomous ReAct agent reasoning & tool execution trace for a ticket.
    """
    target = db.get(Ticket, ticket_id)
    if not target:
        raise HTTPException(status_code=404, detail="Ticket not found")

    trace_result = await react_agent.execute_react_flow(
        ticket_title=target.title,
        ticket_description=target.description,
        user_email=target.user_email,
        category=target.category or "General",
    )
    return trace_result


@router.post("/sanitize-pii")
def test_pii_sanitization(data: PIISanitizeRequest, current_user=Depends(require_auth)):
    """Utility endpoint to test PII and secrets redaction on arbitrary text."""
    sanitized, entities = PIISanitizer.sanitize(data.text)
    return {
        "original_text": data.text,
        "sanitized_text": sanitized,
        "redacted_entities": entities,
        "audit_summary": PIISanitizer.audit_summary(entities),
    }
