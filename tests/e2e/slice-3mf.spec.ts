import { describe, expect, it } from "vitest";
import { request } from "./setup";
import fs from "fs";
import path from "path";

describe("3MF Slicing", () => {
  describe("Bambulab Settings", () => {
    it("should slice file successfully with correct settings", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.3mf")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const response = await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube.3mf")
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

    it("should slice file successfully with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(__dirname, "../files/input/printer.json");
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(__dirname, "../files/input/process.json");
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(__dirname, "../files/input/filament.json");
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.3mf")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(__dirname, "../files/input/printer.json");
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(__dirname, "../files/input/process.json");
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(__dirname, "../files/input/filament.json");
      const filamentBuffer = fs.readFileSync(filamentPath);

      const response = await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.3mf")
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
  });

  describe("None Bambulab Settings", () => {
    it("should slice file successfully with correct settings", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube-MegaS.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.3mf")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube-MegaS.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const response = await request
        .post("/slice")
        .attach("file", fileBuffer, "Cube-MegaS.3mf")
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

    it("should slice file successfully with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube-MegaS.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        "../files/input/megas-printer.json"
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        "../files/input/megas-process.json"
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(__dirname, "../files/input/filament.json");
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube.3mf")
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube-MegaS.3mf");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(
        __dirname,
        "../files/input/megas-printer.json"
      );
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(
        __dirname,
        "../files/input/megas-process.json"
      );
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(__dirname, "../files/input/filament.json");
      const filamentBuffer = fs.readFileSync(filamentPath);

      const response = await request
        .post("/slice")
        .responseType("blob")
        .attach("file", fileBuffer, "Cube-MegaS.3mf")
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
  });
});
