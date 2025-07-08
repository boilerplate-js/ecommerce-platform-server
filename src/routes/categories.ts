import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { authenticate, requireRole } from '../middleware/auth';
import { slugify } from '../utils/database';

const router = express.Router();

export default (prisma: PrismaClient) => {
  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: List of categories
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Category'
   */
  router.get('/', asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  }));

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Category details
   *       404:
   *         description: Category not found
   */
  router.get('/:id', asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        children: true,
        parent: true,
        products: {
          include: { images: true },
          where: { isActive: true }
        }
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: category });
  }));

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               parentId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  router.post('/', authenticate, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, parentId } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        description,
        parentId,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: category });
  }));

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Update category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               parentId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Category updated successfully
   *       404:
   *         description: Category not found
   */
  router.put('/:id', authenticate, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, parentId } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        slug: slugify(name),
        description,
        parentId,
      },
    });

    res.json({ success: true, data: category });
  }));

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Delete category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Category deleted successfully
   *       404:
   *         description: Category not found
   */
  router.delete('/:id', authenticate, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Category deleted successfully' });
  }));

  return router;
};
