/**
 * Metropolitan University — Fee Structure Controller
 * Manages official published programme fee structures (Undergraduate & Graduate)
 */

const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');

const listFeeStructures = async (req, res) => {
  try {
    const feeStructures = await prisma.programmeFeeStructure.findMany({
      include: {
        programme: {
          include: { department: true }
        }
      },
      orderBy: [
        { programme: { degreeLevel: 'asc' } },
        { programme: { code: 'asc' } }
      ]
    });

    res.json({ success: true, count: feeStructures.length, feeStructures });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve fee structures.' });
  }
};

const getFeeStructureByProgramme = async (req, res) => {
  try {
    const { programmeCode } = req.params;

    const programme = await prisma.programme.findFirst({
      where: { code: programmeCode.toUpperCase() },
      include: {
        department: true,
        programmeFeeStructures: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!programme) {
      return res.status(404).json({ success: false, message: 'Programme not found.' });
    }

    res.json({
      success: true,
      programme,
      feeStructure: programme.programmeFeeStructures?.[0] || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fee structure.' });
  }
};

const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      admissionFeeBdt,
      registrationFeeBdt,
      bnccFeeBdt,
      activitiesFeeBdt,
      monthlyCreditFeeBdt,
      admissionFormFeeBdt,
      isActive
    } = req.body;

    const existing = await prisma.programmeFeeStructure.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Fee structure record not found.' });
    }

    const updated = await prisma.programmeFeeStructure.update({
      where: { id },
      data: {
        ...(admissionFeeBdt !== undefined && { admissionFeeBdt: parseFloat(admissionFeeBdt) }),
        ...(registrationFeeBdt !== undefined && { registrationFeeBdt: parseFloat(registrationFeeBdt) }),
        ...(bnccFeeBdt !== undefined && { bnccFeeBdt: parseFloat(bnccFeeBdt) }),
        ...(activitiesFeeBdt !== undefined && { activitiesFeeBdt: parseFloat(activitiesFeeBdt) }),
        ...(monthlyCreditFeeBdt !== undefined && { monthlyCreditFeeBdt: parseFloat(monthlyCreditFeeBdt) }),
        ...(admissionFormFeeBdt !== undefined && { admissionFormFeeBdt: parseFloat(admissionFormFeeBdt) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'FEE_STRUCTURE_UPDATED',
      entityType: 'FEE_STRUCTURE',
      entityId: id,
      details: req.body,
      req
    });

    res.json({
      success: true,
      message: 'Programme fee structure updated successfully.',
      feeStructure: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update fee structure.' });
  }
};

module.exports = {
  listFeeStructures,
  getFeeStructureByProgramme,
  updateFeeStructure
};

