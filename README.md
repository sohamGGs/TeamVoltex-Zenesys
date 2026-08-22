# ProcureIQ

**Autonomous Enterprise Procurement System** — built for Zenesys 2026 by **Team Voltex**.

Addresses **Problem Statement 1: Intelligent Purchase Management** — streamlining
procurement from purchase request to purchase order by identifying suitable
vendors, comparing purchasing options, tracking vendor performance, and
automating approval and follow-up actions.

---

## What Makes This Autonomous

Most procurement tools just digitize paperwork — a human still makes every
real decision. ProcureIQ actually acts on its own in two places:

1. **Autonomous Multi-Agent Negotiation** — an AI Buyer Agent and Vendor
   Agents (built with LangGraph) negotiate price and delivery terms over
   several rounds and settle on better terms than the original quotes,
   with no human back-and-forth required.
2. **RAG-Powered Compliance Guard** — every purchase request is checked
   against real procurement policy the instant it's created, using
   Retrieval-Augmented Generation (ChromaDB + Gemini) grounded in actual
   policy text to avoid hallucinated violations.

## Core Features

- Weighted vendor scoring engine (price, delivery speed, reliability,
  historical performance — 100-point composite score)
- Deterministic approval routing based on budget, urgency, and department
- AI procurement auditor (Gemini 2.5 Flash) giving a reasoned vendor
  recommendation with a confidence score
- Automated Purchase Order generation (ReportLab PDF)
- PO lifecycle tracking: Sent → Acknowledged → Delivered (3-way match)

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| Auth | OAuth2 + JWT (python-jose), bcrypt |
| AI / LLM | Google Gemini 2.5 Flash |
| Agent orchestration | LangGraph |
| RAG | ChromaDB + sentence-transformers (all-MiniLM-L6-v2) |
| PDF generation | ReportLab |
| Frontend | React 18 (Vite), Tailwind CSS, Recharts, Axios |

## AI Tools Disclosure

Per Zenesys hackathon rules, AI tools used during the 8-hour build:
- **Google Gemini 2.5 Flash** — powers the procurement AI auditor, the
  autonomous negotiation agents, and the RAG compliance checker.
- **Antigravity IDE (agent-assisted development)** — used to scaffold
  and write application code during the sprint.

## Team Voltex

Built during the Zenesys 2026 hackathon (GHRCEM Pune, Comet Club × Suitepedia).

## Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run dev
```