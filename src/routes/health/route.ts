import express from "express";
import { checkHealth } from "./health.service";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const health = await checkHealth();
    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});

export default router;
