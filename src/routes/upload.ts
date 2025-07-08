import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import express from "express";
import multer from "multer";
import { config } from "../config/env";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      // ! Should fixed it

      // cb(new Error("Only image files are allowed"), false); // ✅ Corrected this

      console.log("Hello");
    }
  },
});

export default (prisma: PrismaClient) => {
  /**
   * @swagger
   * /api/upload/images:
   *   post:
   *     summary: Upload images
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *               folder:
   *                 type: string
   *                 description: Cloudinary folder name
   *     responses:
   *       200:
   *         description: Images uploaded successfully
   *       400:
   *         description: Upload error
   */
  router.post(
    "/images",
    authenticate,
    requireRole(["ADMIN"]),
    upload.array("images", config.MAX_FILES),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const files = req.files as Express.Multer.File[];
      const folder = req.body.folder || "ecommerce";

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No files uploaded" });
      }

      try {
        const uploadPromises = files.map((file) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: `ecommerce/${folder}`,
                  resource_type: "image",
                  transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" },
                  ],
                },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve({
                      url: result?.secure_url,
                      publicId: result?.public_id,
                      width: result?.width,
                      height: result?.height,
                    });
                  }
                }
              )
              .end(file.buffer);
          });
        });

        const uploadResults = await Promise.all(uploadPromises);

        res.json({
          success: true,
          data: uploadResults,
          message: `${uploadResults.length} image(s) uploaded successfully`,
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to upload images",
          details: error.message,
        });
      }
    })
  );

  /**
   * @swagger
   * /api/upload/product-images/{productId}:
   *   post:
   *     summary: Upload product images
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       200:
   *         description: Product images uploaded successfully
   */
  router.post(
    "/product-images/:productId",
    authenticate,
    requireRole(["ADMIN"]),
    upload.array("images", config.MAX_FILES),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { productId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No files uploaded" });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      try {
        const uploadPromises = files.map((file, index) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: `ecommerce/products/${productId}`,
                  resource_type: "image",
                  transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" },
                  ],
                },
                async (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    // Save image to database
                    const productImage = await prisma.productImage.create({
                      data: {
                        productId,
                        url: result!.secure_url,
                        alt: `${product.name} - Image ${index + 1}`,
                        position: index,
                      },
                    });
                    resolve(productImage);
                  }
                }
              )
              .end(file.buffer);
          });
        });

        const productImages = await Promise.all(uploadPromises);

        res.json({
          success: true,
          data: productImages,
          message: `${productImages.length} product image(s) uploaded successfully`,
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to upload product images",
          details: error.message,
        });
      }
    })
  );

  /**
   * @swagger
   * /api/upload/delete-image:
   *   delete:
   *     summary: Delete image from Cloudinary
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               publicId:
   *                 type: string
   *                 description: Cloudinary public ID
   *               imageId:
   *                 type: string
   *                 description: Database image ID (for product images)
   *     responses:
   *       200:
   *         description: Image deleted successfully
   */
  router.delete(
    "/delete-image",
    authenticate,
    requireRole(["ADMIN"]),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { publicId, imageId } = req.body;

      try {
        // Delete from Cloudinary
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }

        // Delete from database if it's a product image
        if (imageId) {
          await prisma.productImage.delete({
            where: { id: imageId },
          });
        }

        res.json({
          success: true,
          message: "Image deleted successfully",
        });
      } catch (error: any) {
        console.error("Delete error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to delete image",
          details: error.message,
        });
      }
    })
  );

  return router;
};
