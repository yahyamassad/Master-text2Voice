
import React, { useState, useEffect, useRef } from 'react';
import { generateSpeech } from './services/geminiService';
import { generateStandardSpeech } from './services/standardVoiceService';
import SettingsModal from './components/SettingsModal';
import { Language, t } from './i18n/translations';
import { SpeakerConfig, MICROSOFT_AZURE_VOICES, GEMINI_VOICES } from './types';
import { SawtliLogoIcon, GearIcon, SpeakerIcon, LoaderIcon, TranslateIcon, SoundWaveIcon, PlayCircleIcon } from './components/icons';
import { playAudio } from './utils/audioUtils';

export default function App() {
  // State
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<Language>('ar');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Voice Settings
  const [voice, setVoice] = useState('ar-SA-HamedNeural'); 
  const [emotion, setEmotion] = useState('Default');
  const [dialect, setDialect] = useState('modern_standard');
  const [speed, setSpeed] = useState(1.0);
  const [pauseDuration, setPauseDuration] = useState(1.0);

  const audioSourceRef = useRef<any>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, sourceLang: 'auto', targetLang: 'fr' }) // Default to French as requested
      });
      const data = await response.json();
      setTranslatedText(data.translatedText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text.trim() || isSpeaking) return;
    setIsSpeaking(true);
    
    try {
      let pcmData: Uint8Array | null = null;
      const isGemini = GEMINI_VOICES.includes(voice);

      if (isGemini) {
        pcmData = await generateSpeech(text, voice, emotion, pauseDuration, undefined, undefined, undefined, speed, 42, dialect);
      } else {
        pcmData = await generateStandardSpeech(text, voice, pauseDuration, emotion);
      }

      if (pcmData) {
        audioSourceRef.current = await playAudio(pcmData, null, () => setIsSpeaking(false), speed);
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Cairo'] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <SawtliLogoIcon className="h-10 w-auto" />
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500 transition-all text-slate-300"
            >
              <GearIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Source Panel */}
          <div className="workstation-container overflow-hidden group">
            <div className="workstation-header">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('sourceLang', uiLanguage)}</span>
              <button 
                onClick={handleTranslate}
                disabled={isTranslating}
                className="voice-action-btn"
              >
                {isTranslating ? <LoaderIcon className="w-5 h-5" /> : <TranslateIcon className="w-5 h-5" />}
              </button>
            </div>
            <div className="workstation-content min-h-[300px]">
              <textarea 
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="أدخل النص هنا للترجمة أو التحويل الصوتي..."
                className="workstation-textarea"
                dir="auto"
              />
            </div>
            <div className="workstation-footer border-t border-slate-800/50">
               <button 
                 onClick={() => handleSpeak(sourceText)}
                 className="flex items-center gap-3 bg-cyan-600/10 text-cyan-400 px-6 py-2 rounded-xl border border-cyan-500/20 hover:bg-cyan-600 hover:text-white transition-all font-bold"
               >
                 <SpeakerIcon className="w-5 h-5" /> {isSpeaking ? '...' : 'نطق النص'}
               </button>
            </div>
          </div>

          {/* Target Panel (French/Result) */}
          <div className="workstation-container border-dashed border-slate-700 bg-slate-900/10">
            <div className="workstation-header">
              <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">{t('translatedText', uiLanguage)} (FR)</span>
              <div className="flex gap-2">
                 <SoundWaveIcon className={`w-5 h-5 ${isSpeaking ? 'text-cyan-400' : 'text-slate-700'}`} animate={isSpeaking} />
              </div>
            </div>
            <div className="workstation-content min-h-[300px]">
              <textarea 
                value={translatedText}
                readOnly
                placeholder="النتيجة تظهر هنا..."
                className="workstation-textarea text-slate-400"
              />
            </div>
            <div className="workstation-footer border-t border-slate-800/50">
               <button 
                 onClick={() => handleSpeak(translatedText)}
                 className="flex items-center gap-3 bg-indigo-600/10 text-indigo-400 px-6 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all font-bold"
               >
                 <PlayCircleIcon className="w-5 h-5" /> {isSpeaking ? '...' : 'نطق الترجمة'}
               </button>
            </div>
          </div>

        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="feature-grid-item" onClick={() => setIsSettingsOpen(true)}>
              <GearIcon className="feature-icon" />
              <span className="feature-label">الإعدادات</span>
           </div>
           <div className="feature-grid-item opacity-50 cursor-not-allowed">
              <SoundWaveIcon className="feature-icon" />
              <span className="feature-label">الاستوديو</span>
           </div>
           <div className="feature-grid-item">
              <TranslateIcon className="feature-icon text-cyan-500" />
              <span className="feature-label">ترجمة ذكية</span>
           </div>
           <div className="feature-grid-item">
              <SpeakerIcon className="feature-icon text-amber-500" />
              <span className="feature-label">أصوات Ultra</span>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-slate-600 text-xs font-bold tracking-widest uppercase border-t border-slate-900 bg-black/20">
        &copy; 2025 Sawtli AI Audio Station - Professional Grade
      </footer>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          uiLanguage={uiLanguage} 
          voice={voice} setVoice={setVoice} 
          emotion={emotion} setEmotion={setEmotion} 
          dialect={dialect} setDialect={setDialect}
        />
      )}
    </div>
  );
}
