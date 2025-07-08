import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/auth';

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get user's cart
  router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { images: true, category: true }
        }
      },
    });

    const total = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    res.json({ success: true, data: { items: cartItems, total } });
  }));

  // Add item to cart
  router.post('/add', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { productId, quantity } = req.body;

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
      return res.json({ success: true, data: updatedItem });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user.id,
        productId,
        quantity,
      },
    });

    res.status(201).json({ success: true, data: cartItem });
  }));

  // Update cart item quantity
  router.put('/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { quantity },
    });

    res.json({ success: true, data: cartItem });
  }));

  // Remove item from cart
  router.delete('/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.cartItem.delete({
      where: { id: req.params.itemId },
    });

    res.json({ success: true, message: 'Item removed from cart' });
  }));

  // Clear cart
  router.delete('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ success: true, message: 'Cart cleared' });
  }));

  return router;
};
