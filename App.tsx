
import React, { useState, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import SettingsModal from './components/SettingsModal';
import { Language } from './i18n/translations';
import { SpeakerConfig } from './types';

export default function App() {
  // Settings
  const [voice, setVoice] = useState('ar-SA-HamedNeural'); 
  const [emotion, setEmotion] = useState('Default');
  const [dialect, setDialect] = useState('modern_standard');
  const [pauseDuration, setPauseDuration] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Speaker A', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Speaker B', voice: 'Kore' });
  const [speakerC, setSpeakerC] = useState<SpeakerConfig>({ name: 'Speaker C', voice: 'Charon' });
  const [speakerD, setSpeakerD] = useState<SpeakerConfig>({ name: 'Speaker D', voice: 'Zephyr' });
  const [sourceLang, setSourceLang] = useState('ar');
  const [targetLang, setTargetLang] = useState('en');
  const [uiLanguage, setUiLanguage] = useState<Language>('ar');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textToProcess, setTextToProcess] = useState('');

  // Load Settings
  useEffect(() => {
    try {
      const savedSettingsRaw = localStorage.getItem('sawtli_settings');
      if (savedSettingsRaw) {
        const settings = JSON.parse(savedSettingsRaw);
        if (settings.voice) setVoice(settings.voice);
        if (settings.emotion) setEmotion(settings.emotion);
        if (settings.dialect) setDialect(settings.dialect);
        if (settings.pauseDuration) setPauseDuration(settings.pauseDuration);
        if (settings.speed) setSpeed(settings.speed);
        if (settings.seed) setSeed(settings.seed);
        if (settings.multiSpeaker) setMultiSpeaker(settings.multiSpeaker);
        if (settings.speakerA) setSpeakerA(settings.speakerA);
        if (settings.speakerB) setSpeakerB(settings.speakerB);
        if (settings.speakerC) setSpeakerC(settings.speakerC);
        if (settings.speakerD) setSpeakerD(settings.speakerD);
        if (settings.sourceLang) setSourceLang(settings.sourceLang);
        if (settings.targetLang) setTargetLang(settings.targetLang);
        if (settings.uiLanguage) setUiLanguage(settings.uiLanguage);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  // Save Settings
  useEffect(() => {
    try {
      const settings = { voice, emotion, dialect, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, speakerC, speakerD, sourceLang, targetLang, uiLanguage };
      localStorage.setItem('sawtli_settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }, [voice, emotion, dialect, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, speakerC, speakerD, sourceLang, targetLang, uiLanguage]);

  const handleSpeak = async (text: string, target: 'source' | 'target') => {
    const idToken = 'mock-token'; // In real app, get from firebase auth
    const signal = new AbortController().signal;
    const speakersConfig = multiSpeaker ? { speakerA, speakerB, speakerC, speakerD } : undefined;

    try {
      const pcmData = await generateSpeech(
        text, 
        voice, 
        emotion, 
        pauseDuration, 
        speakersConfig, 
        signal, 
        idToken, 
        speed, 
        seed, 
        dialect
      );
      if (pcmData) {
        // Handle playback logic here
        console.log("Audio generated", pcmData.length);
      }
    } catch (geminiError: any) {
      console.error("Gemini Speech Error:", geminiError);
    }
  };

  return (
    <div className="app-container">
      <h1>Sawtli</h1>
      <textarea value={textToProcess} onChange={(e) => setTextToProcess(e.target.value)} />
      <button onClick={() => handleSpeak(textToProcess, 'source')}>Speak</button>
      <button onClick={() => setIsSettingsOpen(true)}>Open Settings</button>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          uiLanguage={uiLanguage} 
          voice={voice} 
          setVoice={setVoice} 
          emotion={emotion} 
          setEmotion={setEmotion} 
          dialect={dialect} 
          setDialect={setDialect}
        />
      )}
    </div>
  );
}
