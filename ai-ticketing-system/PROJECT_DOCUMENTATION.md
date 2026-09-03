# ResolvAI — Complete System Documentation & Architecture Guide

## 1. Project Overview

**ResolvAI** is a smart, automated support ticketing system. It helps organizations streamline customer inquiries, automate repetitive troubleshooting tasks, prevent employee burnout via dynamic workload balancing, and facilitate live real-time communication between customers and support staff.

---

## 2. Core Architecture

The system follows a modular client-server architecture:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 18 + Vite)               │
│   • Support Portal (Customer)                          │
│   • Staff Workspace (Support Employee)                 │
│   • Admin Console (Management & Directory)             │
│   • WebSocket Client (Live Chat Bus)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST / WebSocket
┌──────────────────────────▼─────────────────────────────┐
│               Backend (FastAPI & Python)               │
│   • Auth & RBAC (JWT & Google OAuth)                   │
│   • Automated Triage & Category Classification         │
│   • Hybrid Knowledge Base (Vector + BM25 RAG)          │
│   • Workload & Skill Graph Balancer                    │
│   • Real-Time Connection Manager (WebSockets)          │
│   • Background SLA Sweep Engine                        │
└──────────────────────────┬─────────────────────────────┘
                           │ SQLAlchemy ORM
┌──────────────────────────▼─────────────────────────────┐
│                 Database (SQLite / PostgreSQL)         │
│   • Tickets, Employees, Comments, Knowledge Articles   │
└────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Workspaces

ResolvAI defines 3 distinct operational roles:

### 3.1 Customer (Support Portal)
- **Path:** `/`
- **Capabilities:**
  - Submit new support tickets with descriptions, category selections, and file/image attachments.
  - View real-time ticket progress (New → Assigned → In Progress → Resolved → Closed).
  - Participate in live chat threads with assigned support staff.
  - Provide single-click resolution satisfaction feedback.

### 3.2 Support Employee (Staff Workspace)
- **Path:** `/employee-dashboard`
- **Capabilities:**
  - View personal queue of assigned tickets.
  - Access AI-suggested draft responses matched against company SOPs.
  - Leave internal employee-only collaboration notes on tickets.
  - Update ticket statuses (`In Progress`, `Pending Info`, `Resolved`).
  - Request re-routing or escalation when required.

### 3.3 Administrator (Admin Console)
- **Path:** `/tickets`, `/employees`, `/analytics`, `/knowledge`
- **Capabilities:**
  - Complete visibility over all organizational tickets.
  - Employee directory management (skills, active workload, department).
  - Knowledge base management (add, edit, delete verified runbooks/SOPs).
  - Analytics dashboard (ticket volume, MTTR, category distributions, SLA compliance).
  - Manual ticket assignment, status overrides, and system settings.

---

## 4. Automated Ticket Processing Pipeline

Every incoming ticket passes through the following steps:

1. **Intake & Sanitization**:
   - The ticket subject and description are received.
   - PII and sensitive credentials (credit cards, passwords, API tokens) are detected and masked before processing.
2. **Category & Urgency Classification**:
   - Analyzes intent to categorize into: `Access`, `Billing`, `Server`, `HR`, or `General`.
   - Assigns priority (`Low`, `Medium`, `High`, `Critical`).
3. **Knowledge Base Retrieval (RAG)**:
   - Queries verified company documentation and runbooks.
   - If a matching SOP is found, an instant response suggestion is generated.
4. **Workload-Based Assignment**:
   - If human assistance is needed, the system inspects active employees.
   - Evaluates department alignment, required skill tags, and current active open tickets.
   - Assigns the ticket to the eligible employee with the lowest current workload.
5. **Real-Time Collaboration**:
   - A dedicated WebSocket channel opens (`/ws/{ticket_id}`).
   - User and agent can chat in real time until the issue is confirmed resolved.

---

## 5. API Endpoints Reference

### Authentication
- `POST /api/auth/login`: Authenticate with email/password; returns JWT access token.
- `POST /api/auth/register`: Create a customer account.
- `POST /api/auth/google`: Authenticate via Google OAuth token.

### Tickets
- `GET /api/tickets`: List tickets with optional status, category, or search filters.
- `POST /api/tickets`: Create a new ticket (triggers automated triage).
- `GET /api/tickets/{id}`: Retrieve full ticket details including timeline.
- `PATCH /api/tickets/{id}/status`: Update ticket status (Admin/Employee only).
- `POST /api/tickets/{id}/comments`: Post a comment or chat message.
- `POST /api/tickets/{id}/satisfaction`: Record customer satisfaction rating.

### Employees & Workload
- `GET /api/employees`: List all employees with department, skill tags, and active ticket counts.
- `POST /api/employees`: Add an employee (Admin only).
- `PATCH /api/employees/{id}`: Update employee details or availability status.

### Knowledge Base & Analytics
- `GET /api/knowledge/articles`: List all indexed SOP articles.
- `POST /api/knowledge/articles`: Create and index a new documentation article.
- `GET /api/analytics/overview`: High-level metrics (open count, resolved count, MTTR, SLA compliance).

---

## 6. Local Setup & Execution

### Backend
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API runs at: `http://127.0.0.1:8000`
- Interactive Swagger docs at: `http://127.0.0.1:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web application runs at: `http://localhost:5173`

---

## 7. Demo Credentials

Quick login buttons are available on the landing page and login modal:

| Role | Email | Password |
|---|---|---|
| **End User** | `user@gmail.com` | `user123` |
| **Employee** | `employee@company.com` | `employee123` |
| **Admin** | `admin@gmail.com` | `admin123` |
