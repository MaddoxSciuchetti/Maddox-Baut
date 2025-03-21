import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, type InlineConfig } from "vite";
import type { Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple logging utility
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Create Vite server in middleware mode
    const viteDevConfig: InlineConfig = {
      ...viteConfig,
      configFile: false,
      server: {
        middlewareMode: true,
        hmr: {
          server
        },
      },
      appType: "custom",
      logLevel: "info"
    };

    const vite = await createViteServer(viteDevConfig);

    // Use Vite's middlewares
    app.use(vite.middlewares);
    
    // Handle * route for client-side rendering
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Get the path to the index HTML
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // Read the template
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        
        // Add a version query param to prevent caching
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        // Transform the HTML with Vite
        const page = await vite.transformIndexHtml(url, template);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    log("Vite middleware setup complete", "vite");
  } catch (error) {
    console.error("Error setting up Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // For production mode
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}`);
    // We'll create it if it doesn't exist - useful for Vercel
    fs.mkdirSync(distPath, { recursive: true });
  }

  // Serve static files
  app.use(express.static(distPath, {
    index: false // Don't serve index.html on directory access
  }));

  // Fall through to index.html for SPAs
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not built. Please build the client first.");
    }
  });

  log("Static file serving setup for production", "express");
}
