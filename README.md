# AtomQuest ⚛️ — Enterprise Performance Management Portal

> **Enterprise-grade goal setting, tracking, and performance review portal** built for organizations that demand clarity, accountability, and measurable outcomes across every level of the hierarchy.

---

# Live Link
**https://atomquest-brown.vercel.app/**

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#-architecture)
- [Feature Checklist (BRD Compliance)](#-feature-checklist--brd-compliance)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Demo Credentials](#-demo-credentials)
- [Module Walkthrough](#-module-walkthrough)
- [Business Rules Enforced](#-business-rules-enforced)
- [Cost Optimisation Strategy](#-cost-optimisation-strategy)
- [Security Considerations](#-security-considerations)

---

## Overview

AtomQuest modernizes how organizations define, track, and evaluate employee objectives — replacing fragmented spreadsheets with a unified, transparent, and dynamic SaaS-grade portal. It implements the complete lifecycle: goal creation → manager approval → quarterly achievement tracking → check-ins → performance analytics, with full role-based access control and administrative oversight.

**Key differentiators:**
- **Strict BRD compliance** — Every business rule from §2.1 through §6.6 is enforced
- **Bonus modules implemented** — Analytics, Escalation Monitor, and shared goal management
- **Enterprise UI/UX** — Polished, professional interface using modern design patterns
- **Zero-config demo** — Pre-seeded with realistic Indian enterprise data across 3 roles

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                    │
│  Next.js 16 + React 19 + Tailwind CSS + Recharts     │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │  Sidebar   │  │  Topbar   │  │   Page Router    │ │
│  │ Navigation │  │ Role/Phase│  │  (18 routes)     │ │
│  └────────────┘  └───────────┘  └──────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │ REST API (HTTP/JSON)
                       ▼
┌──────────────────────────────────────────────────────┐
│                  API SERVER                           │
│  Express.js 5 + TypeScript                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Auth    │ │  Goals  │ │  Admin  │ │  Reports  │  │
│  │ Routes  │ │ Routes  │ │ Routes  │ │  Routes   │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ CheckIn │ │ Shared   │ │ Analytics+Escalation │  │
│  │ Routes  │ │ Goals    │ │ Routes               │  │
│  └─────────┘ └──────────┘ └──────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌──────────────────────────────────────────────────────┐
│              DATABASE                                 │
│  SQLite (dev) / PostgreSQL (prod)                     │
│  ┌─────┐ ┌──────────┐ ┌──────┐ ┌────────────┐       │
│  │User │ │GoalSheet │ │Goal  │ │Achievement │       │
│  ├─────┤ ├──────────┤ ├──────┤ ├────────────┤       │
│  │CheckIn│ │AuditLog │ │Notif │ │ThrustArea  │       │
│  └─────┘ └──────────┘ └──────┘ └────────────┘       │
└──────────────────────────────────────────────────────┘
```

### Data Flow
1. **Employee** creates goal sheet → saved as `DRAFT`
2. **Employee** submits → status changes to `PENDING_APPROVAL`
3. **Manager** reviews, optionally edits targets/weightages inline, then approves → `APPROVED`
4. **Employee** records quarterly achievements → progress scores auto-calculated per UoM formula
5. **Manager** conducts quarterly check-ins with feedback → `CheckIn` record created
6. **Admin** monitors org-wide analytics, escalations, and audit trails

---

## ✅ Feature Checklist — BRD Compliance

### Core Requirements (Mandatory)

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 1 | Employee can create goals within a goal sheet | §2.1 | ✅ |
| 2 | Maximum 8 goals per sheet | §2.1 | ✅ |
| 3 | Total weightage must equal 100% | §2.1 | ✅ |
| 4 | Minimum 10% weightage per goal | §2.1 | ✅ |
| 5 | 4 UoM types: Numeric, Percentage, Timeline, Zero-Based | §2.1 | ✅ |
| 6 | Optimization direction (higher/lower is better) | §2.1 | ✅ |
| 7 | Thrust Area alignment per goal | §2.1 | ✅ |
| 8 | Manager approval workflow | §2.1 | ✅ |
| 9 | Manager can edit targets/weightages before approval | §2.1 | ✅ |
| 10 | Return to employee for rework | §2.1 | ✅ |
| 11 | Shared/cascaded goals from manager to team | §2.2 | ✅ |
| 12 | Quarterly achievement recording (Q1–Q4) | §2.2 | ✅ |
| 13 | Progress score computation per UoM formula | §2.3 | ✅ |
| 14 | Manager quarterly check-ins with feedback | §2.3 | ✅ |
| 15 | Role-based dashboards (Employee/Manager/Admin) | §3 | ✅ |
| 16 | Admin: Performance Cycle CRUD | §4.1 | ✅ |
| 17 | Admin: User management & org hierarchy | §4.2 | ✅ |
| 18 | Admin: Thrust area management | §4.3 | ✅ |
| 19 | Admin: Unlock approved sheets (with audit log) | §4.4 | ✅ |
| 20 | Admin: Achievement reports with CSV export | §5.1 | ✅ |
| 21 | Immutable audit log for all post-approval changes | §6.5 | ✅ |
| 22 | Demo-mode with time travel (phase switcher) | §6.1 | ✅ |

### Good-to-Have Features (Bonus)

| # | Feature | Section | Status |
|---|---------|---------|--------|
| 1 | **Analytics Module** — QoQ trends, thrust area/UoM distribution, heatmap | §5.4 | ✅ |
| 2 | **Escalation Monitor** — Rule-based violation tracking with severity levels | §5.3 | ✅ |
| 3 | **Manager Effectiveness** — Check-in completion rates per manager | §5.4 | ✅ |
| 4 | **Shared Goal Management** — Push goals to multiple employees | §2.2 | ✅ |
| 5 | **Completion Dashboard** — Org-wide goal completion tracking | §5.1 | ✅ |
| 6 | SSO Integration (Microsoft Entra ID) | §5.2 | ❌ |
| 7 | Email/Teams Notifications | §5.2 | ❌ |

---

## 🛠 Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend Framework** | Next.js 16 (App Router) | SSR/SSG capabilities, file-based routing, React 19 support |
| **UI Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS 4 | Utility-first, zero runtime CSS overhead |
| **Components** | Shadcn UI + Radix | Accessible, composable primitives |
| **Charts** | Recharts | Lightweight, React-native charting (no D3 overhead) |
| **Animations** | Framer Motion | Production-grade micro-interactions |
| **Backend** | Express.js 5 + TypeScript | Minimal overhead, industry-standard |
| **ORM** | Prisma 5 | Type-safe queries, auto-migration, seeding |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Zero-config dev, production-scale prod |
| **Auth** | JWT + bcrypt | Stateless, lightweight authentication |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repository
```bash
git clone <repo-url>
cd atomquest
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
Backend runs on **http://localhost:5001**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:3000**

---

## 👤 Demo Credentials

The application comes pre-seeded with realistic Indian enterprise personas across a complete organizational hierarchy.

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| **Employee** | `employee` | `Password123!` | Priya Sharma — Software Engineer |
| **Manager** | `manager` | `Password123!` | Rajesh Kumar — Engineering Manager |
| **Admin** | `admin` | `Password123!` | System Administrator |

Use the **quick login buttons** on the homepage or the **role switcher** in the topbar for instant persona switching.

---

## 📖 Module Walkthrough

### Employee Dashboard
- View assigned goals with real-time progress scores
- Create new goal sheets with validation guardrails
- Edit DRAFT/RETURNED sheets before resubmission
- Update quarterly achievements with inline score preview
- Track shared goals pushed by managers

### Manager Dashboard
- **Approvals**: Review pending goal sheets with inline target/weightage editing
- **Check-ins**: Conduct quarterly reviews per direct report with structured feedback
- **Team View**: Monitor team progress with aggregated scores
- **Shared Goals**: Push objectives to multiple team members simultaneously

### Admin Dashboard
- **Cycle Management**: Create/edit performance cycles with phase definitions
- **Org Hierarchy**: Manage users, roles, and reporting relationships
- **Thrust Areas**: Define strategic focus areas for goal alignment
- **Analytics**: QoQ trends, distribution charts, manager effectiveness heatmap
- **Escalation Monitor**: Auto-flag overdue submissions, delayed approvals, missed check-ins
- **Audit Logs**: Immutable trail of all post-approval changes with CSV export
- **Reports**: Filterable achievement data with drill-down and CSV export
- **Completion**: Org-wide goal completion tracking

---

## 📏 Business Rules Enforced

| Rule | Implementation |
|------|----------------|
| Weightage sum must equal 100% | Frontend validation + Backend API validation |
| Minimum 10% weightage per goal | Frontend validation + Backend API validation |
| Maximum 8 goals per sheet | Frontend UI constraint + Backend API validation |
| Shared goals are read-only (except weightage) | Frontend disables fields + Backend ignores non-weightage updates |
| Only DRAFT/RETURNED sheets can be edited | Frontend routing guard + Backend status check |
| Admin unlock requires justification | UI forces justification + Audit log created |
| All 4 UoM formulas correctly compute progress | Backend computes: `(actual/target)*100` for higher-better, `(target/actual)*100` for lower-better, date comparison for Timeline, zero-check for Zero-Based |
| Achievement scores capped at 150% | Backend `Math.min()` enforcement |
| Check-in requires feedback text | Frontend + backend validation |

---

## 💰 Cost Optimisation Strategy

### Development Cost
| Decision | Savings |
|----------|---------|
| **SQLite for development** | Zero database setup cost, instant local dev |
| **Prisma ORM** | Schema-driven; single source of truth eliminates sync issues |
| **Shadcn UI** | Copy-paste components; no dependency bloat or licensing fees |
| **Tailwind CSS** | Utility-first CSS; eliminates need for design system team |

### Operational Cost (Production)
| Decision | Savings |
|----------|---------|
| **Next.js Static + SSR hybrid** | Static pages served from CDN (near-zero compute); SSR only where needed |
| **Express.js (lightweight)** | Minimal memory footprint vs. NestJS/Spring; runs on $5/mo Render instance |
| **PostgreSQL (managed)** | Supabase free tier or Render starter ($7/mo) sufficient for <1000 users |
| **JWT auth (stateless)** | No session store needed; eliminates Redis cost |
| **No external charting SaaS** | Recharts is client-side; zero API costs for analytics |
| **Vercel free tier** | Frontend hosting with automatic CI/CD at $0/mo for hobby plan |

### Estimated TCO (Total Cost of Ownership)
| Component | Monthly Cost |
|-----------|-------------|
| Frontend (Vercel) | $0 |
| Backend (Render) | $7 |
| Database (Render PostgreSQL) | $7 |
| **Total** | **$14/month** |

*For 1-100 users. Scales linearly with managed PostgreSQL tiers.*

---

## 🔒 Security Considerations

- **Password hashing**: bcrypt with salt rounds
- **JWT tokens**: Short-lived, httpOnly-capable
- **Role-based access**: API-level route guards for Manager/Admin endpoints
- **Input validation**: Server-side validation for all business rules
- **Audit trail**: Immutable log for compliance and accountability
- **CORS**: Configured for same-origin in production

---

## 📄 License
This project is open-source and available under the MIT License.
