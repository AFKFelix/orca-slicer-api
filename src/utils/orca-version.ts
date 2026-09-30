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

export const STEP_LAST_SUPPORTED_VERSION: [number, number, number] = [2, 3, 0];

const STEP_EXTENSIONS = new Set([".step", ".stp"]);

function getOrcaSlicerVersion() {
  const raw = process.env.ORCASLICER_VERSION?.trim();
  return raw ? raw : "0";
}

function parseVersionParts(version: string) {
  const parts = version.match(/\d+\.\d+\.\d+/)?.[0].split(".") || [];
  return [
    parseInt(parts[0], 10) || 0,
    parseInt(parts[1], 10) || 0,
    parseInt(parts[2], 10) || 0,
  ] satisfies [number, number, number];
}

/**
 * Returns true if version `a` is bigger than version `b`.
 */
function isVersionBigger(
  a: [number, number, number],
  b: [number, number, number],
) {
  if (a[0] > b[0]) return true;
  if (a[1] !== b[1]) return a[1] > b[1];
  if (a[2] !== b[2]) return a[2] > b[2];
  return false;
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
    isVersionBigger(
      parseVersionParts(getOrcaSlicerVersion()),
      STEP_LAST_SUPPORTED_VERSION,
    ) === false
  );
}

export function getStepUnsupportedMessage(): string {
  return (
    `STEP files are not supported with OrcaSlicer version ${getOrcaSlicerVersion()}. ` +
    `The OrcaSlicer CLI dropped STEP support after v3.2.0`
  );
}
