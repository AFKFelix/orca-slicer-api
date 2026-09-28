import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { request } from "./setup";

const version = process.env.ORCASLICER_VERSION || "2.3.0";
const inputProfile = (name: string) =>
  fs.readFileSync(path.join(__dirname, "../files/input", version, name));

const input = (name: string) =>
  fs.readFileSync(path.join(__dirname, "../files/input", name));

const printers = [
  { name: "Bambulab 3mf", prefix: "", model: "Cube.3mf" },
  { name: "none-Bambulab 3mf", prefix: "megas-", model: "Cube-MegaS.3mf" },
  { name: "Bambulab stl", prefix: "", model: "Cube.stl" },
  { name: "none-Bambulab stl", prefix: "megas-", model: "Cube.stl" },
  {
    name: "Bambulab step",
    prefix: "",
    model: "Cube.step",
    contentType: "application/step",
  },
  {
    name: "none-Bambulab step",
    prefix: "megas-",
    model: "Cube.step",
    contentType: "application/step",
  },
];

async function waitForJob(url: string) {
  const response = await request.get(url).expect(200);
  if (
    response.body.status === "completed" ||
    response.body.status === "failed"
  ) {
    return response.body;
  } else if (["pending", "processing"].includes(response.body.status)) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return waitForJob(url);
  } else throw new Error(`Unexpected status: ${response.body.status}`);
}

async function verifyJob(
  response: { body: { requestId: string; statusUrl: string } },
  expected: "completed" | "failed",
  message?: string,
) {
  const { requestId, statusUrl } = response.body;
  expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(statusUrl).toBe(`/slice-async/${requestId}`);
  try {
    const job = await waitForJob(statusUrl);
    expect(job.requestId).toBe(requestId);
    expect(job.status).toBe(expected);
    if (expected === "completed") {
      expect(job.downloadUrl).toBe(`${statusUrl}/result`);
      for (const value of Object.values(
        job.metadata as Record<string, number>,
      )) {
        expect(value).toBeGreaterThan(0);
      }
      const download = await request
        .get(job.downloadUrl)
        .responseType("blob")
        .expect(200);
      expect(download.headers["content-type"]).toMatch(/octet-stream/);
      expect(download.body.length).toBeGreaterThan(0);
      expect(Number(download.headers["x-print-time-seconds"])).toBeGreaterThan(
        0,
      );
      expect(Number(download.headers["x-filament-used-g"])).toBeGreaterThan(0);
      expect(Number(download.headers["x-filament-used-mm"])).toBeGreaterThan(0);
    } else {
      expect(job.message).toContain(message);
      await request.get(`${statusUrl}/result`).expect(400);
    }
  } finally {
    await request.delete(statusUrl).expect(204);
    await request.get(statusUrl).expect(404);
    await request.get(`${statusUrl}/result`).expect(404);
  }
}

describe("Async slicing", () => {
  for (const printer of printers) {
    describe(printer.name, () => {
      it("should slice successfully on uploaded full profiles", async () => {
        const printerBuffer = inputProfile(
          `full/${printer.prefix}printer.json`,
        );
        const processBuffer = inputProfile(
          `full/${printer.prefix}process.json`,
        );
        const filamentBuffer = inputProfile(`full/filament.json`);

        const model = input(printer.model);

        const response = await request
          .post("/slice-async")
          .attach("file", model, {
            filename: printer.model,
            contentType: printer.contentType,
          })
          .attach("printerProfile", printerBuffer, "printer.json")
          .attach("presetProfile", processBuffer, "process.json")
          .attach("filamentProfile", filamentBuffer, "filament.json")
          .expect(202);

        await verifyJob(response, "completed");
      }, 180_000);
      it("should return an error on uploaded full profiles with an invalid type", async () => {
        const printerBuffer = Buffer.from(
          JSON.stringify({ type: "filament", name: "Profile", from: "test" }),
        );
        const processBuffer = inputProfile(
          `full/${printer.prefix}process.json`,
        );
        const filamentBuffer = inputProfile(`full/filament.json`);

        const model = input(printer.model);

        await request
          .post("/slice-async")
          .attach("file", model, {
            filename: printer.model,
            contentType: printer.contentType,
          })
          .attach("printerProfile", printerBuffer, "printer.json")
          .attach("presetProfile", processBuffer, "process.json")
          .attach("filamentProfile", filamentBuffer, "filament.json")
          .expect(400)
          .expect((res) => {
            const expectedMessage = `Invalid profile type for printers. Expected "machine".`;
            if (res.body.message !== expectedMessage) {
              throw new Error("Wrong error message: " + res.body.message);
            }
          });
      });
      it("should slice successfully on uploaded profiles with inheritance", async () => {
        const printerBuffer = inputProfile(
          `inheritance/${printer.prefix}printer.json`,
        );
        const processBuffer = inputProfile(
          `inheritance/${printer.prefix}process.json`,
        );
        const filamentBuffer = inputProfile(`inheritance/filament.json`);

        const model = input(printer.model);

        const response = await request
          .post("/slice-async")
          .attach("file", model, {
            filename: printer.model,
            contentType: printer.contentType,
          })
          .attach("printerProfile", printerBuffer, "printer.json")
          .attach("presetProfile", processBuffer, "process.json")
          .attach("filamentProfile", filamentBuffer, "filament.json")
          .field("resolveProfileInheritance", "true")
          .expect(202);

        await verifyJob(response, "completed");
      }, 180_000);
      it("should return an error on uploaded profiles without inheritance", async () => {
        const printerBuffer = inputProfile(
          `inheritance/${printer.prefix}printer.json`,
        );
        const processBuffer = inputProfile(
          `inheritance/${printer.prefix}process.json`,
        );
        const filamentBuffer = inputProfile(`inheritance/filament.json`);

        const model = input(printer.model);

        const response = await request
          .post("/slice-async")
          .attach("file", model, {
            filename: printer.model,
            contentType: printer.contentType,
          })
          .attach("printerProfile", printerBuffer, "printer.json")
          .attach("presetProfile", processBuffer, "process.json")
          .attach("filamentProfile", filamentBuffer, "filament.json")
          .expect(202);

        await verifyJob(
          response,
          "failed",
          "Slicing failed with error from slicer",
        );
      }, 180_000);
      it("should slice successfully with system profiles", async () => {
        const printerProfile = printer.name.includes("none")
          ? "Anycubic i3 Mega S 0.4 nozzle"
          : "Bambu Lab P1S 0.4 nozzle";
        const processProfile = printer.name.includes("none")
          ? "0.20mm Standard @Anycubic i3MegaS"
          : "0.20mm Standard @BBL X1C";

        const model = input(printer.model);

        const response = await request
          .post("/slice-async")
          .attach("file", model, {
            filename: printer.model,
            contentType: printer.contentType,
          })
          .field("printer", printerProfile)
          .field("preset", processProfile)
          .field("filament", "Generic ASA")
          .expect(202);

        await verifyJob(response, "completed");
      }, 180_000);
    });
  }
  describe("All", () => {
    it("should return an error on invalid system profiles", async () => {
      const model = input("Cube.stl");

      const response = await request
        .post("/slice-async")
        .attach("file", model, {
          filename: "Cube.stl",
        })
        .field("printer", "nonexistent")
        .field("preset", "nonexistent")
        .field("filament", "Generic ASA")
        .expect(202);

      await verifyJob(response, "failed", 'Profile "nonexistent" not found');
    }, 180_000);
  });
});
