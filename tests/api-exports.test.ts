import { expect } from "chai";
import fs from "fs";
// path is not required when using process.cwd()
import { findAllApiRoutes } from "./utils/findRoutes";

/**
 * Phase 1 QA: Static contract test across all API route handlers.
 * - Ensures each route.ts exports at least one HTTP method function (GET/POST/PUT/PATCH/DELETE)
 * - Avoids executing handler logic (no server, no DB required)
 */

// Resolve repository root; works for both CJS/ESM via process.cwd()
const repoRoot = process.cwd();

describe("API route export contract (TypeScript)", () => {
  const routes = findAllApiRoutes(repoRoot);

  it(`should discover at least 1 API route`, () => {
    expect(routes.length).to.be.greaterThan(0);
  });

  for (const route of routes) {
    it(`${route.urlPath} should export at least one HTTP method`, () => {
      const src = fs.readFileSync(route.filePath, "utf8");
      // Simple regex checks for exported HTTP methods
      const hasGet = /export\s+async\s+function\s+GET\s*\(/.test(src);
      const hasPost = /export\s+async\s+function\s+POST\s*\(/.test(src);
      const hasPut = /export\s+async\s+function\s+PUT\s*\(/.test(src);
      const hasPatch = /export\s+async\s+function\s+PATCH\s*\(/.test(src);
      const hasDelete = /export\s+async\s+function\s+DELETE\s*\(/.test(src);

      const any = hasGet || hasPost || hasPut || hasPatch || hasDelete;
      if (!any) {
        // Provide a helpful hint for the developer
        // e.g., some files might export only OPTIONS or HEAD – treat as valid
        const hasOptions = /export\s+async\s+function\s+OPTIONS\s*\(/.test(src);
        const hasHead = /export\s+async\s+function\s+HEAD\s*\(/.test(src);
        const ok = hasOptions || hasHead;
        expect(ok, `No HTTP method export found in ${route.filePath}`).to.equal(
          true
        );
      } else {
        expect(
          any,
          `No HTTP method export found in ${route.filePath}`
        ).to.equal(true);
      }
    });
  }
});
