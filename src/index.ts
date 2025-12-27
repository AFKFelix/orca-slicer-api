import express from "express";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middleware/error";
import health from "./routes/health/route";
import profiles from "./routes/profiles/route";
import slicing from "./routes/slicing/route";
import cors from "cors";

export const configureApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGINS ?? "*", // if not set, allow all origins
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: [
        "Content-Disposition",
        "ETag",
        "Last-Modified",
        "Content-Length",
        "X-Filament-Used-G",
        "X-Filament-Used-Mm",
        "X-Print-Time-Seconds",
      ],
    })
  );

  app.use(express.json());

  app.use("/health", health);
  app.use("/profiles", profiles);
  app.use("/slice", slicing);

  app.use(errorHandler);

  return app;
};

const app = configureApp();

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  import("../swagger.json", { with: { type: "json" } })
    .then((swaggerDocument) => {
      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument.default)
      );
    })
    .catch((err) => {
      console.error("Failed to load swagger.json:", err);
    });
}

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
