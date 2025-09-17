import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, X, Volume2, VolumeX } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText.ts';

interface SpeechInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  language?: string;
  className?: string;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type or speak your message...",
  language = 'en-US',
  className = ''
}) => {
  const [textInput, setTextInput] = useState('');
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [voiceCommands] = useState([
    'Send message',
    'Clear text',
    'Stop listening',
    'Start new conversation',
    'End conversation'
  ]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [waveformAnimation, setWaveformAnimation] = useState(false);

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
    if (textInput.trim()) {
      // Stop speech recognition first if active
      if (isListening || isStarting) {
        stopListening();
        setWaveformAnimation(false);
      }
      
      onSendMessage(textInput.trim());
      setTextInput('');
      resetTranscript();
      setIsManualTyping(false);
    }
  }, [textInput, isListening, isStarting, stopListening, onSendMessage, resetTranscript]);

  // Handle voice commands
  useEffect(() => {
    if (transcript && !isManualTyping) {
      const lowerTranscript = transcript.toLowerCase();
      
      if (lowerTranscript.includes('send message') || lowerTranscript.includes('send')) {
        if (textInput.trim()) {
          handleSendMessage();
        }
      } else if (lowerTranscript.includes('clear text') || lowerTranscript.includes('clear')) {
        setTextInput('');
        setIsManualTyping(false); // Reset manual typing flag when clearing
        resetTranscript();
      } else if (lowerTranscript.includes('stop listening') || lowerTranscript.includes('stop')) {
        stopListening();
      } else {
        // Set text input from transcript if it's not a voice command
        setTextInput(transcript);
      }
    }
  }, [transcript, textInput, isManualTyping, resetTranscript, stopListening, handleSendMessage]);

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
    } else {
      // Reset manual typing flag before starting (but don't clear existing text)
      setIsManualTyping(false);
      resetTranscript();
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
    <div className={`speech-input-container ${className}`}>
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
                }}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Stop
              </button>
            </div>
          </div>
          
          {/* Animated Waveform */}
          <div ref={waveformRef} className="mt-2 flex items-center gap-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={`w-1 bg-green-400 rounded-full ${
                  waveformAnimation ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${Math.random() * 20 + 8}px`,
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
  );
};

export default SpeechInput;
