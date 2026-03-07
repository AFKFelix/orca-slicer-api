import { Router } from "express";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { uploadFullPrint } from "../../middleware/upload";
import { AppError } from "../../middleware/error";
import type {
  SliceMetaData,
  SlicingSettings,
  UploadedProfiles,
} from "./models";
import { getMetaDataFromFile, sliceModel } from "./slicing.service";
import { generateMetaDataHeaders } from "./helpers";

type SliceJobStatus = "pending" | "processing" | "completed" | "failed";

interface SliceJob {
  id: string;
  status: SliceJobStatus;
  createdAt: string;
  updatedAt: string;
  gcodes?: string[];
  workdir?: string;
  metadata?: SliceMetaData;
  errorMessage?: string;
}

const router = Router();

const jobs = new Map<string, SliceJob>();
const jobRetentionMs = Number(
  process.env.ASYNC_SLICE_RETENTION_MS ?? "3600000",
);

const cleanupIntervalTimeMs = 60 * 60 * 1000;
const cleanupInterval = setInterval(() => {
  void deleteFinishedJobs();
}, cleanupIntervalTimeMs);
cleanupInterval.unref();

router.post(
  "/",
  uploadFullPrint.fields([
    { name: "file", maxCount: 1 },
    { name: "printerProfile", maxCount: 1 },
    { name: "presetProfile", maxCount: 1 },
    { name: "filamentProfile", maxCount: 1 },
  ]),
  async (req, res) => {
    if (!req.files || Array.isArray(req.files)) {
      throw new AppError(
        400,
        "Invalid file upload format: files must be uploaded as named fields",
      );
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files["file"]) {
      throw new AppError(400, "Model file is required for slicing");
    }

    const requestId = randomUUID();
    const job: SliceJob = {
      id: requestId,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    jobs.set(requestId, job);

    const modelFile = files["file"][0];
    const settings = req.body as SlicingSettings;
    const tempProfiles = {
      printer: files["printerProfile"]?.[0]?.buffer,
      preset: files["presetProfile"]?.[0]?.buffer,
      filament: files["filamentProfile"]?.[0]?.buffer,
    } as UploadedProfiles;

    void processSliceJob(requestId, modelFile, settings, tempProfiles);

    res.status(202).json({
      requestId,
      status: job.status,
      statusUrl: `${req.baseUrl}/${requestId}`,
    });
  },
);

router.get("/:requestId", async (req, res) => {
  const job = jobs.get(req.params.requestId);

  if (!job) {
    throw new AppError(404, "Slice request not found");
  }

  if (job.status === "pending" || job.status === "processing") {
    res.status(200).json({
      requestId: job.id,
      status: job.status,
    });
    return;
  }

  if (job.status === "failed") {
    res.status(500).json({
      requestId: job.id,
      status: job.status,
      message: job.errorMessage ?? "Failed to slice the model",
    });
    return;
  }

  if (!job.gcodes || !job.workdir || !job.metadata) {
    throw new AppError(500, "Completed slice job is missing result files");
  }

  return res.status(200).json({
    requestId: job.id,
    status: job.status,
    metadata: job.metadata,
    downloadUrl: `${req.baseUrl}/${job.id}/result`,
  });
});

router.get("/:requestId/result", async (req, res) => {
  const job = jobs.get(req.params.requestId);

  if (!job) {
    throw new AppError(404, "Slice request not found");
  }

  if (job.status != "completed") {
    res.status(400).json({
      message: "Slice job is not completed yet",
    });
    return;
  }

  if (!job.gcodes || !job.workdir || !job.metadata) {
    throw new AppError(500, "Completed slice job is missing result files");
  }

  res.set(generateMetaDataHeaders(job.metadata));

  if (job.gcodes.length === 1) {
    res.download(job.gcodes[0]);
    return;
  }

  res.attachment("result.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => {
    throw new AppError(500, `Error creating archive: ${err.message}`);
  });

  archive.pipe(res);
  job.gcodes.forEach((filePath) => {
    archive.file(filePath, { name: path.basename(filePath) });
  });

  await archive.finalize();
});

router.delete("/:requestId", async (req, res) => {
  const job = jobs.has(req.params.requestId);

  if (!job) {
    throw new AppError(404, "Slice request not found");
  }

  await cleanupJob(req.params.requestId);

  res.status(204).send();
});

async function processSliceJob(
  requestId: string,
  modelFile: Express.Multer.File,
  settings: SlicingSettings,
  tempProfiles: UploadedProfiles,
) {
  const job = jobs.get(requestId);
  if (!job) {
    return;
  }

  updateJob(job, { status: "processing" });

  try {
    const { gcodes, workdir } = await sliceModel(
      modelFile.buffer,
      modelFile.originalname,
      settings,
      tempProfiles,
    );

    if (gcodes.length === 0) {
      throw new AppError(500, "No files generated during slicing");
    }

    const metadata = await aggregateMetaData(gcodes);

    updateJob(job, {
      status: "completed",
      gcodes,
      workdir,
      metadata,
      errorMessage: undefined,
    });
  } catch (error) {
    updateJob(job, {
      status: "failed",
      errorMessage:
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to slice the model",
    });
  }
}

async function aggregateMetaData(gcodes: string[]): Promise<SliceMetaData> {
  const metadata: SliceMetaData = {
    printTime: 0,
    filamentUsedG: 0,
    filamentUsedMm: 0,
  };

  for (const filePath of gcodes) {
    const fileMetadata = await getMetaDataFromFile(filePath);
    metadata.printTime += fileMetadata.printTime;
    metadata.filamentUsedG += fileMetadata.filamentUsedG;
    metadata.filamentUsedMm += fileMetadata.filamentUsedMm;
  }

  return metadata;
}

function updateJob(job: SliceJob, update: Partial<SliceJob>) {
  jobs.set(job.id, { ...job, ...update, updatedAt: new Date().toISOString() });
}

async function cleanupJob(requestId: string) {
  const job = jobs.get(requestId);
  if (!job) {
    return;
  }

  jobs.delete(requestId);

  if (job.workdir) {
    await fs.rm(job.workdir, { recursive: true, force: true });
  }
}

async function deleteFinishedJobs() {
  const now = Date.now();

  for (const job of jobs.values()) {
    if (job.status !== "completed" && job.status !== "failed") {
      continue;
    }

    const updatedAt = Date.parse(job.updatedAt);
    if (now - updatedAt < jobRetentionMs) {
      continue;
    }

    await cleanupJob(job.id);
  }
}

export default router;
