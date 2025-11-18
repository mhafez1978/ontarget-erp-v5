import fs from "fs";
import path from "path";

/**
 * Recursively find all Next.js API route handler files (route.ts/route.mts)
 * under the app/api directory and return their filesystem paths and URL paths.
 */
export interface ApiRouteFile {
  filePath: string; // absolute path to route.ts
  urlPath: string; // computed API path starting with /api
}

function toUrlPath(fromAppApi: string): string {
  // Convert filesystem path segments to URL path
  // Replace [param] -> test, and remove trailing "/route.ts"
  const segs = fromAppApi.split(path.sep).filter(Boolean);
  const replaced = segs
    .map((s) => {
      if (s === "route.ts" || s === "route.mts") return "";
      // Dynamic segment replacement: [id] -> test
      if (s.startsWith("[") && s.endsWith("]")) return "test";
      return s;
    })
    .filter(Boolean);
  return "/" + ["api", ...replaced].join("/");
}

export function findAllApiRoutes(rootDir: string): ApiRouteFile[] {
  const appApiDir = path.join(rootDir, "app", "api");
  const results: ApiRouteFile[] = [];

  function walk(dir: string, relFromApi: string[] = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, [...relFromApi, entry.name]);
      } else if (
        entry.isFile() &&
        (entry.name === "route.ts" || entry.name === "route.mts")
      ) {
        const rel = path.join(...relFromApi, entry.name);
        const urlPath = toUrlPath(rel);
        results.push({ filePath: full, urlPath });
      }
    }
  }

  if (fs.existsSync(appApiDir)) {
    walk(appApiDir);
  }

  return results.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
}
