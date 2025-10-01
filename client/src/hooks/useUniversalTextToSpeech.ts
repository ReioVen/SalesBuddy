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

  // Initialize universal TTS service
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Initialize universal TTS service
      universalTtsService.initialize().then(() => {
        const universalVoicesList = universalTtsService.getVoices();
        setUniversalVoices(universalVoicesList);
        
        // Get Estonian voices
        const estonianVoicesList = universalTtsService.getAvailableEstonianVoices();
        setEstonianVoices(estonianVoicesList);
        setHasEstonianVoices(estonianVoicesList.length > 0);
        
        if (estonianVoicesList.length > 0) {
          console.log('🇪🇪 Estonian voices available for all users:', estonianVoicesList.length);
        } else {
          console.log('⚠️ No Estonian voices available. Using fallback voices.');
        }
      });
      
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

  const speak = useCallback((text: string, options: TextToSpeechOptions = {}) => {
    if (!isSupported || !text || !text.trim()) {
      return;
    }

    // Stop any current speech
    stop();

    // Use universal TTS service for Estonian
    if (options.language && options.language.startsWith('et-')) {
      universalTtsService.speakWithCloudTts(text, {
        language: options.language,
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume
      });
      return;
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
  }, [isSupported, stop, voices]);

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
