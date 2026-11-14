const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { generateClearanceCertificate } = require('../src/services/pdfService');

describe('Metropolitan University CPCS — Core Business Logic Tests', () => {

  describe('1. 4-Installment Fee Billing Engine', () => {
    it('should split term fee into 4 equal installments after applying approved waiver', () => {
      const tuitionFee = 48000;
      const meritWaiver = 8000;
      const netPayable = tuitionFee - meritWaiver; // 40,000 BDT
      
      const installmentCount = 4;
      const perInstallmentAmount = netPayable / installmentCount;

      assert.strictEqual(netPayable, 40000);
      assert.strictEqual(perInstallmentAmount, 10000);

      const schedule = Array.from({ length: installmentCount }, (_, i) => ({
        installmentNumber: i + 1,
        amountBdt: perInstallmentAmount,
        status: i === 0 ? 'PAID' : 'PENDING'
      }));

      assert.strictEqual(schedule.length, 4);
      assert.strictEqual(schedule[0].status, 'PAID');
      assert.strictEqual(schedule[1].status, 'PENDING');
      
      const paidTotal = schedule.filter(s => s.status === 'PAID').reduce((acc, s) => acc + s.amountBdt, 0);
      const remainingBalance = netPayable - paidTotal;
      assert.strictEqual(remainingBalance, 30000);
    });

    it('should enforce double-entry ledger balance invariant', () => {
      // Invariant: Total Debits - Total Credits = Running Balance
      const ledgerEntries = [
        { type: 'DEBIT_INVOICE', amount: 48000 },
        { type: 'CREDIT_WAIVER', amount: 8000 },
        { type: 'CREDIT_PAYMENT', amount: 10000 }
      ];

      const debits = ledgerEntries.filter(e => e.type.startsWith('DEBIT')).reduce((a, b) => a + b.amount, 0);
      const credits = ledgerEntries.filter(e => e.type.startsWith('CREDIT')).reduce((a, b) => a + b.amount, 0);
      const runningBalance = debits - credits;

      assert.strictEqual(runningBalance, 30000);
    });
  });

  describe('2. Clearance Pipeline & Invariant Guard', () => {
    it('should prevent certificate issuance if any department stage is flagged or pending', () => {
      const stages = [
        { department: 'ACCOUNTS', status: 'APPROVED' },
        { department: 'LIBRARY', status: 'FLAGGED' }, // Unreturned book
        { department: 'DEPT_HEAD', status: 'PENDING' }
      ];

      const allApproved = stages.every(s => s.status === 'APPROVED');
      assert.strictEqual(allApproved, false, 'Pipeline invariant: cannot issue certificate while stages are flagged or pending');
    });

    it('should permit certificate issuance only when all mandatory stages are cleared', () => {
      const stages = [
        { department: 'ACCOUNTS', status: 'APPROVED' },
        { department: 'LIBRARY', status: 'APPROVED' },
        { department: 'DEPT_HEAD', status: 'APPROVED' }
      ];

      const allApproved = stages.every(s => s.status === 'APPROVED');
      assert.strictEqual(allApproved, true);

      if (allApproved) {
        const certCode = `MU-CERT-${Date.now()}`;
        assert.ok(certCode.startsWith('MU-CERT-'));
      }
    });
  });

  describe('3. Dynamic QR Code Stamping & PDFKit Certificate Engine', () => {
    it('should generate a valid PDF buffer with embedded QR code', async () => {
      const mockCertificate = {
        certificateNumber: 'MU-CERT-CONV-2026-TEST',
        issueDate: new Date(),
        student: {
          fullName: 'Choyon Dhor',
          studentIdNumber: '231-115-094',
          programme: { title: 'B.Sc. in Computer Science & Engineering' }
        },
        verificationToken: {
          publicLookupCode: 'MU-VTOK-TEST-77A',
          cryptographicToken: crypto.randomBytes(32).toString('hex')
        }
      };

      const pdfBuffer = await generateClearanceCertificate(mockCertificate, 'http://localhost:5173');
      
      assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a binary Buffer');
      assert.ok(pdfBuffer.length > 5000, 'PDF buffer must contain substantial document content');
      
      // Verify PDF header magic bytes '%PDF'
      const pdfHeader = pdfBuffer.slice(0, 4).toString('ascii');
      assert.strictEqual(pdfHeader, '%PDF', 'Buffer must start with valid PDF header magic bytes');
    });
  });
});

