import { describe, expect, it } from "vitest";
import { request } from "./setup";
import fs from "fs";
import path from "path";

describe("STL Slicing", () => {
  const orcaSlicerVersion = process.env.ORCASLICER_VERSION || "2.3.0";

  describe("Bambulab Settings", () => {
    it("should slice file successfully with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      const response = await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("x-print-time-seconds", /[0-9]+/)
        .expect("x-filament-used-g", /[0-9.]+/)
        .expect("x-filament-used-mm", /[0-9.]+/);

      const printTime = Number(response.headers["x-print-time-seconds"]);
      const filamentUsedG = Number(response.headers["x-filament-used-g"]);
      const filamentUsedMm = Number(response.headers["x-filament-used-mm"]);

      expect(printTime).toBeGreaterThan(0);
      expect(filamentUsedG).toBeGreaterThan(0);
      expect(filamentUsedMm).toBeGreaterThan(0);
    });

    it("should return error with inherited profiles without resolveProfileInheritance", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(500)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (
            res.body.message !==
            "Slicing failed with error from slicer: The selected printer is not compatible with the process preset in the 3mf."
          )
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should return error with inherited profiles with resolveProfileInheritance = false", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .field("resolveProfileInheritance", "false")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(500)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (
            res.body.message !==
            "Slicing failed with error from slicer: The selected printer is not compatible with the process preset in the 3mf."
          )
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should slice file with inherited profiles with resolveProfileInheritance = true", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .field("resolveProfileInheritance", "true")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });
  });

  describe("None Bambulab Settings", () => {
    it("should slice file successfully with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/megas-printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/megas-process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/megas-printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/megas-process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/full/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      const response = await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("x-print-time-seconds", /[0-9]+/)
        .expect("x-filament-used-g", /[0-9.]+/)
        .expect("x-filament-used-mm", /[0-9.]+/);

      const printTime = Number(response.headers["x-print-time-seconds"]);
      const filamentUsedG = Number(response.headers["x-filament-used-g"]);
      const filamentUsedMm = Number(response.headers["x-filament-used-mm"]);

      expect(printTime).toBeGreaterThan(0);
      expect(filamentUsedG).toBeGreaterThan(0);
      expect(filamentUsedMm).toBeGreaterThan(0);
    });

    it("should return error with inherited profiles without resolveProfileInheritance", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(500)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (
            res.body.message !==
            "Slicing failed with error from slicer: The selected printer is not compatible with the process preset in the 3mf."
          )
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should return error with inherited profiles with resolveProfileInheritance = false", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .field("resolveProfileInheritance", "false")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(500)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (
            res.body.message !==
            "Slicing failed with error from slicer: The selected printer is not compatible with the process preset in the 3mf."
          )
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should slice file with inherited profiles with resolveProfileInheritance = true", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-printer.json`,
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/megas-process.json`,
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(
        __dirname,
        `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
      );
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .field("resolveProfileInheritance", "true")
        .attach("file", fileBuffer, "Cube.stl")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });
  });

  describe("System Profiles", () => {
    it("should slice file successfully with system profiles referenced by name", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      await request
        .post("/slice")
        .responseType("blob")
        .field("printer", "Bambu Lab P1S 0.4 nozzle")
        .field("preset", "0.20mm Standard @BBL X1C")
        .field("filament", "Generic ASA")
        .attach("file", fileBuffer, "Cube.stl")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return error for unknown system profile name", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.stl");
      const fileBuffer = fs.readFileSync(filePath);

      await request
        .post("/slice")
        .field("printer", "Nonexistent Printer")
        .field("preset", "0.20mm Standard @BBL X1C")
        .attach("file", fileBuffer, "Cube.stl")
        .expect(404)
        .expect((res) => {
          const message = `Profile "Nonexistent Printer" not found in category "printers".`;
          if (res.body.message !== message)
            throw new Error("Wrong error message: " + res.body.message);
        });
    });
  });
});
