import multer from "multer";
import path from "path";
import { AppError } from "./error";

const storage = multer.memoryStorage();

export const uploadJson = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== "application/json" || ext !== ".json") {
      return cb(
        new AppError(400, "Invalid file type. Only JSON files are allowed.")
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 4_000_000 },
});

export const uploadModel = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "model/stl",
      "application/step",
      "model/step",
      "model/3mf",
    ];
    const allowedExts = [".stl", ".step", ".stp", ".3mf"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      !allowedExts.includes(ext)
    ) {
      return cb(
        new AppError(
          400,
          "Invalid file type. Only STL, STEP, and 3MF files are allowed."
        )
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 100_000_000 },
});
