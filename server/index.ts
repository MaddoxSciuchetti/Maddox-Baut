import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import path from "path";
import fs from "fs";

// Log critical environment variables
console.log('Environment variables check:');
console.log('ELEVEN_LABS_API_KEY present:', !!process.env.ELEVEN_LABS_API_KEY);
console.log('ELEVEN_LABS_VOICE_ID present:', !!process.env.ELEVEN_LABS_VOICE_ID);
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create cache directory for audio files
const cacheDir = path.join(process.cwd(), 'cache', 'audio');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Add CORS configuration with specific origin and allow audio content types
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? `https://${process.env.REPLIT_SLUG}.replit.dev`
    : ["http://localhost:5173", "http://localhost:3000", "https://fa03b65f-aeb8-4ef2-b01b-3c3be58cca53-00-2fjc1u7i1wb92.janeway.replit.dev"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Content-Length"]
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use a different port if the default is already in use
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  }).on('error', (error: any) => {
    // If the port is already in use, try another port
    if (error.code === 'EADDRINUSE') {
      const altPort = port + 1;
      log(`Port ${port} is in use, trying port ${altPort}`);
      server.listen({
        port: altPort,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`serving on port ${altPort}`);
      });
    } else {
      throw error;
    }
  });
})();
