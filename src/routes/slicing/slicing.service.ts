import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { execFileSync } from "child_process";
import { AppError } from "../../middleware/error";
import type {
  SlicingSettings,
  SliceResult,
  SliceMetaData,
  UploadedProfiles,
} from "./models";
import { Open } from "unzipper";

export async function sliceModel(
  file: Buffer,
  filename: string,
  settings: SlicingSettings,
  tempProfiles?: UploadedProfiles
): Promise<SliceResult> {
  let workdir: string;
  let inPath: string;
  let inputDir: string;
  let outputDir: string;
  try {
    workdir = await fs.mkdtemp(path.join(os.tmpdir(), "slice-"));
    inputDir = path.join(workdir, "input");
    outputDir = path.join(workdir, "output");
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    inPath = path.join(inputDir, filename);
    await fs.writeFile(inPath, file);

    if (tempProfiles) {
      await writeTempProfiles(tempProfiles, inputDir);
    }
  } catch (error) {
    throw new AppError(
      500,
      "Failed to prepare slicing",
      error instanceof Error ? error.message : String(error)
    );
  }

  const basePath = process.env.DATA_PATH || path.join(process.cwd(), "data");

  const args: string[] = [];

  if (settings.exportType === "3mf") {
    args.push("--export-3mf", "result.3mf");
  }

  const sliceArg = settings.plate === undefined ? "1" : settings.plate;
  args.push("--slice", sliceArg);

  if (settings.arrange !== undefined) {
    args.push("--arrange", settings.arrange ? "1" : "0");
  }

  if (settings.orient !== undefined) {
    args.push("--orient", settings.orient ? "1" : "0");
  }

  if (tempProfiles?.printer && tempProfiles?.preset) {
    const settingsArg = `${inputDir}/printer.json;${inputDir}/preset.json`;
    args.push("--load-settings", settingsArg);
  } else if (settings.printer && settings.preset) {
    const settingsArg = `${basePath}/printers/${settings.printer}.json;${basePath}/presets/${settings.preset}.json`;
    args.push("--load-settings", settingsArg);
  }

  if (tempProfiles?.filament) {
    args.push("--load-filaments", `${inputDir}/filament.json`);
  } else if (settings.filament) {
    args.push(
      "--load-filaments",
      `${basePath}/filaments/${settings.filament}.json`
    );
  }

  if (settings.bedType) {
    args.push("--curr-bed-type", settings.bedType);
  }

  if (settings.multicolorOnePlate) {
    args.push("--allow-multicolor-oneplate");
  }

  args.push("--allow-newer-file");
  args.push("--outputdir", outputDir);

  args.push(inPath);

  if (!process.env.ORCASLICER_PATH) {
    throw new AppError(
      500,
      "Slicing is not configured properly on the server",
      "ORCASLICER_PATH environment variable is not defined"
    );
  }

  try {
    execFileSync(process.env.ORCASLICER_PATH, args, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const resultJsonPath = path.join(outputDir, "result.json");
    let json;
    try {
      const content = await fs.readFile(resultJsonPath, "utf-8");
      json = JSON.parse(content);
    } catch {
      await fs.rm(workdir, { recursive: true, force: true });

      throw new AppError(
        500,
        "Failed to slice the model",
        err instanceof Error ? err.message : String(err)
      );
    }

    if (json?.error_string) {
      await fs.rm(workdir, { recursive: true, force: true });

      throw new AppError(
        500,
        `Slicing failed with error from slicer: ${json.error_string}`
      );
    }

    await fs.rm(workdir, { recursive: true, force: true });

    throw new AppError(
      500,
      "Failed to slice the model",
      err instanceof Error ? err.message : String(err)
    );
  }

  const files = await fs.readdir(outputDir);
  let resultFiles: string[];

  if (settings.exportType === "3mf") {
    resultFiles = files
      .filter((f) => f.toLowerCase().endsWith(".3mf"))
      .map((f) => path.join(outputDir, f));
  } else {
    resultFiles = files
      .filter((f) => f.toLowerCase().endsWith(".gcode"))
      .map((f) => path.join(outputDir, f));
  }

  return { gcodes: resultFiles, workdir };
}

/**
 * Extract metadata (print time, filament used) from a G-code or 3MF file.
 * @param filePath The path to the file.
 * @returns The extracted metadata.
 */
export async function getMetaDataFromFile(
  filePath: string
): Promise<SliceMetaData> {
  let data = {
    printTime: 0,
    filamentUsedG: 0,
    filamentUsedMm: 0,
  };

  if (filePath.endsWith(".gcode")) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      data = parseMetaDataFromString(content);
    } catch (error) {
      console.error(
        "Failed to read G-code file for metadata extraction:",
        error
      );
    }
  } else if (filePath.endsWith(".3mf")) {
    try {
      const dir = await Open.file(filePath);
      for (const file of dir.files.filter((f) => f.path.endsWith(".gcode"))) {
        const content = (await file.buffer()).toString("utf-8");
        const metaData = parseMetaDataFromString(content);
        data.printTime += metaData.printTime;
        data.filamentUsedG += metaData.filamentUsedG;
        data.filamentUsedMm += metaData.filamentUsedMm;
      }
    } catch (error) {
      console.error("Failed to read 3MF file for metadata extraction:", error);
    }
  }

  return data;
}

function parseMetaDataFromString(content: string): SliceMetaData {
  const data: SliceMetaData = {
    printTime: 0,
    filamentUsedG: 0,
    filamentUsedMm: 0,
  };

  try {
    const lines = content.split("\n");

    const timeRegex =
      /total estimated time:\s*((?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?)/i;
    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const days = parseInt(match[2] || "0");
        const hours = parseInt(match[3] || "0");
        const minutes = parseInt(match[4] || "0");
        const seconds = parseInt(match[5] || "0");
        data.printTime = days * 86400 + hours * 3600 + minutes * 60 + seconds;
        break;
      }
    }

    //The estimated filament stands as last of the whole file, so we read it from the end
    const regex = /\d+(\.\d+)?/;
    for (let i = 0; i < 10; i++) {
      const line = lines.pop();
      if (!line) continue;

      if (line.startsWith("; filament used [g]")) {
        data.filamentUsedG = parseFloat(line.match(regex)?.[0] || "0");
      }

      if (line.startsWith("; filament used [mm]")) {
        data.filamentUsedMm = parseFloat(line.match(regex)?.[0] || "0");
      }
    }
  } catch (err) {
    console.error("Failed to parse metadata from string:", err);
  }

  return data;
}

async function writeTempProfiles(
  profiles: UploadedProfiles,
  inputDir: string
): Promise<void> {
  try {
    const printerPath = path.join(inputDir, "printer.json");
    const presetPath = path.join(inputDir, "preset.json");
    const filamentPath = path.join(inputDir, "filament.json");

    const writes: Promise<void>[] = [];

    if (profiles.printer && profiles.printer.length > 0) {
      writes.push(fs.writeFile(printerPath, profiles.printer));
    }
    if (profiles.preset && profiles.preset.length > 0) {
      writes.push(fs.writeFile(presetPath, profiles.preset));
    }
    if (profiles.filament && profiles.filament.length > 0) {
      writes.push(fs.writeFile(filamentPath, profiles.filament));
    }

    await Promise.all(writes);
  } catch (error) {
    throw new AppError(
      500,
      "Failed to write temporary profiles",
      error instanceof Error ? error.message : String(error)
    );
  }
}
