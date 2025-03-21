import axios from 'axios';

interface VoiceServiceResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

/**
 * Service to handle text-to-speech using a voice clone API
 * This implementation uses the server as a proxy to ElevenLabs or similar service
 */
export const voiceService = {
  /**
   * Convert text to speech using a cloned voice
   * @param text The text to convert to speech
   * @returns Promise with the audio URL or error
   */
  async textToSpeech(text: string, retryCount = 0): Promise<VoiceServiceResponse> {
    try {
      console.log('Sending text to speech conversion request:', text.substring(0, 50) + '...');
      
      // Call the server endpoint that handles the voice clone processing
      const response = await axios.post('/api/voice/synthesize', { 
        text,
        // Always include the voiceId from environment
        voiceId: process.env.ELEVEN_LABS_VOICE_ID || 'TnVT7p6RBpw3AtQyx4cd',
        // Additional optional parameters
        stability: 0.75,
        similarity_boost: 0.75,
      }, {
        timeout: 60000 // 60 second timeout for larger text
      });
      
      console.log('Voice synthesis response:', response.data);
      
      if (response.data.success && response.data.audioUrl) {
        // Pre-load the audio to verify it's valid
        try {
          await this.preloadAudio(response.data.audioUrl);
          
          return {
            success: true,
            audioUrl: response.data.audioUrl
          };
        } catch (preloadError) {
          console.error('Voice audio preload failed:', preloadError);
          
          // If preloading failed but we haven't retried too many times, try again
          if (retryCount < 2) {
            console.log(`Retrying text-to-speech (attempt ${retryCount + 1})...`);
            return this.textToSpeech(text, retryCount + 1);
          }
          
          return {
            success: false,
            error: 'Failed to preload audio after multiple attempts'
          };
        }
      } else {
        console.error('Voice synthesis failed:', response.data.message || 'Unknown error');
        
        // If API request succeeded but synthesis failed, retry with smaller text chunks
        if (retryCount < 2 && text.length > 200) {
          console.log('Text might be too long, trying with a shorter version...');
          const shorterText = text.substring(0, Math.floor(text.length * 0.75));
          return this.textToSpeech(shorterText, retryCount + 1);
        }
        
        return {
          success: false,
          error: response.data.message || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
      
      // If request failed due to timeout or network error, retry
      if (retryCount < 2) {
        console.log(`Network error, retrying text-to-speech (attempt ${retryCount + 1})...`);
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.textToSpeech(text, retryCount + 1);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to synthesize speech'
      };
    }
  },
  
  /**
   * Preload audio to verify it's valid
   * @param audioUrl URL of the audio to preload
   * @returns Promise that resolves when audio is preloaded or rejects if invalid
   */
  preloadAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        console.log('Audio preloaded successfully');
        resolve();
      };
      
      audio.onerror = (event) => {
        console.error('Audio preload error:', event);
        reject(new Error('Audio preload failed'));
      };
      
      // Set a timeout in case the audio never loads
      const timeout = setTimeout(() => {
        reject(new Error('Audio preload timed out'));
      }, 10000);
      
      // Cleanup function to be called on both success and error
      const cleanup = () => {
        clearTimeout(timeout);
        audio.oncanplaythrough = null;
        audio.onerror = null;
      };
      
      // Add cleanup to both resolve and reject paths
      audio.oncanplaythrough = () => {
        cleanup();
        resolve();
      };
      
      audio.onerror = (event) => {
        cleanup();
        reject(new Error('Audio preload failed'));
      };
      
      // Start loading the audio
      audio.src = audioUrl;
      audio.load();
    });
  },
  
  /**
   * Play audio from URL with special handling for browser compatibility
   * @param audioUrl URL of the audio to play
   */
  playAudio(audioUrl: string): HTMLAudioElement {
    console.log('Creating audio element for URL:', audioUrl);
    
    // Create audio element
    const audio = new Audio();
    
    // Important: Set crossOrigin to allow CORS requests
    audio.crossOrigin = 'anonymous';
    
    // Add error handling
    audio.onerror = (event) => {
      console.error('Audio playback error:', event);
      console.error('Error code:', (audio as any).error?.code);
      console.error('Error message:', (audio as any).error?.message);
    };
    
    // Log when audio starts loading
    audio.onloadstart = () => {
      console.log('Audio loading started');
    };
    
    // Log when audio metadata is loaded
    audio.onloadedmetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
    };
    
    // Log when audio is loaded and ready to play
    audio.oncanplay = () => {
      console.log('Audio can start playing');
    };
    
    // Log when audio starts playing
    audio.onplay = () => {
      console.log('Audio playback started');
    };
    
    // Log when audio ends
    audio.onended = () => {
      console.log('Audio playback ended');
    };
    
    // Set the audio source
    audio.src = audioUrl;
    
    return audio;
  }
}; 