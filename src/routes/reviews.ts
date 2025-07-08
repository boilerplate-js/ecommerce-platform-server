import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get reviews for a product
  router.get('/product/:productId', asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { 
        productId: req.params.productId,
        isApproved: true 
      },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: reviews });
  }));

  // Create review
  router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { productId, rating, title, comment } = req.body;

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating,
        title,
        comment,
        isApproved: false,
      },
    });

    res.status(201).json({ success: true, data: review });
  }));

  // Approve review (admin only)
  router.put('/:id/approve', authenticate, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });

    res.json({ success: true, data: review });
  }));

  // Delete review
  router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await prisma.review.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  }));

  return router;
};
