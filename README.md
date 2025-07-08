# E-Commerce Platform

A production-ready e-commerce platform built with TypeScript, Node.js, Prisma, PostgreSQL, and Stripe. Features include a comprehensive API, admin panel, user management, product catalog, shopping cart, order processing, and payment integration.

## Features

### Core Features
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 👥 **User Management** - Customer and admin user accounts
- 📦 **Product Management** - CRUD operations for products with categories, images, and variants
- 🛒 **Shopping Cart** - Add, update, remove items from cart
- 💳 **Order Processing** - Complete order lifecycle from creation to fulfillment
- 💰 **Payment Integration** - Stripe payment processing with webhooks
- 📸 **File Upload** - Cloudinary integration for image management
- 📊 **Admin Dashboard** - Analytics, reports, and management interface
- ⭐ **Reviews & Ratings** - Product review system
- 💝 **Wishlist** - Save favorite products
- 📍 **Address Management** - Multiple shipping addresses per user
- 🔍 **Search & Filtering** - Advanced product search and filtering
- 📱 **API Documentation** - Comprehensive Swagger/OpenAPI docs

### Technical Features
- ✅ **TypeScript** - Full type safety
- 🗄️ **PostgreSQL** - Robust relational database
- 🔧 **Prisma ORM** - Type-safe database access
- 🚀 **Express.js** - Fast, unopinionated web framework
- 🔒 **Security** - Helmet, rate limiting, CORS, password hashing
- 📝 **Validation** - Input validation and sanitization
- 🛠️ **Error Handling** - Centralized error handling
- 📄 **Logging** - Winston logging
- 🧪 **Testing Ready** - Jest configuration included

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"
   JWT_SECRET="your-super-secret-jwt-key"
   STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   # ... other variables
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev:server
   ```

The API will be available at `http://localhost:3000`
API Documentation will be available at `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order

### Admin Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/orders` - Get all orders with filters
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/products` - Get all products for admin
- `GET /api/admin/users` - Get all users

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook handler

### File Upload
- `POST /api/upload/images` - Upload images
- `POST /api/upload/product-images/:productId` - Upload product images
- `DELETE /api/upload/delete-image` - Delete image

## Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - Customer and admin accounts
- **Products** - Product catalog with variants and images
- **Categories** - Hierarchical product categorization
- **Orders** - Order processing and tracking
- **Cart Items** - Shopping cart functionality
- **Reviews** - Product reviews and ratings
- **Addresses** - User shipping addresses
- **Payments** - Payment processing integration

## Default Accounts

After running the seed script, you'll have these default accounts:

**Admin Account:**
- Email: `admin@ecommerce.com`
- Password: `Admin123!`

**Customer Account:**
- Email: `customer@ecommerce.com`
- Password: `Customer123!`

## Development

### Available Scripts

- `npm run dev:server` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Application entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seeding script
```

## Deployment

### Environment Variables for Production

Make sure to set all required environment variables in your production environment:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `CLOUDINARY_*` - Cloudinary credentials
- `SMTP_*` - Email service credentials

### Database Migration

For production deployments:

```bash
npx prisma migrate deploy
```

### Docker Support (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Open an issue on GitHub
- Email: support@ecommerce.com

## Roadmap

- [ ] Frontend client application (React/Next.js)
- [ ] Admin panel interface
- [ ] Email notifications
- [ ] Inventory management
- [ ] Coupon/discount system
- [ ] Order tracking
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
