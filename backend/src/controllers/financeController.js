const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const TuitionWaiverService = require('../services/tuitionWaiverService');
const FineCalculationService = require('../services/fineCalculationService');

/**
 * Returns comprehensive student financial overview with transparent tuition waiver and fines.
 */
const getMyFinancialOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        programme: { include: { department: true, programmeFeeStructures: { where: { isActive: true }, take: 1 } } },
        invoices: {
          include: {
            academicTerm: true,
            installmentSchedules: { orderBy: { installmentNumber: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        },
        semesterRegistrations: {
          include: { academicTerm: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        waivers: { where: { status: 'ACTIVE' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const feeStructure = student.programme?.programmeFeeStructures?.[0];
    const baseMonthlyTuition = feeStructure ? feeStructure.monthlyCreditFeeBdt : 8000.0;
    const waiverPercentage = student.tuitionWaiverPercentage || 0;
    
    // Tuition Breakdown via Service
    const tuitionBreakdown = TuitionWaiverService.calculateTuitionBreakdown(baseMonthlyTuition, waiverPercentage);

    // Fine Assessment via Service
    const fineAssessment = await FineCalculationService.assessStudentFines(student.id);

    // Semester Registration Status
    const semesterReg = student.semesterRegistrations?.[0];
    const isSemesterRegPaid = semesterReg ? semesterReg.isFeePaid : false;
    const semesterRegFeeBdt = semesterReg ? semesterReg.registrationFeeBdt : (feeStructure?.registrationFeeBdt || 15000.0);
    const semesterRegFineBdt = fineAssessment.semesterRegFine?.fineAmountBdt || 0;

    // Invoices & Balance Summary
    const latestInvoice = student.invoices?.[0];
    const totalOutstanding = latestInvoice ? latestInvoice.outstandingBalanceBdt : 0;
    const totalPaid = latestInvoice ? latestInvoice.paidAmountBdt : 0;

    // Itemized Fee Table
    const itemizedFeeTable = [
      {
        description: 'Monthly Tuition (Credit Fee)',
        originalAmount: baseMonthlyTuition,
        waiverDiscount: tuitionBreakdown.discountAmount,
        waiverPercentage: tuitionBreakdown.waiverPercentage,
        fineAmount: fineAssessment.totalTuitionFineBdt,
        payableAmount: tuitionBreakdown.payableTuition + fineAssessment.totalTuitionFineBdt,
        status: (latestInvoice?.installmentSchedules?.every(i => i.status === 'PAID')) ? 'PAID' : 'PENDING'
      },
      {
        description: 'Semester Registration Fee',
        originalAmount: semesterRegFeeBdt,
        waiverDiscount: 0,
        waiverPercentage: 0,
        fineAmount: semesterRegFineBdt,
        payableAmount: isSemesterRegPaid ? 0 : semesterRegFeeBdt + semesterRegFineBdt,
        status: isSemesterRegPaid ? 'PAID' : 'PENDING'
      },
      {
        description: 'Campus Activities & IT Fee',
        originalAmount: feeStructure?.activitiesFeeBdt || 2000.0,
        waiverDiscount: 0,
        waiverPercentage: 0,
        fineAmount: 0,
        payableAmount: feeStructure?.activitiesFeeBdt || 2000.0,
        status: 'PAID'
      },
      {
        description: 'BNCC & Rover Scout Fee',
        originalAmount: feeStructure?.bnccFeeBdt || 500.0,
        waiverDiscount: 0,
        waiverPercentage: 0,
        fineAmount: 0,
        payableAmount: feeStructure?.bnccFeeBdt || 500.0,
        status: 'PAID'
      },
      {
        description: 'Semester Final Examination Fee',
        originalAmount: 3000.0,
        waiverDiscount: 0,
        waiverPercentage: 0,
        fineAmount: 0,
        payableAmount: 3000.0,
        status: isSemesterRegPaid ? 'ELIGIBLE' : 'HOLD'
      }
    ];

    res.json({
      success: true,
      summary: {
        totalOutstanding,
        totalPaid,
        totalLateFine: fineAssessment.totalLateFineBdt,
        monthlyTuition: tuitionBreakdown.payableTuition,
        tuitionWaiverPercentage,
        isSemesterRegPaid,
        scholarshipCategory: student.scholarshipCategory
      },
      tuitionBreakdown,
      fineAssessment,
      semesterRegistration: {
        isPaid: isSemesterRegPaid,
        amountBdt: semesterRegFeeBdt,
        fineAmountBdt: semesterRegFineBdt,
        status: semesterReg?.status || 'PENDING_FEE'
      },
      itemizedFeeTable,
      installments: latestInvoice?.installmentSchedules || [],
      recentPayments: student.payments
    });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ success: false, message: 'Failed to compile financial overview.' });
  }
};

/**
 * Returns invoices and 4-installment schedules for student.
 */
const getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId },
      include: { programme: true }
    });

    if (!studentProfile) {
      return res.json({ success: true, invoices: [] });
    }

    const invoices = await prisma.studentInvoice.findMany({
      where: { studentId: studentProfile.id },
      include: {
        academicTerm: true,
        items: { include: { feeCategory: true } },
        installmentSchedules: { orderBy: { installmentNumber: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      student: {
        studentId: studentProfile.studentIdNumber,
        programme: studentProfile.programme.title,
        batch: studentProfile.batchNumber,
        cgpa: studentProfile.cgpa
      },
      invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student invoices.' });
  }
};

/**
 * Returns double-entry ledger history for student.
 */
const getMyLedger = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId }
    });

    if (!studentProfile) {
      return res.json({ success: true, ledgerEntries: [], currentBalance: 0 });
    }

    const ledgerEntries = await prisma.studentLedgerEntry.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' }
    });

    const totalDebits = ledgerEntries
      .filter((e) => e.entryType.startsWith('DEBIT'))
      .reduce((acc, curr) => acc + curr.amountBdt, 0);

    const totalCredits = ledgerEntries
      .filter((e) => e.entryType.startsWith('CREDIT'))
      .reduce((acc, curr) => acc + curr.amountBdt, 0);

    const currentBalance = totalDebits - totalCredits;

    res.json({
      success: true,
      currentBalance,
      totalDebits,
      totalCredits,
      ledgerEntries
    });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ledger.' });
  }
};

/**
 * List all configured fee categories.
 */
const getFeeCategories = async (req, res) => {
  try {
    const categories = await prisma.feeCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fee categories.' });
  }
};

/**
 * Admin creates or updates a fee category.
 */
const createFeeCategory = async (req, res) => {
  try {
    const { code, name, description, isRecurring } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Category code and name are required.' });
    }

    const category = await prisma.feeCategory.upsert({
      where: { code: code.toUpperCase().trim() },
      update: { name, description, isRecurring: Boolean(isRecurring) },
      create: { code: code.toUpperCase().trim(), name, description, isRecurring: Boolean(isRecurring) }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'FEE_CATEGORY_CONFIGURED',
      entityType: 'FEE_CATEGORY',
      entityId: category.id,
      details: { code: category.code, name: category.name },
      req
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to configure fee category.' });
  }
};

module.exports = {
  getMyFinancialOverview,
  getMyInvoices,
  getMyLedger,
  getFeeCategories,
  createFeeCategory
};

