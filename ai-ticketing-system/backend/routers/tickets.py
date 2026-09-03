"""
Ticket API Router — Modules 1, 2, 5
Handles ticket CRUD, AI analysis, auto-resolution, lifecycle management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from database import get_db
from models import Ticket, Employee, Feedback, TicketNote, TicketTimeline, Notification, TicketReply
from schemas import (
    TicketCreate, TicketResponse, TicketStatusUpdate,
    FeedbackCreate, FeedbackResponse,
    NoteCreate, NoteResponse,
    TimelineResponse, NotificationResponse,
    ReplyCreate, ReplyResponse, ReplyFeedback,
    SuggestionCreate, SuggestionResponse,
)
from ai_service import analyze_ticket
from routing_engine import route_ticket
from assignee_engine import suggest_assignee, find_alternative_assignee
from auth_utils import get_current_user, require_employee_or_admin, require_admin, require_auth
from realtime import manager

import os
import json
import asyncio
import urllib.request

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


# ─── SLA & Notification Helpers ─────────────────────────────────────

SLA_HOURS = {
    "Critical": 2,
    "High": 6,
    "Medium": 24,
    "Low": 48,
}


def _compute_sla_due_at(created_at: datetime, severity: str) -> datetime:
    hours = SLA_HOURS.get(severity, 24)
    if created_at is None:
        created_at = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at + timedelta(hours=hours)


def _compute_sla_status(ticket: Ticket) -> str:
    if ticket.status in ["Resolved", "Closed"]:
        return "resolved"

    due_at = ticket.sla_due_at
    if not due_at:
        created = ticket.created_at or datetime.now(timezone.utc)
        due_at = _compute_sla_due_at(created, ticket.severity or "Medium")

    now = datetime.now(timezone.utc)
    if due_at.tzinfo is None:
        due_at = due_at.replace(tzinfo=timezone.utc)

    time_left = (due_at - now).total_seconds()
    if time_left < 0:
        return "breached"
    elif time_left < 3600:  # less than 1 hour remaining
        return "at_risk"
    else:
        return "on_track"


def _format_ticket_response(ticket: Ticket) -> TicketResponse:
    resp = TicketResponse.model_validate(ticket)
    if ticket.assignee:
        resp.assignee_name = ticket.assignee.name
        resp.assignee_email = ticket.assignee.email
        resp.assignee_availability = ticket.assignee.availability
    resp.replies = [ReplyResponse.model_validate(r) for r in (ticket.replies or [])]

    # Compute SLA
    if not ticket.sla_due_at and ticket.created_at:
        ticket.sla_due_at = _compute_sla_due_at(ticket.created_at, ticket.severity or "Medium")
    resp.sla_due_at = ticket.sla_due_at
    resp.sla_status = _compute_sla_status(ticket)
    return resp


def _send_slack_notification(ticket: Ticket, title_prefix: str = "New Ticket Alert"):
    webhook_url = None
    try:
        from database import SessionLocal
        from models import SystemSetting
        db = SessionLocal()
        try:
            rec = db.query(SystemSetting).filter(SystemSetting.key == "slack_webhook_url").first()
            if rec and rec.value and rec.value.strip():
                webhook_url = rec.value.strip()
        finally:
            db.close()
    except Exception:
        pass

    if not webhook_url:
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")

    if not webhook_url or not webhook_url.startswith("http"):
        return

    payload = {
        "text": f"🚨 *{title_prefix}*: #{ticket.id} - {ticket.title}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{title_prefix}: Ticket #{ticket.id}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Title:*\n{ticket.title}"},
                    {"type": "mrkdwn", "text": f"*Severity:*\n{ticket.severity}"},
                    {"type": "mrkdwn", "text": f"*Department:*\n{ticket.department or 'Unassigned'}"},
                    {"type": "mrkdwn", "text": f"*Category:*\n{ticket.category or 'General'}"}
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Description:*\n{ticket.description[:200]}..."
                }
            }
        ]
    }
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(webhook_url, data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=3)
    except Exception as e:
        print(f"[Slack Webhook] Post error: {e}")



# ─── Auto-Resolution Templates ───────────────────────────────────────

AUTO_RESOLVE_TEMPLATES = {
    "password": (
        "Hello,\n\n"
        "We've received your request regarding password assistance. "
        "You can reset your password by visiting: https://portal.company.com/reset-password\n\n"
        "Steps:\n"
        "1. Click the link above\n"
        "2. Enter your registered email address\n"
        "3. Check your inbox for a reset link (also check spam folder)\n"
        "4. Create a new strong password\n\n"
        "If you continue to experience issues, please reply to this ticket.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
    "leave": (
        "Hello,\n\n"
        "Thank you for your inquiry about leave policy.\n\n"
        "Our leave policy details are available at: https://hr.company.com/leave-policy\n\n"
        "Key highlights:\n"
        "• Annual leave: 24 days per year\n"
        "• Sick leave: 12 days per year\n"
        "• Apply via the HR portal at least 3 days in advance\n"
        "• Emergency leave can be applied retroactively within 48 hours\n\n"
        "For specific questions, please contact hr@company.com.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
    "billing": (
        "Hello,\n\n"
        "We've received your billing inquiry. Here's what we can help with:\n\n"
        "• View your invoices: https://billing.company.com/invoices\n"
        "• Payment methods: https://billing.company.com/payment\n"
        "• Billing cycle: Monthly, processed on the 1st\n\n"
        "If you need a specific invoice adjustment or have a disputed charge, "
        "please provide the invoice number and we'll escalate to our finance team.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
    "hr": (
        "Hello,\n\n"
        "Thank you for reaching out to HR Support.\n\n"
        "Here are some useful resources:\n"
        "• Employee handbook: https://hr.company.com/handbook\n"
        "• Benefits portal: https://hr.company.com/benefits\n"
        "• HR policies: https://hr.company.com/policies\n\n"
        "If your query requires personal attention, an HR representative "
        "will follow up within 24 hours.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
    "status": (
        "Hello,\n\n"
        "Thank you for checking in on your request.\n\n"
        "You can track the status of all your tickets at: https://portal.company.com/my-tickets\n\n"
        "Current processing times:\n"
        "• Standard requests: 1-2 business days\n"
        "• Urgent requests: 4-8 hours\n"
        "• Critical issues: 1-2 hours\n\n"
        "If your issue is urgent, please update the ticket priority.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
    "default": (
        "Hello,\n\n"
        "Thank you for contacting support. We've analyzed your request "
        "and believe we can help resolve it quickly.\n\n"
        "Based on our analysis, here's what we recommend:\n"
        "• Check our knowledge base: https://help.company.com\n"
        "• FAQ section: https://help.company.com/faq\n\n"
        "If this doesn't resolve your issue, please let us know and "
        "we'll connect you with a specialist.\n\n"
        "Best regards,\nAI Support Assistant"
    ),
}


def _get_auto_response(category: str, description: str) -> str:
    """Generate an auto-resolution response based on ticket category and content."""
    desc_lower = description.lower()

    for keyword, template in AUTO_RESOLVE_TEMPLATES.items():
        if keyword != "default" and keyword in desc_lower:
            return template

    # Use category-based fallback
    category_map = {
        "Access": AUTO_RESOLVE_TEMPLATES["password"],
        "HR": AUTO_RESOLVE_TEMPLATES["hr"],
        "Billing": AUTO_RESOLVE_TEMPLATES["billing"],
    }

    return category_map.get(category, AUTO_RESOLVE_TEMPLATES["default"])


def _add_timeline(db: Session, ticket_id: int, event_type: str, description: str,
                  old_value: str = None, new_value: str = None, actor: str = "System"):
    """Add a timeline event to a ticket."""
    event = TicketTimeline(
        ticket_id=ticket_id,
        event_type=event_type,
        description=description,
        old_value=old_value,
        new_value=new_value,
        actor=actor,
    )
    db.add(event)


def _send_notification(db: Session, ticket_id: int, email: str, subject: str,
                       body: str, notif_type: str):
    """Create a simulated email notification."""
    notif = Notification(
        ticket_id=ticket_id,
        recipient_email=email,
        subject=subject,
        body=body,
        notification_type=notif_type,
    )
    db.add(notif)


# ─── Endpoints ────────────────────────────────────────────────────────

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """
    Submit a new ticket. Flow:
    1. Create ticket record (auto-generate title if not provided)
    2. Run AI analysis
    3. Either auto-resolve or route to department + assign employee
    """
    user_email = ticket_data.user_email or current_user.email
    if current_user.role == "user":
        # Force user email to current authenticated user's email
        user_email = current_user.email
    # Auto-generate title from description if not provided
    title = ticket_data.title
    if not title or not title.strip():
        stop_words = {"i", "my", "me", "the", "a", "an", "is", "am", "are", "was", "were",
                       "to", "and", "but", "or", "in", "on", "at", "for", "of", "with",
                       "it", "this", "that", "do", "did", "not", "can", "cannot", "have",
                       "has", "had"}
        words = ticket_data.description.split()
        meaningful = [w for w in words if w.lower().strip(".,!?;:") not in stop_words]
        title_words = meaningful[:8] if len(meaningful) >= 6 else words[:8]
        title = " ".join(title_words).strip(".,!?;:")
        title = title[:200].title() if title else "Support Request"

    # Step 1: Create the ticket
    ticket = Ticket(
        title=title,
        description=ticket_data.description,
        user_email=user_email,
        attachment_url=ticket_data.attachment_url,
        status="New",
    )
    db.add(ticket)
    db.flush()  # Get the ticket ID

    _add_timeline(db, ticket.id, "created", "Ticket created by user", actor=user_email)

    # Step 2: AI Analysis
    ai_result = await analyze_ticket(
        title, ticket_data.description, user_email
    )

    # Store AI analysis on the ticket
    ticket.category = ai_result.category
    ticket.ai_summary = ai_result.ai_summary
    ticket.severity = ai_result.severity
    ticket.recommended_resolution_path = ai_result.recommended_resolution_path
    ticket.sentiment = ai_result.sentiment
    ticket.suggested_department = ai_result.suggested_department
    ticket.suggested_employee = ai_result.suggested_employee
    ticket.confidence_score = ai_result.confidence_score
    ticket.estimated_resolution_time = ai_result.estimated_resolution_time
    ticket.sla_due_at = _compute_sla_due_at(datetime.now(timezone.utc), ai_result.severity or "Medium")

    _add_timeline(
        db, ticket.id, "ai_analysis",
        f"AI Analysis: {ai_result.category} | {ai_result.severity} | {ai_result.recommended_resolution_path}",
        actor="AI Engine"
    )

    # Step 3: Route based on AI decision
    if ai_result.recommended_resolution_path == "Auto-resolve":
        # Module 2: Auto-Resolution
        auto_response = _get_auto_response(ai_result.category, ticket_data.description)
        ticket.auto_resolved = True
        ticket.auto_response = auto_response
        ticket.status = "Resolved"
        ticket.department = ai_result.suggested_department
        ticket.resolved_at = datetime.now(timezone.utc)

        _add_timeline(db, ticket.id, "auto_resolved", "Ticket auto-resolved by AI", actor="AI Engine")
        _send_notification(
            db, ticket.id, user_email,
            f"[Resolved] {ticket_data.title}",
            auto_response, "resolved"
        )
    else:
        # Module 3: Department Routing
        routing = route_ticket(
            ai_result.category, ai_result.severity,
            ai_result.ai_summary, ticket_data.description
        )
        ticket.department = routing["department"]
        ticket.severity = routing["severity"]
        ticket.sla_due_at = _compute_sla_due_at(datetime.now(timezone.utc), routing["severity"] or "Medium")

        _add_timeline(
            db, ticket.id, "routed",
            f"Routed to {routing['department']}: {routing['routing_reason']}",
            actor="Routing Engine"
        )

        # Module 4: Assignee Suggestion
        assignment = suggest_assignee(
            db, routing["department"], ai_result.category, routing["severity"],
            title=title, description=ticket_data.description
        )

        if assignment["employee_id"]:
            ticket.assignee_id = assignment["employee_id"]
            ticket.status = "Assigned"
            ticket.assigned_at = datetime.now(timezone.utc)

            # Increment employee load
            employee = db.get(Employee, assignment["employee_id"])
            if employee:
                employee.current_ticket_load += 1

            _add_timeline(
                db, ticket.id, "assigned",
                f"Assigned to {assignment['employee_name']}: {assignment['reason']}",
                actor="Assignment Engine"
            )

            _send_notification(
                db, ticket.id, user_email,
                f"[Assigned] {ticket_data.title}",
                f"Your ticket has been assigned to {assignment['employee_name']} in the {routing['department']} department.",
                "status_change"
            )

    # Dispatch Slack Notification for new tickets.
    # Runs in a worker thread so the blocking HTTP POST never stalls the event loop.
    await asyncio.to_thread(_send_slack_notification, ticket, "New Ticket Submitted")

    db.commit()
    db.refresh(ticket)

    manager.notify({"type": "tickets_updated"})
    return _format_ticket_response(ticket)


@router.get("/", response_model=List[TicketResponse])
def list_tickets(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sla_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """List tickets with filtering and search. Regular users only see their own tickets."""
    query = db.query(Ticket)

    # Scoping: End users can only see their own tickets
    if current_user.role == "user":
        query = query.filter(Ticket.user_email == current_user.email)
    elif user_email:
        query = query.filter(Ticket.user_email == user_email)

    if status:
        query = query.filter(Ticket.status == status)
    if department:
        query = query.filter(Ticket.department == department)
    if severity:
        query = query.filter(Ticket.severity == severity)
    if category:
        query = query.filter(Ticket.category == category)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Ticket.title.ilike(search_term)) | (Ticket.description.ilike(search_term))
        )

    tickets = query.order_by(desc(Ticket.created_at)).offset(skip).limit(limit).all()
    formatted = [_format_ticket_response(t) for t in tickets]
    if sla_status:
        formatted = [t for t in formatted if t.sla_status == sla_status]
    return formatted


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Get a single ticket by ID. End users can only view their own tickets."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "user" and (ticket.user_email or "").lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="You can only view your own tickets")

    return _format_ticket_response(ticket)


@router.patch("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int,
    update: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Update ticket status (lifecycle management). Requires employee or admin."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    ticket.status = update.status
    freed_employee_id = None

    if update.status in ("Resolved", "Closed"):
        if update.status == "Resolved":
            ticket.resolved_at = datetime.now(timezone.utc)
        # Decrement assignee load — agent is now free
        if ticket.assignee_id:
            emp = db.get(Employee, ticket.assignee_id)
            if emp and emp.current_ticket_load > 0:
                emp.current_ticket_load -= 1
            freed_employee_id = ticket.assignee_id

    _add_timeline(
        db, ticket_id, "status_change",
        f"Status changed from {old_status} to {update.status}",
        old_value=old_status, new_value=update.status, actor=update.actor
    )

    _send_notification(
        db, ticket_id, ticket.user_email,
        f"[Status Update] {ticket.title}",
        f"Your ticket status has been updated from {old_status} to {update.status}.",
        "status_change"
    )

    db.commit()

    # If an agent just freed up, promote the oldest waiting ticket
    if freed_employee_id:
        _promote_waiting_ticket(db, freed_employee_id)

    manager.notify({"type": "tickets_updated"})
    return {"message": "Status updated", "old_status": old_status, "new_status": update.status}


@router.post("/{ticket_id}/notes", response_model=NoteResponse)
def add_note(
    ticket_id: int,
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Add an internal note to a ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    note = TicketNote(
        ticket_id=ticket_id,
        author=note_data.author,
        author_email=getattr(note_data, 'author_email', None),
        content=note_data.content,
        is_internal=note_data.is_internal,
        note_type=getattr(note_data, 'note_type', 'internal'),
    )
    db.add(note)

    _add_timeline(db, ticket_id, "note", f"Note added by {note_data.author}", actor=note_data.author)

    # If requesting info from user
    if not note_data.is_internal:
        ticket.status = "Pending Info"
        _send_notification(
            db, ticket_id, ticket.user_email,
            f"[Info Requested] {ticket.title}",
            note_data.content,
            "info_request"
        )

    db.commit()
    db.refresh(note)
    manager.notify({"type": "tickets_updated"})
    return note


@router.get("/{ticket_id}/notes", response_model=List[NoteResponse])
def get_notes(
    ticket_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Get internal notes for a ticket (employees/admins only)."""
    return (
        db.query(TicketNote)
        .filter(TicketNote.ticket_id == ticket_id)
        .order_by(TicketNote.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{ticket_id}/timeline", response_model=List[TimelineResponse])
def get_timeline(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Get the full timeline of a ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == "user" and (ticket.user_email or "").lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="You can only view timeline for your own tickets")

    return (
        db.query(TicketTimeline)
        .filter(TicketTimeline.ticket_id == ticket_id)
        .order_by(TicketTimeline.created_at)
        .all()
    )


@router.post("/{ticket_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    ticket_id: int,
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Submit feedback on an auto-resolved ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    existing = db.query(Feedback).filter(Feedback.ticket_id == ticket_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this ticket")

    feedback = Feedback(
        ticket_id=ticket_id,
        is_helpful=feedback_data.is_helpful,
        comment=feedback_data.comment,
    )
    db.add(feedback)

    _add_timeline(
        db, ticket_id, "feedback",
        f"Feedback: {'Helpful' if feedback_data.is_helpful else 'Not helpful'}",
        actor=ticket.user_email
    )

    # If not helpful, reopen and assign
    if not feedback_data.is_helpful:
        ticket.auto_resolved = False
        ticket.status = "New"
        ticket.resolved_at = None

        # Route and assign
        routing = route_ticket(
            ticket.category, ticket.severity, ticket.ai_summary or "", ticket.description
        )
        ticket.department = routing["department"]
        assignment = suggest_assignee(
            db, routing["department"], ticket.category or "", routing["severity"],
            title=ticket.title or "", description=ticket.description or ""
        )

        if assignment["employee_id"]:
            ticket.assignee_id = assignment["employee_id"]
            ticket.status = "Assigned"
            ticket.assigned_at = datetime.now(timezone.utc)

            emp = db.get(Employee, assignment["employee_id"])
            if emp:
                emp.current_ticket_load += 1

        _add_timeline(db, ticket_id, "reopened", "Ticket reopened due to unhelpful auto-resolution", actor="System")

    db.commit()
    db.refresh(feedback)
    manager.notify({"type": "tickets_updated"})
    return feedback


def _get_ticket_assignee_history(db: Session, ticket: Ticket) -> List[int]:
    """Get all employee IDs that have ever been assigned or involved in this ticket."""
    excluded = set()
    if ticket.assignee_id:
        excluded.add(ticket.assignee_id)

    timeline_events = (
        db.query(TicketTimeline)
        .filter(
            TicketTimeline.ticket_id == ticket.id,
            TicketTimeline.event_type.in_(["assigned", "escalation", "reassigned"])
        )
        .all()
    )

    all_employees = db.query(Employee).all()
    emp_name_map = {emp.name.lower(): emp.id for emp in all_employees}

    for event in timeline_events:
        desc = (event.description or "").lower()
        for emp_name, emp_id in emp_name_map.items():
            if emp_name in desc:
                excluded.add(emp_id)

    return list(excluded)


@router.post("/{ticket_id}/escalate")
async def escalate_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Manually escalate a ticket — admin only."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_assignee_id = ticket.assignee_id
    department = ticket.department or "IT"

    excluded_ids = _get_ticket_assignee_history(db, ticket)

    # Find alternative using AI query analysis
    alt = await find_alternative_assignee(
        db=db,
        department=department,
        exclude_employee_ids=excluded_ids,
        ticket_title=ticket.title or "",
        ticket_desc=ticket.description or "",
        category=ticket.category or ""
    )

    if alt["employee_id"]:
        # Decrement old assignee load
        if old_assignee_id:
            old_emp = db.get(Employee, old_assignee_id)
            if old_emp and old_emp.current_ticket_load > 0:
                old_emp.current_ticket_load -= 1

        # Assign new & update department
        ticket.assignee_id = alt["employee_id"]
        ticket.department = alt.get("department", department)
        ticket.escalated = True
        ticket.assigned_at = datetime.now(timezone.utc)

        new_emp = db.get(Employee, alt["employee_id"])
        if new_emp:
            new_emp.current_ticket_load += 1

        _add_timeline(
            db, ticket_id, "escalation",
            alt["reason"],
            old_value=str(old_assignee_id or ""),
            new_value=str(alt["employee_id"]),
            actor="AI Escalation Engine"
        )

        db.commit()
        manager.notify({"type": "tickets_updated"})
        return {"message": "Ticket escalated", "new_assignee": alt["employee_name"], "department": ticket.department}

    raise HTTPException(status_code=400, detail=alt["reason"])


@router.get("/{ticket_id}/notifications", response_model=List[NotificationResponse])
def get_notifications(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Get all notifications for a ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == "user" and (ticket.user_email or "").lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="You can only view notifications for your own tickets")

    return (
        db.query(Notification)
        .filter(Notification.ticket_id == ticket_id)
        .order_by(desc(Notification.created_at))
        .all()
    )


@router.post("/check-escalations")
async def check_escalations(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """
    Check for tickets needing escalation.
    High/Critical tickets not picked up within 2 hours get auto-reassigned.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)

    stale_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status.in_(["Assigned"]),
            Ticket.severity.in_(["High", "Critical"]),
            Ticket.assigned_at < cutoff,
            Ticket.escalated == False,
        )
        .all()
    )

    escalated_count = 0
    for ticket in stale_tickets:
        excluded_ids = _get_ticket_assignee_history(db, ticket)
        alt = await find_alternative_assignee(
            db=db,
            department=ticket.department or "IT",
            exclude_employee_ids=excluded_ids,
            ticket_title=ticket.title or "",
            ticket_desc=ticket.description or "",
            category=ticket.category or ""
        )
        if alt["employee_id"]:
            if ticket.assignee_id:
                old_emp = db.get(Employee, ticket.assignee_id)
                if old_emp and old_emp.current_ticket_load > 0:
                    old_emp.current_ticket_load -= 1

            ticket.assignee_id = alt["employee_id"]
            ticket.department = alt.get("department", ticket.department)
            ticket.escalated = True
            ticket.assigned_at = datetime.now(timezone.utc)

            new_emp = db.get(Employee, alt["employee_id"])
            if new_emp:
                new_emp.current_ticket_load += 1

            _add_timeline(
                db, ticket.id, "escalation",
                f"Auto-escalated (2h timeout): {alt['reason']}",
                actor="AI Escalation Engine"
            )
            escalated_count += 1

    db.commit()
    if escalated_count:
        manager.notify({"type": "tickets_updated"})
    return {"message": f"Checked escalations, {escalated_count} tickets escalated"}


def _promote_waiting_ticket(db: Session, freed_employee_id: int) -> bool:
    """
    When an employee finishes a ticket and becomes free, assign them the oldest
    ticket currently in the waiting queue (status='New', no assignee_id,
    department matches or any if no match found).
    Returns True if a waiting ticket was promoted.
    """
    freed_emp = db.get(Employee, freed_employee_id)
    if not freed_emp:
        return False

    # Look for oldest unassigned ticket in the freed agent's department first
    waiting_ticket = (
        db.query(Ticket)
        .filter(
            Ticket.status == "New",
            Ticket.assignee_id.is_(None),
            Ticket.department == freed_emp.department,
        )
        .order_by(Ticket.created_at.asc())
        .first()
    )

    # If no match in department, take any unassigned waiting ticket
    if not waiting_ticket:
        waiting_ticket = (
            db.query(Ticket)
            .filter(
                Ticket.status == "New",
                Ticket.assignee_id.is_(None),
            )
            .order_by(Ticket.created_at.asc())
            .first()
        )

    if not waiting_ticket:
        return False

    waiting_ticket.assignee_id = freed_emp.id
    waiting_ticket.status = "Assigned"
    waiting_ticket.assigned_at = datetime.now(timezone.utc)
    freed_emp.current_ticket_load += 1

    _add_timeline(
        db, waiting_ticket.id, "assigned",
        f"Promoted from waiting queue → assigned to {freed_emp.name} ({freed_emp.role}, {freed_emp.department}) after they became free.",
        actor="Queue Promotion Engine"
    )
    _send_notification(
        db, waiting_ticket.id, waiting_ticket.user_email,
        f"[Assigned] {waiting_ticket.title}",
        f"Your ticket has been assigned to {freed_emp.name} in the {freed_emp.department} department.",
        "status_change"
    )
    db.commit()
    return True


@router.post("/check-waiting")
def check_waiting_tickets(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """
    Scan all tickets stuck in 'New' status with no assignee (waiting queue).
    For each one, try to find a free agent using suggest_assignee and assign it.
    Call this on a schedule (e.g. every minute) or after any ticket is closed.
    """
    waiting_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.status == "New",
            Ticket.assignee_id.is_(None),
        )
        .order_by(Ticket.created_at.asc())
        .all()
    )

    promoted = 0
    for ticket in waiting_tickets:
        department = ticket.department or "IT"
        assignment = suggest_assignee(
            db,
            department,
            ticket.category or "",
            ticket.severity or "Medium",
            title=ticket.title or "",
            description=ticket.description or "",
        )
        if assignment["employee_id"]:
            ticket.assignee_id = assignment["employee_id"]
            ticket.status = "Assigned"
            ticket.assigned_at = datetime.now(timezone.utc)

            emp = db.get(Employee, assignment["employee_id"])
            if emp:
                emp.current_ticket_load += 1

            _add_timeline(
                db, ticket.id, "assigned",
                f"Promoted from waiting queue → {assignment['reason']}",
                actor="Queue Promotion Engine"
            )
            _send_notification(
                db, ticket.id, ticket.user_email,
                f"[Assigned] {ticket.title}",
                f"Your ticket has been assigned to {assignment['employee_name']} in the {department} department.",
                "status_change"
            )
            promoted += 1

    db.commit()
    if promoted:
        manager.notify({"type": "tickets_updated"})
    return {
        "message": f"Waiting queue checked: {promoted} ticket(s) promoted, {len(waiting_tickets) - promoted} still waiting.",
        "promoted": promoted,
        "still_waiting": len(waiting_tickets) - promoted,
    }


# ─── Reply Endpoints ─────────────────────────────────────────────────

@router.post("/{ticket_id}/replies", response_model=ReplyResponse)
def create_reply(
    ticket_id: int,
    reply_data: ReplyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Add an official reply to a ticket.

    Permission rules (enforced using verified JWT, NOT request body):
    - is_employee_reply=True  → actor must be 'admin' OR the currently assigned employee.
    - is_employee_reply=False → ticket owner reply, always allowed if authenticated.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # ── Server-side permission gate (reads from verified JWT, cannot be forged) ──
    if reply_data.is_employee_reply:
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentication required to send an employee reply.")

        actor_role = current_user.role          # from JWT — cannot be forged
        actor_email = current_user.email.lower()

        is_admin = actor_role == "admin"

        # Assigned employee check against DB record
        assignee_email = ""
        assignee_id = ticket.assignee_id
        if assignee_id:
            assignee = db.get(Employee, assignee_id)
            if assignee:
                assignee_email = assignee.email.lower()

        is_assigned_employee = False
        if actor_role == "employee":
            emp = None
            if current_user.employee_id:
                emp = db.get(Employee, current_user.employee_id)
            if not emp:
                emp = db.query(Employee).filter(Employee.email.ilike(actor_email)).first()
            if not emp:
                emp = db.query(Employee).filter(Employee.is_active == True).first()

            if not assignee_id:
                is_assigned_employee = True
            elif actor_email == assignee_email:
                is_assigned_employee = True
            elif emp and emp.id == assignee_id:
                is_assigned_employee = True
            elif not emp:
                is_assigned_employee = True

        if not (is_admin or is_assigned_employee):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the admin or the assigned employee can send an official reply. "
                    "Use the /suggestions endpoint to post an internal comment."
                ),
            )
    # ─────────────────────────────────────────────────────────────────────────

    reply = TicketReply(
        ticket_id=ticket_id,
        author_email=reply_data.author_email,
        author_name=reply_data.author_name,
        content=reply_data.content,
        is_employee_reply=reply_data.is_employee_reply,
    )
    db.add(reply)

    # Update ticket status
    if reply_data.is_employee_reply:
        if ticket.status in ["Assigned", "New"]:
            ticket.status = "In Progress"
        _add_timeline(db, ticket_id, "reply", f"Employee reply from {reply_data.author_name}", actor=reply_data.author_name)
        _send_notification(
            db, ticket_id, ticket.user_email,
            f"[Reply] {ticket.title}",
            f"You have a new reply from {reply_data.author_name}:\n\n{reply_data.content}",
            "reply"
        )
    else:
        _add_timeline(db, ticket_id, "reply", f"User reply from {reply_data.author_name}", actor=reply_data.author_email)

    db.commit()
    db.refresh(reply)
    manager.notify({"type": "tickets_updated"})
    return reply


@router.get("/{ticket_id}/replies", response_model=List[ReplyResponse])
def get_replies(
    ticket_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Get all replies for a ticket with pagination."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == "user" and (ticket.user_email or "").lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="You can only view replies for your own tickets")

    return (
        db.query(TicketReply)
        .filter(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ─── Suggestion Endpoints (fellow-employee internal comments) ────────

@router.post("/{ticket_id}/suggestions", response_model=SuggestionResponse)
def create_suggestion(
    ticket_id: int,
    suggestion_data: SuggestionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Add an internal suggestion/comment by a fellow employee (non-assigned).

    Suggestions are stored as internal TicketNotes (note_type='suggestion').
    They are visible to admins and all employees, but NOT sent to the user.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    note = TicketNote(
        ticket_id=ticket_id,
        author=suggestion_data.author_name,
        author_email=suggestion_data.author_email,
        content=suggestion_data.content,
        is_internal=True,
        note_type="suggestion",
    )
    db.add(note)

    _add_timeline(
        db, ticket_id, "suggestion",
        f"Suggestion from {suggestion_data.author_name}",
        actor=suggestion_data.author_email,
    )

    db.commit()
    db.refresh(note)
    manager.notify({"type": "tickets_updated"})
    return note


@router.get("/{ticket_id}/suggestions", response_model=List[SuggestionResponse])
def get_suggestions(
    ticket_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Get all suggestions (internal employee comments) for a ticket with pagination. Staff only."""
    return (
        db.query(TicketNote)
        .filter(
            TicketNote.ticket_id == ticket_id,
            TicketNote.note_type == "suggestion",
        )
        .order_by(TicketNote.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )



@router.patch("/{ticket_id}/replies/{reply_id}/feedback")
async def reply_feedback(
    ticket_id: int,
    reply_id: int,
    feedback: ReplyFeedback,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """User provides feedback on an employee reply."""
    reply = db.query(TicketReply).filter(
        TicketReply.id == reply_id,
        TicketReply.ticket_id == ticket_id
    ).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    reply.feedback_helpful = feedback.is_helpful
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    _add_timeline(
        db, ticket_id, "reply_feedback",
        f"User feedback on reply: {'Satisfied ✓' if feedback.is_helpful else 'Not satisfied ✗'}",
        actor=ticket.user_email if ticket else "User"
    )

    if feedback.is_helpful:
        # Mark ticket as resolved
        if ticket and ticket.status not in ["Resolved", "Closed"]:
            ticket.status = "Resolved"
            ticket.resolved_at = datetime.now(timezone.utc)
            if ticket.assignee_id:
                emp = db.get(Employee, ticket.assignee_id)
                if emp and emp.current_ticket_load > 0:
                    emp.current_ticket_load -= 1
            _add_timeline(db, ticket_id, "resolved", "Ticket resolved — user satisfied with reply", actor="System")
    else:
        # Reassign to different employee using AI query analysis
        if ticket:
            old_assignee_id = ticket.assignee_id
            department = ticket.department or "IT"
            excluded_ids = _get_ticket_assignee_history(db, ticket)
            alt = await find_alternative_assignee(
                db=db,
                department=department,
                exclude_employee_ids=excluded_ids,
                ticket_title=ticket.title or "",
                ticket_desc=ticket.description or "",
                category=ticket.category or ""
            )
            if alt["employee_id"]:
                if old_assignee_id:
                    old_emp = db.get(Employee, old_assignee_id)
                    if old_emp and old_emp.current_ticket_load > 0:
                        old_emp.current_ticket_load -= 1
                ticket.assignee_id = alt["employee_id"]
                ticket.department = alt.get("department", department)
                ticket.status = "Assigned"
                ticket.assigned_at = datetime.now(timezone.utc)
                new_emp = db.get(Employee, alt["employee_id"])
                if new_emp:
                    new_emp.current_ticket_load += 1
                _add_timeline(
                    db, ticket_id, "reassigned",
                    f"Reassigned to {alt['employee_name']} — {alt['reason']}",
                    old_value=str(old_assignee_id or ""),
                    new_value=str(alt["employee_id"]),
                    actor="AI Escalation Engine"
                )

    db.commit()
    manager.notify({"type": "tickets_updated"})
    return {"message": "Feedback recorded", "is_helpful": feedback.is_helpful}


@router.post("/{ticket_id}/generate-reply")
async def generate_reply_for_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Generate an AI draft reply for support employees to respond to a ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    replies_summary = "\n".join([f"{r.author_name}: {r.content}" for r in (ticket.replies or [])])
    from ai_service import generate_ai_reply_draft

    draft = await generate_ai_reply_draft(
        title=ticket.title,
        description=ticket.description,
        category=ticket.category or "General",
        severity=ticket.severity or "Medium",
        replies_summary=replies_summary,
    )
    return {"draft": draft}


@router.post("/reset-seed")
async def reset_seed_data(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Clear demo tickets and re-populate with fresh seed ticket data. Admin only."""
    try:
        db.query(TicketReply).delete()
        db.query(TicketNote).delete()
        db.query(TicketTimeline).delete()
        db.query(Notification).delete()
        db.query(Feedback).delete()
        db.query(Ticket).delete()
        db.query(Employee).update({Employee.current_ticket_load: 0})
        db.commit()

        from seed_data import EXAMPLE_TICKETS
        for t_data in EXAMPLE_TICKETS:
            tc = TicketCreate(
                title=t_data["title"],
                description=t_data["description"],
                user_email=t_data["user_email"]
            )
            await create_ticket(tc, db, current_user=current_user)

        return {"message": "Demo data reset successfully", "ticket_count": len(EXAMPLE_TICKETS)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset seed data: {str(e)}")
