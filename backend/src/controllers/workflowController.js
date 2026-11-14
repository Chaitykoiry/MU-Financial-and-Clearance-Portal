const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');

/**
 * Returns all workflow templates with stages.
 */
const getWorkflowTemplates = async (req, res) => {
  try {
    const templates = await prisma.workflowTemplate.findMany({
      include: {
        clearanceType: true,
        versions: {
          include: {
            stages: { orderBy: { sequenceOrder: 'asc' } }
          },
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    res.json({ success: true, count: templates.length, templates });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow templates.' });
  }
};

/**
 * Super Admin updates or versions a clearance workflow pipeline.
 */
const saveWorkflowVersion = async (req, res) => {
  try {
    const { templateId, stages } = req.body;
    const adminId = req.user.id;

    if (!templateId || !Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ success: false, message: 'Template ID and ordered stages array are required.' });
    }

    const template = await prisma.workflowTemplate.findUnique({
      where: { id: templateId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Workflow template not found.' });
    }

    const currentVersion = template.versions[0]?.versionNumber || 0;
    const nextVersionNumber = currentVersion + 1;

    // Create a new version with the stages
    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.workflowVersion.create({
        data: {
          templateId,
          versionNumber: nextVersionNumber,
          isPublished: true
        }
      });

      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        await tx.workflowStage.create({
          data: {
            workflowVersionId: version.id,
            sequenceOrder: i + 1,
            departmentCode: s.departmentCode,
            stageName: s.stageName,
            isConditional: Boolean(s.isConditional),
            conditionRules: s.conditionRules || null
          }
        });
      }

      return version;
    });

    await recordAuditLog({
      userId: adminId,
      action: 'WORKFLOW_VERSION_PUBLISHED',
      entityType: 'WORKFLOW_VERSION',
      entityId: newVersion.id,
      details: { templateName: template.name, versionNumber: nextVersionNumber, totalStages: stages.length },
      req
    });

    const fullVersion = await prisma.workflowVersion.findUnique({
      where: { id: newVersion.id },
      include: { stages: { orderBy: { sequenceOrder: 'asc' } } }
    });

    res.status(201).json({
      success: true,
      message: `Workflow published successfully as Version ${nextVersionNumber}.`,
      version: fullVersion
    });
  } catch (error) {
    console.error('Error saving workflow version:', error);
    res.status(500).json({ success: false, message: 'Failed to publish workflow version.' });
  }
};

module.exports = {
  getWorkflowTemplates,
  saveWorkflowVersion
};

