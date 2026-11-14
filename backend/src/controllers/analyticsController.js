const prisma = require('../config/prisma');

/**
 * Returns comprehensive administrative KPIs and turnaround analytics for Metropolitan University portal.
 */
const getSystemAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      verifiedPayments,
      invoices,
      clearanceApps,
      certificatesIssued,
      stageInstances
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.paymentTransaction.findMany({
        where: { status: 'VERIFIED' },
        select: { amountBdt: true }
      }),
      prisma.studentInvoice.findMany({
        select: { totalAmountBdt: true, paidAmountBdt: true, outstandingBalanceBdt: true }
      }),
      prisma.clearanceApplication.findMany({
        select: { status: true, clearanceTypeId: true, createdAt: true }
      }),
      prisma.certificate.count({ where: { isRevoked: false } }),
      prisma.clearanceStageInstance.findMany({
        include: { workflowStage: true }
      })
    ]);

    // Financial Totals
    const totalCollectedBdt = verifiedPayments.reduce((acc, p) => acc + p.amountBdt, 0);
    const totalBilledBdt = invoices.reduce((acc, inv) => acc + inv.totalAmountBdt, 0);
    const totalOutstandingBdt = invoices.reduce((acc, inv) => acc + inv.outstandingBalanceBdt, 0);
    const collectionRate = totalBilledBdt > 0 ? ((totalCollectedBdt / totalBilledBdt) * 100).toFixed(1) : 0;

    // Clearance Status Distribution
    const clearanceMetrics = {
      total: clearanceApps.length,
      approved: clearanceApps.filter((a) => a.status === 'APPROVED').length,
      inProgress: clearanceApps.filter((a) => a.status === 'IN_PROGRESS').length,
      flagged: clearanceApps.filter((a) => a.status === 'FLAGGED').length,
      rejected: clearanceApps.filter((a) => a.status === 'REJECTED').length,
      certificatesIssued
    };

    // Department Queue Bottlenecks
    const departmentBottlenecks = {
      ACCOUNTS: { name: 'Accounts Section (NRBC Bank)', pending: 0, approved: 0 },
      LIBRARY: { name: 'Prof. M. H. Rahman Central Library', pending: 0, approved: 0 },
      LABS: { name: 'Computing & Hardware Laboratories', pending: 0, approved: 0 },
      HALL: { name: 'Female Resident Hall Admin', pending: 0, approved: 0 },
      CSE: { name: 'Head of Academic Department', pending: 0, approved: 0 },
      EXAM_RECORDS: { name: 'Office of the Controller of Examinations', pending: 0, approved: 0 }
    };

    stageInstances.forEach((si) => {
      const code = si.workflowStage?.departmentCode;
      if (departmentBottlenecks[code]) {
        if (si.status === 'PENDING' || si.status === 'FLAGGED') {
          departmentBottlenecks[code].pending += 1;
        } else if (si.status === 'APPROVED') {
          departmentBottlenecks[code].approved += 1;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        financials: {
          totalCollectedBdt,
          totalBilledBdt,
          totalOutstandingBdt,
          collectionRate: `${collectionRate}%`
        },
        clearance: clearanceMetrics,
        departmentBottlenecks
      }
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to generate analytics metrics.' });
  }
};

module.exports = {
  getSystemAnalytics
};

