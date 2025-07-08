import { PrismaClient } from '@prisma/client';

export const createPaginationQuery = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const createPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

export const generateSKU = (productName: string, categoryName?: string): string => {
  const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8);
  const cleanCategory = categoryName?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'GEN';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanCategory}-${cleanName}-${random}`;
};

export const calculateOrderTotal = (items: Array<{ price: number; quantity: number }>, taxRate = 0.1, shippingCost = 10) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax + shippingCost;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping: shippingCost,
    total: Number(total.toFixed(2)),
  };
};

export const createSearchQuery = (searchTerm: string) => {
  if (!searchTerm) return {};
  
  return {
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
      { sku: { contains: searchTerm, mode: 'insensitive' as const } },
      { tags: { has: searchTerm } },
    ],
  };
};

export const createPriceFilter = (minPrice?: number, maxPrice?: number) => {
  const filter: any = {};
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.gte = minPrice;
    if (maxPrice !== undefined) filter.price.lte = maxPrice;
  }
  
  return filter;
};

export const createDateFilter = (dateFrom?: string, dateTo?: string) => {
  const filter: any = {};
  
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.lte = new Date(dateTo);
  }
  
  return filter;
};
