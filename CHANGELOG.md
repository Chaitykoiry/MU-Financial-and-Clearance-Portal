# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
# Project Changelog & Phased Release Notes

All notable changes, architectural milestones, and module implementations for the **Metropolitan University Integrated Financial Management & Digital Clearance Portal (CPCS)** are documented in this file.

The project adheres to **Semantic Versioning (SemVer 2.0.0)** and modular release tracking.

---

## [1.0.0-PROD] — Phase 8: Quality Assurance, Security Hardening & Release (2026-11-11)

### Complete System Verification & Release
- **Automated E2E Journey Test Suite:**
  - Implemented multi-stage end-to-end integration test (`backend/test/e2e.journey.test.js`) verifying the entire university lifecycle:
    1. Student Enrolment & 4-Installment Term Fee Billing (`40,000 BDT` split into 4 equal installments of `10,000 BDT`).
    2. NRBC Bank Deposit Slip submission to Accounts Queue (`NRBC-SLIP-77382`).
    3. Accounts Officer audit, approval, and automated ledger balance deduction.
    4. Convocation clearance pipeline triggering across all 6 stages.
    5. Department liability flagging (Library missing book hold: "Accession #4821").
    6. Student physical return and officer sign-off.
    7. Automated certificate issuance upon 100% approval (`MU-VTOK-98124-77A`).
    8. Dynamic PDFKit rendering with embedded high-contrast QR code.
    9. Public QR code authenticator verification.
  - All 6 backend test suites passed with 0 failures in 1.51s (`node --test test/*.test.js`).
- **Production Asset Compilation:**
  - Frontend SPA compiled cleanly with Vite (`dist/index.html`, `dist/assets/index.js`, `dist/assets/index.css`) with 0 errors in 4.06s.
- **Operations & Disaster Recovery Documentation:**
  - Created `docs/DEPLOYMENT_GUIDE.md` covering Docker Compose orchestration, bare-metal PM2 deployment, Nginx reverse proxy with SSL termination, automated `pg_dump` backup scripts with 30-day rotation, and operational troubleshooting runbooks.

---

## [0.7.0] — Phase 7: Notifications, Audit Logs & Analytics Dashboards (2026-11-11)

### Real-Time Alerts & Institutional Analytics
- **Live Notification Bell & Dropdown:**
  - Implemented interactive notification drawer in `frontend/src/components/Navbar.jsx` with unread count badge, unread/read state transitions, and mark-as-read API hooks.
  - Event-driven notifications dispatched upon slip review, stage approval, issue flagging, and certificate generation.
- **Cryptographic Audit Trail:**
  - Implemented immutable audit logging table in `AuditLog` storing actor user, action type, IP address, user-agent, previous state, and new state.
  - Real-time audit log inspector in Super Admin dashboard (`AdminDashboard.jsx`).
- **Turnaround KPIs & Bottleneck Analytics:**
  - Built department turnaround analytics in `analyticsController.js` and `AdminDashboard.jsx`, computing average clearance resolution times per department and flagging operational bottlenecks.

---

## [0.6.0] — Phase 6: Tamper-Evident Digital Certificates & Public QR Verification (2026-11-11)

### Dynamic PDF Generation & QR Verification
- **Dynamic PDFKit Certificate Engine:**
  - Built `backend/src/services/pdfService.js` rendering official Metropolitan University Convocation / Provisional Certificates.
  - Styled with institutional Navy (`#0f2b5c`) border, Metropolitan University header, Bateshwar Sylhet campus address, student credentials, issuance timestamp, and digital registrar signature.
- **Dynamic QR Code Stamping:**
  - Dynamically embeds high-contrast QR code pointing to public verification endpoint: `https://clearance.metrouni.edu.bd/verify-certificate/{token}`.
- **Public QR Authenticator Page:**
  - Built `frontend/src/pages/VerifyCertificatePage.jsx` enabling third-party employers, embassies, and graduate admissions committees to scan QR codes and view live certificate authenticity, student metadata, and revocation state.

---

## [0.5.0] — Phase 5: Digital Clearance & Configurable Workflow Engine (2026-11-11)

### Multi-Department Clearance Pipeline
- **Configurable Workflow State Machine:**
  - Designed `WorkflowTemplate`, `WorkflowVersion`, and `WorkflowStage` relational models with support for sequential and parallel stage execution.
  - Automated clearance engine evaluates prerequisites and transitions applications through `SUBMITTED`, `IN_PROGRESS`, `FLAGGED`, `REJECTED`, and `APPROVED`.
- **Department Review Queues:**
  - Built specialized review queues in `frontend/src/pages/OfficerDashboard.jsx` for Central Library, Departmental Labs (CSE/EEE), Hall Administration, Department Head, and Controller of Examinations.
- **Issue Flagging & Liability Management:**
  - Officers can flag unreturned books, missing lab equipment, or unpaid hall dues with dues amounts; liabilities immediately pause clearance progression and notify the student.
- **Visual Workflow Builder:**
  - Built Super Admin workflow management interface in `AdminDashboard.jsx` allowing dynamic stage reordering, dependency assignment, and approval requirement configuration without code changes.

---

## [0.4.0] — Phase 4: Financial Management, Billing & Payment Processing (2026-11-11)

### Institutional Billing & NRBC Bank Integration
- **4-Installment Term Billing Engine:**
  - Implemented tuition billing splitting semester charges into 4 equal installments as per Metropolitan University financial guidelines (`financeController.js`).
  - Automated waiver deduction engine applying merit and financial aid scholarships before installment computation.
- **NRBC Bank Slip Submission Modal:**
  - Designed bank deposit slip submission modal in `StudentDashboard.jsx` supporting NRBC Bank PLC (Account: `015954000000001`, Campus Branch, Bateshwar).
  - Captures scroll number, branch name, transaction reference, deposit date, and receipt upload.
- **Accounts Officer Audit Queue:**
  - Built `frontend/src/pages/AccountsQueuePage.jsx` with 1-click **Verify & Credit Student** and **Reject Submission** workflows.
- **Double-Entry Student Ledger:**
  - Enforced immutable `StudentLedgerEntry` records guaranteeing double-entry accounting invariant: $\sum \text{Debits} - \sum \text{Credits} = \text{Outstanding Balance}$.

---

## [0.3.0] — Phase 3: Authentication, RBAC & Student Profile Domain (2026-11-11)

### Centralized Security & Role-Based Access Control
- **8 Institutional Roles:**
  - Implemented strict RBAC guards (`backend/src/middleware/auth.js`) for:
    1. `STUDENT`
    2. `ACCOUNTS_OFFICER`
    3. `LIBRARY_OFFICER`
    4. `LAB_OFFICER`
    5. `HALL_OFFICER`
    6. `DEPT_HEAD`
    7. `EXAM_CONTROLLER`
    8. `SUPER_ADMIN`
- **1-Click Demo Login Interface:**
  - Built responsive login portal in `frontend/src/pages/LoginPage.jsx` with instant role switching for demonstration and administrative testing.
- **Student Profile & Department Registry:**
  - Seeded all 7 academic departments (CSE, SWE, EEE, BBA, LAW, ENG, ECO) and 5 administrative directorates.

---

## [0.2.0] — Phase 2: Foundation & Shared Infrastructure (2026-11-11)

### Core Architecture & Containerization
- **Multi-Stage Docker Setup:**
  - Built `backend/Dockerfile` (Node 20 Alpine) and `frontend/Dockerfile` (Node builder + Nginx Alpine runner with custom reverse proxy configuration in `frontend/nginx.conf`).
  - Built `docker-compose.yml` linking PostgreSQL 16 Alpine, Express backend, and Nginx frontend with healthchecks and network isolation.
- **Prisma Windows File-Lock Resolution:**
  - Configured custom generator output `backend/src/generated/client` in `schema.prisma` eliminating Windows OS `EPERM` collisions during hot-reloads and migrations.
- **Automated Database Setup Tool:**
  - Created `backend/setup-db.js` providing automated database creation, migration pushing, and data seeding via `npm run setup:db -- <password>`.

---

## [0.1.0] — Phase 1: Institutional Discovery, Architecture & Specifications (2026-11-11)

### Comprehensive Engineering Documentation Suite
- Researched official Metropolitan University website (`https://metrouni.edu.bd/`) capturing authentic institutional data:
  - Campus: Bateshwar, Sylhet-3103, Bangladesh.
  - Banking Partner: NRBC Bank PLC, Campus Branch (Account: `015954000000001`).
  - Library: Prof. M. Habibur Rahman Central Library.
  - Fees & Rates: Transcripts (Normal 1,000 / Urgent 1,500 BDT); PPC (Normal 2,000 / Urgent 3,000 BDT); Original Certificate (Normal 5,000 / Urgent 7,000 BDT).
- Authored 9 formal architecture specifications in `docs/`:
  - `docs/PROJECT_OVERVIEW.md` (`CPCS-MU-DOC-001`)
  - `docs/REQUIREMENTS.md` (`CPCS-MU-DOC-002`)
  - `docs/SYSTEM_ARCHITECTURE.md` (`CPCS-MU-DOC-003`)
  - `docs/DATABASE_DESIGN.md` (`CPCS-MU-DOC-004`)
  - `docs/USER_ROLES_AND_PERMISSIONS.md` (`CPCS-MU-DOC-005`)
  - `docs/WORKFLOW_DESIGN.md` (`CPCS-MU-DOC-006`)
  - `docs/API_SPECIFICATION.md` (`CPCS-MU-DOC-007`)
  - `docs/SECURITY_PLAN.md` (`CPCS-MU-DOC-008`)
  - `docs/DEVELOPMENT_ROADMAP.md` (`CPCS-MU-DOC-009`)

---
**End of Changelog — System Ready for Production Release**

