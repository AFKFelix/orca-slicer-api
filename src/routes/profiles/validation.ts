import { AppError } from "../../middleware/error";
import type { Category } from "../slicing/models";

const PROFILE_TYPES: Record<Category, string> = {
  printers: "machine", // printer
  presets: "process", // preset
  filaments: "filament",
};

export function validateProfileBuffer(category: Category, profile: Buffer) {
  let parsedProfile;
  try {
    parsedProfile = JSON.parse(profile.toString("utf8"));
  } catch {
    throw new AppError(400, "Profile must be valid JSON");
  }

  if (
    typeof parsedProfile !== "object" ||
    parsedProfile === null ||
    Array.isArray(parsedProfile)
  ) {
    throw new AppError(400, "Profile must be a JSON object");
  }

  const record = parsedProfile as Record<string, unknown>;
  if (record.type !== PROFILE_TYPES[category]) {
    throw new AppError(
      400,
      `Invalid profile type for ${category}. Expected "${PROFILE_TYPES[category]}".`,
    );
  }
  if (typeof record.name !== "string" || record.name.trim().length === 0) {
    throw new AppError(400, "Profile must include a non-empty name");
  }
  if (typeof record.from !== "string" || record.from.trim().length === 0) {
    throw new AppError(400, "Profile must include a non-empty from field");
  }
}

export function validateCategory(category: string) {
  if (!category || !["printers", "presets", "filaments"].includes(category)) {
    throw new AppError(400, "Invalid or missing category");
  }
}
