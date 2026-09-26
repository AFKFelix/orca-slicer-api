import path from "path";
import { AppError } from "../../middleware/error";
import type { Profile } from "./models";
import { promises as fs } from "fs";

export async function readJsonProfile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Profile;
}

export async function readBufferProfile(profile: Buffer) {
  return JSON.parse(profile.toString("utf8")) as Profile;
}

export function isProfileListEntry(entry: unknown) {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "name" in entry &&
    "sub_path" in entry &&
    typeof entry.name === "string" &&
    typeof entry.sub_path === "string"
  );
}

export function toMap<T>(value: unknown) {
  if (value instanceof Map) return new Map(value as Map<string, T>);
  if (value && typeof value === "object")
    return new Map(Object.entries(value as Record<string, T>));
  return new Map<string, T>();
}

export async function findResourcesRoot() {
  const resourcesPath = process.env.ORCASLICER_RESOURCES_PATH;
  if (resourcesPath == undefined) {
    console.error(
      `ORCASLICER_RESOURCES_PATH environment variable is not set. Please set it to the path of the resources directory.`,
    );
    throw new AppError(500, "Error while resolving profile inheritance.");
  }

  const profilePath = path.join(resourcesPath, "profiles");

  try {
    await fs.access(profilePath);
    return profilePath;
  } catch {
    console.error(
      `Profiles directory not found at "${profilePath}". Please check ORCASLICER_RESOURCES_PATH environment variable.`,
    );
    throw new AppError(500, "Error while resolving profile inheritance.");
  }
}
