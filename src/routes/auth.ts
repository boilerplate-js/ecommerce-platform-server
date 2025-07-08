import { authenticate } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import express from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";
import { generateToken } from "../utils/jwt";
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from "../utils/password";

const router = express.Router();

export default (prisma: PrismaClient) => {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       400:
   *         description: Validation error
   */
  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const { email, password, firstName, lastName } = req.body;

      const { isValid, errors } = validatePassword(password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Password validation failed",
          details: errors,
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, error: "Email is already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "CUSTOMER",
        },
      });

      res.status(201).json({ success: true, data: { user } });
    })
  );

  // Login
  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (!user || !(await comparePassword(password, user.password))) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid email or password" });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({ success: true, data: { token, user } });
    })
  );

  // Get profile
  router.get(
    "/profile",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ success: true, data: user });
    })
  );

  return router;
};
