import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth';
import userRoutes from './users';
import productRoutes from './products';
import categoryRoutes from './categories';
import orderRoutes from './orders';
import cartRoutes from './cart';
import wishlistRoutes from './wishlist';
import reviewRoutes from './reviews';
import adminRoutes from './admin';
import paymentRoutes from './payments';
import uploadRoutes from './upload';

export const initRoutes = (app: Express, prisma: PrismaClient) => {
  // Pass prisma instance to all routes
  app.use('/api/auth', authRoutes(prisma));
  app.use('/api/users', userRoutes(prisma));
  app.use('/api/products', productRoutes(prisma));
  app.use('/api/categories', categoryRoutes(prisma));
  app.use('/api/orders', orderRoutes(prisma));
  app.use('/api/cart', cartRoutes(prisma));
  app.use('/api/wishlist', wishlistRoutes(prisma));
  app.use('/api/reviews', reviewRoutes(prisma));
  app.use('/api/admin', adminRoutes(prisma));
  app.use('/api/payments', paymentRoutes(prisma));
  app.use('/api/upload', uploadRoutes(prisma));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });
};
