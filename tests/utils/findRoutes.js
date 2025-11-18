/* eslint-disable */
const fs = require("fs");
const path = require("path");

function toUrlPath(fromAppApi) {
  const segs = fromAppApi.split(path.sep).filter(Boolean);
  const replaced = segs
    .map((s) => {
      if (s === "route.ts" || s === "route.mts" || s === "route.js") return "";
      if (s.startsWith("[") && s.endsWith("]")) return "test";
      return s;
    })
    .filter(Boolean);
  return "/" + ["api", ...replaced].join("/");
}

function findAllApiRoutes(rootDir) {
  const appApiDir = path.join(rootDir, "app", "api");
  const results = [];

  function walk(dir, relFromApi = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, [...relFromApi, entry.name]);
      } else if (
        entry.isFile() &&
        (entry.name === "route.ts" ||
          entry.name === "route.mts" ||
          entry.name === "route.js")
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

module.exports = { findAllApiRoutes };
