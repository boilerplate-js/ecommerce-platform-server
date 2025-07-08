import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductQuery extends PaginationQuery {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  featured?: string;
  inStock?: string;
}

export interface OrderQuery extends PaginationQuery {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: any[];
  topProducts: any[];
  salesChart: any[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CheckoutData {
  items: CartItem[];
  shippingAddress: any;
  paymentMethod: string;
  couponCode?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export interface FileUploadOptions {
  folder: string;
  allowedTypes: string[];
  maxSize: number;
  maxFiles: number;
}

export interface TrackingUpdate {
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
}
