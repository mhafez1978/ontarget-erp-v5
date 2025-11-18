/* eslint-disable */
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");
const { findAllApiRoutes } = require("./utils/findRoutes.js");

describe("API route export contract", () => {
  const rootDir = process.cwd();
  const routes = findAllApiRoutes(rootDir);

  it("should discover at least 1 API route", () => {
    expect(routes.length).to.be.greaterThan(0);
  });

  for (const route of routes) {
    it(`${route.urlPath} should export at least one HTTP method`, () => {
      const src = fs.readFileSync(route.filePath, "utf8");
      const hasGet = /export\s+async\s+function\s+GET\s*\(/.test(src);
      const hasPost = /export\s+async\s+function\s+POST\s*\(/.test(src);
      const hasPut = /export\s+async\s+function\s+PUT\s*\(/.test(src);
      const hasPatch = /export\s+async\s+function\s+PATCH\s*\(/.test(src);
      const hasDelete = /export\s+async\s+function\s+DELETE\s*\(/.test(src);
      const hasOptions = /export\s+async\s+function\s+OPTIONS\s*\(/.test(src);
      const hasHead = /export\s+async\s+function\s+HEAD\s*\(/.test(src);

      const ok =
        hasGet ||
        hasPost ||
        hasPut ||
        hasPatch ||
        hasDelete ||
        hasOptions ||
        hasHead;
      expect(ok, `No HTTP method export found in ${route.filePath}`).to.equal(
        true
      );
    });
  }
});
