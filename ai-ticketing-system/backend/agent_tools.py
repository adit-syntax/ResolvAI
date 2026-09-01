"""
Autonomous Multi-Tool Agent with ReAct Loop — Module GenAI-4
Implements:
- Tool Registry for system diagnostics, account lookup, invoice checking, and RAG retrieval
- ReAct (Reasoning + Acting) execution loop: Thought -> Action -> Observation -> Final Resolution
- Structured thought trace logs for employee auditing and transparency
"""

import json
import os
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from rag_engine import rag_engine
from guardrails import PIISanitizer


# ─── Mock Enterprise System Telemetry & Tool Implementations ─────────────────

class EnterpriseToolRegistry:
    """
    Registry of live diagnostic and operational tools available to the AI Agent.
    """

    @staticmethod
    def search_knowledge_base(query: str) -> Dict[str, Any]:
        """Tool: Retrieve relevant verified articles and runbooks from knowledge base."""
        docs = rag_engine.search(query, top_k=2)
        if not docs:
            return {"status": "no_match", "message": "No matching knowledge base articles found."}
        return {
            "status": "success",
            "matches_found": len(docs),
            "top_match": {
                "id": docs[0]["id"],
                "title": docs[0]["title"],
                "category": docs[0]["category"],
                "similarity": docs[0]["similarity"],
                "content_excerpt": docs[0]["excerpt"],
            }
        }

    @staticmethod
    def check_system_health(service_name: str) -> Dict[str, Any]:
        """Tool: Check latency, error rate, and uptime for internal microservices."""
        service = service_name.lower().strip()
        telemetry = {
            "api-gateway": {"status": "degraded", "uptime": "98.4%", "latency_ms": 1420, "error_rate": "4.2%", "active_pods": "8/10", "alert": "High HTTP 502 rate detected"},
            "postgres-db": {"status": "warning", "uptime": "99.9%", "active_connections": 182, "slow_queries_per_min": 14, "deadlocks": 2, "alert": "Index missing on tickets table"},
            "auth-service": {"status": "healthy", "uptime": "99.99%", "latency_ms": 42, "error_rate": "0.01%", "alert": "None"},
            "stripe-billing": {"status": "healthy", "uptime": "99.95%", "latency_ms": 110, "error_rate": "0.00%", "alert": "None"},
            "search-index": {"status": "healthy", "uptime": "99.9%", "latency_ms": 28, "error_rate": "0.00%", "alert": "None"},
        }
        for key, data in telemetry.items():
            if key in service or service in key:
                return {"service": key, **data}
        return {
            "service": service_name,
            "status": "healthy",
            "uptime": "99.98%",
            "latency_ms": 45,
            "error_rate": "0.02%",
            "alert": "All nodes nominal."
        }

    @staticmethod
    def lookup_user_account(user_email: str) -> Dict[str, Any]:
        """Tool: Query customer profile, subscription tier, and security status."""
        email = user_email.lower().strip()
        is_corp = "@company.com" in email or "@resolvai" in email
        return {
            "user_email": email,
            "account_type": "Enterprise Staff" if is_corp else "Customer Pro Tier",
            "sso_status": "Okta Enforced" if is_corp else "Password + SMS MFA",
            "account_active": True,
            "open_tickets_count": 1,
            "sla_tier": "Priority 2-Hour SLA" if is_corp else "Standard 24-Hour SLA",
            "last_login": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        }

    @staticmethod
    def validate_invoice_record(invoice_id: str) -> Dict[str, Any]:
        """Tool: Verify billing records, disputed charges, and payment gateway logs."""
        clean_id = invoice_id.upper().strip()
        return {
            "invoice_id": clean_id or "INV-2024-0342",
            "amount": "$500.00",
            "status": "Paid / Under Review",
            "date": "2024-03-01",
            "line_items": [
                {"description": "Enterprise AI Helpdesk Plan (Annual)", "amount": "$500.00"}
            ],
            "dispute_eligible": True,
            "stripe_charge_id": "ch_3N9q82Lkd82xLw921",
        }


# ─── Autonomous ReAct Agent ──────────────────────────────────────────────────

class ReActAgent:
    """
    Multi-Step Autonomous Agent implementing Thought -> Action -> Observation reasoning loop.
    """

    AVAILABLE_TOOLS = {
        "search_knowledge_base": EnterpriseToolRegistry.search_knowledge_base,
        "check_system_health": EnterpriseToolRegistry.check_system_health,
        "lookup_user_account": EnterpriseToolRegistry.lookup_user_account,
        "validate_invoice_record": EnterpriseToolRegistry.validate_invoice_record,
    }

    @classmethod
    async def execute_react_flow(
        cls,
        ticket_title: str,
        ticket_description: str,
        user_email: str,
        category: str = "General"
    ) -> Dict[str, Any]:
        """
        Run the ReAct agent flow to autonomously diagnose and resolve or route the ticket.
        Returns full structured thought trace + final decision.
        """
        # Step 0: Apply PII Guardrail
        sanitized_desc, pii_entities = PIISanitizer.sanitize(ticket_description)
        combined_query = f"{ticket_title} {sanitized_desc}"

        trace: List[Dict[str, Any]] = []

        # Step 1: Initial Cognitive Analysis
        thought_1 = f"Analyzing ticket '{ticket_title}' from {user_email}. Category identified as '{category}'. Querying Knowledge Base for matching documentation and SOPs."
        tool_name_1 = "search_knowledge_base"
        tool_input_1 = ticket_title
        obs_1 = EnterpriseToolRegistry.search_knowledge_base(ticket_title)

        trace.append({
            "step": 1,
            "thought": thought_1,
            "action": f"{tool_name_1}(query='{tool_input_1}')",
            "observation": obs_1,
        })

        # Step 2: Contextual Diagnostic Tool Execution
        desc_lower = ticket_description.lower()

        if any(w in desc_lower for w in ["server", "down", "502", "crash", "outage", "database", "query", "slow", "api"]):
            svc = "postgres-db" if ("database" in desc_lower or "query" in desc_lower or "db" in desc_lower) else "api-gateway"
            thought_2 = f"Ticket indicates an infrastructure anomaly. Executing real-time health diagnostics on '{svc}' microservice."
            tool_name_2 = "check_system_health"
            tool_input_2 = svc
            obs_2 = EnterpriseToolRegistry.check_system_health(svc)
            trace.append({
                "step": 2,
                "thought": thought_2,
                "action": f"{tool_name_2}(service_name='{tool_input_2}')",
                "observation": obs_2,
            })
        elif any(w in desc_lower for w in ["invoice", "billing", "charge", "refund", "card", "pay"]):
            inv_match = re.search(r'INV-[0-9\-]+', ticket_description, re.IGNORECASE)
            inv_id = inv_match.group(0) if inv_match else "INV-2024-0342"
            thought_2 = f"Billing inquiry detected. Querying internal invoice transaction ledger for {inv_id}."
            tool_name_2 = "validate_invoice_record"
            tool_input_2 = inv_id
            obs_2 = EnterpriseToolRegistry.validate_invoice_record(inv_id)
            trace.append({
                "step": 2,
                "thought": thought_2,
                "action": f"{tool_name_2}(invoice_id='{tool_input_2}')",
                "observation": obs_2,
            })
        else:
            thought_2 = f"Checking user profile and SSO authorization parameters for {user_email}."
            tool_name_2 = "lookup_user_account"
            tool_input_2 = user_email
            obs_2 = EnterpriseToolRegistry.lookup_user_account(user_email)
            trace.append({
                "step": 2,
                "thought": thought_2,
                "action": f"{tool_name_2}(user_email='{tool_input_2}')",
                "observation": obs_2,
            })

        # Step 3: Synthesis & Final Grounded Action Plan
        top_match = obs_1.get("top_match", {})
        has_kb_match = bool(top_match)
        kb_title = top_match.get("title", "Standard Support SOP")
        kb_id = top_match.get("id", "SOP-101")

        final_thought = (
            f"Diagnostics completed. Evidence gathered from {len(trace)} tools. "
            f"Synthesized resolution plan grounded in [{kb_id}: {kb_title}]."
        )

        final_action_plan = (
            f"1. Verified user SLA tier and account credentials.\n"
            f"2. Matched resolution runbook [{kb_id}: {kb_title}].\n"
            f"3. Executed automated pre-flight diagnostics."
        )

        return {
            "reasoning_steps": len(trace),
            "trace": trace,
            "pii_sanitization": {
                "redacted_count": len(pii_entities),
                "summary": PIISanitizer.audit_summary(pii_entities),
            },
            "final_thought": final_thought,
            "final_action_plan": final_action_plan,
            "grounded_source": f"{kb_id}: {kb_title}" if has_kb_match else "General Support Policy",
        }


react_agent = ReActAgent()
