const prisma = require('../config/prisma');

/**
 * Helper utility to record immutable audit logs.
 */
async function recordAuditLog({ userId, action, entityType, entityId, details, req }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

module.exports = {
  recordAuditLog
};
