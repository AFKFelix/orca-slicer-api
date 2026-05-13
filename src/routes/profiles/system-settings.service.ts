import { existsSync, promises as fs } from "fs";
import { join } from "path";
import { AppError } from "../../middleware/error";
import type { Category } from "../slicing/models";

const BASE = process.env.DATA_PATH || join(process.cwd(), "data");

/**
 * Saves a system setting object to a JSON file with a unique random filename in the system profile directory.
 * Creates the directory if it doesn't exist.
 * @param content - The object to be saved as JSON.
 * @returns A Promise that resolves with the file path when the file is written.
 */
export async function saveSystemSetting(content: object) {
  try {
    const dir = join(BASE, "system");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${crypto.randomUUID()}.json`;
    await fs.writeFile(
      join(dir, filename),
      JSON.stringify(content, null, 2),
      "utf8",
    );
    return join(dir, filename);
  } catch (error) {
    throw new AppError(
      500,
      `Failed to save settings`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function getSystemSettingsIndex() {
  try {
    const index = join(BASE, "system", "index.json");
    if (!existsSync(index)) {
      return null;
    }
    const raw = await fs.readFile(index, "utf8");
    return JSON.parse(raw) as Record<Category, Map<string, string> | null>;
  } catch (error) {
    throw new AppError(
      500,
      `Failed to load system settings index`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function saveSystemSettingsIndex(
  content: Record<Category, Map<string, string>>,
) {
  try {
    const index = join(BASE, "system", "index.json");
    await fs.mkdir(join(BASE, "system"), { recursive: true });
    const serializable: Record<string, unknown> = {};
    for (const key of Object.keys(content)) {
      const val = (content as any)[key];
      if (val instanceof Map) {
        serializable[key] = Object.fromEntries(val as Map<string, string>);
      } else {
        serializable[key] = val;
      }
    }
    await fs.writeFile(index, JSON.stringify(serializable, null, 2), "utf8");
  } catch (error) {
    throw new AppError(
      500,
      `Failed to load system settings index`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function clearSystemSettings() {
  try {
    const dir = join(BASE, "system");
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    throw new AppError(
      500,
      `Failed to clear system settings`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
