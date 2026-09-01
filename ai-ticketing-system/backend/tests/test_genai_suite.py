"""
Integration and unit tests for the Top 1% GenAI suite:
- Enterprise PII Guardrails & Sanitizer
- Hybrid Vector RAG Engine & Citations
- Semantic Duplicate Detection & Incident Clustering
- Autonomous Multi-Tool Agent ReAct Loop
- Knowledge Base API endpoints
"""

import pytest
from guardrails import PIISanitizer
from rag_engine import rag_engine, DenseEmbedder, BM25Index
from clustering_engine import clustering_engine
from agent_tools import react_agent, EnterpriseToolRegistry


def test_pii_sanitizer():
    """Verify that credit cards, API keys, passwords, and SSNs are redacted."""
    raw_text = (
        "My database password is 'SuperSecretPwd123!' and my API key is gsk_abcdef1234567890abcdef1234567890. "
        "Also my card is 4111111111111111 and SSN is 123-45-6789."
    )
    sanitized, entities = PIISanitizer.sanitize(raw_text)

    assert "[REDACTED_PASSWORD]" in sanitized or "SuperSecretPwd123!" not in sanitized
    assert "[REDACTED_SECRET_KEY]" in sanitized or "gsk_abcdef" not in sanitized
    assert "[REDACTED_CREDIT_CARD]" in sanitized or "4111111111111111" not in sanitized
    assert "[REDACTED_SSN]" in sanitized or "123-45-6789" not in sanitized
    assert len(entities) >= 3


def test_dense_embedder_and_cosine():
    """Verify 384-D dense embeddings and semantic similarity."""
    vec1 = DenseEmbedder.embed_text("PostgreSQL query timeout and slow database performance")
    vec2 = DenseEmbedder.embed_text("Database queries taking 5000ms and timing out on postgres")
    vec3 = DenseEmbedder.embed_text("HR policy regarding annual paid vacation and sick leave")

    sim_related = DenseEmbedder.cosine_similarity(vec1, vec2)
    sim_unrelated = DenseEmbedder.cosine_similarity(vec1, vec3)

    assert len(vec1) == 384
    assert sim_related > sim_unrelated
    assert sim_related > 0.50


def test_hybrid_rag_search_and_grounding():
    """Verify RAG hybrid search returns grounded answers with exact source citations."""
    query = "How do I troubleshoot 502 Bad Gateway error on the API gateway pods?"
    result = rag_engine.generate_grounded_answer(query, top_k=2)

    assert result["confidence_score"] > 0.30
    assert len(result["sources"]) > 0
    top_source = result["sources"][0]
    assert "KB-INFRA-202" in top_source["id"] or "API Gateway" in top_source["title"]
    assert "kubectl" in result["answer"] or "Kubernetes" in result["answer"]


def test_semantic_duplicate_detection():
    """Verify cosine duplicate detection on similar incoming tickets."""
    t1 = {"id": 1, "title": "Database slow query timeout", "description": "Postgres queries timing out"}
    candidates = [
        {"id": 2, "title": "PostgreSQL queries timing out", "description": "Database queries slow timeout error", "severity": "High", "user_email": "alice@company.com"},
        {"id": 3, "title": "Need reimbursement for hotel stay", "description": "Finance invoice review", "severity": "Low", "user_email": "bob@company.com"},
    ]

    duplicates = clustering_engine.find_duplicate_tickets(t1, candidates, similarity_threshold=0.60)
    assert len(duplicates) >= 1
    assert duplicates[0]["ticket_id"] == 2


def test_incident_outage_clustering():
    """Verify automatic incident spike detection when multiple similar tickets occur."""
    tickets = [
        {"id": 101, "title": "Production API is down 502 error", "description": "All endpoints returning 502 Bad Gateway", "category": "Server", "severity": "Critical", "user_email": "u1@co.com"},
        {"id": 102, "title": "502 Bad Gateway API crash", "description": "Kubernetes API gateway is failing", "category": "Server", "severity": "Critical", "user_email": "u2@co.com"},
        {"id": 103, "title": "API gateway timeout and 502 errors", "description": "Cannot connect to server API", "category": "Server", "severity": "High", "user_email": "u3@co.com"},
        {"id": 104, "title": "Password reset link not working", "description": "Cannot login to Okta", "category": "Access", "severity": "Low", "user_email": "u4@co.com"},
    ]

    clusters = clustering_engine.detect_incident_clusters(tickets, min_cluster_size=2, similarity_threshold=0.60)
    assert len(clusters) >= 1
    cluster = clusters[0]
    assert cluster["category"] == "Server"
    assert cluster["ticket_count"] >= 3
    assert cluster["severity"] == "Critical"


@pytest.mark.asyncio
async def test_autonomous_react_agent_flow():
    """Verify ReAct agent executes multi-step tool calls and records thought trace."""
    trace_res = await react_agent.execute_react_flow(
        ticket_title="API Gateway 502 server crash",
        ticket_description="The server is returning 502 Bad Gateway and latency is high.",
        user_email="dev@company.com",
        category="Server"
    )

    assert trace_res["reasoning_steps"] >= 2
    assert len(trace_res["trace"]) >= 2
    # Verify tool execution occurred
    step_actions = [step["action"] for step in trace_res["trace"]]
    assert any("search_knowledge_base" in a for a in step_actions)
    assert any("check_system_health" in a for a in step_actions)


@pytest.mark.asyncio
async def test_knowledge_api_endpoints(async_client, employee_auth_headers):
    """Verify knowledge base REST API endpoints."""
    # List articles
    res = await async_client.get("/api/knowledge/articles")
    assert res.status_code == 200
    articles = res.json()
    assert len(articles) >= 5

    # RAG Query
    q_res = await async_client.post(
        "/api/knowledge/query",
        json={"query": "How many vacation days do full time employees receive?", "top_k": 2}
    )
    assert q_res.status_code == 200
    data = q_res.json()
    assert "sources" in data
    assert len(data["sources"]) > 0

    # PII Sanitize endpoint
    pii_res = await async_client.post(
        "/api/knowledge/sanitize-pii",
        json={"text": "Here is my secret token: gsk_123456789012345678901234"}
    )
    assert pii_res.status_code == 200
    assert "[REDACTED_SECRET_KEY]" in pii_res.json()["sanitized_text"]
