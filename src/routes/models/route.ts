import fs, { link } from "fs";
import { Router } from "express";
import { AppError } from "../../middleware/error";
import {
  saveModelFile,
  createModel,
  listModels,
  getModelById,
  deleteModel,
} from "./model.service";
import { uploadModel } from "../../middleware/upload";

const router = Router();

router.post("/", uploadModel.single("file"), async (req, res) => {
  if (!req.file) throw new AppError(400, "File is required");

  let link: string | undefined;

  try {
    const result = await saveModelFile(req.file.buffer, req.file.originalname);
    link = result.link;
    const fileName = result.fileName;

    if (!link || !fileName) {
      throw new AppError(500, "Model file could not be saved");
    }

    const model = await createModel({ link, fileName });
    res.status(201).json({ id: model.id, name: model.file_name });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (link && fs.existsSync(link)) {
      fs.rmSync(link, { force: true });
    }

    throw new AppError(
      500,
      "Failed to create model",
      error instanceof Error ? error.message : String(error)
    );
  }
});

router.get("/", async (_req, res) => {
  const models = await listModels();
  const sanitizedModels = models.map(({ link, ...rest }) => rest);
  res.status(200).json(sanitizedModels);
});

router.get("/:id", async (req, res) => {
  const model = await getModelById(req.params.id);
  if (!model) throw new AppError(404, "Model not found");
  const { link, ...rest } = model;
  res.status(200).json(rest);
});

router.get("/:id/file", async (req, res) => {
  const model = await getModelById(req.params.id);
  if (!model) throw new AppError(404, "Model not found");

  try {
    fs.accessSync(model.link);
  } catch (error) {
    throw new AppError(404, "Model file not found");
  }

  res.download(model.link, model.file_name, { dotfiles: "allow" });
});

router.delete("/:id", async (req, res) => {
  await deleteModel(req.params.id);
  res.status(204).send();
});

export default router;
