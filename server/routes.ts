import { Express } from 'express';
import { Server, createServer } from 'http';
import axios from 'axios';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import voiceRouter from './api/voice';

// Enhanced logging configuration
function logServerStatus() {
  console.log('Server starting...');
  console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
  console.log('ElevenLabs API Key configured:', !!process.env.ELEVEN_LABS_API_KEY);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Log server configuration on startup
  logServerStatus();

  // Register new voice API routes
  app.use('/api/voice', voiceRouter);

  // Legacy endpoint that was previously removed - now redirects to new voice API
  app.post("/api/maddox-query", async (req, res) => {
    // Redirect to new voice API
    res.redirect(307, '/api/voice/synthesize');
  });

  // Legacy audio endpoint - now redirects to new voice API
  app.get("/api/audio/:filename", async (req, res) => {
    // Redirect to new voice API audio endpoint
    res.redirect(307, `/api/voice/audio/${req.params.filename}`);
  });

  const httpServer = createServer(app);
  return httpServer;
}