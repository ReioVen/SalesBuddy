import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech.ts';
import { useTranslation } from '../hooks/useTranslation.ts';
import { Volume2, Play, Square, AlertCircle, CheckCircle } from 'lucide-react';

const EstonianVoiceDebug: React.FC = () => {
  const { voices, speak, isSpeaking, stop } = useTextToSpeech();
  const { language } = useTranslation();
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [testText, setTestText] = useState('Tere! See on eesti keele test. Kuidas läheb?');

  // Get Estonian voices
  const estonianVoices = voices.filter(voice => 
    voice.lang.startsWith('et-') || voice.lang === 'et'
  );

  // Get all available languages
  const availableLanguages = [...new Set(voices.map(v => v.lang))].sort();

  const handleTestVoice = () => {
    if (selectedVoice && testText) {
      speak(testText, { 
        voice: selectedVoice, 
        language: 'et-EE'
      });
    }
  };

  const handleTestDefault = () => {
    if (testText) {
      speak(testText, { 
        language: 'et-EE'
      });
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🇪🇪 Estonian Voice Debug
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Voice Status */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Voice Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {estonianVoices.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>Estonian voices: {estonianVoices.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Total voices: {voices.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Current language: {language}</span>
              </div>
            </div>
          </div>

          {/* Estonian Voices List */}
          {estonianVoices.length > 0 ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                ✅ Estonian Voices Found:
              </h3>
              <ul className="space-y-1 text-sm">
                {estonianVoices.map((voice, index) => (
                  <li key={index} className="text-green-800 dark:text-green-200">
                    {voice.name} ({voice.lang})
                    {voice.localService && <span className="ml-2 text-blue-600">🏠</span>}
                    {voice.default && <span className="ml-2 text-yellow-600">⭐</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                ❌ No Estonian Voices Found
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                Try these solutions:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                <li>• Use Chrome or Edge browser</li>
                <li>• Check Windows language settings</li>
                <li>• Install Estonian language pack</li>
                <li>• Try different browser</li>
              </ul>
            </div>
          )}

          {/* Available Languages */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Available Languages:
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              {availableLanguages.slice(0, 10).join(', ')}
              {availableLanguages.length > 10 && ` ... and ${availableLanguages.length - 10} more`}
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="space-y-4">
          {/* Test Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Text (Estonian):
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Voice:
            </label>
            <select
              value={selectedVoice?.name || 'default'}
              onChange={(e) => {
                const voiceName = e.target.value;
                const voice = voices.find(v => v.name === voiceName) || null;
                setSelectedVoice(voice);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="default">Default Voice (Auto-select)</option>
              {voices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                  {voice.lang.startsWith('et-') || voice.lang === 'et' ? ' 🇪🇪' : ''}
                  {voice.localService ? ' 🏠' : ' 🌐'}
                </option>
              ))}
            </select>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTestVoice}
              disabled={isSpeaking || !selectedVoice}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpeaking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              Test Selected Voice
            </button>
            
            <button
              onClick={handleTestDefault}
              disabled={isSpeaking}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpeaking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              Test Auto-Select
            </button>
            
            {isSpeaking && (
              <button
                onClick={stop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>

          {/* Voice Info */}
          {selectedVoice && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Selected Voice:</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div><strong>Name:</strong> {selectedVoice.name}</div>
                <div><strong>Language:</strong> {selectedVoice.lang}</div>
                <div><strong>Local Service:</strong> {selectedVoice.localService ? 'Yes' : 'No'}</div>
                <div><strong>Default:</strong> {selectedVoice.default ? 'Yes' : 'No'}</div>
                <div><strong>Estonian:</strong> {selectedVoice.lang.startsWith('et-') || selectedVoice.lang === 'et' ? 'Yes 🇪🇪' : 'No'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstonianVoiceDebug;
