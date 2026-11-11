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
        password: hashedPassword,
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

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or matricOrStaffId

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
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
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
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
      details: { identifier },
      req
    });

    const { password: _, ...safeUser } = user;

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
      include: { department: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
