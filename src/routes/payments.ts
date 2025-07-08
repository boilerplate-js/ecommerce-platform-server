import { PrismaClient } from "@prisma/client";
import express from "express";
import Stripe from "stripe";
import { config } from "../config/env";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../types";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default (prisma: PrismaClient) => {
  // Create payment intent
  router.post(
    "/create-payment-intent",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { amount, currency = "usd", orderId } = req.body;

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Stripe expects amount in cents
          currency,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            userId: req.user.id,
            orderId,
          },
        });

        // Update order with payment intent ID
        /*      if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { stripePaymentIntentId: paymentIntent.id },
          });


        } */

        const product = await stripe.products.create({
          name: "Sample Product",
        });

        console.log("Product ID:", product.id);

        const price = await stripe.prices.create({
          unit_amount: 129999, // amount in cents ($1299.99)
          currency: "usd",
          product: product.id,
        });

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
        });

        res.json({
          success: true,
          data: {
            product,
            price,
            paymentIntent,
            paymentLink,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          },
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    })
  );

  // Confirm payment
  router.post(
    "/confirm-payment",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { paymentIntentId } = req.body;

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );

        if (paymentIntent.status === "succeeded") {
          // Update order payment status
          const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: "PAID",
                status: "CONFIRMED",
              },
            });

            // Clear user's cart after successful payment
            await prisma.cartItem.deleteMany({
              where: { userId: req.user.id },
            });
          }
        }

        res.json({
          success: true,
          data: { paymentIntent },
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    })
  );

  // Stripe webhook handler
  router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    asyncHandler(async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          config.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          // Update order status
          const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: "PAID",
                status: "CONFIRMED",
              },
            });
          }
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object as Stripe.PaymentIntent;

          // Update order status
          const failedOrder = await prisma.order.findFirst({
            where: { stripePaymentIntentId: failedPayment.id },
          });

          if (failedOrder) {
            await prisma.order.update({
              where: { id: failedOrder.id },
              data: {
                paymentStatus: "FAILED",
              },
            });
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    })
  );

  // Get payment methods for user
  router.get(
    "/payment-methods",
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      try {
        // For demo purposes, returning static payment methods
        // In production, you'd retrieve saved payment methods from Stripe
        const paymentMethods = [
          {
            id: "card",
            type: "card",
            name: "Credit/Debit Card",
            icon: "credit-card",
          },
          {
            id: "paypal",
            type: "paypal",
            name: "PayPal",
            icon: "paypal",
          },
        ];

        res.json({ success: true, data: paymentMethods });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    })
  );

  return router;
};
