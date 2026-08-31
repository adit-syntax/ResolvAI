import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import asyncio
from database import SessionLocal, engine, Base
from models import Ticket, Employee, TicketTimeline
from seed_data import seed_employees
from assignee_engine import find_alternative_assignee
from routers.tickets import _get_ticket_assignee_history

Base.metadata.create_all(bind=engine)

def run_test():
    db = SessionLocal()
    try:
        seed_employees(db)
        
        # Test: IT access issue starting with Fiona O'Brien (ID 6)
        ticket = Ticket(
            title="Cannot access shared drive after role change",
            description="I was promoted but still cannot access the IT shared drive folder. Access permissions needed.",
            user_email="dev@company.com",
            department="IT",
            assignee_id=6, # Fiona O'Brien (IT Support Lead)
            category="Access"
        )
        db.add(ticket)
        db.flush()
        
        # Initial timeline record
        db.add(TicketTimeline(ticket_id=ticket.id, event_type="assigned", description="Assigned to Fiona O'Brien", old_value=None, new_value="6", actor="System"))
        db.commit()
        db.refresh(ticket)
        
        print("=== TEST IT ACCESS TICKET MULTI-ESCALATION ===")
        print(f"Initial: Ticket #{ticket.id} in dept '{ticket.department}', assigned to ID {ticket.assignee_id} (Fiona O'Brien)")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Escalation 1
        excluded_1 = _get_ticket_assignee_history(db, ticket)
        print(f"Excluded for Escalation 1: {excluded_1}")
        alt1 = loop.run_until_complete(find_alternative_assignee(
            db, ticket.department, excluded_1, ticket.title, ticket.description, ticket.category
        ))
        print(f"1st Escalation: {alt1['employee_name']} ({alt1['department']})")
        print(f"Reason: {alt1['reason'].encode('ascii', 'ignore').decode()}")
        
        old_id_1 = ticket.assignee_id
        ticket.assignee_id = alt1["employee_id"]
        ticket.department = alt1["department"]
        db.add(TicketTimeline(ticket_id=ticket.id, event_type="escalation", description=alt1["reason"], old_value=str(old_id_1), new_value=str(alt1["employee_id"]), actor="AI Escalation Engine"))
        db.commit()
        db.refresh(ticket)
        
        # Escalation 2
        excluded_2 = _get_ticket_assignee_history(db, ticket)
        print(f"\nExcluded for Escalation 2: {excluded_2}")
        alt2 = loop.run_until_complete(find_alternative_assignee(
            db, ticket.department, excluded_2, ticket.title, ticket.description, ticket.category
        ))
        print(f"2nd Escalation: {alt2['employee_name']} ({alt2['department']})")
        print(f"Reason: {alt2['reason'].encode('ascii', 'ignore').decode()}")
        
        old_id_2 = ticket.assignee_id
        ticket.assignee_id = alt2["employee_id"]
        ticket.department = alt2["department"]
        db.add(TicketTimeline(ticket_id=ticket.id, event_type="escalation", description=alt2["reason"], old_value=str(old_id_2), new_value=str(alt2["employee_id"]), actor="AI Escalation Engine"))
        db.commit()
        db.refresh(ticket)
        
        # Escalation 3
        excluded_3 = _get_ticket_assignee_history(db, ticket)
        print(f"\nExcluded for Escalation 3: {excluded_3}")
        alt3 = loop.run_until_complete(find_alternative_assignee(
            db, ticket.department, excluded_3, ticket.title, ticket.description, ticket.category
        ))
        print(f"3rd Escalation: {alt3['employee_name']} ({alt3['department']})")
        print(f"Reason: {alt3['reason'].encode('ascii', 'ignore').decode()}")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
