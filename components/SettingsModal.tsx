
import React from 'react';
import { t, Language } from '../i18n/translations';
import { ARABIC_DIALECTS, MICROSOFT_AZURE_VOICES, GEMINI_VOICES } from '../types';

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
  onClose, uiLanguage, voice, setVoice, emotion, setEmotion, dialect, setDialect 
}) => {
  const isGemini = GEMINI_VOICES.includes(voice);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-cyan-400">تخصيص تجربة الصوت</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          
          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">اختر الشخصية الصوتية</label>
            <div className="grid grid-cols-1 gap-2">
              <select 
                value={voice} 
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all appearance-none"
              >
                <optgroup label="Ultra Voices (Gemini)">
                  {GEMINI_VOICES.map(v => <option key={v} value={v}>{v} (Ultra HD)</option>)}
                </optgroup>
                <optgroup label="Professional Voices (Azure)">
                  {MICROSOFT_AZURE_VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Dialect Selection (Gemini Only) */}
          {isGemini && (
            <div className="space-y-2 animate-fade-in-down">
              <label className="text-xs font-black text-cyan-500 uppercase tracking-widest">اللهجة (لأصوات Ultra فقط)</label>
              <select 
                value={dialect} 
                onChange={(e) => setDialect(e.target.value)}
                className="w-full bg-slate-800 border border-cyan-900/50 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all appearance-none"
              >
                {ARABIC_DIALECTS.map(d => <option key={d.id} value={d.id}>{t(d.labelKey as any, uiLanguage)}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 italic">ملاحظة: أصوات Ultra تستخدم ذكاء اصطناعي لتقمص اللهجة المختارة.</p>
            </div>
          )}

          {/* Tone Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">نبرة الصوت والأسلوب</label>
            <select 
              value={emotion} 
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all appearance-none"
            >
              <option value="Default">افتراضي (متزن)</option>
              <option value="happy">سعيد ومبتهج</option>
              <option value="sad">حزين وهادئ</option>
              <option value="formal">رسمي (نشرة أخبار)</option>
              <option value="epic_poet">حماسي (إلقاء شعري)</option>
            </select>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-900/50 border-t border-slate-800">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
           >
             حفظ الإعدادات والبدء
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
