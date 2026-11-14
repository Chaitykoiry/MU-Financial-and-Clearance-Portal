const prisma = require('../config/prisma');

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, limit = 50 } = req.query;

    const where = {};
    if (action) where.actionTag = action;
    if (entityType) where.entityType = entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, role: true, matricOrStaffId: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10)
    });

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

module.exports = {
  getAuditLogs
};

