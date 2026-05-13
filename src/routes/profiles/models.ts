import type { Category } from "../slicing/models";

export type Profile = {
  inherits?: string;
  instantiation?: string;
  name: string;
  type: string;
  [key: string]: unknown;
};

export interface ProfileListEntry {
  name: string;
  sub_path: string;
}

export const CATEGORY_LIST_KEYS: Record<Category, string> = {
  printers: "machine_list",
  presets: "process_list",
  filaments: "filament_list",
};
