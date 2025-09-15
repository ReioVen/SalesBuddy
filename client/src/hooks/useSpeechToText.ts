import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onWaveformChange?: (isAnimating: boolean) => void;
}

interface SpeechToTextReturn {
  transcript: string;
  isListening: boolean;
  isStarting: boolean;
  isSupported: boolean;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSpeechToText = (options: SpeechToTextOptions = {}): SpeechToTextReturn => {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onError,
    onStart,
    onEnd,
    onWaveformChange
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        setIsStarting(false);
        setError(null);
        onStart?.();
        onWaveformChange?.(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsStarting(false);
        onEnd?.();
        onWaveformChange?.(false);
      };

      recognition.onerror = (event) => {
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
        setIsListening(false);
        setIsStarting(false);
        onError?.(errorMessage);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            setConfidence(result[0].confidence || 0);
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        finalTranscriptRef.current = finalTranscript;

        // Call the callback with the current transcript
        onResult?.(fullTranscript, event.results[event.results.length - 1]?.isFinal || false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError, onStart, onEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStarting) {
      try {
        setIsStarting(true);
        finalTranscriptRef.current = '';
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start speech recognition');
        setIsStarting(false);
      }
    }
  }, [isListening, isStarting]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && (isListening || isStarting)) {
      try {
        recognitionRef.current.stop();
        // Force set listening state to false immediately
        setIsListening(false);
        setIsStarting(false);
        onWaveformChange?.(false);
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setIsListening(false);
        setIsStarting(false);
        onWaveformChange?.(false);
      }
    }
  }, [isListening, isStarting, onWaveformChange]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setConfidence(0);
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    isStarting,
    isSupported,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};

// Helper function to get user-friendly error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'No microphone was found. Please ensure a microphone is connected.';
    case 'not-allowed':
      return 'Permission to use microphone was denied. Please allow microphone access.';
    case 'network':
      return 'Network error occurred. Please check your internet connection.';
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.';
    case 'aborted':
      return 'Please send your current message before starting a new voice message.';
    default:
      return `Speech recognition error: ${error}`;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
