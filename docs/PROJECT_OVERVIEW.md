# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: Project Overview & Institutional Profile
**Code:** `CPCS-MU-DOC-001`  
**Version:** 1.0.0 (Production Architecture)  
**Date of Verification:** 2026-11-11  
**Source Domain:** [https://metrouni.edu.bd/](https://metrouni.edu.bd/) (Metropolitan University, Bateshwar, Sylhet, Bangladesh)

---

### 1. Executive Summary

Metropolitan University (MU), located in Bateshwar, Sylhet, Bangladesh, is a premier private university established in 2003 under the Private University Act. The institution operates multiple schools covering Science & Technology, Business & Economics, Law, and Humanities & Social Sciences.

As the university expands its academic offerings and student body, traditional paper-based clearance and fragmented fee collection create administrative bottlenecks during semester final exams, convocation, provisional certificate issuance, and transcript delivery. 

The **Integrated Financial Management & Digital Clearance Portal** is a centralized, enterprise-grade digital platform designed to bridge students, the Accounts Section, the Central Library, Departmental Laboratories, Hall Administration, Academic Department Heads, the Controller of Examinations, and the Registrar’s Office into an auditable, event-driven, automated ecosystem.

---

### 2. Institutional Context & Authentic Data Baseline

All university-specific baseline data has been derived and verified from the official university website ([metrouni.edu.bd](https://metrouni.edu.bd/)):

| University Dimension | Verified Official Information | Source URL / Verification Reference |
|---|---|---|
| **Location & Campus** | Bateshwar, Sylhet-3103, Bangladesh | `metrouni.edu.bd` |
| **Banking Partner** | NRB Commercial Bank PLC (NRBC Bank), Metropolitan University Campus Branch | Account: `015954000000001` (`metrouni.edu.bd/payment-instructions`) |
| **Mobile Banking (MFS)** | bKash Education Fee Portal & Nagad Merchant Channels | Helplines: `01757535844`, `01757537550` |
| **Academic Schools** | School of Science & Technology, School of Business & Economics, School of Law, School of Humanities & Social Sciences | `metrouni.edu.bd/academics/departments` |
| **Primary Departments** | Computer Science & Engineering (CSE), Software Engineering (SWE), Electrical & Electronic Engineering (EEE), Data Science, Business Administration, Economics, English, Law & Justice | `metrouni.edu.bd/academics` |
| **Grading System** | UGC Standard Grading Scale ($A+$ 4.00 to $D$ 2.00, $F$ 0.00) | `metrouni.edu.bd/academic-policies` |
| **Course Evaluation** | Final Exam (40%), Mid-term (30%), Class Tests/Assignments (20%), Attendance & Participation (10%) | `metrouni.edu.bd/academic-policies` |
| **Tuition Installments** | Four (4) equal installments per academic term/semester | `metrouni.edu.bd/payment-policy` |
| **Certificate/Transcript Fees** | - Transcript: Normal (7 days) = BDT 1,000 / Urgent (1 day) = BDT 1,500<br>- PPC & Transcript: Normal = BDT 2,000 / Urgent = BDT 3,000<br>- Original Certificate: Normal (8–14 days) = BDT 5,000 / Urgent = BDT 7,000 | `metrouni.edu.bd/controller-of-examinations` |
| **Central Library** | Prof. M. Habibur Rahman Central Library (Sat-Thu 8:30am - 8:00pm, Fri 4:00pm - 8:00pm) | `metrouni.edu.bd/facilities/library` |
| **Laboratories** | CSE Software Labs, Hardware & Microprocessor Labs, EEE Power & Circuit Labs | `metrouni.edu.bd/facilities/labs` |
| **Student Residences** | Dedicated Female Resident Halls (CCTV, 24/7 security guards), Staff Accommodations | `metrouni.edu.bd/facilities/accommodation` |
| **One Stop Service (OSSC)** | Rapid-dispatch academic documentation, provisional mark sheets, MOI, certificates | `metrouni.edu.bd/one-stop-service` |

---

### 3. Dual System Architecture Scope

The unified portal brings together two core mission-critical systems:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             METROPOLITAN UNIVERSITY INTEGRATED CAMPUS MANAGEMENT PORTAL                │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ 1. FINANCIAL MANAGEMENT & PAYMENTS        │ 2. DIGITAL CLEARANCE & CERTIFICATION       │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Credit & Term-based Tuition Engine      │ • Configurable Multi-Stage Workflow Engine │
│ • 4-Installment Due Schedule Engine       │ • Semester Final Exam Clearance            │
│ • Bank Deposit Verification (NRBC Slip)   │ • Graduation & Convocation Clearance       │
│ • MFS (bKash/Nagad) Digital Gateway Layer │ • Library, Lab, Hall, Accounts Sign-Offs   │
│ • Double-Entry Authoritative Ledger       │ • Issue Flagging & Resubmission Lifecycle  │
│ • Waivers, Scholarships, Late Fines       │ • Tamper-Evident Cryptographic Certificates│
│ • Downloadable Receipts with Barcode      │ • Public Server-Verified QR Authenticator  │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

### 4. Core Development Philosophy: Extensibility First

To ensure this platform scales gracefully into a comprehensive University ERP:
1. **Modular Monolith First**: Clear domain boundaries, decoupling business logic from transport and persistence layers, enabling future microservices extraction without code rewrites.
2. **Rule-Driven Configuration**: No hardcoded fees, approval sequences, or department lists. Everything is database-driven and manageable via Super Admin UI.
3. **Immutable Financial History & Ledger**: Financial entries are never deleted or silently modified; reversals, adjustments, and audit trails govern ledger integrity.
4. **Separation of Concerns**: Strict RBAC enforced at the API layer with row-level and field-level clearance security guards.

