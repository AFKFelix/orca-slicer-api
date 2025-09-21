import express from "express";
import profiles from "./routes/profiles/route";
import slicing from "./routes/slicing/route";
import { errorHandler } from "./middleware/error";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
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

app.use("/profiles", profiles);
app.use("/slice", slicing);

app.use(errorHandler);
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
