import { Router } from 'express';
import axios from 'axios';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import OpenAI from 'openai';
import speech from '@google-cloud/speech';
import { protos } from '@google-cloud/speech';
import multer from 'multer';
import { Request, Response } from 'express';

// Import audio encoding types from Google Speech API
type AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

// Define types for request with file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const voiceRouter = Router();
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';
const CACHE_DIR = path.join(process.cwd(), 'cache', 'audio');

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Speech client
const googleSpeechClient = new speech.SpeechClient({
  keyFilename: './google-credentials.json'
});

// Log configuration
console.log('Voice router initialized with:');
console.log('- ElevenLabs API Key:', process.env.ELEVEN_LABS_API_KEY ? 'Present' : 'Missing');
console.log('- Default Voice ID:', process.env.ELEVEN_LABS_VOICE_ID || 'TnVT7p6RBpw3AtQyx4cd');
console.log('- Google Speech API credentials:', fs.existsSync('./google-credentials.json') ? 'Present' : 'Missing');

/**
 * Endpoint for Google Speech-to-Text transcription
 */
voiceRouter.post('/transcribe', upload.single('audio'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    console.log(`Received audio file: ${req.file.originalname}, size: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);
    
    // Check if file is too small (likely contains no speech)
    if (req.file.size < 1000) {
      console.log('Audio file too small, likely contains no speech');
      return res.status(400).json({
        success: false,
        message: 'Audio file too small, likely contains no speech'
      });
    }

    // Get audio data from the request
    const audioBytes = req.file.buffer.toString('base64');

    // Detect encoding from mimetype
    let encoding: AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS;
    if (req.file.mimetype.includes('wav')) {
      encoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16;
    } else if (req.file.mimetype.includes('mp3')) {
      // MP3 is not supported in some versions of the API types, use OGG_OPUS as fallback
      encoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.OGG_OPUS;
    }

    // Log the mimetype and selected encoding
    console.log(`Audio file mimetype: ${req.file.mimetype}, using encoding: ${encoding}`);

    // Configure the request to Google Speech API
    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: encoding,
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'default',
        enableAutomaticPunctuation: true,
        useEnhanced: true,
        audioChannelCount: 1
      },
    };

    console.log(`Sending audio to Google Speech API for transcription using encoding: ${encoding}`);
    
    try {
      // Make the API request
      const [response] = await googleSpeechClient.recognize(request);
      
      if (!response || !response.results || response.results.length === 0) {
        console.log('Google Speech API returned no results');
        return res.status(422).json({
          success: false,
          message: 'No speech detected in the audio'
        });
      }
      
      const transcription = response.results
        .map(result => result.alternatives && result.alternatives[0] ? result.alternatives[0].transcript : '')
        .join(' ')
        .trim();
        
      if (!transcription) {
        console.log('Google Speech API returned empty transcription');
        return res.status(422).json({
          success: false,
          message: 'No speech detected in the audio'
        });
      }
        
      console.log('Google Speech API returned transcription:', transcription);
  
      return res.status(200).json({
        success: true,
        transcript: transcription
      });
    } catch (speechError) {
      console.error('Google Speech API error:', speechError);
      
      // Try a fallback with different configuration
      try {
        const fallbackRequest = {
          audio: {
            content: audioBytes,
          },
          config: {
            encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sampleRateHertz: 16000, // Try a different sample rate
            languageCode: 'en-US',
            model: 'default',
            enableAutomaticPunctuation: true,
          },
        };
        
        console.log('Trying fallback Google Speech API request with different configuration');
        const [fallbackResponse] = await googleSpeechClient.recognize(fallbackRequest);
        
        if (fallbackResponse && fallbackResponse.results && fallbackResponse.results.length > 0) {
          const fallbackTranscription = fallbackResponse.results
            .map(result => result.alternatives && result.alternatives[0] ? result.alternatives[0].transcript : '')
            .join(' ')
            .trim();
            
          if (fallbackTranscription) {
            console.log('Fallback Google Speech API returned transcription:', fallbackTranscription);
            return res.status(200).json({
              success: true,
              transcript: fallbackTranscription
            });
          }
        }
        
        throw new Error('Fallback transcription also failed');
      } catch (fallbackError) {
        console.error('Fallback Google Speech API error:', fallbackError);
        throw speechError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error in transcription:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to transcribe audio'
    });
  }
});

/**
 * Endpoint to handle chat with OpenAI
 */
voiceRouter.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required for chat'
      });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API Key is not configured'
      });
    }
    
    // Use provided conversation history or create a new one
    let messages = history || [
      {
        role: 'system',
        content: 'You are a helpful voice assistant. Keep your responses concise and conversational as they will be spoken aloud.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    // If no history was provided, we need to add the current message
    if (!history) {
      messages.push({
        role: 'user',
        content: message
      });
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 150
    });

    // Extract the response
    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    return res.status(200).json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate chat response'
    });
  }
});

/**
 * Endpoint to synthesize speech from text using ElevenLabs API
 */
voiceRouter.post('/synthesize', async (req, res) => {
  try {
    const { text, voiceId, stability, similarity_boost } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for speech synthesis'
      });
    }
    
    console.log('Synthesizing speech for text:', text.substring(0, 50) + '...');
    
    // Get API key from environment variables
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    
    if (!apiKey) {
      console.error('ElevenLabs API Key is missing');
      return res.status(500).json({
        success: false,
        message: 'ElevenLabs API Key is not configured'
      });
    }
    
    const defaultVoiceId = process.env.ELEVEN_LABS_VOICE_ID || 'TnVT7p6RBpw3AtQyx4cd'; // Default voice ID
    
    console.log('Using voice ID:', voiceId || defaultVoiceId);
    
    // Generate a hash of the text to use as filename for caching
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const audioFilename = `${hash}.mp3`;
    const audioFilePath = path.join(CACHE_DIR, audioFilename);
    
    // Check if we already have this audio cached
    if (fs.existsSync(audioFilePath)) {
      console.log('Using cached audio file:', audioFilePath);
      return res.status(200).json({
        success: true,
        audioUrl: `/api/voice/audio/${audioFilename}`
      });
    }
    
    // Request parameters
    const params = {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: stability || 0.5,
        similarity_boost: similarity_boost || 0.75
      }
    };
    
    console.log('Making request to ElevenLabs API...');
    
    // Make request to ElevenLabs
    try {
      // Create full API URL with voice ID
      const voiceIdToUse = voiceId || defaultVoiceId;
      const apiUrl = `${ELEVEN_LABS_API_URL}/text-to-speech/${voiceIdToUse}`;
      
      console.log(`ElevenLabs API URL: ${apiUrl}`);
      
      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: params,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey
        },
        responseType: 'arraybuffer',
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // Check if we received valid audio data
      if (response.data && response.data.byteLength > 0) {
        console.log(`Received audio data: ${response.data.byteLength} bytes`);
        
        try {
          // Ensure cache directory exists
          if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
          }
          
          // Save the audio file
          fs.writeFileSync(audioFilePath, response.data);
          console.log('Audio file saved to:', audioFilePath);
          
          // Return success with URL to access the audio
          return res.status(200).json({
            success: true,
            audioUrl: `/api/voice/audio/${audioFilename}`
          });
        } catch (fileError) {
          console.error('Error saving audio file:', fileError);
          return res.status(500).json({
            success: false,
            message: 'Error saving audio file',
            error: fileError instanceof Error ? fileError.message : 'Unknown file error'
          });
        }
      } else {
        console.error('Received empty audio data from ElevenLabs');
        return res.status(500).json({
          success: false,
          message: 'Received empty audio data from voice service'
        });
      }
    } catch (apiError: unknown) {
      const axiosError = apiError as { response?: { status: number; statusText: string } };
      console.error('ElevenLabs API error:', axiosError.response?.status, axiosError.response?.statusText);
      
      return res.status(500).json({
        success: false,
        message: 'Error calling voice service API',
        error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        statusCode: axiosError.response?.status
      });
    }
  } catch (error) {
    console.error('Error in voice synthesis:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to synthesize speech'
    });
  }
});

/**
 * Endpoint to serve cached audio files
 */
voiceRouter.get('/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    console.log('Audio file requested:', filename);
    
    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(CACHE_DIR, sanitizedFilename);
    
    console.log('Looking for audio file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('Audio file not found:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Audio file not found'
      });
    }
    
    // Get file information
    const stat = fs.statSync(filePath);
    console.log('Audio file found, size:', stat.size, 'bytes');
    
    // Essential headers for proper audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // CORS headers to ensure browser allows playback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Range');
    
    // Cache control headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Handle range requests (important for audio streaming)
    const range = req.headers.range;
    if (range) {
      console.log('Range request detected:', range);
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = (end - start) + 1;
      
      console.log(`Serving byte range ${start}-${end}/${stat.size}`);
      
      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', chunkSize);
      
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Stream the full file
      console.log('Serving complete file');
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to serve audio file'
    });
  }
});

export default voiceRouter; 