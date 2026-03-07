import type { SliceMetaData } from "./models";

export function generateMetaDataHeaders(metadata: SliceMetaData) {
  const headers: Record<string, string> = {};
  headers["X-Print-Time-Seconds"] = metadata.printTime.toString();
  headers["X-Filament-Used-g"] = metadata.filamentUsedG.toString();
  headers["X-Filament-Used-mm"] = metadata.filamentUsedMm.toString();
  return headers;
}
