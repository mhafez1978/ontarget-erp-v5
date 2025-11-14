#!/usr/bin/env node

/**
 * Setup System Test Script
 * Tests the initial system setup flow
 */

const BASE_URL = "http://localhost:3001";

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

async function testSetupFlow() {
  logSection("🚀 SYSTEM SETUP TEST");

  // Test 1: Check setup status
  logSection("Test 1: Check Setup Status");
  try {
    const response = await fetch(`${BASE_URL}/api/setup/check`);
    const data = await response.json();
    log(`Status: ${response.status}`, response.ok ? "green" : "red");
    log(`Response: ${JSON.stringify(data, null, 2)}`, "yellow");

    if (data.hasSetup) {
      log("\n✅ System is already set up!", "green");
      log("A SUPER_ADMIN user already exists.", "yellow");
      return;
    } else {
      log("\n⚠️  System needs setup", "yellow");
      log("No SUPER_ADMIN user found. Ready for initialization.", "yellow");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    return;
  }

  // Test 2: Initialize system
  logSection("Test 2: Initialize System");
  const setupData = {
    name: "Super Admin",
    email: "admin@ontarget.com",
    password: "Admin123!",
    systemName: "OnTarget ERP",
    companyName: "OnTarget Systems",
    companySlogan: "People Driven & AI Insight",
  };

  log("\nAttempting to initialize system with:", "blue");
  log(JSON.stringify(setupData, null, 2), "yellow");

  try {
    const response = await fetch(`${BASE_URL}/api/setup/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setupData),
    });

    const data = await response.json();
    log(`\nStatus: ${response.status}`, response.ok ? "green" : "red");
    log(`Response: ${JSON.stringify(data, null, 2)}`, "yellow");

    if (response.ok) {
      log("\n✅ System initialized successfully!", "green");
      log(
        `Super Admin created: ${data.user.name} (${data.user.email})`,
        "green"
      );
      log(`Root Company created: ${data.company.name}`, "green");
      log(`User Role: ${data.user.role}`, "green");
    } else {
      log(`\n❌ Setup failed: ${data.error}`, "red");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  }

  // Test 3: Verify setup complete
  logSection("Test 3: Verify Setup Complete");
  try {
    const response = await fetch(`${BASE_URL}/api/setup/check`);
    const data = await response.json();
    log(`Status: ${response.status}`, response.ok ? "green" : "red");
    log(`Response: ${JSON.stringify(data, null, 2)}`, "yellow");

    if (data.hasSetup) {
      log("\n✅ Setup verification successful!", "green");
      log("System is now ready to use.", "green");
    } else {
      log("\n⚠️  Setup verification failed", "yellow");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  }

  // Test 4: Try to login as super admin
  logSection("Test 4: Login as Super Admin");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: setupData.email,
        password: setupData.password,
      }),
    });

    const data = await response.json();
    log(`Status: ${response.status}`, response.ok ? "green" : "red");
    log(`Response: ${JSON.stringify(data, null, 2)}`, "yellow");

    if (response.ok) {
      log("\n✅ Login successful!", "green");
      log(`Logged in as: ${data.user.name} (${data.user.role})`, "green");
    } else {
      log(`\n❌ Login failed: ${data.error}`, "red");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  }

  logSection("📊 TEST SUMMARY");
  log("\n✅ All tests completed!", "green");
  log("\nNext Steps:", "blue");
  log(
    "1. Visit http://localhost:3001 - Should redirect to /setup if no SUPER_ADMIN exists",
    "yellow"
  );
  log("2. Fill out the setup form", "yellow");
  log("3. System will create SUPER_ADMIN and root company", "yellow");
  log("4. You will be automatically logged in", "yellow");
  log("5. Future visits will redirect to homepage instead of /setup", "yellow");
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});

async function runTests() {
  await testSetupFlow();
}
