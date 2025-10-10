import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Headphones } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText.ts';
import { useTextToSpeech } from '../hooks/useTextToSpeech.ts';
import { enhancedTtsService } from '../services/enhancedTtsService.ts';

interface SpeechInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  language?: string;
  className?: string;
  handsFreeMode?: boolean;
  autoSendDelay?: number; // in milliseconds
  onAIResponse?: (speakFunction: (response: string) => void) => void; // Callback to receive the speak function
  selectedVoice?: SpeechSynthesisVoice | null; // Voice selected in conversation creation
  ttsVolume?: number; // Volume for text-to-speech (0.0 to 1.0)
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type or speak your message...",
  language = 'en-US',
  className = '',
  handsFreeMode = false,
  autoSendDelay = 3000, // 3 seconds default
  onAIResponse,
  selectedVoice = null,
  ttsVolume = 0.7
}) => {
  const [textInput, setTextInput] = useState('');
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [voiceCommands] = useState([
    'Send message',
    'Clear text',
    'Stop listening',
    'Start new conversation',
    'End conversation',
    'Stop speaking',
    'Repeat that'
  ]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [waveformAnimation, setWaveformAnimation] = useState(false);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [userExplicitlyStopped, setUserExplicitlyStopped] = useState(false);
  
  // Text-to-speech functionality
  const { isSpeaking, isSupported: ttsSupported, speak, stop: stopTTS } = useTextToSpeech();
  const lastAIResponseRef = useRef<string>('');
  const [isEnhancedTtsSpeaking, setIsEnhancedTtsSpeaking] = useState(false);

  // Function to speak AI responses with enhanced, natural-sounding voice
  const speakAIResponse = useCallback(async (response: string) => {
    console.log('🎙️ [SPEECH-INPUT] ========== AI RESPONSE SPEAKING ==========');
    console.log('🔊 [SPEECH-INPUT] speakAIResponse called!');
    console.log('📝 [SPEECH-INPUT] Response type:', typeof response);
    console.log('📝 [SPEECH-INPUT] Response preview:', response?.substring(0, 100));
    console.log('🎤 [SPEECH-INPUT] Browser TTS supported:', ttsSupported);
    console.log('🌍 [SPEECH-INPUT] Language:', language);
    console.log('🗣️ [SPEECH-INPUT] Selected voice:', selectedVoice?.name || 'none');
    console.log('🔊 [SPEECH-INPUT] Volume:', ttsVolume);
    
    // Critical: Validate response is a string and not empty
    if (!response || typeof response !== 'string') {
      console.error('❌ [SPEECH-INPUT] Invalid response type:', typeof response);
      if (typeof response === 'object') {
        console.error('❌ CRITICAL: TTS called with object instead of string:', response);
        console.error('❌ This should never happen - callback misuse detected');
      }
      return;
    }
    
    const responseText = response.trim();
    if (!responseText) {
      console.warn('⚠️ [SPEECH-INPUT] Empty response text for TTS');
      return;
    }
    
    // Prevent duplicate speaking of the same response
    if (lastAIResponseRef.current === responseText) {
      console.log('⚠️ [SPEECH-INPUT] Skipping duplicate AI response:', responseText.substring(0, 50));
      return;
    }
    
    lastAIResponseRef.current = responseText;
    console.log('✅ [SPEECH-INPUT] All validations passed, proceeding with TTS...');
    
    try {
      // IMPORTANT: Always try Enhanced TTS (Azure) first!
      // Azure TTS doesn't need browser TTS support - it plays audio files directly
      // Only the fallback requires browser TTS support
      const ttsLanguage = selectedVoice?.lang || language;
      
      console.log(`🎤 [SPEECH-INPUT] TTS Config:`, {
        language: ttsLanguage,
        voice: selectedVoice?.name || 'default',
        textLength: responseText.length,
        volume: ttsVolume
      });
      
      console.log('🚀 [SPEECH-INPUT] Calling enhancedTtsService.speak() [Azure Cloud TTS]...');
      console.log('☁️ [SPEECH-INPUT] Note: Cloud TTS does NOT require browser TTS support!');
      
      setIsEnhancedTtsSpeaking(true);
      console.log('🔊 [SPEECH-INPUT] Set isEnhancedTtsSpeaking = true');
      
      await enhancedTtsService.speak(responseText, {
        language: ttsLanguage,
        voice: selectedVoice?.name,
        rate: 1.3, // Faster speech rate for efficiency
        pitch: 0.98, // Slightly lower pitch sounds more natural
        volume: ttsVolume,
        addPauses: true, // Add natural pauses at punctuation
        speakingStyle: 'professional' // Use professional speaking style
      });
      
      setIsEnhancedTtsSpeaking(false);
      console.log('✅ [SPEECH-INPUT] Successfully spoke AI response!');
      console.log('🔇 [SPEECH-INPUT] Set isEnhancedTtsSpeaking = false');
    } catch (error) {
      console.error('❌ [SPEECH-INPUT] Enhanced TTS (Azure) failed:', error);
      console.error('❌ [SPEECH-INPUT] Error details:', error instanceof Error ? error.message : String(error));
      console.log('🔄 [SPEECH-INPUT] Attempting fallback to browser TTS...');
      
      // Reset the speaking state
      setIsEnhancedTtsSpeaking(false);
      console.log('🔇 [SPEECH-INPUT] Set isEnhancedTtsSpeaking = false (error)');
      
      // Only now check if browser TTS is supported for fallback
      if (!ttsSupported) {
        console.error('❌ [SPEECH-INPUT] Browser TTS also not supported - cannot play audio');
        console.error('💡 [SPEECH-INPUT] Try using Chrome or Edge for better TTS support');
        return;
      }
      
      // Fallback to standard browser TTS if enhanced fails
      const fallbackLanguage = selectedVoice?.lang || language;
      console.log(`🔄 [SPEECH-INPUT] Fallback language: ${fallbackLanguage}`);
      
      try {
        speak(responseText, { language: fallbackLanguage, rate: 1.3, voice: selectedVoice || undefined, volume: ttsVolume });
        console.log('✅ [SPEECH-INPUT] Browser TTS fallback successful');
      } catch (fallbackError) {
        console.error('❌ [SPEECH-INPUT] Browser TTS also failed:', fallbackError);
      }
    }
  }, [ttsSupported, speak, language, selectedVoice, ttsVolume]);

  const {
    transcript,
    isListening,
    isStarting,
    isSupported,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechToText({
    language,
    continuous: true,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      if (!isManualTyping) {
        setTextInput(transcript);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    },
    onStart: () => {
      setWaveformAnimation(true);
    },
    onEnd: () => {
      setWaveformAnimation(false);
    },
    onWaveformChange: (isAnimating) => {
      setWaveformAnimation(isAnimating);
    }
  });

  const handleSendMessage = useCallback(() => {
    // Ensure textInput is a string before processing
    const inputText = typeof textInput === 'string' ? textInput : '';
    if (inputText && inputText.trim()) {
      const messageToSend = inputText.trim();
      
      // Stop speech recognition first if active
      if (isListening || isStarting) {
        stopListening();
        setWaveformAnimation(false);
      }
      
      // Clear auto-send timer
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }
      
      // In hands-free mode, speak the client's message before sending
      if (handsFreeMode && ttsSupported) {
        speak(messageToSend, { language, rate: 0.9, voice: selectedVoice || undefined, volume: ttsVolume });
        
        // Wait for TTS to finish before sending message and restarting speech recognition
        const checkTTS = () => {
          if (!isSpeaking) {
            // TTS finished, now send the message
            onSendMessage(messageToSend);
            setTextInput('');
            resetTranscript();
            setIsManualTyping(false);
            
            // Restart speech recognition after a short delay
            setTimeout(() => {
              startListening();
            }, 1000);
          } else {
            // Still speaking, check again in 100ms
            setTimeout(checkTTS, 100);
          }
        };
        
        // Start checking after a short delay to ensure TTS has started
        setTimeout(checkTTS, 200);
      } else {
        // Normal mode - send immediately
        onSendMessage(messageToSend);
        setTextInput('');
        resetTranscript();
        setIsManualTyping(false);
        
        // In hands-free mode, restart speech recognition after sending message
        if (handsFreeMode) {
          console.log('Hands-free mode: restarting speech recognition after sending message');
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      }
    }
  }, [textInput, isListening, isStarting, stopListening, onSendMessage, resetTranscript, handsFreeMode, startListening, ttsSupported, speak, language, isSpeaking]);

  // Auto-send functionality for hands-free mode
  const startAutoSendTimer = useCallback(() => {
    if (!handsFreeMode || !textInput || !textInput.trim() || !isListening) return;
    
    // In hands-free mode, ignore manual typing flag if speech recognition has ended
    // This allows auto-send to work even if user was typing before
    if (isManualTyping) {
      return;
    }
    
    // Clear existing timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }
    
    // Start new timer
    autoSendTimerRef.current = setTimeout(() => {
      if (textInput && textInput.trim()) {
        // Stop speech recognition first
        if (isListening || isStarting) {
          stopListening();
          setWaveformAnimation(false);
        }
        
        // Clear the timer
        if (autoSendTimerRef.current) {
          clearTimeout(autoSendTimerRef.current);
          autoSendTimerRef.current = null;
        }
        
        // Send the message
        onSendMessage(textInput.trim());
        setTextInput('');
        resetTranscript();
        setIsManualTyping(false);
      }
    }, autoSendDelay);
  }, [handsFreeMode, textInput, isManualTyping, isListening, isStarting, autoSendDelay, stopListening, onSendMessage, resetTranscript, selectedVoice]);

  // Clear auto-send timer when needed
  const clearAutoSendTimer = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  }, []);

  // Effect to handle auto-send timer - start timer when we have text and speech recognition is active
  useEffect(() => {
    
    if (handsFreeMode && textInput && textInput.trim() && isListening) {
      // Start timer when we have text and are listening (this will trigger after silence)
      startAutoSendTimer();
    } else {
      clearAutoSendTimer();
    }
    
    return () => clearAutoSendTimer();
  }, [handsFreeMode, textInput, isManualTyping, isListening, startAutoSendTimer, clearAutoSendTimer]);

  // Handle voice commands
  useEffect(() => {
    if (transcript && !isManualTyping) {
      const lowerTranscript = transcript.toLowerCase();
      
      if (lowerTranscript.includes('send message') || lowerTranscript.includes('send')) {
        if (textInput && textInput.trim()) {
          handleSendMessage();
        }
      } else if (lowerTranscript.includes('clear text') || lowerTranscript.includes('clear')) {
        setTextInput('');
        setIsManualTyping(false); // Reset manual typing flag when clearing
        resetTranscript();
      } else if (lowerTranscript.includes('stop listening') || lowerTranscript.includes('stop')) {
        stopListening();
        setUserExplicitlyStopped(true);
      } else if (lowerTranscript.includes('stop speaking')) {
        stopTTS();
      } else if (lowerTranscript.includes('repeat that') && lastAIResponseRef.current) {
        speakAIResponse(lastAIResponseRef.current);
      } else {
        // Set text input from transcript if it's not a voice command
        setTextInput(transcript);
      }
    }
  }, [transcript, textInput, isManualTyping, resetTranscript, stopListening, handleSendMessage, stopTTS, speakAIResponse]);

  // Expose speakAIResponse function to parent component (only once!)
  const hasSetCallback = useRef(false);
  useEffect(() => {
    console.log('🔧 [SPEECH-INPUT] Callback registration effect triggered');
    console.log('🔧 [SPEECH-INPUT] onAIResponse exists:', !!onAIResponse);
    console.log('🔧 [SPEECH-INPUT] speakAIResponse exists:', !!speakAIResponse);
    console.log('🔧 [SPEECH-INPUT] hasSetCallback:', hasSetCallback.current);
    
    if (onAIResponse && speakAIResponse && !hasSetCallback.current) {
      hasSetCallback.current = true;
      onAIResponse(speakAIResponse);
      console.log('✅ [SPEECH-INPUT] ========== TTS CALLBACK REGISTERED ==========');
      console.log('✅ [SPEECH-INPUT] Configuration:', {
        handsFreeMode,
        language,
        hasSelectedVoice: !!selectedVoice,
        voiceLang: selectedVoice?.lang,
        voiceName: selectedVoice?.name
      });
      console.log('✅ [SPEECH-INPUT] Parent component can now trigger AI voice responses');
    } else if (!onAIResponse) {
      console.warn('⚠️ [SPEECH-INPUT] onAIResponse callback not provided by parent');
    }
  }, [onAIResponse, speakAIResponse, handsFreeMode, language, selectedVoice]);

  // In hands-free mode, restart speech recognition when AI finishes speaking
  useEffect(() => {
    // Wait for BOTH browser TTS and Azure TTS to finish before restarting microphone
    const anyTtsSpeaking = isSpeaking || isEnhancedTtsSpeaking;
    
    if (handsFreeMode && !anyTtsSpeaking && !isListening && !isStarting && !userExplicitlyStopped) {
      console.log('🎤 [SPEECH-INPUT] TTS finished, restarting microphone...');
      // Small delay to ensure TTS has fully finished
      setTimeout(() => {
        if (!isListening && !isStarting && !isEnhancedTtsSpeaking) {
          console.log('🎤 [SPEECH-INPUT] Starting listening after TTS...');
          startListening();
        }
      }, 500);
    }
  }, [handsFreeMode, isSpeaking, isEnhancedTtsSpeaking, isListening, isStarting, userExplicitlyStopped, startListening]);

  // Start speech recognition when hands-free mode is enabled (but don't stop when disabled)
  useEffect(() => {
    if (handsFreeMode) {
      // Clear the explicitly stopped flag when hands-free mode is enabled
      setUserExplicitlyStopped(false);
      
      // Start listening immediately for call mode (but not if TTS is speaking)
      const anyTtsSpeaking = isSpeaking || isEnhancedTtsSpeaking;
      if (!isListening && !isStarting && !anyTtsSpeaking) {
        console.log('🎙️ Hands-free mode: Starting microphone immediately...');
        // Use a very short timeout to ensure component is mounted
        setTimeout(() => {
          if (!isListening && !isStarting && !isEnhancedTtsSpeaking) {
            startListening();
          }
        }, 50); // Very short delay, just enough for component to be ready
      }
    }
    // Note: We don't stop speech recognition when hands-free mode is disabled
    // because the user might have manually started it for normal speech-to-text
  }, [handsFreeMode, isListening, isStarting, isSpeaking, isEnhancedTtsSpeaking, startListening]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextInput(newValue);
    
    // Only set manual typing if user is actively typing (not just clearing text)
    // Allow deletion of speech-to-text content
    if (newValue.length === 0) {
      setIsManualTyping(false); // Allow speech-to-text to work again after clearing
    } else if (newValue !== transcript) {
      setIsManualTyping(true); // User is manually typing different content
    }
  };

  const handleMicClick = () => {
    if (isListening || isStarting) {
      stopListening();
      // Force stop animation immediately
      setWaveformAnimation(false);
      // Mark that user explicitly stopped the microphone
      setUserExplicitlyStopped(true);
    } else {
      // Reset manual typing flag before starting (but don't clear existing text)
      setIsManualTyping(false);
      resetTranscript();
      // Clear the explicitly stopped flag when user starts again
      setUserExplicitlyStopped(false);
      startListening();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return '🟢';
    if (confidence >= 0.6) return '🟡';
    return '🔴';
  };

  return (
    <>

      <div className={`speech-input-container ${className}`}>
      {/* Hands-Free Mode Indicator */}
      {handsFreeMode && (
        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Hands-Free Mode Active
            </span>
            {autoSendTimerRef.current && textInput.trim() && !isManualTyping && (
              <span className="text-xs text-green-600 dark:text-green-400">
                (Auto-send in {Math.ceil(autoSendDelay / 1000)}s)
              </span>
            )}
          </div>
        </div>
      )}



      {/* Text-to-Speech Status */}
      {isSpeaking && (
        <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              AI is speaking...
            </span>
            <button
              onClick={stopTTS}
              className="ml-auto text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      {showVoiceCommands && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Voice Commands</h4>
            <button
              onClick={() => setShowVoiceCommands(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {voiceCommands.map((command, index) => (
              <div key={index} className="text-blue-700">
                • {command}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speech Status Bar */}
      {(isListening || isStarting) && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {isStarting ? 'Starting...' : 'Listening...'}
                </span>
              </div>
              {confidence > 0 && (
                <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(confidence)}`}>
                  <span>{getConfidenceIcon(confidence)}</span>
                  <span>{Math.round(confidence * 100)}% confidence</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVoiceCommands(!showVoiceCommands)}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Voice Commands
              </button>
              <button
                onClick={() => {
                  console.log('Stop button clicked');
                  stopListening();
                  setWaveformAnimation(false);
                  setUserExplicitlyStopped(true);
                }}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Stop
              </button>
            </div>
          </div>
          
          {/* Animated Waveform */}
          <div ref={waveformRef} className="mt-2 flex items-center justify-center gap-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={`w-1 rounded-full transition-all ${
                  waveformAnimation 
                    ? 'bg-red-400 animate-pulse' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{
                  height: waveformAnimation 
                    ? `${Math.random() * 20 + 8}px` 
                    : '4px',
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <VolumeX className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={textInput}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={2}
            className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 dark:placeholder-gray-400"
            disabled={disabled}
          />
          
          {/* Speech indicator in textarea */}
          {(isListening || isStarting) && (
            <div className="absolute right-3 top-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">🎤</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Microphone Button */}
          <button
            onClick={handleMicClick}
            disabled={!isSupported || disabled}
            className={`p-3 rounded-lg border-2 transition-all ${
              (isListening || isStarting)
                ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${!isSupported || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={(isListening || isStarting) ? 'Stop listening' : 'Start voice input'}
          >
            {(isListening || isStarting) ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>


          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!textInput.trim() || disabled}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-300">
          ⚠️ Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice input.
        </div>
      )}

      {/* Live Transcript Display */}
      {transcript && !isManualTyping && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-3 h-3" />
            <span className="font-medium">Live Transcript:</span>
          </div>
          <p className="italic">{transcript}</p>
        </div>
      )}
      </div>
    </>
  );
};

export default SpeechInput;
