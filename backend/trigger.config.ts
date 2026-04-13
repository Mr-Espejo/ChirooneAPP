import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_dkclmcrccgwxxswwgwzc",
  runtime: "node",
  logLevel: "log",
  dirs: ["triggers"],
  maxDuration: 300, 
  build: {
    extensions: [
      prismaExtension({
        mode: "legacy",
        schema: "prisma/schema.prisma",
      }),
    ],
  },
});
