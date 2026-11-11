# Centralised Payment and Clearance System (CPCS)

A modern, full-stack institutional clearance and payment platform engineered with **React.js**, **Tailwind CSS**, **Node.js (Express.js)**, **PostgreSQL (Prisma ORM)**, and **PDFKit with dynamic QR Code stamping**.

---

## 🏛️ Architecture Overview

```
                                      ┌─────────────────────────────────┐
                                      │      React + Vite Frontend      │
                                      │   (Single Page Application)     │
                                      └────────────────┬────────────────┘
                                                       │
                                            REST API (JSON & JWT)
                                                       │
                                      ┌────────────────▼────────────────┐
                                      │      Node.js / Express API      │
                                      │   - Auth Guards & RBAC          │
                                      │   - Clearance Validation Engine │
                                      │   - Event-driven Pipelines      │
                                      │   - PDFKit & QR Generator Engine │
                                      └────────┬───────────────┬────────┘
                                               │               │
                            Prisma ORM / SQL   │               │ Dynamic QR Stamping
                                               │               │
                                      ┌────────▼───────┐ ┌─────▼────────────────┐
                                      │   PostgreSQL   │ │ Official Certificate │
                                      │   Database     │ │ (PDF with QR code)   │
                                      └────────────────┘ └──────────────────────┘
```

---

## 🛠️ Technical Stack

- **Frontend:**
  - **React.js** (Vite SPA)
  - **Tailwind CSS** (responsive dashboards & checklist states)
  - **Lucide Icons**
  - **React Router DOM** (role-based protected routes)
  - **Axios** (API client with JWT bearer tokens)
- **Backend:**
  - **Node.js** with **Express.js**
  - RESTful architecture with modular controllers, middlewares, and services
  - **JWT Authentication** and **Bcrypt** password hashing
  - Event-driven clearance validation pipeline: auto-evaluates multi-department approvals and settles dues
- **Database & ORM:**
  - **PostgreSQL**
  - **Prisma ORM** (strict relational integrity, enums, migrations, and audit trails)
- **Utilities & Tooling:**
  - **PDFKit**: Server-side dynamic PDF certificate generation with official styling and layout
  - **QRCode**: Cryptographic QR code generation dynamically stamped onto the certificate
  - **Git**: Version control & sprint tracking

---

## 📋 Relational Database Schema (`backend/prisma/schema.prisma`)

1. **`User`**: Admin, Department Officer, and Student roles with matriculation/staff IDs.
2. **`Department`**: Configurable clearance departments (e.g., Library, Bursar, Hostel, Sports, Exams, Faculty) with payment-requirement flags.
3. **`ClearanceRequest`**: Clearance lifecycle (`PENDING`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `HOLD`) with certificate verification code and issuance timestamp.
4. **`DepartmentApproval`**: Departmental flags, dues amounts, payment status (`duesPaid`), officer sign-offs, and remarks.
5. **`Payment`**: Transaction audit records, payment references, payment method, and amount.
6. **`AuditLog`**: Immutable security logs tracking all user logins, department approvals, payments, and certificate downloads.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** database (Local, Docker, or Cloud provider like Neon/Supabase)

### 2. Configure Database
In `backend/.env`, set your PostgreSQL connection string:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/cpcs_db?schema=public"
JWT_SECRET="supersecret_cpcs_jwt_signing_key_2026"
FRONTEND_URL="http://localhost:5173"
```

> **Optional Docker PostgreSQL**: If you have Docker installed, simply run:
> ```bash
> docker compose up -d
> ```

### 3. Run Prisma Migration & Seed Demo Data
```bash
cd backend
npx prisma db push
npm run seed
```

### 4. Start the Application
Run both servers:
- **Backend**:
  ```bash
  cd backend
  npm run dev
  ```
  *(Runs on `http://localhost:5000`)*

- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
  *(Runs on `http://localhost:5173`)*

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Email / Identifier | Password | Details |
|---|---|---|---|
| **System Admin** | `admin@cpcs.edu` | `admin123` | Full dashboard, audit logs, department configuration |
| **Library Officer** | `library@cpcs.edu` | `officer123` | Reviews library returns & signs off |
| **Bursar Officer** | `bursar@cpcs.edu` | `officer123` | Oversees tuition fees & graduation dues |
| **Hostel Officer** | `hostel@cpcs.edu` | `officer123` | Hall & room clearance |
| **Cleared Student** | `student@cpcs.edu` | `student123` | **Alex Mercer** - Fully cleared; has downloadable certificate with QR stamp (`CPCS-CERT-773921`) |
| **Pending Student** | `clara@cpcs.edu` | `student123` | **Clara Oswald** - In-progress clearance with pending dues ready to settle |

*(The login screen also features 1-click autofill buttons for each demo user!)*

---

## 📄 Dynamic PDF Certificate & QR Verification Workflow

1. **Clearance Pipeline Evaluation**:
   When a student requests clearance, approval entries are generated for all configured departments.
2. **Multi-Department Sign-Off**:
   Department officers inspect dues and approve/hold requests. Students can settle outstanding dues directly through the dashboard.
3. **Auto-Certification**:
   Once all departments approve and statutory dues are settled, the pipeline automatically transitions the request to `APPROVED` and generates a cryptographic certificate code (`CPCS-CERT-XXXXXX`).
4. **PDFKit & QR Stamping**:
   - `pdfService.js` creates an official university certificate.
   - Generates a high-contrast QR code pointing to `http://localhost:5173/verify-certificate/<CODE>`.
   - Embeds the QR code and digital seal into the document.
5. **Instant QR Verification**:
   Anyone scanning the QR code or visiting `/verify` can immediately verify the certificate's validity, student details, and departmental audit timestamps.
