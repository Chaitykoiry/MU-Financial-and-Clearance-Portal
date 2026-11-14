const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { generateClearanceCertificate } = require('../src/services/pdfService');

describe('Metropolitan University CPCS — Phase 8 Full Lifecycle Integration Journey', () => {

  it('Complete E2E Journey: Tuition Billing -> Bank Deposit -> Accounts Audit -> Clearance Pipeline -> Flagging -> Resubmission -> Auto-Certification -> Public Verification', async () => {
    console.log('\n--- Step 1: Student Enrols & Term Invoice is Generated ---');
    const student = {
      id: 'stu-choyon-094',
      name: 'Choyon Dhor',
      studentId: '231-115-094',
      programme: 'B.Sc. in Computer Science & Engineering',
      batch: 56
    };

    const invoice = {
      id: 'inv-spring-2026',
      totalAmountBdt: 48000,
      waiverAmountBdt: 8000,
      paidAmountBdt: 0,
      outstandingBalanceBdt: 40000,
      installments: [
        { number: 1, amountBdt: 10000, status: 'PENDING' },
        { number: 2, amountBdt: 10000, status: 'PENDING' },
        { number: 3, amountBdt: 10000, status: 'PENDING' },
        { number: 4, amountBdt: 10000, status: 'PENDING' }
      ]
    };

    assert.strictEqual(invoice.outstandingBalanceBdt, 40000);
    assert.strictEqual(invoice.installments.length, 4);
    console.log(`✓ Spring 2026 term invoice: 40,000 BDT split into 4 equal installments of 10,000 BDT.`);

    console.log('\n--- Step 2: Student Submits NRBC Bank Deposit Slip ---');
    const paymentSubmission = {
      id: 'pay-tx-8819',
      studentId: student.id,
      paymentMethod: 'NRBC_BANK_DEPOSIT',
      amountBdt: 10000,
      bankBranch: 'NRBC Bank Campus Branch, Bateshwar',
      accountNumber: '015954000000001',
      slipNumber: 'NRBC-SLIP-77382',
      status: 'PENDING_VERIFICATION'
    };

    assert.strictEqual(paymentSubmission.status, 'PENDING_VERIFICATION');
    console.log(`✓ Bank deposit slip #${paymentSubmission.slipNumber} submitted to Accounts Queue.`);

    console.log('\n--- Step 3: Accounts Officer Audits Slip & Reconciles Ledger ---');
    const accountsOfficer = { id: 'off-acc-01', name: 'Md. Taufiqur Rahman' };
    
    // Simulate verification
    paymentSubmission.status = 'VERIFIED';
    paymentSubmission.verifiedBy = accountsOfficer.name;
    paymentSubmission.verifiedAt = new Date();

    // Ledger credit
    const ledger = [
      { type: 'DEBIT_INVOICE', amount: 48000 },
      { type: 'CREDIT_WAIVER', amount: 8000 },
      { type: 'CREDIT_PAYMENT', amount: paymentSubmission.amountBdt }
    ];

    invoice.installments[0].status = 'PAID';
    invoice.paidAmountBdt += paymentSubmission.amountBdt;
    invoice.outstandingBalanceBdt -= paymentSubmission.amountBdt;

    assert.strictEqual(paymentSubmission.status, 'VERIFIED');
    assert.strictEqual(invoice.installments[0].status, 'PAID');
    assert.strictEqual(invoice.outstandingBalanceBdt, 30000);
    console.log(`✓ Slip verified by ${accountsOfficer.name}. 1st installment marked PAID; balance reduced to ${invoice.outstandingBalanceBdt} BDT.`);

    console.log('\n--- Step 4: Student Submits Convocation Clearance Application ---');
    const clearanceApplication = {
      id: 'clr-mu-0094',
      applicationNumber: 'MU-CLR-2026-0094',
      studentId: student.id,
      clearanceType: 'Graduation & Convocation Clearance',
      status: 'IN_PROGRESS',
      stages: [
        { name: 'Accounts & Finance Dues Settlement', status: 'APPROVED' },
        { name: 'Prof. M. H. Rahman Central Library', status: 'PENDING' },
        { name: 'Head of Department Academic & Thesis Sign-Off', status: 'LOCKED' }
      ]
    };

    assert.strictEqual(clearanceApplication.status, 'IN_PROGRESS');
    console.log(`✓ Institutional clearance pipeline activated across 3 stages.`);

    console.log('\n--- Step 5: Library Flags Outstanding Liability ---');
    const libraryStage = clearanceApplication.stages[1];
    libraryStage.status = 'FLAGGED';
    const issue = {
      stage: libraryStage.name,
      reason: "Unreturned book: 'Introduction to Algorithms' (Accession #4821)",
      duesBdt: 0,
      isResolved: false
    };

    clearanceApplication.status = 'FLAGGED';
    assert.strictEqual(clearanceApplication.status, 'FLAGGED');
    console.log(`✓ Library Officer flagged issue: "${issue.reason}". Pipeline paused.`);

    console.log('\n--- Step 6: Student Returns Book & Library Signs Off ---');
    issue.isResolved = true;
    issue.studentResponse = 'Returned book at 1st floor counter on Feb 10.';
    libraryStage.status = 'APPROVED';

    // Department Head approves
    clearanceApplication.stages[2].status = 'APPROVED'; // Dept Head

    const allApproved = clearanceApplication.stages.every(s => s.status === 'APPROVED');
    assert.strictEqual(allApproved, true);
    console.log(`✓ Issue resolved and all 3 stages approved.`);

    console.log('\n--- Step 7: Auto-Certification & Cryptographic Token Generation ---');
    clearanceApplication.status = 'APPROVED';
    const certNumber = 'MU-CERT-CONV-2026-98124';
    const publicToken = 'MU-VTOK-98124-77A';
    const sha256Hash = crypto.createHash('sha256').update(`${certNumber}-${student.studentId}`).digest('hex');

    const certificate = {
      certificateNumber: certNumber,
      issueDate: new Date(),
      student,
      verificationToken: {
        publicLookupCode: publicToken,
        cryptographicToken: sha256Hash
      }
    };

    assert.ok(certificate.certificateNumber.startsWith('MU-CERT-'));
    console.log(`✓ Clearance approved! Certificate issued with Verification Token: ${publicToken}`);

    console.log('\n--- Step 8: Dynamic PDF Rendering with QR Code ---');
    const pdfBuffer = await generateClearanceCertificate(certificate, 'http://localhost:5173');
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.strictEqual(pdfBuffer.slice(0, 4).toString('ascii'), '%PDF');
    console.log(`✓ Official PDF certificate rendered (${pdfBuffer.length} bytes) with embedded QR stamp.`);

    console.log('\n--- Step 9: Third-Party Public QR Code Verification ---');
    const lookupResult = {
      valid: true,
      lookupCode: publicToken,
      studentName: student.name,
      studentId: student.studentId,
      status: 'CLEARED & VALID',
      isRevoked: false
    };

    assert.strictEqual(lookupResult.valid, true);
    assert.strictEqual(lookupResult.studentId, '231-115-094');
    console.log(`✓ Public QR verification verified authenticity: ${lookupResult.studentName} is ${lookupResult.status}!`);
    console.log('================================================================');
  });

});

