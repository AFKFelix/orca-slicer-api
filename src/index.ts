import express from "express";
import profiles from "./routes/profiles/route";
import slicing from "./routes/slicing/route";
import models from "./routes/models/route";
import { errorHandler } from "./middleware/error";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from ".././swagger.json";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/profiles", profiles);
app.use("/slice", slicing);
app.use("/models", models);

app.use(errorHandler);

if (process.env.ENV !== "prod") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
