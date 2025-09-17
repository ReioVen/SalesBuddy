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
  const isExplicitlyStoppedRef = useRef(false);
  const isRestartingRef = useRef(false);

  // Helper function to create a new recognition instance
  const createRecognitionInstance = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

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
      // If this is not the current recognition instance, ignore the event
      if (recognition !== recognitionRef.current) {
        return;
      }
      
      if (!continuous || isExplicitlyStoppedRef.current) {
        setIsListening(false);
        setIsStarting(false);
        onEnd?.();
        onWaveformChange?.(false);
        isExplicitlyStoppedRef.current = false;
        isRestartingRef.current = false;
      } else if (!isRestartingRef.current) {
        // In continuous mode, create a new instance and restart (only if not already restarting)
        isRestartingRef.current = true;
        setTimeout(() => {
          if (!isExplicitlyStoppedRef.current && isRestartingRef.current) {
            const newRecognition = createRecognitionInstance();
            if (newRecognition) {
              recognitionRef.current = newRecognition;
              try {
                newRecognition.start();
                isRestartingRef.current = false;
              } catch (err) {
                setIsListening(false);
                setIsStarting(false);
                onEnd?.();
                onWaveformChange?.(false);
                isRestartingRef.current = false;
                isExplicitlyStoppedRef.current = true; // Prevent further restart attempts
              }
            } else {
              isRestartingRef.current = false;
            }
          } else {
            isRestartingRef.current = false;
          }
        }, 500); // Increased delay to prevent rapid restarts
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      
      // If this is not the current recognition instance, ignore the event
      if (recognition !== recognitionRef.current) {
        return;
      }
      
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

      onResult?.(fullTranscript, event.results[event.results.length - 1]?.isFinal || false);
    };

    return recognition;
  }, [continuous, interimResults, language, maxAlternatives, onResult, onError, onStart, onEnd, onWaveformChange]);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = createRecognitionInstance();
      recognitionRef.current = recognition;
    }
  }, [createRecognitionInstance]);

  const startListening = useCallback(() => {
    // Prevent multiple rapid starts
    if (isStarting) {
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        // Always stop any existing recognition first
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
        }
        
        // Add a longer delay to ensure the previous recognition is fully stopped
        setTimeout(() => {
          try {
            // Create a fresh recognition instance
            const recognition = createRecognitionInstance();
            if (recognition) {
              recognitionRef.current = recognition;
              
              setIsStarting(true);
              finalTranscriptRef.current = '';
              setTranscript('');
              setError(null);
              isExplicitlyStoppedRef.current = false; // Reset the stop flag
              isRestartingRef.current = false; // Reset the restart flag
              recognition.start();
            }
          } catch (err) {
            setError('Failed to start speech recognition');
            setIsStarting(false);
          }
        }, 1000); // 1 second delay to ensure proper cleanup
      } catch (err) {
        setError('Failed to start speech recognition');
        setIsStarting(false);
      }
    }
  }, [createRecognitionInstance, isStarting]);

  const stopListening = useCallback(() => {
    isExplicitlyStoppedRef.current = true; // Mark as explicitly stopped
    isRestartingRef.current = false; // Stop any restart attempts
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null; // Clear the reference
      } catch (err) {
        // Ignore errors when stopping
      }
    }
    
    // Always reset states to ensure clean state
    setIsListening(false);
    setIsStarting(false);
    setError(null);
    onWaveformChange?.(false);
  }, [onWaveformChange]);

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
      return 'Speech recognition was stopped. You can start a new voice message now.';
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
