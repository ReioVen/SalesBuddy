import { useState, useCallback, useRef, useEffect } from 'react';
import { universalTtsService, UniversalTtsVoice } from '../services/universalTtsService.ts';

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
  universalVoices: UniversalTtsVoice[];
  speak: (text: string, options?: TextToSpeechOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  hasEstonianVoices: boolean;
  estonianVoices: UniversalTtsVoice[];
}

export const useUniversalTextToSpeech = (): TextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [universalVoices, setUniversalVoices] = useState<UniversalTtsVoice[]>([]);
  const [hasEstonianVoices, setHasEstonianVoices] = useState(false);
  const [estonianVoices, setEstonianVoices] = useState<UniversalTtsVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const initialized = useRef(false);

  // Lazy initialize universal TTS service only when needed
  const initializeTTS = useCallback(() => {
    if (initialized.current) return Promise.resolve();
    
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (!supported) return Promise.resolve();
    
    initialized.current = true;
    
    return universalTtsService.initialize().then(() => {
      const universalVoicesList = universalTtsService.getVoices();
      setUniversalVoices(universalVoicesList);
      
      // Get Estonian voices
      const estonianVoicesList = universalTtsService.getAvailableEstonianVoices();
      setEstonianVoices(estonianVoicesList);
      setHasEstonianVoices(estonianVoicesList.length > 0);
      
      // Load browser voices
      const browserVoices = speechSynthesis.getVoices();
      if (browserVoices.length > 0) {
        setVoices(browserVoices);
      }
    });
  }, []);

  // Initialize only on mount, but don't block - initialize in background
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Initialize in background without blocking
      setTimeout(() => initializeTTS(), 100);
      
      // Load browser voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Check for browser Estonian voices
        const browserEstonianVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('et-') || voice.lang === 'et'
        );
        
        if (browserEstonianVoices.length > 0) {
          console.log('🇪🇪 Browser Estonian voices found:', browserEstonianVoices.map(v => `${v.name} (${v.lang})`));
          setHasEstonianVoices(true);
        } else {
          console.log('⚠️ No browser Estonian voices found. Using universal service.');
        }
      };
      
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Also try loading voices after a short delay
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

  const speak = useCallback(async (text: string, options: TextToSpeechOptions = {}) => {
    if (!isSupported || !text || !text.trim()) {
      return;
    }

    // Ensure TTS is initialized
    await initializeTTS();

    // Stop any current speech
    stop();

    // Use browser TTS with language matching for supported languages
    if (options.language) {
      const languageCode = options.language.split('-')[0];
      const supportedLangs = universalTtsService.getSupportedLanguages();
      
      if (supportedLangs.includes(languageCode)) {
        console.log(`🎯 Testing voice for ${languageCode} language`);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        utterance.lang = options.language;

        // Try to find the best browser voice for the language
        const matchingVoices = voices.filter(voice => 
          voice.lang.startsWith(languageCode) || 
          voice.lang === options.language ||
          voice.lang === languageCode
        );

        if (matchingVoices.length > 0) {
          const localVoice = matchingVoices.find(voice => voice.localService);
          utterance.voice = localVoice || matchingVoices[0];
          console.log(`🎤 Using browser voice: ${utterance.voice.name} (${utterance.voice.lang}) for language: ${options.language}`);
        } else {
          console.log(`⚠️ No matching browser voice found for language: ${options.language}. Using default voice.`);
        }

        utterance.onstart = () => { setIsSpeaking(true); };
        utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
        utterance.onerror = (event) => { console.error('Text-to-speech error:', event.error); setIsSpeaking(false); utteranceRef.current = null; };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        return;
      }
    }

    // Use browser TTS for other languages
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.language || 'en-US';
    
    // Voice selection logic
    if (options.voice) {
      utterance.voice = options.voice;
    } else if (options.language) {
      // Try to find the best voice for the language
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
        console.log(`⚠️ No matching voice found for language: ${options.language}. Using default voice.`);
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
  }, [isSupported, stop, voices, initializeTTS]);

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
    universalVoices,
    speak,
    stop,
    pause,
    resume,
    hasEstonianVoices,
    estonianVoices
  };
};
