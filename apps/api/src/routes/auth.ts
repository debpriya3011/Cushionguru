import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { retailer: true },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        retailerId: user.retailerId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        retailer: user.retailer
          ? {
              id: user.retailer.id,
              businessName: user.retailer.businessName,
            }
          : null,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { retailer: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      retailer: user.retailer
        ? {
            id: user.retailer.id,
            businessName: user.retailer.businessName,
          }
        : null,
    });
  })
);

// Create invitation (Super Admin only)
router.post(
  '/invitations',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, name, role, retailerId } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Generate invitation token
    const token = jwt.sign(
      { email: email.toLowerCase(), name, role, retailerId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        name,
        role,
        retailerId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdById: req.user!.id,
      },
    });

    // TODO: Send invitation email

    res.status(201).json({
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
      },
    });
  })
);

// Accept invitation
router.post(
  '/invitations/accept',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      name: string;
      role: string;
      retailerId?: string;
    };

    // Find invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        email: decoded.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: decoded.email,
        name: decoded.name,
        password: hashedPassword,
        role: decoded.role as any,
        retailerId: decoded.retailerId,
      },
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// Change password
router.post(
  '/change-password',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  })
);

export { router as authRouter };
