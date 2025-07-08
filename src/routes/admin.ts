import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, DashboardStats } from '../types';
import { authenticate, requireRole } from '../middleware/auth';

const router = express.Router();

export default (prisma: PrismaClient) => {
  /**
   * @swagger
   * /api/admin/dashboard:
   *   get:
   *     summary: Get dashboard statistics
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/DashboardStats'
   */
  router.get('/dashboard', authenticate, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Get dashboard statistics
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    // Get sales chart data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesChart = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'PAID',
      },
      orderBy: { createdAt: 'asc' },
    });

    const dashboardStats: DashboardStats = {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total) || 0,
      totalProducts,
      totalCustomers,
      recentOrders,
      topProducts: [], // Will be populated with product details
      salesChart: salesChart.map(day => ({
        date: day.createdAt,
        revenue: Number(day._sum.total) || 0,
        orders: day._count.id,
      })),
    };

    res.json({ success: true, data: dashboardStats });
  }));

  /**
   * @swagger
   * /api/admin/orders:
   *   get:
   *     summary: Get all orders with pagination and filters
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Order status filter
   *     responses:
   *       200:
   *         description: List of orders
   */
  router.get('/orders', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true, price: true } } } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }));

  /**
   * @swagger
   * /api/admin/orders/{id}/status:
   *   put:
   *     summary: Update order status
   *     tags: [Admin]
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
   *               status:
   *                 type: string
   *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
   *     responses:
   *       200:
   *         description: Order status updated
   */
  router.put('/orders/:id/status', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { product: true } },
      },
    });

    res.json({ success: true, data: order });
  }));

  /**
   * @swagger
   * /api/admin/products:
   *   get:
   *     summary: Get all products for admin
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of products
   */
  router.get('/products', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          images: true,
          _count: {
            select: { orderItems: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }));

  /**
   * @swagger
   * /api/admin/users:
   *   get:
   *     summary: Get all users
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   */
  router.get('/users', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  }));

  /**
   * @swagger
   * /api/admin/users/{id}/toggle-status:
   *   put:
   *     summary: Toggle user active status
   *     tags: [Admin]
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
   *         description: User status updated
   */
  router.put('/users/:id/toggle-status', authenticate, requireRole(['ADMIN']), asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { isActive: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ success: true, data: updatedUser });
  }));

  return router;
};
