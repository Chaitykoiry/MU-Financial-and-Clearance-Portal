const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');

const register = async (req, res) => {
  try {
    const { email, password, fullName, matricOrStaffId, role, departmentId } = req.body;

    if (!email || !password || !fullName || !matricOrStaffId) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { matricOrStaffId }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email or Matric/Staff ID already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        matricOrStaffId,
        role: role || 'STUDENT',
        departmentId: departmentId || null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        matricOrStaffId: true,
        role: true,
        departmentId: true,
        createdAt: true
      }
    });

    await recordAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      req
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecret_cpcs_jwt_signing_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Dedicated Student Portal Login (Passwordless — Student ID Only)
 * Students authenticate directly using their Student ID (e.g. 231-115-094).
 * Enforces role === 'STUDENT'
 */
const studentLogin = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId || !String(studentId).trim()) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const trimmedId = String(studentId).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { matricOrStaffId: { equals: trimmedId, mode: 'insensitive' } },
          { email: { equals: trimmedId, mode: 'insensitive' } },
          { studentProfile: { studentIdNumber: { equals: trimmedId, mode: 'insensitive' } } }
        ]
      },
      include: {
        studentProfile: {
          include: { programme: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Student ID not found in Metropolitan University records.' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'This portal is reserved for students. Administrative officers must login via the Administration Portal.'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, studentProfileId: user.studentProfile?.id },
      process.env.JWT_SECRET || 'supersecret_cpcs_jwt_signing_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await recordAuditLog({
      userId: user.id,
      action: 'STUDENT_PORTAL_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { studentId: trimmedId, authMode: 'STUDENT_ID_DIRECT' },
      req
    });

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Student login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ success: false, message: 'Server error during student login.' });
  }
};

/**
 * Dedicated Administration Portal Login
 * Enforces role !== 'STUDENT'
 */
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Official email/username and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { matricOrStaffId: identifier }
        ]
      },
      include: { department: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    if (user.role === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student accounts must access via the Student Portal.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecret_cpcs_jwt_signing_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await recordAuditLog({
      userId: user.id,
      action: 'ADMIN_PORTAL_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { identifier, role: user.role },
      req
    });

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Administration login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during administration login.' });
  }
};

/**
 * Universal login for backwards compatibility
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ success: false, message: 'Student ID or staff email is required.' });
    }

    const trimmedIdentifier = String(identifier).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedIdentifier, mode: 'insensitive' } },
          { matricOrStaffId: { equals: trimmedIdentifier, mode: 'insensitive' } },
          { studentProfile: { studentIdNumber: { equals: trimmedIdentifier, mode: 'insensitive' } } }
        ]
      },
      include: { department: true, studentProfile: { include: { programme: true } } }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or Student ID not found.' });
    }

    // Password is ONLY required for Administrative / Officer roles; Students login directly with Student ID
    if (user.role !== 'STUDENT') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required for administrative accounts.' });
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecret_cpcs_jwt_signing_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await recordAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { identifier, role: user.role },
      req
    });

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true, studentProfile: { include: { programme: true } } }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

module.exports = {
  register,
  login,
  studentLogin,
  adminLogin,
  getMe
};
