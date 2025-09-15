import React, { useState, useEffect } from 'react';
import { Mic, Command, Volume2, VolumeX } from 'lucide-react';

interface VoiceCommandsProps {
  isListening: boolean;
  onCommand: (command: string) => void;
  className?: string;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({
  isListening,
  onCommand,
  className = ''
}) => {
  const [showCommands, setShowCommands] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  const commands = [
    {
      phrase: 'send message',
      action: 'send',
      description: 'Send the current message',
      icon: '📤'
    },
    {
      phrase: 'clear text',
      action: 'clear',
      description: 'Clear the input field',
      icon: '🗑️'
    },
    {
      phrase: 'stop listening',
      action: 'stop',
      description: 'Stop voice recognition',
      icon: '⏹️'
    },
    {
      phrase: 'start listening',
      action: 'start',
      description: 'Start voice recognition',
      icon: '🎤'
    },
    {
      phrase: 'new conversation',
      action: 'new',
      description: 'Start a new conversation',
      icon: '💬'
    },
    {
      phrase: 'end conversation',
      action: 'end',
      description: 'End current conversation',
      icon: '❌'
    },
    {
      phrase: 'help',
      action: 'help',
      description: 'Show available commands',
      icon: '❓'
    }
  ];

  // Listen for voice commands
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript.toLowerCase())
          .join(' ');

        // Check for commands
        const matchedCommand = commands.find(cmd => 
          transcript.includes(cmd.phrase.toLowerCase())
        );

        if (matchedCommand && matchedCommand.action !== lastCommand) {
          setLastCommand(matchedCommand.action);
          onCommand(matchedCommand.action);
          
          // Reset after a delay to allow repeated commands
          setTimeout(() => setLastCommand(''), 2000);
        }
      };

      if (isListening) {
        recognition.start();
      }

      return () => {
        recognition.stop();
      };
    }
  }, [isListening, onCommand, lastCommand, commands]);

  return (
    <div className={`voice-commands ${className}`}>
      {/* Commands Toggle Button */}
      <button
        onClick={() => setShowCommands(!showCommands)}
        className={`p-2 rounded-lg border transition-all ${
          showCommands 
            ? 'bg-blue-100 border-blue-300 text-blue-600' 
            : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
        }`}
        title="Voice Commands"
      >
        <Command className="w-4 h-4" />
      </button>

      {/* Commands Panel */}
      {showCommands && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice Commands
              </h3>
              <button
                onClick={() => setShowCommands(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {commands.map((command, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-lg">{command.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      "{command.phrase}"
                    </div>
                    <div className="text-xs text-gray-600">
                      {command.description}
                    </div>
                  </div>
                  {isListening && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Volume2 className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                {isListening ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Listening for commands...</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Start speaking to use voice commands</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommands;
