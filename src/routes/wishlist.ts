import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get wishlist
  router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { images: true, category: true },
        },
      },
    });

    res.json({ success: true, data: wishlistItems });
  }));

  // Add to wishlist
  router.post('/add', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { productId } = req.body;

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existingItem) {
      return res.status(400).json({ success: false, error: 'Product is already in wishlist' });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });

    res.status(201).json({ success: true, data: wishlistItem });
  }));

  // Remove from wishlist
  router.delete('/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.wishlistItem.delete({
      where: { id: req.params.itemId },
    });

    res.json({ success: true, message: 'Item removed from wishlist' });
  }));

  return router;
};

