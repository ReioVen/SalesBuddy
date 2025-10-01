import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech.ts';
import { useTranslation } from '../hooks/useTranslation.ts';
import { Volume2, Play, Square } from 'lucide-react';

const VoiceTest: React.FC = () => {
  const { voices, speak, isSpeaking, stop } = useTextToSpeech();
  const { language } = useTranslation();
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [testText, setTestText] = useState('');

  // Estonian test text
  const estonianText = "Tere! See on eesti keele test. Kuidas läheb?";
  const englishText = "Hello! This is an English test. How are you doing?";
  const spanishText = "¡Hola! Esta es una prueba en español. ¿Cómo estás?";
  const russianText = "Привет! Это тест на русском языке. Как дела?";

  // Get test text based on language
  const getTestText = () => {
    switch (language) {
      case 'et': return estonianText;
      case 'es': return spanishText;
      case 'ru': return russianText;
      default: return englishText;
    }
  };

  // Filter voices by language
  const getVoicesForLanguage = () => {
    if (language === 'et') {
      return voices.filter(voice => 
        voice.lang.startsWith('et-') || voice.lang === 'et'
      );
    }
    return voices;
  };

  const languageVoices = getVoicesForLanguage();

  useEffect(() => {
    setTestText(getTestText());
  }, [language]);

  const handleTestVoice = () => {
    if (selectedVoice && testText) {
      speak(testText, { 
        voice: selectedVoice, 
        language: language === 'et' ? 'et-EE' : 
                 language === 'es' ? 'es-ES' : 
                 language === 'ru' ? 'ru-RU' : 'en-US'
      });
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🎤 Voice Test - {language.toUpperCase()}
      </h2>
      
      <div className="space-y-4">
        {/* Test Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Text:
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
            <option value="default">Default Voice</option>
            {languageVoices.map((voice, index) => (
              <option key={index} value={voice.name}>
                {voice.name} ({voice.lang})
                {voice.localService ? ' 🏠' : ' 🌐'}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Info */}
        {selectedVoice && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Voice Details:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Name:</strong> {selectedVoice.name}<br/>
              <strong>Language:</strong> {selectedVoice.lang}<br/>
              <strong>Local Service:</strong> {selectedVoice.localService ? 'Yes' : 'No'}<br/>
              <strong>Default:</strong> {selectedVoice.default ? 'Yes' : 'No'}
            </p>
          </div>
        )}

        {/* Test Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTestVoice}
            disabled={isSpeaking || !selectedVoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpeaking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSpeaking ? 'Stop' : 'Test Voice'}
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

        {/* Available Voices Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Available Voices ({languageVoices.length}):
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {languageVoices.length > 0 ? (
              <ul className="space-y-1">
                {languageVoices.map((voice, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>{voice.name}</span>
                    <span className="text-gray-500">({voice.lang})</span>
                    {voice.localService && <span className="text-green-600">🏠</span>}
                    {voice.default && <span className="text-blue-600">⭐</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-yellow-600">
                ⚠️ No voices found for {language.toUpperCase()}. 
                Available languages: {[...new Set(voices.map(v => v.lang))].join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTest;
