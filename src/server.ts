import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";
import { config } from "./config/env";
import { specs } from "./config/swagger";
import { initRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const prisma = new PrismaClient();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: [config.CLIENT_URL, config.ADMIN_URL],
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());

// Rate limiting
app.use(
  rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: "Too many requests from this IP, please try again later.",
    },
  })
);

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customSiteTitle: "E-Commerce API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

// Initialize routes
app.get("/", (_req, res) => {
  res.send({
    success: true,
    message: "E-commerce platform api is 🏃‍♀️‍➡️",
    data: {
      api_base: `http://localhost:${config.PORT}`,
      api_docs: `http://localhost:${config.PORT}/api-docs`,
    },
  });
});

initRoutes(app, prisma);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server is running on http://localhost:${config.PORT}`);
  console.log(
    `API Documentation available at http://localhost:${config.PORT}/api-docs`
  );
});

export default app;
