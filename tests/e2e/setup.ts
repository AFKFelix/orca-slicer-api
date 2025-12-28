import { configureApp } from "../../src/index";
import { beforeAll, afterAll } from "vitest";
import supertest, { Test } from "supertest";
import { Server } from "http";
import type TestAgent from "supertest/lib/agent";
import { loadEnvFile } from "process";

try {
  loadEnvFile();
} catch {
  console.warn("No .env file found, proceeding without.");
}

const app = configureApp();

let server: Server;
let request: TestAgent<Test>;

beforeAll(async () => {
  server = app.listen(0);
  request = supertest(app);
});

afterAll(async () => {
  server.close();
});

export { request };
