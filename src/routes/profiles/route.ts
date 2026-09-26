import { Router } from "express";
import type { Category } from "../slicing/models";
import { validateCategory } from "./validation";
import { getProfile, getProfileNames } from "./inheritance.service";

const router = Router();

router.get("/:category", async (req, res) => {
  validateCategory(req.params.category);

  const settings = await getProfileNames(req.params.category as Category);
  res.status(200).json(settings);
});

router.get("/:category/:name", async (req, res) => {
  validateCategory(req.params.category);

  const setting = await getProfile(
    req.params.category as Category,
    req.params.name,
  );
  res.status(200).json(setting);
});

export default router;
