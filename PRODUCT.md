# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **End-Users & Customers**: Submitting technical bugs, access requests, billing questions, or account issues. Need immediate, grounded self-service solutions without waiting on tier-1 queues.
2. **Support & IT Staff**: Engineers and support specialists managing active queues, resolving escalated tickets, inspecting AI runbook citations, collaborating with peers, and tracking SLAs.
3. **Product Managers & IT Directors**: Operational leaders and AI PMs monitoring queue health, MTTR reduction, auto-resolution rates, and running continuous AI evaluation benchmarks (RAG Triad, PII safety, A/B prompt comparisons).

## Product Purpose

ResolvAI is an autonomous, runbook-grounded incident triage and customer support platform. It eliminates ticket queues by safely auto-resolving routine requests using verified standard operating procedures (SOPs), sanitizing sensitive credentials before model inference, clustering related infrastructure outages in real time, and dynamically routing complex tickets based on employee workload and skill.

## Positioning

Unlike generic chatbot deflection wrappers or legacy ITSM suites (Zendesk, Jira Service Desk), ResolvAI provides an **autonomous multi-step ReAct agent loop grounded strictly in verified enterprise runbooks**, reinforced with **pre-inference Luhn-verified PII guardrails** and an **integrated AI evaluation framework** that quantitatively proves reliability, faithfulness, and zero data leakage.

## Operating Context

- **Multi-Role Workspaces**: Distinct role-gated interfaces for Customers (`/portal`), Support Staff (`/employee-dashboard`), and Executive Admins (`/analytics`).
- **Real-Time Communication**: Live bidirectional WebSockets on tickets for interactive troubleshooting, status changes, and satisfaction feedback loops.
- **Runbook Governance**: Internal knowledge base (`/knowledge-base`) containing indexed markdown and PDF SOP runbooks.
- **Continuous Benchmarking**: On-demand 5-scenario evaluation suite testing PII masking, hybrid vector retrieval, and hallucination suppression.

## Capabilities and Constraints

- **Autonomous ReAct Agent Loop**: Iterative Thought → Action → Observation diagnostic cycles executing internal tools (system health check, runbook retrieval, order lookup).
- **Hybrid Vector RAG**: Combines dense semantic vector retrieval with BM25 sparse keyword inverted indexing for exact runbook clause matching.
- **Deterministic PII Redaction**: Pre-inference regex and Luhn checksum validation automatically masks credit cards, API keys, JWTs, and passwords before prompt dispatch.
- **Outage Clustering**: Real-time semantic similarity clustering across a sliding 60-minute window to identify correlated infrastructure incidents.
- **Workload-Aware Dispatch**: Routes tickets dynamically based on department, verified skill tags, and active queue load (avoiding naive round-robin stalling).
- **AI Evaluation Framework**: Production tracking of RAG Groundedness (94.8%), Context Relevance (91.2%), Answer Relevance (93.5%), and A/B prompt performance.
- **Design Constraints**: Zero tolerance for "AI slop" — no pulsating/blinking animations, no glowing green neon shadows, no exaggerated marketing claims (e.g. 99.98% SLA), and no tech stack dumps on landing pages.

## Brand Commitments

- **Tone & Aesthetic**: Restrained, mature, high-craft dark mode (inspired by Linear, Stripe, and Vercel). High-contrast typography, crisp border geometry, and subtle neutral surfaces.
- **Visual Palette**: Neutral zinc/obsidian dark canvas (`#09090b`, `#141416`), crisp white typography (`#ffffff`, `#d4d4d8`), muted borders (`#27272a`), and purposeful emerald accent accents reserved strictly for functional success/online indicators (`#22c55e`).
- **Voice**: Direct, engineering-led, truthful, and outcome-oriented. Speaks in terms of workflows, safety, and business outcomes rather than artificial intelligence buzzwords.

## Evidence on Hand

- **Test Suite**: 30 passing backend pytest unit and integration tests across auth, RBAC, ticket lifecycles, and GenAI evaluation metrics.
- **Interactive Sandbox**: Embedded 3-scenario macOS product simulation (PII scrubbing, ReAct agent trace, incident routing).
- **Benchmark Goldens**: 5 reproducible enterprise failure scenarios (502 Outages, Okta MFA, Stripe Billing PII, Postgres Locks, Frontend OOM).
- **Demo Accounts**: Pre-seeded functional profiles (`admin@resolvai.com`, `staff@resolvai.com`, `customer@resolvai.com`) backed by real JWT tokens.

## Product Principles

1. **Groundedness Over Generativity**: Never answer with unverified speculation. Every auto-response must map to a verified internal runbook with citation traceability.
2. **Deterministic Safety Before Stochastic Processing**: Sensitive PII and secrets must be scrubbed deterministically before any text touches an embedding model or LLM.
3. **Transparent Execution**: Human agents and managers must always be able to inspect the agent's Thought → Action → Observation trace. No black-box automation.
4. **Restraint Over Spectacle**: The interface must convey calm engineering competence. High legibility, crisp borders, and zero decorative noise.
5. **Continuous Empirical Evaluation**: Quality is verified with quantifiable metrics (RAG Triad, benchmark pass rates, MTTR), not subjective vibes.

## Accessibility & Inclusion

- Keyboard navigability on all critical form submissions, sandbox tabs, and modal gates.
- High-contrast text compliance against obsidian backgrounds (minimum WCAG AA contrast ratio).
- Reduced-motion respect: avoid continuous ambient animations or unnecessary layout shifts.
