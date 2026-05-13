import { promises as fs } from "fs";
import * as path from "path";
import type { Category } from "../slicing/models";
import { AppError } from "../../middleware/error";
import {
  clearSystemSettings,
  getSystemSettingsIndex,
  saveSystemSetting,
  saveSystemSettingsIndex,
} from "./system-settings.service";
import {
  findResourcesRoot,
  isProfileListEntry,
  readBufferProfile,
  readJsonProfile,
  toMap,
} from "./helpers";
import {
  CATEGORY_LIST_KEYS,
  type Profile,
  type ProfileListEntry,
} from "./models";

/**
 * In-memory cache for profile search.
 * Key is the profile name.
 * Value is the profile path.
 */
const searchCache: Record<Category, Map<string, string>> = {
  printers: new Map<string, string>(),
  presets: new Map<string, string>(),
  filaments: new Map<string, string>(),
};

export async function resolveProfileInheritance(
  category: Category,
  profileContent: Buffer,
) {
  const profile = await readBufferProfile(profileContent);
  const parentProfilePath = searchCache[category].get(profile.inherits || "");
  if (!parentProfilePath) {
    throw new AppError(
      500,
      `Parent profile "${profile.inherits}" not found in search cache for category "${category}".`,
    );
  }
  try {
    const parentProfile = await readJsonProfile(parentProfilePath);
    return { ...parentProfile, ...profile };
  } catch (error) {
    console.error(
      `Failed to read parent profile at "${parentProfilePath}":`,
      error,
    );
    throw new AppError(
      500,
      `Error while resolving profile inheritance for "${profile.name}".`,
    );
  }
}

export async function initializeProfileIndex() {
  const existingIndex = await getSystemSettingsIndex();
  if (existingIndex) {
    searchCache.printers = toMap<string>(existingIndex.printers);
    searchCache.presets = toMap<string>(existingIndex.presets);
    searchCache.filaments = toMap<string>(existingIndex.filaments);
    console.log(
      `Profile index loaded with ${searchCache.printers.size} printers, ${searchCache.presets.size} presets, and ${searchCache.filaments.size} filaments.`,
    );
    // If the saved index exists but is empty, rebuild it from resources.
    const total =
      searchCache.printers.size +
      searchCache.presets.size +
      searchCache.filaments.size;
    if (total === 0) {
      console.warn(
        "Saved profile index is empty — rebuilding from resources...",
      );
      await buildProfileIndex();
      await saveSystemSettingsIndex(searchCache);
    }
  } else {
    await buildProfileIndex();
    await saveSystemSettingsIndex(searchCache);
  }
}

async function buildProfileIndex() {
  const resourcesRoot = await findResourcesRoot();

  console.log(
    `Building profile index from resources directory at "${resourcesRoot}"...`,
  );

  const brands = (await fs.readdir(resourcesRoot))
    .filter((entry) => {
      return entry.endsWith(".json") && entry !== "blacklist.json";
    })
    .map((entry) => entry.split(".")[0]);

  const systemFilaments = await indexSystemFilaments(resourcesRoot);

  for (const brand of brands) {
    console.log(`Indexing brand "${brand}"...`);

    const brandPath = path.join(resourcesRoot, `${brand}.json`);
    const content = await JSON.parse(await fs.readFile(brandPath, "utf8"));

    const machines = content[CATEGORY_LIST_KEYS.printers];
    const resolvedMachines = await indexCategory(
      brand,
      "printers",
      resourcesRoot,
      machines,
    );
    if (resolvedMachines) {
      const savedMachines = await saveProfiles(resolvedMachines);
      searchCache.printers = new Map([
        ...searchCache.printers,
        ...savedMachines,
      ]);
    }

    const presets = content[CATEGORY_LIST_KEYS.presets];
    const resolvedPresets = await indexCategory(
      brand,
      "presets",
      resourcesRoot,
      presets,
    );
    if (resolvedPresets) {
      const savedPresets = await saveProfiles(resolvedPresets);
      searchCache.presets = new Map([...searchCache.presets, ...savedPresets]);
    }

    const filaments = content[CATEGORY_LIST_KEYS.filaments];
    const resolvedFilaments = await indexCategory(
      brand,
      "filaments",
      resourcesRoot,
      filaments,
      systemFilaments,
    );
    if (resolvedFilaments) {
      const savedFilaments = await saveProfiles(resolvedFilaments);
      searchCache.filaments = new Map([
        ...searchCache.filaments,
        ...savedFilaments,
      ]);
    }
  }

  const totalEntries =
    searchCache.printers.size +
    searchCache.presets.size +
    searchCache.filaments.size;

  console.log(
    `Profile index built with ${totalEntries} entries for ${brands.length} brands.`,
  );
}

export async function rebuildProfileIndex() {
  searchCache.printers.clear();
  searchCache.presets.clear();
  searchCache.filaments.clear();

  await clearSystemSettings();
  await buildProfileIndex();
  await saveSystemSettingsIndex(searchCache);
}

async function saveProfiles(profiles: Map<string, Profile>) {
  const saved: Map<string, string> = new Map();
  for (const [name, profile] of profiles.entries()) {
    try {
      const filepath = await saveSystemSetting(profile);
      saved.set(name, filepath);
    } catch (error) {
      console.warn(`Failed to save profile "${name}" during indexing:`, error);
    }
  }
  return saved;
}

/** Index system filaments (OrcaFilamentLibrary) to use as fallback */
async function indexSystemFilaments(resourcesRoot: string) {
  console.log(`Indexing system filaments...`);

  const brandPath = path.join(resourcesRoot, `OrcaFilamentLibrary.json`);
  const content = await readJsonProfile(brandPath);

  const filaments = content[CATEGORY_LIST_KEYS.filaments];
  const filamentsResolved = await indexCategory(
    "OrcaFilamentLibrary",
    "filaments",
    resourcesRoot,
    filaments,
    undefined,
    true,
  );

  return filamentsResolved;
}

async function indexCategory(
  brand: string,
  category: Category,
  basePath: string,
  entries: unknown,
  systemEntries?: Map<string, Profile>,
  includeNoneInstantiable = false,
) {
  if (!Array.isArray(entries) || entries.length === 0) {
    console.warn(
      `Skipping ${category} for brand "${brand}" because it is not an array or empty.`,
    );
    return;
  }

  const validEntries = entries.filter(isProfileListEntry) as ProfileListEntry[];
  if (validEntries.length === 0) {
    console.warn(`No valid entries found for ${category} of brand "${brand}".`);
    return;
  }

  const profiles = new Map<string, Profile>();
  const resolved = new Map<string, Profile>();

  for (const entry of validEntries) {
    const profilePath = path.join(basePath, brand, entry.sub_path);
    const profile = await readJsonProfile(profilePath);
    if (
      entry.name.includes("fdm_process_RatRig") ||
      entry.name.includes("fdm_process_SecKit_common")
    ) {
      // Speicially for RatRig/SecKit profiles because they have incorectly named "inherits" fields.
      profiles.set(entry.name.toLowerCase(), profile);
    } else {
      profiles.set(entry.name, profile);
    }
  }

  for (const [name, profile] of profiles.entries()) {
    try {
      if (
        (profile.instantiation && Boolean(profile.instantiation)) ||
        includeNoneInstantiable
      ) {
        const resolvedProfile = resolveInheritance(
          profile,
          profiles,
          systemEntries,
        );

        resolved.set(name, resolvedProfile);
      }
    } catch (error) {
      console.error(error);
    }
  }

  console.log(
    `Indexed ${resolved.size} entries for ${category} of brand "${brand}".`,
  );
  return resolved;
}

function resolveInheritance(
  profile: Profile,
  profileList: Map<string, Profile>,
  systemEntries?: Map<string, Profile>,
) {
  const next = profile?.inherits;
  if (next === undefined) {
    return profile;
  }

  let parent = profileList.get(next);

  if (parent === undefined) {
    const systemParent = systemEntries?.get(next);
    if (systemParent) {
      parent = systemParent;
      console.warn(
        `Profile "${profile.name}" inherits from "${next}", but it was not found in the profile list. Using system profile instead.`,
      );
    } else {
      console.warn(
        `Profile "${profile.name}" inherits from "${next}", but it was not found in the profile list.`,
      );
      return profile;
    }
  }

  const parentResolved = resolveInheritance(
    parent,
    profileList,
    systemEntries,
  ) as Profile;

  return {
    ...parentResolved,
    ...profile,
  };
}
