# 🤖 ResolvAI — Smart AI Ticketing & Autonomous Helpdesk System

> **ResolvAI** is an enterprise-grade AI internal ticketing platform. It uses Large Language Models (LLM) to read incoming tickets, classify severity and sentiment, auto-resolve common inquiries, route complex issues to the best-suited employees based on skill tags and workload, track SLAs with real-time countdown badges, and notify teams via Slack. Ships production-ready: JWT authentication, role-based access control, rate limiting, and one-click Render + PostgreSQL deployment.

---

## 🏛️ Architecture

```
                                  +---------------------------------------+
                                  |         Web Frontend (React 18)       |
                                  | (Landing, User Portal, Admin Dashboard|
                                  |     Settings Modal, Google OAuth)     |
                                  +-------------------+-------------------+
                                                      |
                                          HTTP REST / WebSocket
                                                      |
                                                      v
                                  +---------------------------------------+
                                   |         Backend API (FastAPI)         |
                                   |  (Routers: Auth, Tickets, Employees,  |
                                   |   Analytics, Settings — JWT + RBAC)   |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +-----------------------+
                     |                                                                  |
                     v                                                                  v
    +---------------------------------+                               +----------------------------------+
    |         AI Engine Layer         |                               |     Routing & SLA Logic        |
    |  - Groq LLaMA 3.3 70B LLM       |                               |  - Department Category Mapping   |
    |  - Auto-Resolution Engine       |                               |  - Skill Tag Match & Load Balancing|
    |  - AI Smart Reply Assistant     |                               |  - SLA Status & Escalation Timers|
    |  - Offline Keyword Fallback     |                               +----------------+-----------------+
    +----------------+----------------+                                                |
                     |                                                                 |
                     v                                                                 v
    +---------------------------------+                               +----------------------------------+
    |  Settings & Database Layer      |                               |      External Dispatches         |
    |  - SQLite (dev) / PostgreSQL    |                               |  - Real-time WebSockets (`/ws`)  |
    |  - SystemSetting key-value DB   |                               |  - Slack Webhook Cards           |
    +---------------------------------+                               +----------------------------------+
```

---

## 🔄 User, Employee & Admin System Workflows

### 👤 1. End-User Flow (Ticket Creator / Customer)

```mermaid
graph TD
    A[User Visits ResolvAI] --> B[Sign in via Email/Pwd or Google OAuth]
    B --> C[Open User Portal]
    C --> D[Submit Ticket Title & Natural Language Description]
    D --> E[AI Evaluates Category, Severity & User Sentiment]
    E --> F{Is Ticket Eligible for AI Auto-Resolution?}
    F -- Yes --> G[Display Instant Step-by-Step AI Solution]
    G --> H[User Submits Feedback: Helpful / Unhelpful]
    H -- Unhelpful --> I[Escalate & Re-assign to Senior Human Support Engineer]
    F -- No --> J[Routing Engine Assigns Ticket to Department & Employee]
    J --> K[User Tracks Status & SLA in 'My Tickets']
    K --> L[Receive Live Agent Replies & WebSockets Notifications]
```

**Step-by-step User Experience**:
1. **Authentication**: Sign in using Email/Password, **Google OAuth ("Continue with Google")**, or Demo User quick-login.
2. **Submit Ticket**: Fill in the title and describe the issue in plain text.
3. **Instant AI Analysis**: The LLM automatically extracts category (`Access`, `Billing`, `Server`, `DB`, `HR`, `Bug`, `Feature`), severity rating, and sentiment.
4. **Auto-Resolution Check**: Common requests (password reset steps, leave policies, duplicate billing) receive instant resolution instructions.
5. **Real-time Updates**: Track assigned employee status, active SLA countdowns, and chat directly with support agents.

---

### 👩‍💻 2. Support Employee Flow (Ticket Resolver / Support Agent)

```mermaid
graph TD
    A2[Employee Logs In] --> B2[View Assigned Tickets in Ticket Management List]
    B2 --> C2[Check Real-Time SLA Countdown Badges: Breached / At Risk / On Track]
    C2 --> D2[Open Ticket Detail View]
    D2 --> E2[Inspect AI Triage: Category, Severity, Sentiment & Suggested Steps]
    E2 --> F2[Click '✨ Generate AI Reply' for 1-Click Contextual Draft]
    F2 --> G2[Review, Edit & Send Response to Customer]
    G2 --> H2[Add Internal Staff Notes for Team Collaboration]
    H2 --> I2[Update Ticket Status to In Progress / Resolved / Closed]
```

**Step-by-step Support Employee Experience**:
1. **Work Queue Inspection**: View incoming tickets assigned based on skill matching and current workload.
2. **SLA Countdown & Urgency**: Monitor color-coded **SLA Badges** (`SLA Breached 🚨`, `SLA < 1h ⏱️`, `SLA On Track 💙`).
3. **AI Smart Reply Assistant**: Click **"✨ Generate AI Reply"** to generate an automated draft response powered by Groq LLaMA 3.3.
4. **Customer Communication & Notes**: Publish replies, attach internal team notes, and manage ticket status (`In Progress`, `Pending Info`, `Resolved`, `Closed`).

---

### 🛡️ 3. Admin & System Lead Flow (Management, Settings & Analytics)

```mermaid
graph TD
    A3[System Admin Logs In] --> B3[Access Full System Overview & Control Panel]
    B3 --> C3[Manage Employee Directory: Skills, Workload & Availability]
    C3 --> D3[Configure Web UI Settings: Groq API Key & Slack Webhooks]
    D3 --> E3[Test Slack Alert Card Connection with 1-Click]
    E3 --> F3[Monitor High-Priority & SLA Breached Tickets Across All Departments]
    F3 --> G3[Export Filtered Ticket Dataset via '📥 Export CSV']
    G3 --> H3[View Executive Analytics: Department Load, Category Breakdown & Performance]
    H3 --> I3[1-Click Demo Reset to Restore Test Scenario Tickets]
```

**Step-by-step System Admin Experience**:
1. **Global Oversight**: Track tickets across all departments (Engineering, DevOps, IT, HR, Finance, Legal, Product).
2. **Employee Directory Management**: Add/edit support staff, update skill tags, set availability (`Available`, `Busy`, `On Leave`), and balance ticket workloads.
3. **Web UI Settings & Integrations**: In-browser configuration of Groq API Keys, LLM models, and Slack Webhooks with 1-click connection testing.
4. **Data Reporting & Analytics**: Export filtered tickets into CSV spreadsheets and review Recharts metrics for SLA compliance and department trends.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend Core** | React 18, Vite | SPA with fast hot-reloading & clean modular component architecture |
| **Styling & Icons** | Tailwind CSS 3, Lucide Icons | Modern dark-mode glassmorphic design system |
| **Data Visualization** | Recharts | Interactive department load, category, and sentiment analytics |
| **Backend API** | Python 3.10+, FastAPI | High-performance async REST API framework |
| **Database & ORM** | SQLite (dev) / PostgreSQL (prod), SQLAlchemy | Zero-config SQLite locally; managed PostgreSQL in production via `DATABASE_URL` |
| **AI / LLM Engine** | Groq (`llama-3.3-70b-versatile`) | Ultra-fast LLM inference with smart offline fallback mode |
| **Real-time Engine** | WebSockets (`/ws`) | Live updates for tickets, chat replies, and system notifications |
| **Notifications** | Slack Incoming Webhooks | Rich alert cards dispatched on urgent tickets or SLA escalations |
| **Auth & Identity** | JWT (HS256) + bcrypt, Google OAuth | Server-signed tokens (24 h expiry), bcrypt-hashed passwords, role-based access control (`admin` / `employee` / `user`) |
| **API Protection** | slowapi | Per-IP rate limiting: 100 req/min global, 10 req/min on the login endpoint |

---

## ⚡ Quick Start & Setup

### Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18.x` or higher
- **npm**: `9.x` or higher

### 1. Backend Setup

```bash
# Navigate to backend directory
cd ai-ticketing-system/backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment variables sample and set a strong SECRET_KEY
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"   # paste output into SECRET_KEY

# Start FastAPI dev server with auto-reload
uvicorn main:app --reload --port 8000
```
> 💡 *Note: The backend auto-creates database tables, registers system settings, seeds 15 employee directory records, and creates the bcrypt-hashed demo user accounts on first startup.*

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd ai-ticketing-system/frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
> Open **http://localhost:5173** in your browser.

---

## ⚙️ Configuration & Web UI Settings

You can configure integrations in **two ways**:

1. **Via Web UI (Recommended)**: Click **"⚙️ Integrations & AI"** in the sidebar. Enter your Groq API key or Slack Webhook URL directly from your browser. Settings are saved securely to SQLite.
2. **Via `.env` Files**:
   - **Backend (`ai-ticketing-system/backend/.env`)**:
     ```env
     SECRET_KEY=change-me-to-a-long-random-string   # REQUIRED in production
     ACCESS_TOKEN_EXPIRE_MINUTES=1440               # JWT expiry (24 h)
     ALLOWED_ORIGINS=http://localhost:5173          # CORS allow-list
     GROQ_API_KEY=gsk_your_groq_api_key_here
     SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T000/B000/XXXXX
     ```
   - **Frontend (`ai-ticketing-system/frontend/.env`)**:
     ```env
     VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```

---

## 🔐 Security & Production Readiness

| Control | Implementation |
|---|---|
| **Authentication** | Server-signed JWTs (HS256, `python-jose`); 24 h expiry via `ACCESS_TOKEN_EXPIRE_MINUTES` |
| **Password Storage** | bcrypt hashing (`backend/auth_utils.py`) — never stored or logged in plaintext |
| **Authorization** | Role-based access control on every endpoint (`require_admin`, `require_employee_or_admin`, `require_auth`); end-users can only read & create their own tickets |
| **Rate Limiting** | slowapi — 100 req/min per IP globally, 10 req/min on the login endpoint |
| **CORS** | Environment-scoped via `ALLOWED_ORIGINS`; localhost-only fallback in dev |
| **Secrets Hygiene** | Groq keys & Slack webhooks masked in API responses; settings endpoints are admin-only |
| **Deployment** | One-click Render blueprint (`render.yaml`) with managed PostgreSQL; `SECRET_KEY` set manually in the dashboard; Swagger UI disabled when `ENVIRONMENT=production` |

### Demo Accounts (seeded on startup, bcrypt-hashed in DB)

| Email | Password | Role |
|---|---|---|
| `admin@gmail.com` | `admin123` | admin |
| `employee@company.com` | `employee123` | employee |
| `user@gmail.com` | `user123` | user |

> ⚠️ For a real deployment: change these passwords immediately (or remove `_seed_demo_users()` from `main.py`) and set a strong `SECRET_KEY`.

### Deploying to Render

1. Push this repo to GitHub and create a **Blueprint** from `render.yaml`.
2. Render provisions the FastAPI backend, the React static frontend, and a **managed PostgreSQL** database.
3. In the Render dashboard set `SECRET_KEY` (generate with `python -c "import secrets; print(secrets.token_hex(32))"`), `GROQ_API_KEY`, and `ALLOWED_ORIGINS` (your frontend URL, e.g. `https://ai-ticketing-frontend.onrender.com`).

---

## 📡 Complete API Endpoints Documentation

Swagger Interactive API Docs: `http://localhost:8000/docs`

All endpoints require an `Authorization: Bearer <JWT>` header unless marked 🔓. Role legend: 🔓 public · 👤 any authenticated user · 👩‍💻 employee/admin · 🛡️ admin only.

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | 🔓 Exchange email + password for a signed JWT (rate-limited: 10 req/min) |
| `POST` | `/api/auth/register` | 🔓 Self-register an end-user account (role is always `user`) |
| `GET` | `/api/auth/me` | 👤 Get current user's profile |
| `PUT` | `/api/auth/me/password` | 👤 Change own password |

### 🎟️ Tickets (`/api/tickets`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets/` | 👤 Create a new ticket (triggers AI analysis, auto-resolution check, & routing) |
| `GET` | `/api/tickets/` | 👤 List tickets with filters (`status`, `department`, `severity`, `category`, `sla_status`, `search`) — end-users only see their own |
| `GET` | `/api/tickets/{id}` | 👤 Get detailed ticket object with replies, notes, SLA status, and timeline |
| `PATCH` | `/api/tickets/{id}/status` | 👩‍💻 Update ticket status (`New`, `Assigned`, `In Progress`, `Pending Info`, `Resolved`, `Closed`) |
| `POST` | `/api/tickets/{id}/notes` | 👩‍💻 Add internal employee note to a ticket |
| `POST` | `/api/tickets/{id}/replies` | 👤 Post reply — official replies restricted to admin or the assigned employee |
| `POST` | `/api/tickets/{id}/generate-reply` | 👩‍💻 ✨ Generate AI draft reply using Groq LLM |
| `GET` | `/api/tickets/{id}/timeline` | 👤 Fetch activity timeline events |
| `POST` | `/api/tickets/{id}/feedback` | 👤 Submit user satisfaction feedback (`Helpful` / `Unhelpful`) |
| `POST` | `/api/tickets/{id}/escalate` | 🛡️ Escalate ticket severity & trigger urgent Slack notification |
| `POST` | `/api/tickets/check-escalations` | 🛡️ System timer check for overdue tickets |
| `POST` | `/api/tickets/reset-seed` | 🛡️ 🔄 1-Click reset database back to initial seed dataset |

### ⚙️ System Settings (`/api/settings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings/` | 🛡️ Fetch current system settings (secrets masked) |
| `POST` | `/api/settings/` | 🛡️ Save Groq API key, model choice, or Slack webhook URL |
| `POST` | `/api/settings/test-slack` | 🛡️ 🧪 Send test alert card to configured Slack channel |

### 👥 Employees (`/api/employees`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees/` | 👩‍💻 List employee directory with skill tags & current ticket workloads |
| `POST` | `/api/employees/` | 🛡️ Register new employee |
| `PUT` | `/api/employees/{id}` | 🛡️ Update employee details, skills, or availability |
| `DELETE` | `/api/employees/{id}` | 🛡️ Deactivate employee |

### 📊 Analytics (`/api/analytics`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview` | 👩‍💻 Executive KPI stats (total tickets, auto-resolved %, SLA compliance, resolution time) |
| `GET` | `/api/analytics/department-load` | 👩‍💻 Department ticket distribution for charts |
| `GET` | `/api/analytics/top-categories` | 👩‍💻 Top 5 ticket category breakdown |

### 🔌 WebSockets (`/ws`)
| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/ws` | Real-time WebSocket connection for live ticket updates and notifications |

---

## 🧪 Example Test Tickets

The system includes 10 pre-built test ticket scenarios (`backend/seed_data.py`):

1. **Password reset request** → *Auto-Resolved by AI*
2. **Server is completely down — URGENT** → *Assigned to DevOps (Critical Severity)*
3. **Database query taking too long** → *Assigned to Engineering (Critical Severity)*
4. **Leave policy inquiry** → *Auto-Resolved by AI*
5. **Billing discrepancy** → *Auto-Resolved by AI*
6. **Feature request: Dark mode** → *Assigned to Product*
7. **Access permissions after role change** → *Assigned to IT Support (High Severity)*
8. **Payroll calculation error** → *Assigned to Finance*
9. **Application crash on CSV export** → *Assigned to Engineering*
10. **Compliance review needed** → *Assigned to Legal*

---

## 🚀 Key Modules & Feature Walkthrough

### 1. 🔑 Authentication — JWT, RBAC & Google OAuth
Email/password login issues **server-signed JWTs** (bcrypt-hashed passwords, 24 h expiry). Every API endpoint enforces **role-based access control** (`admin` / `employee` / `user`), end-users only see their own tickets, the login endpoint is rate-limited, and **Google OAuth** plus quick demo logins are supported.

![Google OAuth & Login Interface](https://github.com/user-attachments/assets/73211743-dbb5-46fd-8b92-194c2a90b8a6)

### 2. 🌐 Landing Page & Interactive AI Demo Modal
Features a landing page highlighting AI automation capabilities and an interactive **Live AI Processing Simulation Modal**.

### 3. ✍️ Ticket Intake & AI Triage (User Portal)
Users submit issues in natural language. The AI immediately analyzes category, severity (`Critical`, `High`, `Medium`, `Low`), sentiment (`Frustrated`, `Polite`, `Neutral`), and confidence score.

![AI Ticket Analysis](https://github.com/user-attachments/assets/886c7ee7-b181-4e05-be1f-872876fea964)

### 4. ⚡ Auto-Resolution Engine
For standard requests (password resets, leave policy FAQs, billing double-charges), the AI provides instant resolution steps with a user feedback loop (`Helpful` / `Unhelpful`).

![Auto-Resolution Engine](https://github.com/user-attachments/assets/cbcf8b69-b60b-4006-9da8-88fa5e5641f3)

### 5. 🔀 Intelligent Department & Employee Routing
Complex issues are routed to departments (Engineering, DevOps, IT, HR, Finance, Legal, Product) and assigned to employees based on **skill tags**, **current ticket workload**, and **availability**.

![Employee Matching & Directory](https://github.com/user-attachments/assets/4a12e923-d59b-463a-967c-bcc652c4e718)
![Assignee Selection](https://github.com/user-attachments/assets/6ed46927-e18c-4d67-ae8c-a8d806f4b218)

### 6. ⏱️ SLA Countdown & Status Badges
Tracks strict Service Level Agreements based on severity:
- `Critical`: 2 Hours
- `High`: 6 Hours
- `Medium`: 24 Hours
- `Low`: 48 Hours
Visual badges highlight tickets as **`SLA Met ✓`**, **`SLA On Track 💙`**, **`SLA < 1h ⏱️`**, or **`SLA Breached 🚨`**.

### 7. ✨ AI Smart Reply Assistant
Support agents can click **"✨ Generate AI Reply"** on any ticket detail page. The Groq LLM reads conversation context and crafts a professional draft response.

### 8. ⚙️ Web UI Settings & Integration Manager
In-browser modal to manage Groq API Keys, select LLM models, configure Slack Webhooks, test connections, or reset demo seed data.

### 9. 📥 CSV Ticket Export
Download filtered ticket datasets into formatted `.csv` spreadsheets with 1-click.

### 10. 📊 Executive Analytics Dashboard
Visualizes ticket volume trends, department workloads, category distributions, and SLA metrics via Recharts.

![Analytics Dashboard](https://github.com/user-attachments/assets/a538e275-6534-472d-9f12-402662606025)

---

## 📂 Project Structure

```
ai-ticketing-system/
├── backend/
│   ├── main.py                 # FastAPI application & WebSocket server
│   ├── auth_utils.py           # JWT + bcrypt utilities & RBAC dependencies
│   ├── limiter.py              # slowapi rate-limit configuration
│   ├── database.py              # SQLAlchemy engine (SQLite/PostgreSQL) & Session
│   ├── models.py                # ORM Database Models (User, Ticket, Employee, SystemSetting, etc.)
│   ├── schemas.py               # Pydantic validation schemas
│   ├── ai_service.py            # Groq LLM integration + Smart Offline Engine
│   ├── routing_engine.py        # Rule-based department classification
│   ├── assignee_engine.py       # Skill-matching & load-balancing algorithm
│   ├── seed_data.py             # 15 seed employees & 10 demo scenario tickets
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Sample environment configuration
│   └── routers/
│       ├── auth.py             # Login, registration, profile & password endpoints
│       ├── tickets.py           # Ticket CRUD, SLA tracking, AI reply & seed reset
│       ├── settings.py          # System settings & Slack webhook verification
│       ├── employees.py         # Employee directory CRUD
│       └── analytics.py         # Dashboard analytics & charts
├── frontend/
│   ├── package.json             # React dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS theme tokens
│   ├── index.html               # Entry HTML
│   └── src/
│       ├── main.jsx             # React DOM root
│       ├── App.jsx              # Navigation sidebar, router & layout
│       ├── api.js               # Centralized REST API client
│       ├── index.css            # Custom CSS & glassmorphic design system
│       ├── components/
│       │   ├── SettingsModal.jsx      # Web UI Integrations & Settings modal
│       │   ├── DemoOverlayModal.jsx   # Interactive AI processing demo overlay
│       │   ├── LandingCarousel.jsx    # Hero feature carousel
│       │   ├── ResolvAiLogo.jsx       # SVG Brand Logo
│       │   └── TicketFlowGraph.jsx    # Interactive lifecycle graph
│       └── pages/
│           ├── LandingPage.jsx        # Public landing & feature showcase
│           ├── LoginPage.jsx          # Auth, Google OAuth & Demo Quick-Logins
│           ├── UserPortal.jsx         # User ticket submission & intake
│           ├── MyTickets.jsx          # End-user ticket tracking
│           ├── TicketList.jsx         # Support Agent / Admin ticket management & CSV export
│           ├── TicketDetail.jsx       # Ticket conversation, AI Smart Reply & notes
│           ├── EmployeeDirectory.jsx  # Employee directory & workload manager
│           └── Analytics.jsx          # Recharts executive analytics dashboard
└── README.md
```

---

## ⚠️ Known Limitations

1. **WebSocket endpoint (`/ws`)**: accepts unauthenticated connections but only echoes acknowledgements — no ticket data is exposed. Token-gate it before shipping real-time updates.
2. **Demo accounts**: seeded on every startup for quick evaluation. Remove `_seed_demo_users()` from `main.py` and rotate the admin password for real deployments.
3. **Groq Rate Limits**: Groq's free tier has rate limits; the built-in offline engine handles rate limit fallbacks seamlessly without breaking requests.

---

## 🔮 Future Improvements

1. 🧠 **Vector DB & RAG (Retrieval-Augmented Generation)**:
   - Integrate ChromaDB or FAISS vector database to store embeddings of all resolved tickets and internal documentation.
   - Enables semantic similarity search so the AI learns from past human resolutions to answer complex technical queries automatically.
2. 🔐 **Enterprise Single Sign-On (SSO)**:
   - SAML 2.0 / OpenID Connect integration for Okta, Azure AD, and Google Workspace.
3. ⚡ **Redis Caching & Background Workers**:
   - Redis-backed rate limiting, sessions, and Celery workers for SLA timers and email dispatch at high concurrency.
4. 📧 **Inbound Email Ingestion Gateway**:
   - Parse incoming support emails (`support@company.com`) via IMAP/SendGrid Webhooks directly into AI tickets.

---

Made with ❤️ by Aditya Singh
