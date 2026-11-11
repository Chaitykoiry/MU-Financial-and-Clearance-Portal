const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { officers: true, approvals: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { code, name, description, requiresPayment } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Department code already exists.' });
    }

    const department = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description,
        requiresPayment: Boolean(requiresPayment)
      }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      details: { code: department.code, name: department.name },
      req
    });

    res.status(201).json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create department.' });
  }
};

module.exports = {
  getDepartments,
  createDepartment
};

