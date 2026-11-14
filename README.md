# Metropolitan University — Integrated Financial Management & Digital Clearance Portal (CPCS)

An enterprise-grade, full-stack university management platform engineered for **Metropolitan University, Sylhet, Bangladesh** ([https://metrouni.edu.bd/](https://metrouni.edu.bd/)).

The portal combines two major institutional workflows into a single unified platform:
1. **University Financial Management & Online Fee Payment System** (Tuition billing in 4 equal installments, NRBC Bank deposit slip submission, Accounts Officer verification queue, and double-entry student ledger).
2. **Digital Administrative Clearance & Certificate Management System** (Configurable multi-department clearance pipeline, issue flagging with dues penalties, dynamic PDFKit certificate generation, and server-signed dynamic QR code verification).

---

## 🏛️ System Architecture

```
                                  [ Client Layer ]
                    React.js + Vite SPA (Tailwind CSS, Lucide Icons)
                                         │
                                         ▼ HTTPS / JSON (JWT RBAC)
                                  [ API Gateway ]
                     Node.js / Express.js Modular REST Layer
             ┌───────────────────────────┼───────────────────────────┐
             │                           │                           │
    [ Identity & RBAC ]         [ Financial Engine ]       [ Clearance Engine ]
   Argon2 / Bcrypt Hashing     4-Installment Billing       Configurable Pipelines
     8 Institutional Roles      NRBC Deposit Queue          Department Review Queues
     Audit Trail Logging        Double-Entry Ledger         Issue Flagging & Holds
             │                           │                           │
             └───────────────────────────┼───────────────────────────┘
                                         ▼
                            [ Data & Security Layer ]
                      PostgreSQL 16 / 18 via Prisma ORM
                         PDFKit Dynamic QR Stamping
```

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide React, Axios, React Router v6.
- **Backend:** Node.js, Express.js, Prisma ORM, PDFKit, QRCode, JsonWebToken, Bcrypt.
- **Database:** PostgreSQL 16/18 with relational constraints, enums, and connection pooling.
- **DevOps & Containers:** Docker, Docker Compose, Nginx reverse proxy, multi-stage Alpine builds.
- **Testing:** Node.js native test runner (`node --test`), unit tests, and full E2E user journey testing.

---

## 👥 Supported Institutional Roles (8 Roles)

| Role | Responsibilities & Capabilities |
|---|---|
| **Student** | View 4-installment billing schedule, upload NRBC Bank deposit slips, track multi-department clearance checklist, download verified certificates |
| **Accounts Officer** | Audit submitted bank deposit slips, verify transactions, reconcile student ledger, manage tuition dues and late fines |
| **Library Officer** | Review clearance applications, inspect book return records, flag missing books with replacement fines, grant clearance |
| **Lab Officer** | Inspect hardware/software lab equipment returns (CSE/EEE labs), record damages/liabilities, grant clearance |
| **Hall Officer** | Review accommodation dues and university property clearance for resident students |
| **Department Head** | Academic sign-off, departmental clearance monitoring, and student status oversight |
| **Exam Controller** | Final graduation & academic record verification, convocation clearance sign-off |
| **Super Admin** | Visual workflow builder (reorder stages, set dependencies), department roster management, system KPIs, and tamper-evident audit logs |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.x or v20.x+)
- **PostgreSQL** (v16.x or v18.x) or **Docker**

### 2. Configure Environment
```bash
# Clone repository
git clone https://github.com/metropolitan-university/cpcs-portal.git
cd "centrelised payment and clearance system"

# Setup backend environment
cp backend/.env.example backend/.env
```

### 3. Automated Database Setup & Seeding
If you have PostgreSQL installed locally on port 5432:
```bash
node backend/setup-db.js <your_postgres_password>
```
*This automated script connects to PostgreSQL, creates `cpcs_db` if not present, pushes the Prisma schema, and seeds all departments, fee categories, and demo accounts.*

Or using Docker Compose:
```bash
docker compose up -d --build
docker compose exec backend npx prisma db push
docker compose exec backend npm run seed
```

### 4. Run Development Servers
- **Backend API Server (Port 5000):**
  ```bash
  cd backend
  npm run dev
  ```
- **Frontend SPA (Port 5173):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🔑 Pre-Seeded Institutional Demo Accounts

The login screen (`http://localhost:5173/login`) provides **1-click autofill demo login buttons** for all 8 roles:

| Role | Email | Password | Pre-loaded Context |
|---|---|---|---|
| **Super Admin** | `admin@metrouni.edu.bd` | `admin123` | System-wide administrative access & workflow designer |
| **Accounts Officer** | `accounts@metrouni.edu.bd` | `officer123` | Active NRBC bank deposit slip verification queue |
| **Library Officer** | `library@metrouni.edu.bd` | `officer123` | Central Library clearance review queue |
| **Lab Officer** | `labs@metrouni.edu.bd` | `officer123` | CSE & EEE departmental lab equipment review queue |
| **Hall Officer** | `hall@metrouni.edu.bd` | `officer123` | Dedicated Female Hall accommodation clearance queue |
| **Head of CSE** | `head.cse@metrouni.edu.bd` | `officer123` | CSE Department Head sign-off queue |
| **Exam Controller** | `controller@metrouni.edu.bd` | `officer123` | Final graduation clearance sign-off queue |
| **Cleared Student** | `choyon@metrouni.edu.bd` | `student123` | **Choyon Dhor** (231-115-094) — 100% Cleared, Certificate #`MU-VTOK-98124-77A` |
| **Pending Student** | `clara@metrouni.edu.bd` | `student123` | **Clara Oswald** (231-115-042) — Pending 2nd installment & NRBC slip |

---

## 🧪 Automated Testing

Execute the comprehensive test suites verifying business invariants, installment calculation, and the full end-to-end clearance lifecycle:

```bash
# Run unit & integration tests
npm --prefix backend test
```

Expected output:
```
✔ Metropolitan University CPCS — Phase 8 Full Lifecycle Integration Journey (192ms)
✔ Metropolitan University CPCS — Core Business Logic Tests (185ms)
ℹ tests 6
ℹ suites 5
ℹ pass 6
ℹ fail 0
```

Compile production frontend assets:
```bash
npm --prefix frontend run build
```

---

## 📚 Engineering Documentation (`docs/`)

All formal architectural specifications and operational runbooks are located in `docs/`:

1. [`docs/PROJECT_OVERVIEW.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/PROJECT_OVERVIEW.md) — Institutional background, objectives & governance
2. [`docs/REQUIREMENTS.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/REQUIREMENTS.md) — Functional and non-functional requirements
3. [`docs/SYSTEM_ARCHITECTURE.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/SYSTEM_ARCHITECTURE.md) — Modular monolith architectural topology & data flows
4. [`docs/DATABASE_DESIGN.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/DATABASE_DESIGN.md) — Relational ERD, indexes, audit logs, and double-entry ledger design
5. [`docs/USER_ROLES_AND_PERMISSIONS.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/USER_ROLES_AND_PERMISSIONS.md) — Comprehensive 8-role RBAC matrix
6. [`docs/WORKFLOW_DESIGN.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/WORKFLOW_DESIGN.md) — Finite state machines & clearance progression logic
7. [`docs/API_SPECIFICATION.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/API_SPECIFICATION.md) — OpenAPI/RESTful endpoints, schemas & error payloads
8. [`docs/SECURITY_PLAN.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/SECURITY_PLAN.md) — Threat modeling, cryptographic hashing, and OWASP mitigation
9. [`docs/DEVELOPMENT_ROADMAP.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/DEVELOPMENT_ROADMAP.md) — 8-phase execution plan and milestone criteria
10. [`docs/DEPLOYMENT_GUIDE.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/docs/DEPLOYMENT_GUIDE.md) — Production operations, Nginx SSL, Docker, and disaster recovery manual
11. [`CHANGELOG.md`](file:///c:/Users/suman/Documents/ALL%20Projects/centrelised%20payment%20and%20clearance%20system/CHANGELOG.md) — Chronological release notes for Phases 1 through 8

---

## 🏛️ Official Institutional Verification

- **Institution:** Metropolitan University (Private University approved by Govt. of Bangladesh and UGC)
- **Campus:** Bateshwar, Sylhet-3103, Bangladesh
- **Official Portal:** [https://metrouni.edu.bd/](https://metrouni.edu.bd/)
- **Official Banking Partner:** NRBC Bank PLC, Campus Branch, Bateshwar (Account: `015954000000001`)
