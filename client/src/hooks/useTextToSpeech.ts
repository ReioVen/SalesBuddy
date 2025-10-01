import { useState, useCallback, useRef } from 'react';

interface TextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface TextToSpeechReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, options?: TextToSpeechOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const useTextToSpeech = (): TextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for browser support and load voices
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Debug: Log Estonian voices if any
        const estonianVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('et-') || voice.lang === 'et'
        );
        if (estonianVoices.length > 0) {
          console.log('🇪🇪 Estonian voices found:', estonianVoices.map(v => `${v.name} (${v.lang})`));
        } else {
          console.log('⚠️ No Estonian voices found. Available languages:', 
            [...new Set(availableVoices.map(v => v.lang))].sort()
          );
          console.log('💡 Tip: Try using Chrome/Edge for better Estonian voice support');
        }
      };
      
      // Load voices immediately
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Also try loading voices after a short delay (some browsers need this)
      setTimeout(loadVoices, 100);
    }
  }, []);

  const stop = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback((text: string, options: TextToSpeechOptions = {}) => {
    if (!isSupported || !text || !text.trim()) {
      return;
    }

    // Stop any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.language || 'en-US';
    
    // If no specific voice is provided, try to find the best voice for the language
    if (options.voice) {
      utterance.voice = options.voice;
    } else if (options.language) {
      // Try to find a voice that matches the language
      const languageCode = options.language.split('-')[0];
      const matchingVoices = voices.filter(voice => 
        voice.lang.startsWith(languageCode) || 
        voice.lang === options.language ||
        voice.lang === languageCode
      );
      
      if (matchingVoices.length > 0) {
        // Prefer local voices over remote ones
        const localVoice = matchingVoices.find(voice => voice.localService);
        utterance.voice = localVoice || matchingVoices[0];
        
        console.log(`🎤 Using voice: ${utterance.voice.name} (${utterance.voice.lang}) for language: ${options.language}`);
      } else {
        console.log(`⚠️ No matching voice found for language: ${options.language}. Available languages:`, 
          [...new Set(voices.map(v => v.lang))].sort()
        );
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Text-to-speech error:', event.error);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, stop]);

  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    voices,
    speak,
    stop,
    pause,
    resume
  };
};
