import { Router } from "express";
import { uploadJson } from "../../middleware/upload";
import type { Category } from "../slicing/models";
import {
  saveSetting,
  listSettings,
  getSetting,
  deleteSetting,
} from "./settings.service";
import { AppError } from "../../middleware/error";
import { resolveProfileInheritance } from "./inheritance.service";
import {
  validateCategory,
  validateName,
  validateProfileBuffer,
} from "./validation";

const router = Router();

router.post("/:category", uploadJson.single("file"), async (req, res) => {
  const { name, resolveInheritance } = req.body;

  validateName(name);

  if (!req.file) {
    throw new AppError(400, "File is required");
  }

  validateCategory(req.params.category as string);

  const category = req.params.category as Category;

  validateProfileBuffer(category, req.file.buffer);

  if (resolveInheritance !== undefined && resolveInheritance === "true") {
    const resolved = await resolveProfileInheritance(category, req.file.buffer);
    await saveSetting(category, name, resolved);
  } else {
    const content = JSON.parse(req.file.buffer.toString("utf8"));
    await saveSetting(category, name, content);
  }

  res.status(201).json({ name });
});

router.get("/:category", async (req, res) => {
  validateCategory(req.params.category);

  const settings = await listSettings(req.params.category as Category);
  res.status(200).json(settings);
});

router.get("/:category/:name", async (req, res) => {
  validateCategory(req.params.category);
  validateName(req.params.name);

  const setting = await getSetting(
    req.params.category as Category,
    req.params.name,
  );
  res.status(200).json(setting);
});

router.delete("/:category/:name", async (req, res) => {
  validateCategory(req.params.category);
  validateName(req.params.name);

  await deleteSetting(req.params.category as Category, req.params.name);
  res.status(204).send();
});

export default router;
