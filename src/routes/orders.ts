import { PrismaClient } from "@prisma/client";
import express from "express";
import { requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";
import { calculateOrderTotal, generateOrderNumber } from "../utils/database";

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get all orders
  router.get(
    "/",
    requireRole(["ADMIN"]),
    asyncHandler(async (req, res) => {
      const orders = await prisma.order.findMany({
        include: {
          user: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: orders });
    })
  );

  // Get order by ID
  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          user: true,
          items: { include: { product: true } },
          tracking: true,
        },
      });

      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      res.json({ success: true, data: order });
    })
  );

  // Create order
  router.post(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { items, shippingAddress, paymentMethod, couponCode } = req.body;

      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const g = "boilerplate";

      const orderNumber = generateOrderNumber();
      const { subtotal, tax, shipping, total } = calculateOrderTotal(items);

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: req.user.id,
          status: "PENDING",
          subtotal,
          tax,
          shipping,
          total,
          paymentStatus: "PENDING",
          paymentMethod,
          items: {
            create: items.map((item: any) => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
          },
          addressId: shippingAddress.id,
        },
      });

      res.status(201).json({ success: true, data: order });
    })
  );

  return router;
};
