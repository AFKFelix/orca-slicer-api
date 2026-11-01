import { describe, expect, it } from "vitest";
import { request } from "./setup";
import fs from "fs";
import path from "path";
import { Open } from "unzipper";

/**
 * Bars.3mf contains 12 plain objects (long bars, squares and rectangles)
 * without transforms. Arranging them all over plates makes the OrcaSlicer CLI
 * rotate some of them unless rotations are disabled.
 */
describe("Arrange rotation", () => {
  const orcaSlicerVersion = process.env.ORCASLICER_VERSION || "2.3.0";

  const readInput = (file: string) =>
    fs.readFileSync(path.join(__dirname, "../files/input", file));

  const sliceBars = async (allowRotations: string) => {
    const response = await request
      .post("/slice")
      .responseType("blob")
      .attach("file", readInput("Bars.3mf"), "Bars.3mf")
      .attach(
        "printerProfile",
        readInput(`${orcaSlicerVersion}/full/printer.json`),
        "printer.json",
      )
      .attach(
        "presetProfile",
        readInput(`${orcaSlicerVersion}/full/process.json`),
        "process.json",
      )
      .attach(
        "filamentProfile",
        readInput(`${orcaSlicerVersion}/full/filament.json`),
        "filament.json",
      )
      .field("arrange", "true")
      .field("plate", "0")
      .field("exportType", "3mf")
      .field("allowRotations", allowRotations)
      .expect(200);

    const archive = await Open.buffer(response.body as Buffer);
    const model = archive.files.find((f) => f.path === "3D/3dmodel.model");
    expect(model).toBeDefined();
    const xml = (await model!.buffer()).toString("utf-8");

    // Z rotation (degrees) of every build item, from its 3MF transform matrix.
    const items = [...xml.matchAll(/<item [^>]*transform="([^"]*)"/g)];
    return items.map(([, transform]) => {
      const [m00, m01] = transform.split(" ").map(Number);
      return Math.abs(Math.round((Math.atan2(m01, m00) * 180) / Math.PI));
    });
  };

  it("should not rotate models when allowRotations is false", async () => {
    const angles = await sliceBars("false");

    expect(angles).toHaveLength(12);
    expect(angles.every((angle) => angle === 0)).toBe(true);
  });

  it("should rotate models when allowRotations is true", async () => {
    const angles = await sliceBars("true");

    expect(angles).toHaveLength(12);
    expect(angles.some((angle) => angle !== 0)).toBe(true);
  });
});
