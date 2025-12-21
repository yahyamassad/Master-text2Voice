
import React from 'react';
import { t, Language } from '../i18n/translations';
import { ARABIC_DIALECTS } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  uiLanguage: Language;
  voice: string;
  setVoice: React.Dispatch<React.SetStateAction<string>>;
  emotion: string;
  setEmotion: React.Dispatch<React.SetStateAction<string>>;
  dialect: string;
  setDialect: React.Dispatch<React.SetStateAction<string>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  uiLanguage, 
  voice, 
  setVoice, 
  emotion, 
  setEmotion, 
  dialect, 
  setDialect 
}) => {
  const voiceMode = voice.includes('Neural') ? 'azure' : 'gemini';
  const areControlsDisabled = false;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-cyan-400">{t('settingsTitle', uiLanguage)}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Dialect Selector */}
          {voiceMode === 'gemini' && (
            <div>
              <label htmlFor="dialect-select" className="block text-sm font-medium text-slate-300 mb-1">
                {t('dialectLabel', uiLanguage)}
              </label>
              <select 
                id="dialect-select" 
                value={dialect} 
                onChange={(e) => setDialect(e.target.value)} 
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white outline-none focus:border-cyan-500" 
                disabled={areControlsDisabled}
              >
                {ARABIC_DIALECTS.map(d => (
                  <option key={d.id} value={d.id}>{t(d.labelKey as any, uiLanguage)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Emotion Selector */}
          <div>
            <label htmlFor="emotion-select" className="block text-sm font-medium text-slate-300 mb-1">
              {t('emotionLabel', uiLanguage)}
            </label>
            <select 
              id="emotion-select" 
              value={emotion} 
              onChange={(e) => setEmotion(e.target.value)} 
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white outline-none focus:border-cyan-500"
            >
              <option value="Default">Default</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="mt-8 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
        >
          {t('closeButton', uiLanguage)}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
