import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Vite builds client to dist/public, server is in dist/index.cjs
  const publicPath = path.join(process.cwd(), "dist", "public");

  if (!fs.existsSync(publicPath)) {
    throw new Error(
      `Could not find the build directory: ${publicPath}. Did you run the build?`,
    );
  }

  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(publicPath));

  // SPA fallback: any non-API route returns index.html for client-side routing
  // This must come AFTER API routes are registered (in server/index.ts)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}
