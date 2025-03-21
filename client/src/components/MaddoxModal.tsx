import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import { voiceService } from '../lib/voiceService';
import axios from 'axios';

interface MaddoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MaddoxModal = ({ isOpen, onClose }: MaddoxModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Update the useEffect for modal state changes
  useEffect(() => {
    if (!isOpen) {
      // Stop any ongoing processes when modal is closed
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
      setIsListening(false);
      setError(null);
      setStatusMessage('');
      setRetryCount(0);
    } else {
      // When modal opens, initialize audio context and start listening
      if (!audioContextRef.current) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          console.log('AudioContext initialized');
        } catch (err) {
          console.error('Failed to initialize AudioContext:', err);
          setError('Failed to initialize audio system');
        }
      }

      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(console.error);
      }

      // Start listening after a short delay
      const timer = setTimeout(() => {
        if (!isProcessing) {
          console.log('Auto-starting listening...');
          setStatusMessage('Ready to listen. Please speak...');
          setIsListening(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
      setIsListening(false);
    };
  }, []);

  // Handle voice input - this is called when speech is detected
  const handleTranscriptReady = async (transcript: string) => {
    try {
      if (!transcript.trim()) {
        console.log('MaddoxModal: Empty transcript received, ignoring');
        return;
      }
      
      // Reset retry count on new transcript
      setRetryCount(0);
      
      console.log('MaddoxModal: Received transcript:', transcript);
      setIsProcessing(true);
      setError(null);
      setStatusMessage('Processing your request...');
      
      // Stop any playing audio
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }

      // Add user message to conversation history
      const updatedHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: 'user', content: transcript }
      ];
      
      setConversationHistory(updatedHistory);

      // Call OpenAI API for response with conversation history
      console.log('MaddoxModal: Getting AI response...');
      setStatusMessage('Getting AI response...');
      
      try {
        const aiResponse = await getAIResponse(transcript, updatedHistory);
        
        // Add assistant response to conversation history
        const finalHistory: ConversationMessage[] = [
          ...updatedHistory,
          { role: 'assistant', content: aiResponse }
        ];
        
        setConversationHistory(finalHistory);
        
        console.log('MaddoxModal: Received AI response, now converting to speech:', aiResponse);
        setStatusMessage('Converting response to speech...');
        
        try {
          // Convert to speech using the voice service
          const result = await voiceService.textToSpeech(aiResponse);
          
          if (result.success && result.audioUrl) {
            console.log('MaddoxModal: Successfully generated speech, audio URL:', result.audioUrl);
            
            if (isMuted) {
              setStatusMessage('Response (muted): ' + aiResponse);
              
              // Even when muted, auto-start listening again after a delay
              setTimeout(() => {
                setStatusMessage('Listening...');
                setIsListening(true);
              }, 3000);
            } else {
              await playAudio(result.audioUrl);
            }
          } else if (result.error) {
            throw new Error(result.error);
          }
        } catch (speechError) {
          console.error('MaddoxModal: Speech synthesis error:', speechError);
          setError(`Speech synthesis failed: ${speechError instanceof Error ? speechError.message : 'Unknown error'}`);
          setStatusMessage('Waiting for next command...');
        }
      } catch (aiError) {
        console.error('MaddoxModal: AI response error:', aiError);
        setError(`Failed to get AI response: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
        setStatusMessage('Waiting for next command...');
      }
    } catch (err) {
      console.error('MaddoxModal: Processing error:', err);
      setError('An error occurred while processing your request');
      setStatusMessage('Waiting for next command...');
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio with robust error handling and retry logic
  const playAudio = async (audioUrl: string) => {
    try {
      setStatusMessage('Playing response...');
      
      // Create a single audio element and configure it completely
      const audio = new Audio(audioUrl);
      
      // Set up all event handlers before setting source
      audio.onerror = async (e) => {
        console.error('MaddoxModal: Error playing audio:', e);
        
        // Try to retry a few times
        if (retryCount < 3) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          console.log(`MaddoxModal: Retrying audio playback (attempt ${newRetryCount})...`);
          setError('Error playing audio, retrying...');
          
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          playAudio(audioUrl);
        } else {
          setError('Error playing audio response after multiple attempts');
          setAudioPlayer(null);
          setStatusMessage('Waiting for next command...');
          
          // Auto-restart listening after error
          setTimeout(() => {
            setIsListening(true);
            setStatusMessage('Listening...');
          }, 2000);
        }
      };
      
      audio.onended = () => {
        console.log('MaddoxModal: Audio finished playing');
        setAudioPlayer(null);
        setStatusMessage('Listening...');
        // Auto-start listening again after response finishes
        setTimeout(() => {
          setIsListening(true);
        }, 500);
      };

      audio.oncanplaythrough = () => {
        console.log('MaddoxModal: Audio can play through');
        setStatusMessage('Playing response...');
      };
      
      // Force audio context creation which can help with playback issues
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      
      // Make sure the audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(audioContextRef.current.destination);
      
      // Set the audio player first so we can reference it
      setAudioPlayer(audio);
      
      // Play with explicit user interaction flag and resume audio context
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('MaddoxModal: Audio playback started successfully');
            setRetryCount(0); // Reset retry count on success
          })
          .catch(async (e) => {
            console.error('MaddoxModal: Audio playback failed:', e);
            
            // Try an alternative approach if the first fails
            try {
              await new Promise(resolve => setTimeout(resolve, 500));
              await audioContextRef.current?.resume();
              await audio.play();
              console.log('MaddoxModal: Second attempt succeeded');
              setRetryCount(0); // Reset retry count on success
            } catch (err) {
              console.error('MaddoxModal: Second attempt also failed:', err);
              
              if (retryCount < 3) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                console.log(`MaddoxModal: Retrying audio playback (attempt ${newRetryCount})...`);
                
                // Small delay before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                playAudio(audioUrl);
              } else {
                setError('Browser blocked audio playback after multiple attempts');
                setStatusMessage('Waiting for next command...');
                
                // Auto-restart listening after error
                setTimeout(() => {
                  setIsListening(true);
                  setStatusMessage('Listening...');
                }, 2000);
              }
            }
          });
      }
    } catch (audioError) {
      console.error('MaddoxModal: Error setting up audio playback:', audioError);
      setError('Error preparing audio playback');
      setStatusMessage('Waiting for next command...');
      
      // Auto-restart listening after error
      setTimeout(() => {
        setIsListening(true);
        setStatusMessage('Listening...');
      }, 2000);
    }
  };

  // Get AI response from OpenAI with conversation history
  const getAIResponse = async (input: string, history: ConversationMessage[]): Promise<string> => {
    try {
      // Format the history for the API
      const messages: ApiMessage[] = [
        { role: 'system', content: 'You are a helpful voice assistant. Keep your responses concise and conversational as they will be spoken aloud.' },
        ...history.map(msg => ({ 
          role: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant' | 'system', 
          content: msg.content
        })).slice(-10) // Keep last 10 messages for context
      ];
      
      const response = await axios.post('/api/voice/chat', { 
        message: input,
        history: messages
      });
      
      if (response.data.success && response.data.response) {
        return response.data.response;
      }
      
      throw new Error('Failed to get AI response');
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioPlayer && !isMuted) {
      audioPlayer.pause();
    }
    setIsMuted(!isMuted);
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause();
      setAudioPlayer(null);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-60" onClick={onClose}></div>
      <div className="bg-gray-800 w-72 h-72 rounded-full shadow-2xl p-6 z-10 relative animate-fadein flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
        
        <button
          onClick={toggleMute}
          className="absolute top-4 left-4 text-gray-400 hover:text-white focus:outline-none"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>

        <div className="flex flex-col items-center justify-center">
          {statusMessage && (
            <div className="absolute top-8 left-0 right-0 mx-auto bg-blue-900/70 p-2 rounded-md text-blue-200 text-xs text-center">
              {statusMessage}
            </div>
          )}
          
          {error && (
            <div className="absolute bottom-16 left-0 right-0 mx-auto bg-red-900/70 p-2 rounded-md text-red-200 text-xs text-center">
              {error}
            </div>
          )}
          
          <VoiceRecorder 
            onTranscriptReady={handleTranscriptReady} 
            isListening={isListening}
            setIsListening={setIsListening}
            continuousMode={true}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default MaddoxModal; 