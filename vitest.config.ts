import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/scan.test.ts"],
    environment: "node",
  },
});
