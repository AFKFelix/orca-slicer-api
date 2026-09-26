import { resolveProfileInheritance } from "../profiles/inheritance.service";
import type { Category, SliceMetaData } from "./models";
import { promises as fs } from "fs";

export function generateMetaDataHeaders(metadata: SliceMetaData) {
  const headers: Record<string, string> = {};
  headers["X-Print-Time-Seconds"] = metadata.printTime.toString();
  headers["X-Filament-Used-g"] = metadata.filamentUsedG.toString();
  headers["X-Filament-Used-mm"] = metadata.filamentUsedMm.toString();
  return headers;
}

export async function writeTempProfile(
  category: Category,
  profileBuffer: Buffer,
  outputPath: string,
  resolveInheritance?: boolean,
) {
  if (resolveInheritance == undefined || !resolveInheritance) {
    await fs.writeFile(outputPath, profileBuffer);
  } else {
    const resolved = await resolveProfileInheritance(category, profileBuffer);
    await fs.writeFile(outputPath, JSON.stringify(resolved, null, 2), "utf8");
  }
}
