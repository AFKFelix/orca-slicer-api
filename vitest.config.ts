import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    include: ["tests/**/*.spec.ts"],
    setupFiles: "./tests/e2e/setup.ts",
  },
});
