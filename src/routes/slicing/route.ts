import { Router } from "express";

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { execFileSync } from "child_process";
import { uploadModel } from "../../middleware/upload";
import type { SlicingSettings } from "./models";
import { listSettings } from "../profiles/settings.service";
import { AppError } from "../../middleware/error";

const router = Router();

router.post("/", uploadModel.single("file"), async (req, res) => {
  if (!req.file) {
    throw new AppError(400, "File is required for slicing");
  }

  const { printer, preset, filament, bedType } = req.body as SlicingSettings;

  if (
    !printer ||
    !preset ||
    !filament ||
    !bedType ||
    !(await listSettings("printers")).includes(printer) ||
    !(await listSettings("presets")).includes(preset) ||
    !(await listSettings("filaments")).includes(filament)
  ) {
    throw new AppError(400, "Invalid or missing slicing settings");
  }

  let workdir;
  let inPath;
  let outputDir;

  try {
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), "slice-"));
    const inputDir = path.join(workdir, "input");
    outputDir = path.join(workdir, "output");
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    const originalName = req.file.originalname;
    inPath = path.join(inputDir, originalName);
    await fs.writeFile(inPath, req.file.buffer);
  } catch (error) {
    throw new AppError(
      500,
      "Failed to prepare slicing",
      error instanceof Error ? error.message : String(error)
    );
  }

  const basePath = process.env.DATA_PATH || path.join(process.cwd(), "data");

  const settingsArg = `${basePath}/printers/${printer}.json;${basePath}/presets/${preset}.json`;
  const args = [
    "--arrange",
    "1",
    "--orient",
    "1",
    "--slice",
    "1",
    "--allow-newer-file",
    "--load-settings",
    settingsArg,
    "--load-filaments",
    `${basePath}/filaments/${filament}.json`,
    "--outputdir",
    outputDir,
    "--curr-bed-type",
    bedType,
    inPath,
  ];

  try {
    if (!process.env.ORCASLICER_PATH) {
      throw new AppError(
        500,
        "Slicing is not configured properly on the server",
        "ORCASLICER_PATH environment variable is not defined"
      );
    }
    execFileSync(process.env.ORCASLICER_PATH, args, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    await fs.rm(workdir, { recursive: true, force: true });
    throw new AppError(
      500,
      "Failed to slice the model",
      err instanceof Error ? err.message : String(err)
    );
  }

  const files = await fs.readdir(outputDir);
  const gcodes = files.filter((f) => f.toLowerCase().endsWith(".gcode"));

  res.download(path.join(outputDir, gcodes[0]));
  await fs.rm(workdir, { recursive: true, force: true });
});

export default router;
