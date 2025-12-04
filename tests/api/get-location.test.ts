import { expect } from "chai";
import { GET, __clearGetLocationCache } from "@/app/api/get-location/route";

type MockResponse = {
  ok: boolean;
  json: () => Promise<Record<string, unknown>>;
};

describe("GET /api/get-location (unit)", () => {
  const realFetch = global.fetch as typeof fetch;

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = realFetch;
    // Clear route cache to avoid cross-test pollution
    __clearGetLocationCache();
  });

  it("caches results and avoids repeated provider calls", async () => {
    let callCount = 0;

    global.fetch = (async (input: RequestInfo | URL) => {
      callCount++;
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("ipapi.co")) {
        const mock: MockResponse = {
          ok: true,
          async json() {
            return {
              ip: "222.222.222.222",
              city: "Cached City",
              region: "Cached Region",
              country_name: "Cachedland",
              country_code: "CL",
            };
          },
        };
        return mock as unknown as Response;
      }
      throw new Error("Unexpected fetch to: " + url);
    }) as typeof fetch;

    const mockRequest = {
      headers: {
        get: (_name: string) => "222.222.222.222",
      },
    } as unknown as Request;

    // First call should hit the provider
    const res1 = await GET(mockRequest as any);
    const body1 = await (res1 as Response).json();

    expect(res1.status).to.equal(200);
    expect(body1.ip).to.equal("222.222.222.222");
    expect(body1.city).to.equal("Cached City");
    expect(callCount).to.equal(1);

    // Second call with same IP should be served from cache (no extra fetch)
    const res2 = await GET(mockRequest as any);
    const body2 = await (res2 as Response).json();

    expect(res2.status).to.equal(200);
    expect(body2.ip).to.equal("222.222.222.222");
    expect(body2.city).to.equal("Cached City");
    expect(callCount).to.equal(1);
  });

  it("returns geo data from provider when available", async () => {
    // Mock ipapi.co response
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("ipapi.co")) {
        const mock: MockResponse = {
          ok: true,
          async json() {
            return {
              ip: "203.0.113.10",
              city: "Test City",
              region: "Test State",
              country_name: "Testland",
              country_code: "TL",
              latitude: 10.5,
              longitude: 20.5,
            };
          },
        };
        return mock as unknown as Response;
      }
      throw new Error("Unexpected fetch to: " + url);
    }) as typeof fetch;

    const mockRequest = {
      headers: {
        get: (_name: string) => null,
      },
    } as unknown as Request;

    const res = await GET(mockRequest as any);
    const body = await (res as Response).json();

    expect(res.status).to.equal(200);
    expect(body).to.include({
      ip: "203.0.113.10",
      city: "Test City",
      region: "Test State",
      country_name: "Testland",
    });
    expect(body.flag).to.be.a("string");
  });

  it("falls back to secondary provider when primary has no city/country", async () => {
    // Mock ipapi.co returning minimal data (only ip)
    global.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("ipapi.co")) {
        const mock: MockResponse = {
          ok: true,
          async json() {
            return {
              ip: "198.51.100.25",
              // intentionally missing city/region/country
            };
          },
        };
        return mock as unknown as Response;
      }

      if (url.includes("ipwho.is")) {
        const mock: MockResponse = {
          ok: true,
          async json() {
            return {
              success: true,
              ip: "198.51.100.25",
              city: "Fallback City",
              region: "Fallback Region",
              country: "Fallbackland",
              country_code: "FL",
              latitude: 1.23,
              longitude: 4.56,
            };
          },
        };

        return mock as unknown as Response;
      }

      throw new Error("Unexpected fetch to: " + url);
    }) as typeof fetch;

    const mockRequest = {
      headers: {
        get: (_name: string) => null,
      },
    } as unknown as Request;

    const res = await GET(mockRequest as any);
    const body = await (res as Response).json();

    expect(res.status).to.equal(200);
    expect(body).to.include({
      ip: "198.51.100.25",
      city: "Fallback City",
      region: "Fallback Region",
      country_name: "Fallbackland",
    });
    expect(body.flag).to.be.a("string");
  });

  it("returns localhost fallback on provider error", async () => {
    // Make provider call fail
    global.fetch = (async () => {
      throw new Error("Network down");
    }) as typeof fetch;

    const mockRequest = {
      headers: {
        get: (_name: string) => null,
      },
    } as unknown as Request;

    const res = await GET(mockRequest as any);
    const body = await (res as Response).json();

    expect(res.status).to.equal(200);
    expect(body).to.include({
      ip: "127.0.0.1",
      city: "Localhost",
      country_name: "Local Development",
    });
  });
});
