# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: Security Architecture, Threat Mitigation & Compliance Plan
**Code:** `CPCS-MU-DOC-008`  
**Version:** 1.0.0  

---

### 1. Data Classification & Protection Levels

| Level | Data Category | Examples | Security Controls |
|---|---|---|---|
| **High (Confidential)** | Identity Credentials & Financial Records | Password hashes, JWT secrets, Bank deposit slips, Ledger balances, MFS transaction IDs | Hashed with Bcrypt/Argon2id, encrypted at rest, TLS 1.3 in transit, strict RBAC, no plain text logging. |
| **Medium (Internal)** | Student Academic & Clearance Records | CGPA, unreturned lab equipment, library liabilities, departmental sign-off remarks | Row-level data isolation (officers only see relevant department liabilities), audit logged on access. |
| **Low (Public Verifiable)** | Certificate Verification Proofs | Student Full Name, Student ID (partially masked), Degree awarded, Date of clearance, Certificate status | Read-only public API, cryptographically signed verification tokens, rate-limited against brute force. |

---

### 2. Threat Modeling & Defense Strategies

#### A. Preventing Duplicate Payments & Race Conditions
- **Threat:** A student double-clicks "Submit Payment" or replay attacks a bank deposit slip.
- **Defense:**
  1. **Idempotency Keys:** Every payment submission requires a unique client-generated UUID idempotency key stored in Redis/database with a 24-hour expiration.
  2. **Unique Constraints:** The database enforces a `UNIQUE(slip_number, bank_branch)` constraint on bank deposits and `UNIQUE(gateway_transaction_id)` on MFS payments.
  3. **Atomic Transactions:** Payment creation, ledger entry debit/credit, and installment status updates occur strictly within an ACID `prisma.$transaction`.

#### B. Clearance Bypassing & Unauthorized Sign-Offs
- **Threat:** A student or rogue actor attempts to forge an approval or trigger certificate generation directly.
- **Defense:**
  1. **Server-Side Enforcement:** Clearance stage transitions check the authenticated user's assigned role and department ID at the controller and service layer. Frontend disabled buttons are treated as UI hints only.
  2. **Pipeline Invariant Guard:** The certificate generation service independently queries the database to ensure every required stage in the application's assigned `workflow_version_id` has status `APPROVED`. If any stage is `PENDING`, `FLAGGED`, or `LOCKED`, certificate generation throws a hard HTTP 403 error.
  3. **Separation of Duties:** Administrative staff who are also enrolled students are strictly barred from reviewing their own records (`WHERE applicant_student_id != reviewer_student_id`).

#### C. Tamper-Evident Certificate Verification
- **Threat:** An individual forges a paper clearance certificate or manipulates a PDF.
- **Defense:**
  1. **QR Code Integrity:** The QR code does not contain the verification data itself (which could be spoofed); it embeds a direct HTTPS link containing an unguessable 128-bit cryptographic verification token (`/verify-certificate/MU-VTOK-...`).
  2. **Server-Authoritative Verification:** Scanning the QR code triggers a server lookup against the authoritative database. The public verification page renders the live clearance state, official issue date, student name, and revocation status directly from the server.
  3. **Revocation Registry:** If a student’s clearance is revoked due to discovered academic dishonesty or unpaid debts, the certificate is marked `is_revoked = true` with a recorded timestamp and explanation. The public verification portal immediately displays a prominent red **REVOKED** warning.

#### D. Secure File Uploads (Bank Slips & Documents)
- Files are limited to $5\text{MB}$ and validated strictly by MIME type (`image/png`, `image/jpeg`, `application/pdf`).
- Files are assigned random UUID filenames to prevent path traversal (`../../`).
- Files are stored outside the public web root and served exclusively through authenticated, streaming endpoints with appropriate `Content-Disposition` headers.

#### E. Network & Application Hardening
- **Helmet Middleware:** Enforces HTTP Strict Transport Security (HSTS), X-Content-Type-Options: `nosniff`, and Frameguard against clickjacking.
- **Rate Limiting:** Global rate limit ($100$ requests per $15$ minutes per IP) with strict throttling on `/api/v1/auth/login` ($5$ attempts per minute).
- **CORS:** Restricted to trusted Metropolitan University portal domains (`https://*.metrouni.edu.bd`).
- **Audit Logging:** Every critical administrative and financial action writes an append-only row containing user ID, action tag, target entity, metadata diff, client IP address, and timestamp.

