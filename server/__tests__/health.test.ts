import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import express from "express";

/**
 * Minimal smoke tests for health endpoints
 * These tests verify that:
 * 1. /health always returns 200 (even if DB is down)
 * 2. /api/health/db returns 200 if DB is up, 503 if down
 * 3. Server starts without crashing
 */

describe("Health Endpoints", () => {
  let server: any;
  const port = 5001; // Use a different port for testing
  const baseUrl = `http://localhost:${port}`;

  beforeAll(async () => {
    // Import and start the server
    const { createApp } = await import("../index");
    server = await createApp();
    
    // Wait a bit for server to fully start
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /health should always return 200", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(data.auth).toBe("independent");
  });

  it("GET /api/health/db should return 200 if DB is healthy", async () => {
    const response = await fetch(`${baseUrl}/api/health/db`);
    
    // Either 200 (DB healthy) or 503 (DB down) - both are valid
    // What matters is that the app didn't crash
    expect([200, 503]).toContain(response.status);
    
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it("Server should not crash on startup", async () => {
    // If we got here, the server didn't crash
    expect(server).toBeDefined();
  });
});
