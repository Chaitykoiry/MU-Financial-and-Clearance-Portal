# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: System Requirements Specification (SRS)
**Code:** `CPCS-MU-DOC-002`  
**Version:** 1.0.0  
**Target:** Metropolitan University (Sylhet, Bangladesh)

---

### 1. Functional Requirements (FR) by Module

#### Module 1: Authentication & Identity Management
- **FR-1.1:** System shall provide JWT-based multi-factor authentication with session expiration and refresh token rotation.
- **FR-1.2:** System shall support 8 core roles: Student, Accounts Officer, Library Officer, Departmental Laboratory Officer, Hall Administration Officer, Department Head / In-Charge, Examination Controller / Registrar, and Super Admin.
- **FR-1.3:** Passwords must be hashed using Argon2id or Bcrypt ($12$ rounds minimum) with complexity enforcement.
- **FR-1.4:** Role-Based Access Control (RBAC) and Granular Permissions (e.g., `payment.verify`, `clearance.approve`, `certificate.issue`) must be validated strictly on backend endpoints.

#### Module 2: Student Information Management
- **FR-2.1:** Manage student academic profile: Full Name, Student ID (format e.g., `231-115-094`), School, Department, Programme (e.g., B.Sc. in CSE), Batch, Academic Term/Semester, Enrolment Status.
- **FR-2.2:** Expose student lookup endpoints filtered by department, batch, and academic standing with strict privacy controls.

#### Module 3 & 4: Financial Management, Fee Configuration & Billing
- **FR-3.1:** Database-driven fee categories: Admission Form, Admission Fee, Term Registration Fee, Credit Tuition Fee, Campus Activities Fee, BNCC Fee, Lab Fee, Exam Fee, Certificate/Transcript Fee, Late Fine, Library Overdue Fine, Hall Dues.
- **FR-3.2:** Support Metropolitan University's 4-installment billing schedule per semester, calculating due dates and amounts automatically based on registered credit hours.
- **FR-3.3:** Record approved tuition fee waivers, merit scholarships, and financial aid adjustments without overwriting original billing assessments.
- **FR-3.4:** Calculate authoritative student outstanding balance dynamically from double-entry ledger entries.

#### Module 5 & 6: Payment Processing, Verification & Reconciliation
- **FR-5.1:** Payment Provider Abstraction layer supporting:
  - **Online Gateway Integration**: bKash Education Fee / Nagad / SSLCommerz (in sandbox/mock mode with server-side HMAC callback verification and replay protection).
  - **Manual Bank Deposit**: NRBC Bank (Campus Branch Account `015954000000001`) deposit slip submission with slip number, deposit date, bank branch, and image/PDF receipt upload.
- **FR-5.2:** Provide Accounts Officers with a dedicated Verification Queue to inspect uploaded bank slips, verify transaction references against bank statement sheets, approve, or reject with mandatory remarks.
- **FR-5.3:** Idempotency keys on all payment submissions to prevent double billing or race conditions.
- **FR-5.4:** Generate downloadable, cryptographically verifiable PDF payment receipts with barcodes upon verification.

#### Module 7 & 8: Digital Clearance & Departmental Approval Engine
- **FR-7.1:** Support configurable clearance events: Semester Final Examination, Grade Card Release, Transcript Application, Provisional Pass Certificate (PPC), Original Certificate, Convocation, and University Withdrawal.
- **FR-7.2:** Configurable, versioned workflow templates where Super Admin can define sequential or parallel stages across departments (Accounts, Library, Lab, Hall, Dept Head, Exam Controller).
- **FR-7.3:** Maintain complete approval state machine: `DRAFT`, `SUBMITTED`, `PENDING`, `UNDER_REVIEW`, `APPROVED`, `FLAGGED`, `REJECTED`, `RESUBMISSION_REQUIRED`, `COMPLETED`, `CANCELLED`.
- **FR-8.1:** **Department-Specific Reviews**:
  - **Accounts**: Validates zero balance for the term/convocation.
  - **Library**: Checks borrowed books, damages, and overdue fines at Prof. M. Habibur Rahman Library.
  - **Laboratories**: Validates returned lab kits, circuit boards, and equipment across CSE/EEE/SWE labs.
  - **Hall Administration**: Checks female hostel room handovers and hall property damage.
  - **Department Head**: Confirms project/thesis submission and academic department clearance.
  - **Controller of Examinations**: Final eligibility check for degree and transcript award.
- **FR-8.2:** Flagging Mechanism: If an officer flags an application, they must input a specific reason; the student is alerted in-app/email with the exact liability and an option to resolve and resubmit for re-verification without wiping approval history.

#### Module 9: Certificate Generation & Public QR Verification
- **FR-9.1:** Automatically trigger generation of tamper-evident clearance certificate PDF once all required stages are approved.
- **FR-9.2:** Render official Metropolitan University insignia, student identification, academic session, date of issue, unique verification token, and digital sign-off table.
- **FR-9.3:** Embed server-signed QR code linking to public verification endpoint (`/verify-certificate/:token`).
- **FR-9.4:** Public verification endpoint queries authoritative server database to render instant, read-only proof of certificate validity and revocation status.

#### Module 10: Notification Management
- **FR-10.1:** Asynchronous in-app notifications and email alerts triggered on payment submission, verification, clearance flagging, re-submission, and certificate issuance.

#### Module 11, 12, 13 & 14: Dashboards, Audit Logs & Analytics
- **FR-11.1:** Role-tailored dashboards for Students, Accounts, Library, Lab, Hall, Dept Heads, Exam Controller, and Super Admin.
- **FR-12.1:** Immutable audit log capturing timestamp, actor ID, action tag, entity type, entity ID, metadata diff, and client IP address for all financial and clearance modifications.
- **FR-13.1:** Visual Workflow Builder UI allowing Super Admin to configure stages, roles, conditional execution, and versioning.
- **FR-14.1:** Administrative reporting on fee collections, clearance turnaround times, pending queues, and department clearance bottlenecks.

---

### 2. Non-Functional Requirements (NFR)

| Category | Requirement Specification |
|---|---|
| **Performance** | API response times $< 200\text{ms}$ for standard queries; $< 1.5\text{s}$ for PDF certificate generation under normal load. |
| **Scalability** | Capable of supporting $10,000+$ active students and concurrent semester-end clearance spikes. |
| **Security** | OWASP Top 10 compliance: Strict parameterized SQL queries (via Prisma), CSRF protection, Content Security Policy, rate limiting ($100$ requests / 15 min per IP), and RBAC validation. |
| **Auditability** | Financial transactions and clearance sign-offs are append-only. Zero hard-deletion of ledger entries. |
| **Reliability** | ACID compliance for all financial ledger operations and stage transitions using Prisma interactive transactions. |
| **Usability** | WCAG 2.1 AA compliant UI, responsive on mobile, tablet, and desktop viewports. |

---

### 3. Assumptions & Constraints
1. **Assumption:** Metropolitan University will review and confirm the exact fee schedules for each department before live production deployment.
2. **Assumption:** Payment gateway integration (bKash/Nagad/SSLCommerz) initially runs in sandbox mode pending university merchant contract activation.
3. **Constraint:** The system must run either locally (Windows/Linux) or containerized via Docker without depending on undocumented external legacy systems.

---

### 4. Unresolved Items Requiring University Administration Confirmation
- Exact automated waiver rules (e.g., GPA-based waivers: 4.00 waiver percentage vs. financial hardship waivers).
- Convocation fee structure and gown deposit refund procedures.
- Specific departmental signatory names and official digital signature protocols for the Exam Controller.

