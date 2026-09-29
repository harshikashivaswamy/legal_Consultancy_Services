import fs from "node:fs";
import path from "node:path";

let cachedEnv: Record<string, string> | null = null;
let lastReadTime = 0;

export function getEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];

  // Refresh .env cache every 2 seconds if file exists
  const now = Date.now();
  if (!cachedEnv || now - lastReadTime > 2000) {
    cachedEnv = {};
    lastReadTime = now;
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
            cachedEnv[k] = v;
          }
        }
      }
    } catch (err) {
      console.warn("Could not read .env file directly:", err);
    }
  }

  return cachedEnv[key] || process.env[key];
}
