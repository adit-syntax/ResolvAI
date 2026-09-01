"""
Employee API Router — Module 4
Employee directory CRUD and management.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone

from database import get_db
from models import Employee, Ticket, TicketTimeline
from schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    ActiveTicketInfo, EmployeeAvailabilityUpdate
)
from assignee_engine import find_alternative_assignee
from auth_utils import require_admin, require_employee_or_admin

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees"],
    dependencies=[Depends(require_employee_or_admin)],
)

# Open statuses — tickets that still need active support
OPEN_STATUSES = ["New", "Assigned", "In Progress", "Pending Info"]


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


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    department: Optional[str] = None,
    availability: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """List employees with optional filters. Requires employee or admin."""
    query = db.query(Employee)
    if active_only:
        query = query.filter(Employee.is_active == True)
    if department:
        query = query.filter(Employee.department == department)
    if availability:
        query = query.filter(Employee.availability == availability)
    return query.order_by(Employee.name).all()


@router.get("/active-tickets", response_model=List[ActiveTicketInfo])
def get_active_tickets(db: Session = Depends(get_db), current_user=Depends(require_employee_or_admin)):
    """
    Return active ticket assignments for all employees.
    Active = status in (Assigned, In Progress, Pending Info).
    Returns the most recent active ticket per employee.
    """
    active_statuses = ["Assigned", "In Progress", "Pending Info"]
    rows = (
        db.query(Ticket, Employee)
        .join(Employee, Ticket.assignee_id == Employee.id)
        .filter(Ticket.status.in_(active_statuses))
        .order_by(desc(Ticket.created_at))
        .all()
    )

    results = []
    seen_employees = set()
    for ticket, employee in rows:
        if employee.id not in seen_employees:
            seen_employees.add(employee.id)
            results.append(ActiveTicketInfo(
                employee_id=employee.id,
                employee_name=employee.name,
                ticket_id=ticket.id,
                ticket_title=ticket.title,
                ticket_category=ticket.category,
            ))

    return results


@router.get("/me/dashboard")
def get_my_employee_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """
    Get personal employee dashboard:
    - Current employee profile
    - Active / live assigned tickets
    - Past / resolved assigned tickets
    - Personal performance analytics (load, resolution rate, severity breakdown, SLA stats)
    - Department queue for peer collaboration & suggestions
    """
    emp = None
    if current_user.employee_id:
        emp = db.get(Employee, current_user.employee_id)
    if not emp:
        emp = db.query(Employee).filter(Employee.email.ilike(current_user.email)).first()
    if not emp and current_user.role == "admin":
        emp = db.query(Employee).first()
    if not emp:
        # Fallback if logged in as general demo employee account
        emp = db.query(Employee).filter(Employee.is_active == True).first()

    emp_id = emp.id if emp else None

    # Fetch all tickets assigned to this employee
    all_assigned = (
        db.query(Ticket)
        .filter(Ticket.assignee_id == emp_id)
        .order_by(desc(Ticket.created_at))
        .all()
        if emp_id
        else []
    )

    active_statuses = ["New", "Assigned", "In Progress", "Pending Info"]
    live_tickets = [t for t in all_assigned if t.status in active_statuses]
    past_tickets = [t for t in all_assigned if t.status in ["Resolved", "Closed"]]

    # Department queue (other open tickets in department for peer comments & suggestions)
    dept_tickets = []
    if emp and emp.department:
        dept_tickets = (
            db.query(Ticket)
            .filter(
                Ticket.department == emp.department,
                Ticket.assignee_id != emp_id,
                Ticket.status.in_(active_statuses)
            )
            .order_by(desc(Ticket.created_at))
            .limit(10)
            .all()
        )

    # Calculate metrics
    total_count = len(all_assigned)
    resolved_count = len(past_tickets)
    active_count = len(live_tickets)
    resolution_rate = round((resolved_count / total_count * 100), 1) if total_count > 0 else 100.0

    # Severity distribution
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    category_counts = {}
    for t in all_assigned:
        cat = t.category or "Other"
        category_counts[cat] = category_counts.get(cat, 0) + 1

    for t in live_tickets:
        sev = t.severity or "Medium"
        if sev in severity_counts:
            severity_counts[sev] += 1
        else:
            severity_counts[sev] = 1

    # Average resolution time for this employee (in hours)
    resolved_with_time = [
        t for t in past_tickets if t.resolved_at and t.created_at
    ]
    avg_hours = emp.avg_resolution_time if emp and emp.avg_resolution_time else 2.5
    if resolved_with_time:
        total_time_h = sum(
            (t.resolved_at - t.created_at).total_seconds() / 3600
            for t in resolved_with_time
        )
        avg_hours = round(total_time_h / len(resolved_with_time), 1)

    from routers.tickets import _format_ticket_response
    formatted_live = [_format_ticket_response(t) for t in live_tickets]
    formatted_past = [_format_ticket_response(t) for t in past_tickets]
    formatted_dept = [_format_ticket_response(t) for t in dept_tickets]

    # SLA breakdown for employee tickets
    sla_counts = {"on_track": 0, "at_risk": 0, "breached": 0, "resolved": 0}
    for t in formatted_live:
        status = t.sla_status or "on_track"
        if status in sla_counts:
            sla_counts[status] += 1
    for t in formatted_past:
        sla_counts["resolved"] += 1

    breached_count = sla_counts["breached"]
    total_evaluated = total_count
    sla_compliance_rate = round(((total_evaluated - breached_count) / total_evaluated * 100), 1) if total_evaluated > 0 else 100.0

    return {
        "employee": EmployeeResponse.model_validate(emp).model_dump() if emp else None,
        "metrics": {
            "total_assigned": total_count,
            "active_tickets": active_count,
            "resolved_tickets": resolved_count,
            "resolution_rate": resolution_rate,
            "avg_resolution_time_hours": avg_hours,
            "current_load": emp.current_ticket_load if emp else active_count,
            "max_capacity": 8,
            "availability": emp.availability if emp else "Available",
            "department": emp.department if emp else "Support",
            "severity_breakdown": severity_counts,
            "category_breakdown": category_counts,
            "sla_breakdown": sla_counts,
            "sla_compliance_rate": sla_compliance_rate,
        },
        "live_tickets": formatted_live,
        "past_tickets": formatted_past,
        "department_queue": formatted_dept,
    }


@router.patch("/me/availability")
def update_my_availability(
    data: EmployeeAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_employee_or_admin),
):
    """Update current employee's availability status (Available, Busy, On Leave)."""
    valid_statuses = ["Available", "Busy", "On Leave"]
    if data.availability not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Availability must be one of: {', '.join(valid_statuses)}")

    emp = None
    if current_user.employee_id:
        emp = db.get(Employee, current_user.employee_id)
    if not emp:
        emp = db.query(Employee).filter(Employee.email.ilike(current_user.email)).first()
    if not emp and current_user.role == "admin":
        emp = db.query(Employee).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.is_active == True).first()

    if not emp:
        raise HTTPException(status_code=404, detail="No matching employee profile found.")

    emp.availability = data.availability
    db.commit()
    db.refresh(emp)

    return {
        "message": f"Availability updated to {emp.availability}",
        "availability": emp.availability,
        "employee_id": emp.id,
    }


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user=Depends(require_employee_or_admin)):
    """Get single employee."""
    emp = db.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("/", response_model=EmployeeResponse)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Add a new employee. Admin only."""
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Update an employee's details. Admin only."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}")
async def deactivate_employee(employee_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """
    Deactivate (soft delete) an employee. Admin only.
    Automatically reassigns any open tickets previously assigned to them.
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_name = emp.name

    # ── Find all open tickets assigned to this employee ──────────────
    open_tickets = (
        db.query(Ticket)
        .filter(
            Ticket.assignee_id == employee_id,
            Ticket.status.in_(OPEN_STATUSES),
        )
        .all()
    )

    reassigned = []
    failed = []

    for ticket in open_tickets:
        # Decrement the departing employee's load
        if emp.current_ticket_load > 0:
            emp.current_ticket_load -= 1

        # Find a replacement — exclude the deactivated employee
        alt = await find_alternative_assignee(
            db=db,
            department=ticket.department or "IT",
            exclude_employee_ids=[employee_id],
            ticket_title=ticket.title or "",
            ticket_desc=ticket.description or "",
            category=ticket.category or "",
        )

        if alt["employee_id"]:
            new_emp = db.get(Employee, alt["employee_id"])

            ticket.assignee_id = alt["employee_id"]
            ticket.assigned_at = datetime.now(timezone.utc)
            # Keep escalated flag if it was already set; mark as Assigned if it was New
            if ticket.status == "New":
                ticket.status = "Assigned"

            if new_emp:
                new_emp.current_ticket_load += 1

            _add_timeline(
                db, ticket.id, "reassigned",
                f"Auto-reassigned from {emp_name} (deactivated) → {alt['employee_name']}. {alt['reason']}",
                old_value=str(employee_id),
                new_value=str(alt["employee_id"]),
                actor="System (Employee Deactivated)",
            )

            reassigned.append({
                "ticket_id": ticket.id,
                "ticket_title": ticket.title,
                "new_assignee": alt["employee_name"],
            })
        else:
            # No alternative found — unassign so an admin can manually reassign
            ticket.assignee_id = None
            ticket.status = "New"

            _add_timeline(
                db, ticket.id, "reassigned",
                f"Assignee {emp_name} was deactivated. No available agent found — ticket returned to queue.",
                old_value=str(employee_id),
                new_value=None,
                actor="System (Employee Deactivated)",
            )

            failed.append({
                "ticket_id": ticket.id,
                "ticket_title": ticket.title,
            })

    # ── Deactivate the employee ───────────────────────────────────────
    emp.is_active = False
    db.commit()

    return {
        "message": f"Employee {emp_name} deactivated",
        "reassigned_tickets": reassigned,
        "unassigned_tickets": failed,
    }


@router.get("/departments/list")
def list_departments(db: Session = Depends(get_db), current_user=Depends(require_employee_or_admin)):
    """Get all unique departments."""
    depts = db.query(Employee.department).distinct().all()
    return [d[0] for d in depts]

