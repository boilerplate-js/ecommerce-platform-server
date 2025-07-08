import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Platform API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce platform API with admin panel',
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            comparePrice: { type: 'number', format: 'decimal' },
            sku: { type: 'string' },
            quantity: { type: 'integer' },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            categoryId: { type: 'string' },
            images: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductImage' },
            },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            alt: { type: 'string' },
            position: { type: 'integer' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' },
            isActive: { type: 'boolean' },
            parentId: { type: 'string' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            },
            subtotal: { type: 'number', format: 'decimal' },
            tax: { type: 'number', format: 'decimal' },
            shipping: { type: 'number', format: 'decimal' },
            total: { type: 'number', format: 'decimal' },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number', format: 'decimal' },
            total: { type: 'number', format: 'decimal' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: { type: 'string' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);
