# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: RESTful API Specifications & Endpoint Contracts
**Code:** `CPCS-MU-DOC-007`  
**Version:** 1.0.0  
**Base URL:** `https://portal.metrouni.edu.bd/api/v1` (Local dev: `http://localhost:5000/api/v1`)  

---

### 1. Standard Request & Response Envelopes

#### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 150
  }
}
```

#### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Payment slip image is required for bank deposit submissions.",
  "errors": [
    { "field": "slipDocument", "message": "File format must be PNG or PDF" }
  ],
  "timestamp": "2026-11-11T22:30:00.000Z"
}
```

---

### 2. Core Endpoint Specifications

#### A. Authentication & User Profile (`/api/v1/auth`)
- `POST /auth/login`: Authenticate with email/Student ID and password. Returns signed JWT bearer token and user profile.
- `POST /auth/refresh`: Rotate refresh token and issue fresh access token.
- `GET /auth/me`: Fetch authenticated user profile, roles, and granular permissions.
- `POST /auth/change-password`: Update authenticated user password.

#### B. Student Information (`/api/v1/students`)
- `GET /students/me`: Authenticated student's full academic record, programme, batch, and registered term.
- `GET /students`: Admin/Officer lookup with filters by department, batch, and Student ID.
- `GET /students/:id`: Detailed student summary with academic and enrolment history.

#### C. Financial Management & Billing (`/api/v1/finance`)
- `GET /finance/my-invoices`: Current term invoice, fee items, and 4-installment schedule.
- `GET /finance/my-ledger`: Complete double-entry student ledger transactions and running balance.
- `POST /finance/fee-categories`: [Admin] Create or update configurable fee category.
- `POST /finance/fee-structures`: [Admin] Assign term fee structure to an academic programme.
- `POST /finance/waivers`: [Accounts] Record student merit/hardship tuition fee waiver.

#### D. Payment Processing (`/api/v1/payments`)
- `POST /payments/bank-deposit`: Submit NRBC Bank deposit slip details with multipart file attachment.
- `POST /payments/initiate-gateway`: Initiate bKash / Nagad / SSLCommerz payment session.
- `POST /payments/gateway/callback`: Server-to-server gateway webhook verification with HMAC signature.
- `GET /payments/receipt/:transactionId`: Download tamper-evident payment receipt PDF with barcode.

#### E. Accounts Office Verification (`/api/v1/accounts`)
- `GET /accounts/verification-queue`: List pending bank deposit slip submissions.
- `PATCH /accounts/verify/:transactionId`: Approve bank slip, credit student ledger, and mark installment paid.
- `PATCH /accounts/reject/:transactionId`: Reject submission with mandatory feedback remarks.
- `GET /accounts/reconciliation-report`: Daily bank reconciliation summary against branch account `015954000000001`.

#### F. Clearance Application & Workflow Engine (`/api/v1/clearance`)
- `GET /clearance/types`: Retrieve available clearance events (Semester Final, Graduation, Transcript).
- `POST /clearance/apply`: Submit a new clearance application (generates application number and instantiates workflow version).
- `GET /clearance/my-applications`: Student view of active and completed clearance progress.
- `GET /clearance/:id`: Full details of clearance stages, assigned officers, dues, and remarks.

#### G. Department Review Queues (`/api/v1/reviews`)
- `GET /reviews/queue`: List applications awaiting review for the officer's designated department.
- `PATCH /reviews/:stageInstanceId/approve`: Sign off clearance stage for the department.
- `PATCH /reviews/:stageInstanceId/flag`: Flag outstanding liability with reason and fine amount.
- `PATCH /reviews/:stageInstanceId/resolve`: Re-evaluate resubmitted application after liability settlement.

#### H. Workflow Builder (`/api/v1/workflows`)
- `GET /workflows/templates`: List configurable clearance workflow templates.
- `POST /workflows/templates`: [Super Admin] Create or version a workflow with ordered/parallel stages.

#### I. Certificates & Verification (`/api/v1/certificates`)
- `GET /certificates/download/:applicationId`: Download official PDF clearance certificate with dynamic QR code.
- `GET /certificates/verify/:token`: **Public endpoint**. Cryptographically validates certificate authenticity, student metadata, issue date, and departmental sign-offs.
- `PATCH /certificates/revoke/:id`: [Exam Controller / Admin] Revoke certificate with recorded reason.

#### J. Audit Logs & System Administration (`/api/v1/admin`)
- `GET /admin/audit-logs`: Query immutable system audit logs with filters by actor, action tag, and date range.
- `GET /admin/kpis`: Real-time analytics on fee recovery, pending clearance queues, and department turnaround times.

