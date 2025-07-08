import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate, requireRole } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get all users (admin only)
  router.get('/', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  }));

  // Get user by ID
  router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Users can only access their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  }));

  // Update user profile
  router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { firstName, lastName, phone, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        firstName,
        lastName,
        phone,
        email,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user });
  }));

  // Add user address
  router.post('/:id/addresses', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const {
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        firstName,
        lastName,
        company,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        phone,
        isDefault,
      },
    });

    res.status(201).json({ success: true, data: address });
  }));

  // Update user address
  router.put('/:id/addresses/:addressId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { isDefault, ...addressData } = req.body;

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.addressId },
      data: {
        ...addressData,
        isDefault,
      },
    });

    res.json({ success: true, data: address });
  }));

  // Delete user address
  router.delete('/:id/addresses/:addressId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await prisma.address.delete({
      where: { id: req.params.addressId },
    });

    res.json({ success: true, message: 'Address deleted successfully' });
  }));

  // Change password
  router.put('/:id/password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { newPassword } = req.body;
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  }));

  return router;
};
