import { defineConfig } from "prisma/config";
import { readFileSync, existsSync } from "fs";

// Prisma 7 doesn't auto-load .env.local (Next.js convention), so load it manually
if (existsSync(".env.local")) {
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (/^["']/.test(val)) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
