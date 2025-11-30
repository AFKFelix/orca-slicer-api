export interface SlicingSettings {
  printer?: string;
  preset?: string;
  filament?: string;
  bedType?: string;
  plate?: string;
  multicolorOnePlate?: boolean;
  arrange?: boolean;
  orient?: boolean;
  exportType?: "gcode" | "3mf";
}

export interface SliceResult {
  gcodes: string[];
  workdir: string;
}

export interface SliceMetaData {
  printTime: number; //print time in seconds
  filamentUsedG: number; // filament used in grams
  filamentUsedMm: number; // total length of filament used in millimeters
}

export type Category = "printers" | "presets" | "filaments";

export interface UploadedProfiles {
  printer?: Buffer;
  preset?: Buffer;
  filament?: Buffer;
}
