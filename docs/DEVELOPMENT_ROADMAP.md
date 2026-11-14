# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: Phased Development Roadmap & Implementation Plan
**Code:** `CPCS-MU-DOC-009`  
**Version:** 1.0.0  

---

### 1. Phased Execution Roadmap

```mermaid
gantt
    title Metropolitan University CPCS Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Discovery & Architecture
    Institutional Research & Formal Docs :done, p1, 2026-11-11, 2026-11-12
    section Phase 2: Project Foundation
    Monorepo Structure, Docker, Prisma Setup :active, p2, 2026-11-13, 2026-11-15
    section Phase 3: Auth & Student Domain
    RBAC, User Management, Student Profiles :p3, 2026-11-16, 2026-11-19
    section Phase 4: Financial Management
    Fee Engine, 4-Installment Billing, NRBC Deposit Queue :p4, 2026-11-20, 2026-11-24
    section Phase 5: Clearance Workflow Engine
    Configurable Stages, Review Queues, Issue Flags :p5, 2026-11-25, 2026-11-29
    section Phase 6: Certification & QR
    PDFKit Rendering, Tamper-Evident QR Verification :p6, 2026-11-30, 2026-12-03
    section Phase 7: Notifications & Reports
    In-App Alerts, Audit Viewer, Turnaround KPIs :p7, 2026-12-04, 2026-12-07
    section Phase 8: Production Release
    E2E Testing, Security Hardening, Production Launch :p8, 2026-12-08, 2026-12-12
```

---

### 2. Phase Breakdown & Deliverables

#### Phase 1: Discovery, Architecture & Specifications (Complete)
- **Deliverables:** Approved documentation set (`docs/PROJECT_OVERVIEW.md`, `docs/REQUIREMENTS.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/USER_ROLES_AND_PERMISSIONS.md`, `docs/WORKFLOW_DESIGN.md`, `docs/API_SPECIFICATION.md`, `docs/SECURITY_PLAN.md`, `docs/DEVELOPMENT_ROADMAP.md`).
- **Success Criteria:** Architectural clarity aligning with official `metrouni.edu.bd` policies.

#### Phase 2: Foundation & Shared Infrastructure
- **Deliverables:** Modular codebase setup, PostgreSQL database with Prisma ORM, Docker containerization (`docker-compose.yml`), environment management, base UI design system tokens (Metropolitan University brand palette), logging, and global error boundaries.
- **Success Criteria:** Zero-friction local and Docker startup with verified database connectivity.

#### Phase 3: Authentication, RBAC & Student Profile Domain
- **Deliverables:** Centralized JWT authentication with refresh tokens, Argon2id/Bcrypt password hashing, 8 role guards, student academic profile management, and department/programme registries.
- **Success Criteria:** Multi-role login passing unit & integration security tests; unauthorized role access blocked.

#### Phase 4: Financial Management, Billing & Payment Processing
- **Deliverables:** Database-driven fee categories, 4-installment term billing engine, NRBC Bank deposit slip submission with receipt upload, Accounts Officer verification queue, double-entry student ledger, and PDF payment receipt generator.
- **Success Criteria:** Accurate installment calculation, zero balance discrepancy, idempotency protection against double-billing.

#### Phase 5: Digital Clearance & Configurable Workflow Engine
- **Deliverables:** Dynamic workflow template versioning, state machine (`SUBMITTED`, `IN_PROGRESS`, `FLAGGED`, `APPROVED`), department review dashboards (Accounts, Library, Lab, Hall, Dept Head, Exam Controller), issue flagging, and resubmission loop.
- **Success Criteria:** Multi-department applications advance correctly based on configured sequential/parallel rules; liabilities block progression until cleared.

#### Phase 6: Tamper-Evident Digital Certificates & Public QR Verification
- **Deliverables:** PDFKit certificate generation featuring Metropolitan University insignia, digital signatures, and server-signed QR code; public `/verify-certificate/:token` authentication page.
- **Success Criteria:** Only fully approved applications generate certificates; public QR scanner displays live verification status and warns if revoked.

#### Phase 7: Notifications, Audit Logs & Analytics Dashboards
- **Deliverables:** Event-driven in-app notifications and email dispatch, immutable audit log table with IP and actor tracking, and administrative KPIs (collection turnaround, department bottlenecks).
- **Success Criteria:** Every financial and approval action generates a verifiable audit log; real-time dashboard reflects live state.

#### Phase 8: Quality Assurance, Security Hardening & Release
- **Deliverables:** End-to-end integration test suite (Playwright / Jest), OWASP Top 10 security penetration checks, load testing for semester-end peak traffic, database backup routines, and deployment manual.
- **Success Criteria:** All critical user journeys pass automated E2E tests with zero regression.

