import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      { find: /^server-only$/, replacement: root + "tests/unit/server-only-stub.ts" },
    ],
  },
});
