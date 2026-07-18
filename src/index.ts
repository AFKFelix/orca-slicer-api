import swaggerUi from "swagger-ui-express";
import { initializeProfileIndex } from "./routes/profiles/inheritance.service";
import { configureApp } from "./app";

const app = configureApp();

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  import("../swagger.json", { with: { type: "json" } })
    .then((swaggerDocument) => {
      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument.default),
      );
    })
    .catch((err) => {
      console.error("Failed to load swagger.json:", err);
    });
}

await initializeProfileIndex();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
