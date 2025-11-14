#!/usr/bin/env node

/**
 * Geo-Tracking Test Script
 * Tests all geo-tracking endpoints and functionality
 */

const BASE_URL = "http://localhost:3001";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "bold");
  console.log("=".repeat(60));
}

async function testEndpoint(name, url, method = "GET", body = null) {
  try {
    log(`\n🧪 Testing: ${name}`, "blue");
    log(`   URL: ${url}`, "yellow");
    log(`   Method: ${method}`, "yellow");

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
      log(`   Body: ${JSON.stringify(body)}`, "yellow");
    }

    const response = await fetch(url, options);
    const data = await response.json();

    log(`   Status: ${response.status}`, response.ok ? "green" : "red");
    log(`   Response:`, "yellow");
    console.log(JSON.stringify(data, null, 2));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

async function runTests() {
  logSection("🚀 GEO-TRACKING API TESTS");

  // Test 1: Check if ipapi.co API is working
  logSection("Test 1: IP Geolocation API Check");
  const geoTest = await testEndpoint(
    "IP Geolocation Service (ipapi.co)",
    `${BASE_URL}/api/test-geo`
  );

  // Test 2: Get current geo-tracking settings
  logSection("Test 2: Get Geo-Tracking Settings");
  const getSettings = await testEndpoint(
    "Get Settings",
    `${BASE_URL}/api/settings/geo-tracking`
  );

  // Test 3: Enable geo-tracking
  logSection("Test 3: Enable Geo-Tracking");
  const enableTracking = await testEndpoint(
    "Enable Tracking",
    `${BASE_URL}/api/settings/geo-tracking`,
    "POST",
    { enabled: true }
  );

  // Test 4: Verify settings were updated
  logSection("Test 4: Verify Settings Update");
  const verifySettings = await testEndpoint(
    "Verify Settings",
    `${BASE_URL}/api/settings/geo-tracking`
  );

  // Test 5: Track a visitor
  logSection("Test 5: Track Visitor");
  const trackVisitor = await testEndpoint(
    "Track Visitor",
    `${BASE_URL}/api/track-visitor`,
    "POST",
    {
      ipAddress: "8.8.8.8",
      city: "Mountain View",
      state: "California",
      country: "United States",
      countryFlag: "🇺🇸",
      userAgent: "Test Script",
      page: "/test",
    }
  );

  // Test 6: Get recent visitors
  logSection("Test 6: Get Recent Visitors");
  const getVisitors = await testEndpoint(
    "Get Visitors",
    `${BASE_URL}/api/tracking/visitors`
  );

  // Test 7: Get active sessions
  logSection("Test 7: Get Active Sessions");
  const getSessions = await testEndpoint(
    "Get Active Sessions",
    `${BASE_URL}/api/tracking/sessions`
  );

  // Test 8: Disable geo-tracking
  logSection("Test 8: Disable Geo-Tracking");
  const disableTracking = await testEndpoint(
    "Disable Tracking",
    `${BASE_URL}/api/settings/geo-tracking`,
    "POST",
    { enabled: false }
  );

  // Summary
  logSection("📊 TEST SUMMARY");
  const tests = [
    { name: "IP Geolocation API", result: geoTest },
    { name: "Get Settings", result: getSettings },
    { name: "Enable Tracking", result: enableTracking },
    { name: "Verify Settings", result: verifySettings },
    { name: "Track Visitor", result: trackVisitor },
    { name: "Get Visitors", result: getVisitors },
    { name: "Get Sessions", result: getSessions },
    { name: "Disable Tracking", result: disableTracking },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const status = test.result.success ? "✅ PASS" : "❌ FAIL";
    const color = test.result.success ? "green" : "red";
    log(`${index + 1}. ${test.name}: ${status}`, color);

    if (test.result.success) {
      passed++;
    } else {
      failed++;
      if (test.result.error) {
        log(`   Error: ${test.result.error}`, "red");
      }
    }
  });

  console.log("\n" + "=".repeat(60));
  log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`, "bold");
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    log("⚠️  Some tests failed. Check the output above for details.", "yellow");
    log("\nCommon issues:", "yellow");
    log(
      "  1. Make sure the Next.js dev server is running on port 3001",
      "yellow"
    );
    log("  2. Check if the MySQL database is running", "yellow");
    log("  3. Verify DATABASE_URL in .env file", "yellow");
    log("  4. Run: npx prisma generate", "yellow");
    log("  5. Run: npx prisma migrate dev", "yellow");
  } else {
    log("🎉 All tests passed!", "green");
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
