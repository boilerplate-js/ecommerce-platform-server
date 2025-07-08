"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const password_1 = require("../src/utils/password");
const prisma = new client_1.PrismaClient();
async function main() {
    // Seed admin user
    const adminPassword = await (0, password_1.hashPassword)("admin@1234");
    const admin = await prisma.user.upsert({
        where: { email: "admin@ecommerce.com" },
        update: {},
        create: {
            email: "admin@ecommerce.com",
            password: adminPassword,
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            isActive: true,
        },
    });
    console.log("Admin user seeded:", admin);
    // Seed customer user
    const customerPassword = await (0, password_1.hashPassword)("customer@1234");
    const customer = await prisma.user.upsert({
        where: { email: "customer@ecommerce.com" },
        update: {},
        create: {
            email: "customer@ecommerce.com",
            password: customerPassword,
            firstName: "John",
            lastName: "Doe",
            role: "CUSTOMER",
            isActive: true,
        },
    });
    console.log("Customer user seeded:", customer);
    // Seed categories
    const categories = await prisma.category.createMany({
        data: [
            { name: "Electronics", slug: "electronics", isActive: true },
            { name: "Clothing", slug: "clothing", isActive: true },
            { name: "Books", slug: "books", isActive: true },
        ],
    });
    console.log("Categories seeded:", categories);
    // Fetch category IDs
    const electronicsCategory = await prisma.category.findFirst({
        where: { slug: "electronics" },
    });
    if (!electronicsCategory) {
        throw new Error("Category 'electronics' not found");
    }
    const clothingCategory = await prisma.category.findFirst({
        where: { slug: "clothing" },
    });
    if (!clothingCategory) {
        throw new Error("Category 'clothing' not found");
    }
    // Seed products
    const products = await prisma.product.createMany({
        data: [
            {
                name: "Smartphone",
                slug: "smartphone",
                price: 699.99,
                categoryId: electronicsCategory.id,
                sku: "ELEC-1234-001",
                isActive: true,
            },
            {
                name: "T-Shirt",
                slug: "t-shirt",
                price: 19.99,
                categoryId: clothingCategory.id,
                sku: "CLOTH-5678-002",
                isActive: true,
            },
        ],
    });
    console.log("Products seeded:", products);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
