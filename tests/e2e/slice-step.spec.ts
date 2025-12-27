import { describe, it } from "vitest";
import { request } from "./setup";
import fs from "fs";
import path from "path";

describe("STEP Slicing", () => {
  describe("Bambulab Settings", () => {
    it("should slice file successfully with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.step");
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
        .attach("file", fileBuffer, {
          filename: "Cube.step",
          contentType: "application/step",
        })
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("Content-Type", /octet-stream/);
    });

    it("should return correct meta data headers with uploaded profiles", async () => {
      const filePath = path.join(__dirname, "../files/input/Cube.step");
      const fileBuffer = fs.readFileSync(filePath);

      const printerPath = path.join(__dirname, "../files/input/printer.json");
      const printerBuffer = fs.readFileSync(printerPath);

      const presetPath = path.join(__dirname, "../files/input/process.json");
      const presetBuffer = fs.readFileSync(presetPath);

      const filamentPath = path.join(__dirname, "../files/input/filament.json");
      const filamentBuffer = fs.readFileSync(filamentPath);

      await request
        .post("/slice")
        .attach("file", fileBuffer, {
          filename: "Cube.step",
          contentType: "application/step",
        })
        .attach("printerProfile", printerBuffer, "printer.json")
        .attach("presetProfile", presetBuffer, "process.json")
        .attach("filamentProfile", filamentBuffer, "filament.json")
        .expect(200)
        .expect("x-print-time-seconds", "934")
        .expect("x-filament-used-g", "0.71")
        .expect("x-filament-used-mm", "237.64");
    });
  });
});
