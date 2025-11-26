import { expect } from "chai";
import { GET } from "@/app/api/get-location/route";

type MockResponse = {
  ok: boolean;
  json: () => Promise<Record<string, unknown>>;
};

describe("GET /api/get-location (unit)", () => {
  const realFetch = global.fetch as typeof fetch;

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = realFetch;
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
