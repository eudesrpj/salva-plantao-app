#!/usr/bin/env node
/**
 * Smoke Test Script
 * Starts the server and tests health endpoints
 * 
 * Usage: npm run smoke
 * 
 * This script:
 * 1. Starts the server in a child process
 * 2. Waits for it to be ready (listens on /health)
 * 3. Tests /health (must be 200)
 * 4. Tests /api/health/db (must be 200 or 503, never crash)
 * 5. Stops the server
 * 6. Exits with code 0 if all tests pass, 1 if any fail
 */

import { spawn } from "child_process";
import http from "http";
import path from "path";

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
const TIMEOUT = 30000; // 30 seconds max
const STARTUP_WAIT = 3000; // 3 seconds for server to start

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Server is ready at ${url}`);
        return true;
      }
    } catch (err) {
      // Server not ready yet
      await sleep(500);
    }
  }
  return false;
}

async function testHealthEndpoint(): Promise<boolean> {
  try {
    console.log(`\n📍 Testing GET /health`);
    const response = await fetch(`${BASE_URL}/health`);
    
    if (response.status !== 200) {
      console.error(`❌ /health returned ${response.status}, expected 200`);
      return false;
    }
    
    const data = await response.json();
    if (data.status !== "ok") {
      console.error(`❌ /health status is "${data.status}", expected "ok"`);
      return false;
    }
    
    console.log(`✅ /health returned 200 OK`);
    console.log(`   - status: ${data.status}`);
    console.log(`   - auth: ${data.auth}`);
    return true;
  } catch (err) {
    console.error(`❌ /health test failed:`, err);
    return false;
  }
}

async function testDbHealthEndpoint(): Promise<boolean> {
  try {
    console.log(`\n📍 Testing GET /api/health/db`);
    const response = await fetch(`${BASE_URL}/api/health/db`);
    
    // Accept both 200 (healthy) and 503 (DB down)
    // What matters is the app didn't crash
    if (![200, 503].includes(response.status)) {
      console.error(`❌ /api/health/db returned ${response.status}, expected 200 or 503`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ /api/health/db returned ${response.status}`);
    console.log(`   - status: ${data.status}`);
    
    if (response.status === 200) {
      console.log(`   - database: healthy`);
    } else {
      console.log(`   - database: unavailable (this is normal if DB is not set up)`);
    }
    
    return true;
  } catch (err) {
    console.error(`❌ /api/health/db test failed:`, err);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting Smoke Test");
  console.log(`📦 Starting server on port ${PORT}...`);
  
  // Start the server
  const serverProcess = spawn("node", ["dist/index.cjs"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: PORT.toString(),
      // Provide a dummy DATABASE_URL for smoke testing
      // The /api/health/db endpoint will return 503 if DB is unavailable
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/dummy",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  let errors = "";

  serverProcess.stdout?.on("data", (data) => {
    output += data.toString();
    process.stdout.write(data);
  });

  serverProcess.stderr?.on("data", (data) => {
    errors += data.toString();
    process.stderr.write(data);
  });

  // Wait for server to start
  await sleep(STARTUP_WAIT);

  // Check if process is still alive
  if (!serverProcess.exitCode && serverProcess.exitCode !== null) {
    console.error(`❌ Server process exited with code ${serverProcess.exitCode}`);
    process.exit(1);
  }

  try {
    // Wait for server to be ready
    console.log(`⏳ Waiting for server to be ready...`);
    const ready = await waitForServer(`${BASE_URL}/health`);
    
    if (!ready) {
      console.error(`❌ Server did not become ready within ${STARTUP_WAIT}ms`);
      serverProcess.kill();
      process.exit(1);
    }

    // Run tests
    const test1 = await testHealthEndpoint();
    const test2 = await testDbHealthEndpoint();

    // Summary
    console.log(`\n📊 Test Summary`);
    console.log(`✅ /health: ${test1 ? "PASS" : "FAIL"}`);
    console.log(`✅ /api/health/db: ${test2 ? "PASS" : "FAIL"}`);

    if (test1 && test2) {
      console.log(`\n🎉 All tests passed!`);
      serverProcess.kill();
      process.exit(0);
    } else {
      console.log(`\n❌ Some tests failed`);
      serverProcess.kill();
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Test execution failed:`, err);
    serverProcess.kill();
    process.exit(1);
  }
}

main();
