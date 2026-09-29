/**
 * Helpers around the configured OrcaSlicer version.
 *
 * Background: the OrcaSlicer CLI in v2.3.0 accepts STEP (.step/.stp) files,
 * but v2.3.2+ rejects them.
 *
 * To fail fast with a clear 400 instead of a cryptic 500 from the slicer,
 * STEP uploads are rejected when the configured version is above the last
 * known-good version.
 */

import path from "path";

export const STEP_LAST_SUPPORTED_VERSION = 230;

const STEP_EXTENSIONS = new Set([".step", ".stp"]);

function getOrcaSlicerVersion() {
  const raw = process.env.ORCASLICER_VERSION?.trim();
  return raw ? raw : "0";
}

function parseVersionParts(version: string) {
  const parts = version.split(".");
  let versionStr = "";
  for (let i = 0; i < parts.length; i++) {
    const char = parts[i];
    if (char >= "0" && char <= "9") {
      versionStr += char;
    } else {
      break;
    }
  }
  return parseInt(versionStr, 10);
}

export function isStepFile(filename: string): boolean {
  return STEP_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

/**
 * Whether the given (or configured) OrcaSlicer version supports STEP via CLI.
 * Unknown/unset versions return true to preserve previous behaviour and let
 * the slicer itself decide.
 */
export function isStepSupported() {
  return (
    parseVersionParts(getOrcaSlicerVersion()) <= STEP_LAST_SUPPORTED_VERSION
  );
}

export function getStepUnsupportedMessage(): string {
  return (
    `STEP files are not supported with OrcaSlicer version ${getOrcaSlicerVersion()}. ` +
    `The OrcaSlicer CLI dropped STEP support after v3.2.0`
  );
}
