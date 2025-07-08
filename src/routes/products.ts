import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";
import { slugify } from "../utils/database";

const router = express.Router();

export default (prisma: PrismaClient) => {
  // Get all products
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true, images: true },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: products });
    })
  );

  // Get product by ID
  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { category: true, images: true },
      });

      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      res.json({ success: true, data: product });
    })
  );

  // Create product
  router.post(
    "/",
    authenticate,
    requireRole(["ADMIN"]),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const {
        name,
        description,
        shortDescription,
        price,
        comparePrice,
        costPrice,
        sku,
        barcode,
        trackQuantity,
        quantity,
        allowBackorder,
        weight,
        dimensions,
        images,
        variants,
        category,
        tags,
      } = req.body;

      try {
        const product = await prisma.product.create({
          data: {
            name,
            description,
            shortDescription,
            price,
            comparePrice,
            costPrice,
            sku,
            tags,
            barcode,
            trackQuantity,
            quantity,
            allowBackorder,
            weight,
            dimensions,
            slug: slugify(name),
            images: {
              create: images,
            },
            variants: {
              create: variants,
            },
            category: {
              create: category,
            },
          },
        });

        res.status(201).json({ success: true, data: product });
      } catch (error: any) {
        console.error("Error: ", error?.message);

        res
          .status(400)
          .send({ success: false, error: { message: error?.message } });
      }
    })
  );

  // Update product
  router.put(
    "/:id",
    requireRole(["ADMIN"]),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { name, description, price, categoryId, tags } = req.body;

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          name,
          slug: slugify(name),
          description,
          price,
          categoryId,
          tags,
        },
      });

      res.json({ success: true, data: product });
    })
  );

  // Delete product
  router.delete(
    "/:id",
    requireRole(["ADMIN"]),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      await prisma.product.delete({ where: { id: req.params.id } });

      res.json({ success: true, message: "Product deleted successfully" });
    })
  );

  return router;
};
