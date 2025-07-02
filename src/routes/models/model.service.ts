import { promises as fs } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../middleware/error";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();
const BASE = process.env.DATA_PATH || join(process.cwd(), "data");
const MODELS_DIR = join(BASE, "models");

export async function saveModelFile(
  file: Buffer,
  originalName: string
): Promise<{ link: string; fileName: string }> {
  await fs.mkdir(MODELS_DIR, { recursive: true });
  const id = uuidv4();
  const ext = originalName.split(".").pop();
  const name = `${id}.${ext}`;
  const filePath = join(MODELS_DIR, name);
  await fs.writeFile(filePath, file);
  const link = filePath;
  return { link, fileName: originalName };
}

export async function createModel({
  link,
  fileName,
}: {
  link: string;
  fileName: string;
}) {
  return prisma.models.create({ data: { link, file_name: fileName } });
}

export async function listModels() {
  return prisma.models.findMany();
}

export async function getModelById(id: string) {
  return prisma.models.findUnique({ where: { id } });
}

export async function deleteModel(id: string) {
  const model = await prisma.models.findUnique({ where: { id } });
  if (!model) throw new AppError(404, "Model not found");
  await fs.rm(model.link, { force: true });
  await prisma.models.delete({ where: { id } });
}
