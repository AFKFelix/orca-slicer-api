import { describe, expect, it } from "vitest";
import { request } from "./setup";
import fs from "fs";
import path from "path";

describe("Profiles API", () => {
  const orcaSlicerVersion = process.env.ORCASLICER_VERSION || "2.3.0";

  const printerPath = path.join(
    __dirname,
    `../files/input/${orcaSlicerVersion}/full/printer.json`,
  );
  const printerBuffer = fs.readFileSync(printerPath);
  const completePrinter = JSON.parse(printerBuffer.toString("utf8"));
  delete completePrinter.inherits;
  const completePrinterBuffer = Buffer.from(JSON.stringify(completePrinter));

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

  const inheritedPrinterBuffer = fs.readFileSync(
    path.join(
      __dirname,
      `../files/input/${orcaSlicerVersion}/inheritance/printer.json`,
    ),
  );
  const inheritedPresetBuffer = fs.readFileSync(
    path.join(
      __dirname,
      `../files/input/${orcaSlicerVersion}/inheritance/process.json`,
    ),
  );
  const inheritedFilamentBuffer = fs.readFileSync(
    path.join(
      __dirname,
      `../files/input/${orcaSlicerVersion}/inheritance/filament.json`,
    ),
  );

  describe("POST /profiles/:category", () => {
    it("should upload a printer profile successfully", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "testprinter")
        .attach("file", printerBuffer, "printer.json")
        .expect(201)
        .expect("Content-Type", /json/)
        .expect({ name: "testprinter" });
    });

    it("should upload a preset profile successfully", async () => {
      await request
        .post("/profiles/presets")
        .field("name", "testpreset")
        .attach("file", presetBuffer, "process.json")
        .expect(201)
        .expect({ name: "testpreset" });
    });

    it("should upload a filament profile successfully", async () => {
      await request
        .post("/profiles/filaments")
        .field("name", "testfilament")
        .attach("file", filamentBuffer, "filament.json")
        .expect(201)
        .expect({ name: "testfilament" });
    });

    it("should upload an inherited printer profile without resolving inheritance", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "inheritanceprinter")
        .attach("file", inheritedPrinterBuffer, "printer.json")
        .expect(201)
        .expect({ name: "inheritanceprinter" });
    });

    it("should upload an inherited preset profile without resolving inheritance", async () => {
      await request
        .post("/profiles/presets")
        .field("name", "inheritancepreset")
        .attach("file", inheritedPresetBuffer, "process.json")
        .expect(201)
        .expect({ name: "inheritancepreset" });
    });

    it("should upload an inherited filament profile without resolving inheritance", async () => {
      await request
        .post("/profiles/filaments")
        .field("name", "inheritancefilament")
        .attach("file", inheritedFilamentBuffer, "filament.json")
        .expect(201)
        .expect({ name: "inheritancefilament" });
    });

    it("should upload an inherited printer profile with resolved inheritance", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "resolvedinheritanceprinter")
        .field("resolveInheritance", "true")
        .attach("file", inheritedPrinterBuffer, "printer.json")
        .expect(201)
        .expect({ name: "resolvedinheritanceprinter" });
    });

    it("should upload an inherited preset profile with resolved inheritance", async () => {
      await request
        .post("/profiles/presets")
        .field("name", "resolvedinheritancepreset")
        .field("resolveInheritance", "true")
        .attach("file", inheritedPresetBuffer, "process.json")
        .expect(201)
        .expect({ name: "resolvedinheritancepreset" });
    });

    it("should upload an inherited filament profile with resolved inheritance", async () => {
      await request
        .post("/profiles/filaments")
        .field("name", "resolvedinheritancefilament")
        .field("resolveInheritance", "true")
        .attach("file", inheritedFilamentBuffer, "filament.json")
        .expect(201)
        .expect({ name: "resolvedinheritancefilament" });
    });

    it("should leave a complete profile unchanged when resolving inheritance", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "resolvedcompleteprinter")
        .field("resolveInheritance", "true")
        .attach("file", completePrinterBuffer, "printer.json")
        .expect(201)
        .expect({ name: "resolvedcompleteprinter" });

      const printer = await request
        .get("/profiles/printers/resolvedcompleteprinter")
        .expect(200);
      expect(printer.body).toEqual(completePrinter);
    });

    it("should return 400 for invalid category", async () => {
      await request
        .post("/profiles/invalid")
        .field("name", "test")
        .attach("file", printerBuffer, "printer.json")
        .expect(400)
        .expect((res) => {
          if (res.body.message !== "Invalid or missing category")
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should return 400 for invalid name (special characters)", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "test-printer!")
        .attach("file", printerBuffer, "printer.json")
        .expect(400)
        .expect((res) => {
          if (res.body.message !== "Name must only contain letters and numbers")
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it("should return 400 if file is missing", async () => {
      await request
        .post("/profiles/printers")
        .field("name", "testprinter")
        .expect(400)
        .expect((res) => {
          if (res.body.message !== "File is required")
            throw new Error("Wrong error message: " + res.body.message);
        });
    });

    it.each([
      ["printers", "process", "machine"],
      ["presets", "machine", "process"],
      ["filaments", "process", "filament"],
    ])(
      "should reject a %s profile with type %s",
      async (category, type, expectedType) => {
        await request
          .post(`/profiles/${category}`)
          .field("name", "invalidprofile")
          .attach(
            "file",
            Buffer.from(JSON.stringify({ type, name: "Profile", from: "test" })),
            "profile.json",
          )
          .expect(400)
          .expect((res) => {
            const expectedMessage = `Invalid profile type for ${category}. Expected "${expectedType}".`;
            if (res.body.message !== expectedMessage) {
              throw new Error("Wrong error message: " + res.body.message);
            }
          });
      },
    );

    it.each([
      ["array", "[]", "Profile must be a JSON object"],
      ["null", "null", "Profile must be a JSON object"],
      ["missing name", '{"type":"machine","from":"test"}', "Profile must include a non-empty name"],
      ["blank name", '{"type":"machine","name":"  ","from":"test"}', "Profile must include a non-empty name"],
      ["missing from", '{"type":"machine","name":"Profile"}', "Profile must include a non-empty from field"],
      ["blank from", '{"type":"machine","name":"Profile","from":"  "}', "Profile must include a non-empty from field"],
    ])("should reject profile with %s", async (_case, profile, message) => {
      await request
        .post("/profiles/printers")
        .field("name", "invalidprofile")
        .attach("file", Buffer.from(profile), "profile.json")
        .expect(400)
        .expect((res) => {
          if (res.body.message !== message) {
            throw new Error("Wrong error message: " + res.body.message);
          }
        });
    });
  });

  describe("GET /profiles/:category", () => {
    it("should list uploaded printer profiles", async () => {
      await request
        .get("/profiles/printers")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (!Array.isArray(res.body))
            throw new Error("Response should be an array");
          if (!res.body.includes("testprinter"))
            throw new Error("testprinter should be in the list");
        });
    });

    it("should list uploaded preset profiles", async () => {
      await request
        .get("/profiles/presets")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (!Array.isArray(res.body))
            throw new Error("Response should be an array");
          if (!res.body.includes("testpreset"))
            throw new Error("testpreset should be in the list");
        });
    });

    it("should list uploaded filament profiles", async () => {
      await request
        .get("/profiles/filaments")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (!Array.isArray(res.body))
            throw new Error("Response should be an array");
          if (!res.body.includes("testfilament"))
            throw new Error("testfilament should be in the list");
        });
    });
  });

  describe("GET /profiles/:category/:name", () => {
    it("should get a specific printer profile", async () => {
      await request
        .get("/profiles/printers/testprinter")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (res.body.name !== "Bambu Lab P1S 0.4 nozzle")
            throw new Error(
              `Profile content mismatch, got "${res.body.name}" expected "Bambu Lab P1S 0.4 nozzle"`,
            );
        });
    });
    it("should get a specific preset profile", async () => {
      await request
        .get("/profiles/presets/testpreset")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (res.body.name !== "0.20mm Standard @BBL X1C")
            throw new Error(
              `Profile content mismatch, got "${res.body.name}" expected "0.20mm Standard @BBL X1C"`,
            );
        });
    });
    it("should get a specific filament profile", async () => {
      await request
        .get("/profiles/filaments/testfilament")
        .expect(200)
        .expect("Content-Type", /json/)
        .expect((res) => {
          if (res.body.name !== "Bambu PETG Basic @BBL X1C")
            throw new Error(
              `Profile content mismatch, got "${res.body.name}" expected "Bambu PETG Basic @BBL X1C"`,
            );
        });
    });

    it("should get an unresolved inherited printer profile as uploaded", async () => {
      const printer = await request
        .get("/profiles/printers/inheritanceprinter")
        .expect(200);
      expect(printer.body).toEqual({
        type: "machine",
        name: "My P1S 0.4 nozzle",
        from: "User",
        inherits: "Bambu Lab P1S 0.6 nozzle",
      });
    });

    it("should get an unresolved inherited preset profile as uploaded", async () => {
      const preset = await request
        .get("/profiles/presets/inheritancepreset")
        .expect(200);
      expect(preset.body).toEqual({
        type: "process",
        name: "My - 0.24mm Standard @BBL X1C 0.6 nozzle",
        from: "User",
        inherits: "0.24mm Standard @BBL X1C 0.6 nozzle",
      });
    });

    it("should get an unresolved inherited filament profile as uploaded", async () => {
      const filament = await request
        .get("/profiles/filaments/inheritancefilament")
        .expect(200);
      expect(filament.body).toEqual({
        type: "filament",
        name: "My ASA",
        from: "User",
        inherits: "Generic ASA",
      });
    });

    it("should get a resolved inherited printer profile with parent settings", async () => {
      const printer = await request
        .get("/profiles/printers/resolvedinheritanceprinter")
        .expect(200);
      expect(printer.body.name).toBe("My P1S 0.4 nozzle");
      expect(printer.body.nozzle_diameter).toEqual(["0.6"]);
      expect(printer.body.instantiation).toEqual("true");
    });

    it("should get a resolved inherited preset profile with parent settings", async () => {
      const preset = await request
        .get("/profiles/presets/resolvedinheritancepreset")
        .expect(200);
      expect(preset.body.name).toBe("My - 0.24mm Standard @BBL X1C 0.6 nozzle");
      expect(preset.body.layer_height).toBe("0.24");
      expect(preset.body.instantiation).toEqual("true");
    });

    it("should get a resolved inherited filament profile with parent settings", async () => {
      const filament = await request
        .get("/profiles/filaments/resolvedinheritancefilament")
        .expect(200);
      expect(filament.body.name).toBe("My ASA");
      expect(filament.body.filament_type).toEqual(["ASA"]);
      expect(filament.body.instantiation).toEqual("true");
    });

    it("should return error for non-existent printer profile", async () => {
      await request.get("/profiles/printers/nonexistent").expect(500);
    });
    it("should return error for non-existent preset profile", async () => {
      await request.get("/profiles/presets/nonexistent").expect(500);
    });
    it("should return error for non-existent filament profile", async () => {
      await request.get("/profiles/filaments/nonexistent").expect(500);
    });
  });
});
