import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle } from 'lucide-react';
import axios from 'axios';

// Simplified type definitions for Web Speech API
type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
  onaudiostart: () => void;
  onspeechstart: () => void;
  start: () => void;
  stop: () => void;
};

// Simplified SpeechRecognition constructor type
interface SpeechRecognitionCtor {
  new(): SpeechRecognition;
}

// Extend Window type
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  continuousMode?: boolean;
  isProcessing?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscriptReady, 
  isListening,
  setIsListening,
  continuousMode = false,
  isProcessing = false
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [silenceTimer, setSilenceTimer] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFinalTranscriptRef = useRef<boolean>(false);
  const lastTranscriptRef = useRef<string>('');
  const errorCountRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const useGoogleSpeechAPI = useRef<boolean>(true); // Toggle to use Google Speech API instead of Web Speech API
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceCounterRef = useRef<number>(0);
  const silenceDetectionActive = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  
  // Initialize and start listening when component mounts if in continuous mode
  useEffect(() => {
    if (continuousMode && !recognitionRef.current) {
      startListening();
    }
    
    // Clean up on component unmount
    return () => {
      cleanupRecording();
    };
  }, [continuousMode]);
  
  // Restart listening when processing finishes in continuous mode
  useEffect(() => {
    if (continuousMode && !isProcessing && !recognitionRef.current) {
      startListening();
    }
  }, [isProcessing, continuousMode]);
  
  // Initialize audio visualization
  const initAudioVisualization = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Start visualization loop
      const updateVolume = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;
        const normalizedVolume = Math.min(average / 128, 1); // Normalize between 0 and 1
        setVolume(normalizedVolume);
        
        // Detect silence for continuous mode
        if (continuousMode && transcript && normalizedVolume < 0.05) {
          // Start silence timer if not already running
          if (silenceTimeoutRef.current === null && isFinalTranscriptRef.current === false) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (transcript !== lastTranscriptRef.current && transcript.trim() !== '') {
                isFinalTranscriptRef.current = true;
                lastTranscriptRef.current = transcript;
                onTranscriptReady(transcript);
                setTranscript('');
              }
              silenceTimeoutRef.current = null;
            }, 1500); // 1.5 seconds of silence triggers the callback
          }
        } else if (silenceTimeoutRef.current !== null) {
          // Reset silence timer if sound is detected again
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Error initializing audio visualization:', err);
    }
  };
  
  // Clean up audio visualization
  const cleanupAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    setVolume(0);
  };
  
  // Initialize audio recording
  const initAudioRecording = async () => {
    try {
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
      }
      
      audioChunksRef.current = [];
      
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current) {
          audioChunksRef.current.push(event.data);
          console.log(`Audio data chunk received: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (!isRecordingRef.current) {
          console.log('Recording was stopped externally, skipping processing');
          return;
        }

        console.log('MediaRecorder stopped, processing audio chunks');
        
        if (audioChunksRef.current.length === 0) {
          console.log('No audio chunks collected');
          if (continuousMode && !isProcessing) {
            setTimeout(() => startListening(), 1000);
          }
          return;
        }
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size < 500) {
            console.warn('Audio recording too small');
            if (continuousMode && !isProcessing) {
              setTimeout(() => startListening(), 1000);
            }
            return;
          }
          
          await sendAudioToServer(audioBlob);
        } catch (err) {
          console.error('Error processing audio:', err);
          if (continuousMode && !isProcessing) {
            setTimeout(() => startListening(), 1000);
          }
        }
      };
      
      mediaRecorder.start(1000);
      console.log('MediaRecorder started with options:', options);
      
      // Set recording timeout
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          console.log('Recording timeout reached');
          mediaRecorderRef.current.stop();
        }
      }, 10000);
      
      // Initialize silence detection
      initSilenceDetection();
      
    } catch (err) {
      console.error('Failed to initialize audio recording:', err);
      cleanupRecording();
      throw err;
    }
  };
  
  // Add silence detection to trigger the stop method when silence is detected
  const initSilenceDetection = () => {
    if (!analyserRef.current || !dataArrayRef.current) {
      console.log('Cannot initialize silence detection: analyzer or dataArray not initialized');
      return;
    }
    
    silenceDetectionActive.current = true;
    silenceCounterRef.current = 0;
    const silenceThreshold = 5; // 5 consecutive silent frames
    
    const checkSilence = () => {
      if (!silenceDetectionActive.current) return;
      
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      const average = dataArrayRef.current!.reduce((acc, val) => acc + val, 0) / dataArrayRef.current!.length;
      const normalizedVolume = Math.min(average / 128, 1);
      
      // Update volume for UI feedback
      setVolume(normalizedVolume);
      
      if (normalizedVolume < 0.05) {
        silenceCounterRef.current++;
        console.log(`Silence detected (${silenceCounterRef.current}/${silenceThreshold})`);
        
        if (silenceCounterRef.current >= silenceThreshold && 
            mediaRecorderRef.current?.state === 'recording') {
          console.log('Silence threshold reached, stopping recorder');
          silenceDetectionActive.current = false; // Stop silence detection
          mediaRecorderRef.current.stop();
          silenceCounterRef.current = 0;
          return; // No need to continue after stopping
        }
      } else {
        silenceCounterRef.current = 0; // Reset on non-silent frame
      }
      
      if (isListening && silenceDetectionActive.current) {
        requestAnimationFrame(checkSilence);
      }
    };
    
    requestAnimationFrame(checkSilence);
  };
  
  // Send recorded audio to server for transcription using Google Speech API
  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      console.log('Preparing to send audio to server for transcription...');
      
      console.log('Creating FormData with audio blob');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      setStatusMessage('Transcribing speech...');
      console.log(`Sending audio to server (${audioBlob.size} bytes, type: ${audioBlob.type})`);
      
      const response = await axios.post('/api/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout for large audio files
      });
      
      if (response.data.success && response.data.transcript) {
        const googleTranscript = response.data.transcript;
        console.log('Google Speech API transcription:', googleTranscript);
        
        if (googleTranscript.trim()) {
          setTranscript(googleTranscript);
          isFinalTranscriptRef.current = true;
          onTranscriptReady(googleTranscript);
        } else {
          // If transcript is empty, inform the user
          setError('No speech detected. Please try speaking again.');
          
          // In continuous mode, restart listening
          if (continuousMode && !isProcessing) {
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        }
      } else {
        throw new Error(response.data.message || 'Transcription failed');
      }
    } catch (err) {
      console.error('Error sending audio to server:', err);
      setError('Failed to transcribe audio: ' + (err instanceof Error ? err.message : 'Unknown error'));
      
      // Fall back to browser speech recognition if Google Speech API fails
      if (recognitionRef.current === null) {
        console.log('Falling back to Web Speech API');
        useGoogleSpeechAPI.current = false;
        startListening();
      }
    }
  };

  // Cleanup function to ensure all resources are released
  const cleanupRecording = async () => {
    console.log('Cleaning up recording...');
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      recognitionRef.current = null;
    }
    
    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Clear timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Reset state
    silenceDetectionActive.current = false;
    isRecordingRef.current = false;
    audioChunksRef.current = [];
    setVolume(0);
    
    // Clean up audio visualization
    cleanupAudioVisualization();
  };
  
  const startListening = async () => {
    console.log('VoiceRecorder: Starting listening...');
    
    // Don't start if already recording
    if (isRecordingRef.current) {
      console.log('Already recording, ignoring start request');
      return;
    }

    // Reset error count and states
    errorCountRef.current = 0;
    setError(null);
    setTranscript('');
    isFinalTranscriptRef.current = false;

    try {
      // Clean up any existing recording first
      await cleanupRecording();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (useGoogleSpeechAPI.current) {
        isRecordingRef.current = true;
        mediaStreamRef.current = stream;
        await initAudioVisualization();
        await initAudioRecording();
        setIsListening(true);
        return;
      }

      // Clean up test stream if not using Google Speech API
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      cleanupRecording();
      setIsListening(false);
      return;
    }
  };
  
  const stopListening = () => {
    console.log('VoiceRecorder: Stopping listening...');
    if (isRecordingRef.current) {
      cleanupRecording();
      setIsListening(false);
    }
  };
  
  // Calculate button size based on volume
  const buttonSize = isListening ? `${Math.max(4, 4 + volume * 3)}rem` : '4rem';
  
  const pulseClass = isProcessing ? 
    'bg-amber-500 hover:bg-amber-600' : 
    (isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700');
  
  return (
    <div className="flex flex-col items-center w-full">
      {error && !continuousMode && (
        <div className="text-red-500 mb-2 text-sm">{error}</div>
      )}
      
      <div className="flex flex-col items-center">
        <button
          onClick={continuousMode ? undefined : (isListening ? stopListening : startListening)}
          className={`rounded-full ${pulseClass} text-white transition-all duration-300 flex items-center justify-center`}
          style={{ 
            width: buttonSize, 
            height: buttonSize,
            transition: 'width 0.2s, height 0.2s'
          }}
          aria-label={isListening ? "Listening..." : "Click to speak"}
          disabled={continuousMode || isProcessing}
        >
          {isProcessing ? (
            <span className="w-8 h-8 flex items-center justify-center">
              <span className="animate-ping absolute w-5 h-5 rounded-full bg-amber-400 opacity-75"></span>
              <Mic className="h-8 w-8 relative" />
            </span>
          ) : isListening ? (
            <Mic className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
        
        {!continuousMode && (
          <div className="text-gray-300 mt-2">
            {isListening ? 'Listening...' : 'Click to speak'}
          </div>
        )}
      </div>
      
      {transcript && !continuousMode && (
        <div className="w-full p-3 bg-gray-800 rounded-md mt-4">
          <p className="text-gray-200">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder; 