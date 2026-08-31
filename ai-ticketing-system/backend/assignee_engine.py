"""
Employee Assignee Suggestion Engine — Module 4
Selects the best employee based on AI query analysis, skills, workload, and availability.

Rule: One active ticket per employee at a time.
- If the best candidate already has an open ticket, skip them.
- If no free agent exists in the department, try cross-department free agents.
- If every expert is currently busy, return None → ticket waits in "New" status
  until a check-waiting poll reassigns it when someone finishes.
"""

from typing import Union, List, Optional, Set
import os
import json
import re
from sqlalchemy.orm import Session
from models import Employee, Ticket


KEYWORD_DEPT_MAP = {
    "money": "Finance",
    "transaction": "Finance",
    "billing": "Finance",
    "payment": "Finance",
    "invoice": "Finance",
    "reimbursement": "Finance",
    "payroll": "Finance",
    "tax": "Finance",
    "server": "DevOps",
    "outage": "DevOps",
    "kubernetes": "DevOps",
    "cloud": "DevOps",
    "deployment": "DevOps",
    "db": "Engineering",
    "database": "Engineering",
    "sql": "Engineering",
    "bug": "Engineering",
    "api": "Engineering",
    "python": "Engineering",
    "react": "Engineering",
    "frontend": "Engineering",
    "leave": "HR",
    "vacation": "HR",
    "policy": "HR",
    "benefits": "HR",
    "onboarding": "HR",
    "access": "IT",
    "password": "IT",
    "permission": "IT",
    "security": "IT",
    "hardware": "IT",
    "contract": "Legal",
    "compliance": "Legal",
}

# Statuses that count as "actively occupied"
ACTIVE_STATUSES = ["Assigned", "In Progress", "Pending Info"]


def _get_occupied_employee_ids(db: Session) -> Set[int]:
    """
    Return the set of employee IDs that currently own an open (active) ticket.
    These employees are considered fully occupied and must not receive another ticket.
    """
    rows = (
        db.query(Ticket.assignee_id)
        .filter(
            Ticket.assignee_id.isnot(None),
            Ticket.status.in_(ACTIVE_STATUSES),
        )
        .all()
    )
    return {r[0] for r in rows}


def _score_candidates(candidates, text_content: str):
    """Score and sort a list of Employee objects by best fit for the ticket text."""
    scored = []
    for emp in candidates:
        score = 0.0

        # Skill match bonus (0–50 pts)
        skills = [s.strip().lower() for s in (emp.skill_tags or "").split(",") if s.strip()]
        for skill in skills:
            if skill and skill in text_content:
                score += 25

        # Role keyword match (0–30 pts)
        role_words = [w for w in emp.role.lower().split() if len(w) > 3]
        for rw in role_words:
            if rw in text_content:
                score += 15

        # Availability status (0–30 pts)
        if emp.availability == "Available":
            score += 30
        elif emp.availability == "Busy":
            score += 10

        # Lower load is better (0–20 pts)
        load_penalty = min(emp.current_ticket_load * 4, 20)
        score += (20 - load_penalty)

        # Faster resolution time bonus (0–10 pts)
        if emp.avg_resolution_time > 0:
            score += max(0, 10 - emp.avg_resolution_time)

        scored.append((emp, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def suggest_assignee(
    db: Session,
    department: str,
    category: str,
    severity: str,
    title: str = "",
    description: str = ""
) -> dict:
    """
    Find the best FREE employee for a new ticket.

    Priority order:
    1. Free agent (no active ticket) in the target department
    2. Free agent (no active ticket) in any department (cross-dept fallback)
    3. None → ticket waits in 'New' status until check-waiting reassigns it
    """
    occupied_ids = _get_occupied_employee_ids(db)
    text_content = f"{title} {description} {category}".lower()

    # ── Step 1: free agents in department ─────────────────────────────
    dept_free = (
        db.query(Employee)
        .filter(
            Employee.department == department,
            Employee.is_active == True,
            Employee.availability != "On Leave",
            ~Employee.id.in_(occupied_ids) if occupied_ids else True,
        )
        .all()
    )

    if dept_free:
        scored = _score_candidates(dept_free, text_content)
        best = scored[0][0]
        return {
            "employee_id": best.id,
            "employee_name": best.name,
            "reason": f"Assigned to {best.name} ({best.role}, {best.department}) — free agent, load {best.current_ticket_load}",
        }

    # ── Step 2: free agents anywhere (cross-department) ───────────────
    any_free = (
        db.query(Employee)
        .filter(
            Employee.is_active == True,
            Employee.availability == "Available",
            ~Employee.id.in_(occupied_ids) if occupied_ids else True,
        )
        .all()
    )

    if any_free:
        scored = _score_candidates(any_free, text_content)
        best = scored[0][0]
        return {
            "employee_id": best.id,
            "employee_name": best.name,
            "reason": f"Cross-department assignment to {best.name} ({best.role}, {best.department}) — no free {department} agent available",
        }

    # ── Step 3: all experts are busy — put ticket in waiting queue ────
    return {
        "employee_id": None,
        "employee_name": None,
        "reason": f"All agents in {department} (and cross-department) are currently handling active tickets. Ticket queued — will auto-assign when an agent becomes free.",
    }


async def _ai_select_escalation_agent(
    ticket_title: str,
    ticket_desc: str,
    category: str,
    candidates: list
) -> Optional[dict]:
    """Use Groq LLM to intelligently analyze ticket query and pick best agent from candidates."""
    try:
        from ai_service import get_groq_key
        api_key = get_groq_key()
        if not api_key:
            return None

        from groq import Groq
        client = Groq(api_key=api_key)

        candidate_list_str = "\n".join([
            f"- ID {c.id}: {c.name} (Role: {c.role}, Dept: {c.department}, Skills: '{c.skill_tags}', Availability: {c.availability}, Current Load: {c.current_ticket_load})"
            for c in candidates
        ])

        prompt = f"""You are an AI IT escalation routing system.
Analyze the support ticket query and select the single best employee from the list of candidate agents.

TICKET QUERY:
Title: {ticket_title}
Description: {ticket_desc}
Category: {category}

AVAILABLE CANDIDATE AGENTS:
{candidate_list_str}

INSTRUCTIONS:
1. Match the ticket query requirements against agent skills, role expertise, and department.
2. Consider agent current ticket load (lower load preferred) and availability.
3. If the query requires cross-department expertise (e.g. database, billing, devops, hr, legal), select the appropriate specialist even if they are in a different department.
4. Select exactly ONE candidate ID from the list.

RETURN ONLY VALID JSON:
{{
    "selected_employee_id": <int>,
    "reason": "<concise 1-sentence reason explaining why AI chose this agent for this query>"
}}
"""

        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[
                {"role": "system", "content": "You are a precise AI routing assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300,
        )

        content = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            sel_id = data.get("selected_employee_id")
            selected_emp = next((c for c in candidates if c.id == sel_id), None)
            if selected_emp:
                return {
                    "employee_id": selected_emp.id,
                    "employee_name": selected_emp.name,
                    "department": selected_emp.department,
                    "reason": f"AI Escalation: Reassigned to {selected_emp.name} ({selected_emp.role}, {selected_emp.department}) — {data.get('reason', 'AI selected best specialist for query')}"
                }
    except Exception as e:
        print(f"[Assignee Engine] LLM escalation selection error: {e}")
    return None


async def find_alternative_assignee(
    db: Session,
    department: str,
    exclude_employee_ids: Union[int, List[int]],
    ticket_title: str = "",
    ticket_desc: str = "",
    category: str = ""
) -> dict:
    """
    Find an alternative employee for escalation using AI query-aware skill matching.
    Excludes all previously assigned employee IDs to prevent looping.
    Enforces the one-active-ticket-per-agent rule:
      - Prefer free agents (no active ticket).
      - Only consider busy agents if no free agent exists at all.
    """
    # Normalize excluded IDs to a set
    if isinstance(exclude_employee_ids, int):
        excluded_set = {exclude_employee_ids} if exclude_employee_ids > 0 else set()
    elif isinstance(exclude_employee_ids, (list, set, tuple)):
        excluded_set = set(int(x) for x in exclude_employee_ids if x)
    else:
        excluded_set = set()

    occupied_ids = _get_occupied_employee_ids(db)

    # Get all active, non-on-leave, non-excluded employees
    all_active = (
        db.query(Employee)
        .filter(
            Employee.is_active == True,
            Employee.availability != "On Leave",
        )
        .all()
    )
    candidates = [e for e in all_active if e.id not in excluded_set]

    if not candidates:
        return {
            "employee_id": None,
            "employee_name": None,
            "department": department,
            "reason": "No alternative employees available for escalation",
        }

    # ── Prefer free agents (not currently occupied) ───────────────────
    free_candidates = [e for e in candidates if e.id not in occupied_ids]

    pool = free_candidates if free_candidates else candidates

    # Try LLM selection on the free pool first
    if ticket_title or ticket_desc:
        ai_res = await _ai_select_escalation_agent(ticket_title, ticket_desc, category, pool)
        if ai_res:
            return ai_res

    # Heuristic scoring fallback
    text_content = f"{ticket_title} {ticket_desc} {category}".lower()
    target_dept = department
    detected_keyword = None

    for keyword, dept in KEYWORD_DEPT_MAP.items():
        if keyword in text_content:
            target_dept = dept
            detected_keyword = keyword
            break

    scored = []
    for emp in pool:
        score = 0.0

        # Skill match bonus with ticket query (0–60 pts)
        skills = [s.strip().lower() for s in (emp.skill_tags or "").split(",") if s.strip()]
        matched_skills = []
        for skill in skills:
            if skill and skill in text_content:
                score += 30
                matched_skills.append(skill)

        # Role keyword match (0–30 pts)
        role_words = [w for w in emp.role.lower().split() if len(w) > 3]
        for rw in role_words:
            if rw in text_content:
                score += 20

        # Target department bonus (0–30 pts)
        if emp.department == target_dept:
            score += 30
        elif emp.department == department:
            score += 15

        # Free-agent bonus — reward agents with no active ticket (0–40 pts)
        if emp.id not in occupied_ids:
            score += 40

        # Availability status (0–25 pts)
        if emp.availability == "Available":
            score += 25
        elif emp.availability == "Busy":
            score += 10

        # Workload penalty (0–20 pts)
        load_penalty = min(emp.current_ticket_load * 4, 20)
        score += (20 - load_penalty)

        # Resolution speed bonus (0–10 pts)
        if emp.avg_resolution_time > 0:
            score += max(0, 10 - emp.avg_resolution_time)

        scored.append((emp, score, matched_skills))

    scored.sort(key=lambda x: x[1], reverse=True)
    best_emp, best_score, matched_skills = scored[0]

    if matched_skills:
        reason_detail = f"AI matched skills: {', '.join(matched_skills)}"
    elif detected_keyword:
        reason_detail = f"AI query keyword '{detected_keyword}' → {best_emp.department}"
    else:
        reason_detail = f"AI skill & workload score ({best_score:.0f})"

    is_free = best_emp.id not in occupied_ids
    free_note = "" if is_free else " (currently handling another ticket — no free agent available)"

    reason_text = f"AI Escalation: Reassigned to {best_emp.name} ({best_emp.role}, {best_emp.department}) [{reason_detail}]{free_note}"

    return {
        "employee_id": best_emp.id,
        "employee_name": best_emp.name,
        "department": best_emp.department,
        "reason": reason_text,
    }


