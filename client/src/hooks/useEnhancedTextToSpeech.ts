import { useState, useCallback, useRef, useEffect } from 'react';
import { cloudTtsService, CloudTtsVoice } from '../services/cloudTtsService';

interface TextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
  useCloudTts?: boolean;
}

interface TextToSpeechReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  cloudVoices: CloudTtsVoice[];
  speak: (text: string, options?: TextToSpeechOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  hasEstonianVoices: boolean;
}

export const useEnhancedTextToSpeech = (): TextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [cloudVoices, setCloudVoices] = useState<CloudTtsVoice[]>([]);
  const [hasEstonianVoices, setHasEstonianVoices] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for browser support and load voices
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Initialize cloud TTS service
      cloudTtsService.initialize().then(() => {
        const cloudVoicesList = cloudTtsService.getVoices();
        setCloudVoices(cloudVoicesList);
        
        // Check if we have Estonian voices (browser or cloud)
        const browserEstonianVoices = voices.filter(voice => 
          voice.lang.startsWith('et-') || voice.lang === 'et'
        );
        const cloudEstonianVoices = cloudVoicesList.filter(voice => 
          voice.language.startsWith('et-')
        );
        
        setHasEstonianVoices(browserEstonianVoices.length > 0 || cloudEstonianVoices.length > 0);
        
        if (browserEstonianVoices.length > 0) {
          console.log('🇪🇪 Browser Estonian voices found:', browserEstonianVoices.map(v => `${v.name} (${v.lang})`));
        }
        if (cloudEstonianVoices.length > 0) {
          console.log('🌐 Cloud Estonian voices available:', cloudEstonianVoices.map(v => `${v.name} (${v.language})`));
        }
        if (browserEstonianVoices.length === 0 && cloudEstonianVoices.length === 0) {
          console.log('⚠️ No Estonian voices found. Using fallback voices.');
          console.log('💡 Available languages:', [...new Set(voices.map(v => v.lang))].sort().slice(0, 5).join(', '));
        }
      });
      
      // Load browser voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Check for Estonian voices again after voices load
        const estonianVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('et-') || voice.lang === 'et'
        );
        
        if (estonianVoices.length > 0) {
          console.log('🇪🇪 Estonian voices found:', estonianVoices.map(v => `${v.name} (${v.lang})`));
          setHasEstonianVoices(true);
        } else {
          console.log('⚠️ No browser Estonian voices found. Available languages:', 
            [...new Set(availableVoices.map(v => v.lang))].sort()
          );
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
    cloudVoices,
    speak,
    stop,
    pause,
    resume,
    hasEstonianVoices
  };
};
