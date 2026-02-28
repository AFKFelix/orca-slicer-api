import { promises as fs } from "fs";
import { join } from "path";
import type { Category } from "../slicing/models";
import { AppError } from "../../middleware/error";

const BASE = process.env.DATA_PATH || join(process.cwd(), "data");

/**
 * Saves a setting object to a JSON file in the specified category directory.
 * Creates the directory if it doesn't exist.
 * @param category - The category directory to save the setting in.
 * @param name - The name of the setting file (without .json extension).
 * @param content - The object to be saved as JSON.
 * @returns A Promise that resolves when the file is written.
 */
export async function saveSetting(
  category: Category,
  name: string,
  content: object,
) {
  try {
    const dir = join(BASE, category);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      join(dir, `${name}.json`),
      JSON.stringify(content, null, 2),
      "utf8",
    );
  } catch (error) {
    throw new AppError(
      500,
      `Failed to save settings`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Lists the names of settings files for a specified category.
 * This function reads files from the corresponding category directory,
 * filters out JSON files, and returns their base names without extensions.
 * @param category - The category to filter settings.
 * @returns A Promise that resolves to an array of file names (without .json extension)
 * or an empty array if the directory doesn't exist.
 * @throws {AppError} If the directory cannot be read.
 */
export async function listSettings(category: Category) {
  const dir = join(BASE, category);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch (error) {
    throw new AppError(
      500,
      `Failed to read settings directory`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Reads a setting from disk and parses it into an object.
 * @param category - The category directory containing the setting file.
 * @param name - The name of the setting file (without .json extension).
 * @returns A Promise that resolves to the parsed JSON content.
 * @throws {AppError} If the file cannot be read or parsed.
 */
export async function getSetting(category: Category, name: string) {
  try {
    const filepath = join(BASE, category, `${name}.json`);
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    throw new AppError(
      500,
      `Failed to read setting`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Deletes a setting JSON file for the given category and name.
 * @param category - The category directory containing the setting file.
 * @param name - The name of the setting file (without .json extension).
 */
export async function deleteSetting(category: Category, name: string) {
  try {
    const filepath = join(BASE, category, `${name}.json`);
    await fs.unlink(filepath);
  } catch (error) {
    throw new AppError(
      500,
      `Failed to delete setting`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
