# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: Workflow Design & Transaction State Machines
**Code:** `CPCS-MU-DOC-006`  
**Version:** 1.0.0  

---

### 1. Financial Payment Processing Workflows

#### Flow A: Manual Bank Deposit (NRBC Bank Campus Branch)
Metropolitan University students pay fees via direct deposit at NRBC Bank, Bateshwar Branch (Account: `015954000000001`):

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Accounts as Accounts Officer
    participant Portal as Portal UI & API
    participant DB as PostgreSQL Ledger

    Student->>Portal: 1. Select term invoice / installment dues
    Student->>Portal: 2. Input deposit slip details (Slip #, Branch, Date, Amount)
    Student->>Portal: 3. Upload scanned slip / bank photo (PDF/PNG)
    Portal->>DB: 4. Create PaymentTransaction (Status: PENDING_VERIFICATION)
    Portal-->>Student: 5. Return tracking reference (e.g., MU-PAY-88219)
    Note over Accounts: Daily Verification Routine
    Accounts->>Portal: 6. Open Accounts Verification Queue
    Accounts->>Portal: 7. Inspect slip image against bank statement
    alt Slip Valid & Matches Bank Statement
        Accounts->>Portal: 8a. Click "Verify & Credit Student"
        Portal->>DB: 9a. Update PaymentTransaction (Status: VERIFIED)
        Portal->>DB: 10a. Post Credit to StudentLedgerEntry & update Invoice balance
        Portal-->>Student: 11a. In-app / Email Alert + Downloadable Receipt with Barcode
    else Slip Invalid or Amount Mismatch
        Accounts->>Portal: 8b. Click "Reject" with mandatory reason
        Portal->>DB: 9b. Update PaymentTransaction (Status: REJECTED)
        Portal-->>Student: 10b. Alert student to resubmit valid slip
    end
```

---

### 2. Configurable Clearance Workflow Engine

The clearance pipeline is dynamic and configurable. Different clearance events follow tailored workflows:

#### Workflow Variant 1: Semester Final Examination Clearance
1. **Accounts Section** (Zero semester balance check)
2. **Central Library** (No overdue books)
3. **Department Head** (Course registration & lab attendance confirmation)
4. $\rightarrow$ **Admit Card & Clearance Slip Issued**

#### Workflow Variant 2: Final Graduation / Convocation / Certificate Clearance
1. **Accounts Section** (Settlement of all academic fees, convocation fee, and graduation charges)
2. **Central Library** (Return of all books and library card cancellation)
3. **Departmental Laboratories** (CSE/EEE lab kits, project hardware return)
4. **Hall Administration** (Female resident room clearance, damage inspection)
5. **Department Head** (Final year thesis/internship report submission)
6. **Controller of Examinations** (Credit audit, degree award eligibility check)
7. $\rightarrow$ **Digital Clearance Certificate Generated with Dynamic QR Code**

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Student selects clearance event
    DRAFT --> SUBMITTED : Submits application
    SUBMITTED --> IN_PROGRESS : Stage 1 activated (Accounts)

    state IN_PROGRESS {
        [*] --> STAGE_EVALUATION
        STAGE_EVALUATION --> STAGE_APPROVED : Department officer signs off
        STAGE_EVALUATION --> STAGE_FLAGGED : Department officer flags liability
        STAGE_FLAGGED --> RESUBMISSION_REQUIRED : Notified student resolves dues/returns item
        RESUBMISSION_REQUIRED --> STAGE_EVALUATION : Student requests re-verification
    }

    IN_PROGRESS --> REJECTED : Severe academic/disciplinary violation
    IN_PROGRESS --> APPROVED : All configured stages approved

    APPROVED --> CERTIFICATE_ISSUED : PDFKit generates signed certificate with QR stamp
    CERTIFICATE_ISSUED --> [*]
```

---

### 3. Issue Flagging & Resubmission Lifecycle

When an administrative unit identifies an outstanding liability:
1. The officer selects **Flag Issue** and inputs:
   - Specific reason (e.g. *"Overdue textbook 'Algorithm Design' (Acc # 4821) not returned"*).
   - Liability amount in BDT (if monetary fine applies).
2. The clearance application enters `FLAGGED` status for that department.
3. The student receives an immediate alert with resolution instructions:
   - If monetary: Student can click **Pay Fine Online** directly from the portal.
   - If material: Student returns the equipment/book to the department.
4. The student clicks **Submit for Re-verification**.
5. The officer is notified, verifies the returned item or settled fine, and updates the stage to `APPROVED`.
6. **Audit Continuity:** All prior flags, notes, and timestamps are preserved immutably in `clearance_issues` and `audit_logs`.

