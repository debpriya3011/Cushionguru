import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@cushion/database';
import { sendInvitationEmail } from '../services/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthController {
  /**
   * Login user
   */
  async login(req: Request, res: Response) {
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
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request, res: Response) {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
  }

  /**
   * Create invitation
   */
  async createInvitation(req: Request, res: Response) {
    const { email, name, role, retailerId } = req.body;
    const createdById = (req as any).user?.id;

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

    // Check for existing active invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return res.status(409).json({ error: 'Active invitation already exists for this email' });
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
        createdById,
      },
    });

    // Send invitation email
    try {
      await sendInvitationEmail(email, name, token);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }

    res.status(201).json({
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(req: Request, res: Response) {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

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
        role: decoded.role,
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
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  }
}

export const authController = new AuthController();
