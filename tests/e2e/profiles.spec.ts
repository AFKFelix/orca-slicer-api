import { describe, expect, it } from "vitest";
import { request } from "./setup";

describe("Profiles API", () => {
  describe("GET /profiles/:category", () => {
    it("should list system printer profiles", async () => {
      const res = await request
        .get("/profiles/printers")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body).toContain("Bambu Lab P1S 0.4 nozzle");
    });

    it("should list system preset profiles", async () => {
      const res = await request
        .get("/profiles/presets")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body).toContain("0.20mm Standard @BBL X1C");
    });

    it("should list system filament profiles", async () => {
      const res = await request
        .get("/profiles/filaments")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body).toContain("Generic ASA");
    });

    it("should return 400 for invalid category", async () => {
      await request
        .get("/profiles/invalid")
        .expect(400)
        .expect((res) => {
          if (res.body.message !== "Invalid or missing category")
            throw new Error("Wrong error message: " + res.body.message);
        });
    });
  });

  describe("GET /profiles/:category/:name", () => {
    it("should get a specific printer profile", async () => {
      const res = await request
        .get("/profiles/printers/Bambu%20Lab%20P1S%200.4%20nozzle")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.type).toBe("machine");
      expect(res.body.name).toBe("Bambu Lab P1S 0.4 nozzle");
      expect(res.body.nozzle_diameter).toEqual(["0.4"]);
    });

    it("should get a specific preset profile", async () => {
      const res = await request
        .get("/profiles/presets/0.20mm%20Standard%20@BBL%20X1C")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.type).toBe("process");
      expect(res.body.name).toBe("0.20mm Standard @BBL X1C");
    });

    it("should get a specific filament profile", async () => {
      const res = await request
        .get("/profiles/filaments/Generic%20ASA")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.type).toBe("filament");
      expect(res.body.name).toBe("Generic ASA");
      expect(res.body.filament_type).toEqual(["ASA"]);
    });
    it("should return 404 for non-existent printer profile", async () => {
      await request.get("/profiles/printers/nonexistent").expect(404);
    });

    it("should return 404 for non-existent preset profile", async () => {
      await request.get("/profiles/presets/nonexistent").expect(404);
    });

    it("should return 404 for non-existent filament profile", async () => {
      await request.get("/profiles/filaments/nonexistent").expect(404);
    });
  });
});
