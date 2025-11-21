import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers (forwarded by proxy/load balancer)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2...)
    // The first one is the real client IP
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp;

    // Build the URL - if we have a client IP, query it specifically
    // Otherwise, ipapi.co will detect the server's IP
    const apiUrl = clientIp
      ? `https://ipapi.co/${clientIp}/json/`
      : "https://ipapi.co/json/";

    // Fetch from ipapi.co - this will return location for the specified IP
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "NextJS-App",
      },
    });

    if (!response.ok) {
      // Rate limited or API error - try to at least return the client IP
      const fallbackIp = clientIp || "127.0.0.1";
      const isLocalhost =
        fallbackIp === "127.0.0.1" ||
        fallbackIp === "::1" ||
        fallbackIp?.startsWith("192.168.") ||
        fallbackIp?.startsWith("10.");

      return NextResponse.json(
        {
          error: "Rate limited or API unavailable",
          ip: fallbackIp,
          ipv4: fallbackIp && !fallbackIp.includes(":") ? fallbackIp : null,
          ipv6: fallbackIp && fallbackIp.includes(":") ? fallbackIp : null,
          city: isLocalhost ? "Localhost" : null,
          region: null,
          country_name: isLocalhost ? "Local Development" : null,
          country_code: null,
          flag: isLocalhost ? "🏠" : null,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Determine if the IP is IPv4 or IPv6
    const isIPv6 = data.ip && data.ip.includes(":");
    // console.log(
    //   `Primary IP from ipapi.co: ${data.ip} (${isIPv6 ? "IPv6" : "IPv4"})`
    // );

    // Try to get IPv4 address as well if current is IPv6
    let ipv4 = isIPv6 ? null : data.ip;
    const ipv6 = isIPv6 ? data.ip : null;

    // If we got IPv6, try to also fetch IPv4 from multiple services
    if (isIPv6 && ipv4 === null) {
      // Try multiple IPv4 detection services in order
      const ipv4Services = [
        "https://api.ipify.org?format=json",
        "https://api64.ipify.org?format=json",
        "https://ipv4.icanhazip.com",
      ];

      for (const serviceUrl of ipv4Services) {
        try {
          const ipv4Response = await fetch(serviceUrl, {
            headers: {
              "User-Agent": "NextJS-App",
            },
            signal: AbortSignal.timeout(3000), // 3 second timeout
          });

          if (ipv4Response.ok) {
            let possibleIPv4: string | null = null;

            // Different services return different formats
            if (serviceUrl.includes("ipify")) {
              const ipv4Data = await ipv4Response.json();
              possibleIPv4 = ipv4Data.ip;
            } else {
              possibleIPv4 = (await ipv4Response.text()).trim();
            }

            // Only use it if it's actually IPv4 (doesn't contain ':')
            if (possibleIPv4 && !possibleIPv4.includes(":")) {
              ipv4 = possibleIPv4;
              //console.log(`IPv4 detected from ${serviceUrl}: ${ipv4}`);
              break; // Found IPv4, stop trying other services
            }
          }
        } catch (error) {
          console.log(`Could not fetch IPv4 from ${serviceUrl}:`, error);
          // Continue to next service
        }
      }

      if (!ipv4) {
        console.log(
          "No IPv4 address available - you may be on an IPv6-only network"
        );
      }
    }

    // Convert country code to flag emoji
    const flag = data.country_code
      ? countryCodeToFlag(data.country_code)
      : null;

    return NextResponse.json({
      ip: data.ip || "Unknown",
      ipv4: ipv4,
      ipv6: ipv6,
      city: data.city || null,
      region: data.region || null,
      country_name: data.country_name || null,
      country_code: data.country_code || null,
      flag,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });
  } catch (error) {
    console.error("Geo-location API error:", error);

    // Get client IP from headers for fallback
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const fallbackIp =
      forwardedFor?.split(",")[0]?.trim() || realIp || "127.0.0.1";
    const isLocalhost =
      fallbackIp === "127.0.0.1" ||
      fallbackIp === "::1" ||
      fallbackIp?.startsWith("192.168.") ||
      fallbackIp?.startsWith("10.");

    // Return fallback with client IP
    return NextResponse.json({
      ip: fallbackIp,
      ipv4: fallbackIp && !fallbackIp.includes(":") ? fallbackIp : null,
      ipv6: fallbackIp && fallbackIp.includes(":") ? fallbackIp : null,
      city: isLocalhost ? "Localhost" : null,
      region: null,
      country_name: isLocalhost ? "Local Development" : null,
      country_code: null,
      flag: isLocalhost ? "🏠" : null,
    });
  }
}

function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
