# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: User Roles, Permissions & Access Control Matrix
**Code:** `CPCS-MU-DOC-005`  
**Version:** 1.0.0  

---

### 1. Role Definitions & Scope of Responsibility

| Role Identifier | Title | Domain Scope |
|---|---|---|
| `STUDENT` | Registered Student | Personal profile, invoices, payment submissions, clearance applications, issue resolution, certificate downloads. |
| `ACCOUNTS_OFFICER` | Accounts & Finance Officer | Fee assessments, bank deposit slip verification queue, manual reconciliation, dues management, and financial clearance sign-offs. |
| `LIBRARY_OFFICER` | Central Library Officer | Prof. M. Habibur Rahman Library book checkout checks, overdue fines, and library clearance sign-offs. |
| `LAB_OFFICER` | Departmental Lab Officer | Hardware/circuits/software lab kits, equipment return validation, laboratory liabilities, and lab clearance sign-offs. |
| `HALL_OFFICER` | Hall Warden / Hall Admin | Female resident hall property returns, room inspections, hall damages, and accommodation clearance sign-offs. |
| `DEPT_HEAD` | Head of Academic Department | Departmental final clearance, thesis/project approval, academic performance check, and departmental endorsement. |
| `EXAM_CONTROLLER` | Controller of Examinations | Degree completion audit, academic transcript applications, provisional & original certificate validation, final clearance sign-off. |
| `SUPER_ADMIN` | System Administrator | Role/permission assignment, department creation, fee structure management, visual workflow configuration, system settings, and audit log inspection. |

---

### 2. Granular Permissions Matrix

| Permission Slug | Description | Student | Accounts | Library | Lab | Hall | Dept Head | Exam Controller | Super Admin |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `auth.self.manage` | Update own password/contact info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `student.view.own` | View personal profile & academic records | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `student.view.all` | Search and view student academic details | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `finance.view.own` | View personal invoices, balances, installments | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `finance.manage` | Configure fee structures, billing, installment dates | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `payment.submit` | Submit bank deposit slips or initiate MFS payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payment.verify` | Approve or reject bank deposit payments in queue | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `payment.reconcile`| Manage adjustments, refunds, and bank reconciliations | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `clearance.apply` | Apply for clearance events (Semester Final, Convocation) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `clearance.track` | Track visual stage-by-stage clearance progress | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `clearance.sign.accounts` | Approve/flag Accounts clearance stage | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `clearance.sign.library` | Approve/flag Central Library clearance stage | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `clearance.sign.lab` | Approve/flag Departmental Laboratory clearance stage | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `clearance.sign.hall` | Approve/flag Hall Administration clearance stage | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| `clearance.sign.dept` | Approve/flag Academic Department Head stage | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `clearance.sign.exam` | Approve/flag Examination Controller final stage | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `clearance.workflow.edit` | Create, modify, and version clearance workflow stages | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `certificate.issue` | Issue official stamped PDF clearance certificate | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `certificate.revoke` | Revoke issued certificate with recorded reason | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `audit.view` | View immutable system audit logs and IP trails | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### 3. Separation of Duties (SoD) & Least Privilege Rules

1. **Self-Review Prevention:** An administrative officer who is also enrolled in an academic programme cannot review or sign off on their own clearance application.
2. **Departmental Data Isolation:** A Library Officer cannot view a student's private financial records or medical documents; they only have access to library liabilities and the clearance review form.
3. **Dual Approval Guard for Certificate Issuance:** No certificate can be generated if any mandatory departmental stage is in a `PENDING`, `FLAGGED`, or `LOCKED` status.
4. **Authoritative Ledger Immutability:** Accounts officers cannot delete payment transactions; any corrections must be recorded as compensatory credit or debit adjustment entries.

