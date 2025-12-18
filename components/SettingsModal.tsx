
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, Language, translations } from '../i18n/translations';
import { SpeakerConfig, GEMINI_VOICES, MICROSOFT_AZURE_VOICES } from '../types';
import { LoaderIcon, PlayCircleIcon, InfoIcon, SwapIcon, SparklesIcon, CheckIcon, LockIcon } from './icons';
import { previewVoice } from '../services/geminiService';
import { generateStandardSpeech } from '../services/standardVoiceService';
import { playAudio } from '../utils/audioUtils';
import { VOICE_STYLES } from '../utils/voiceStyles';

interface SettingsModalProps {
  onClose: () => void;
  uiLanguage: Language;
  voice: string;
  setVoice: React.Dispatch<React.SetStateAction<string>>;
  emotion: string;
  setEmotion: React.Dispatch<React.SetStateAction<string>>;
  pauseDuration: number;
  setPauseDuration: React.Dispatch<React.SetStateAction<number>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  seed: number;
  setSeed: React.Dispatch<React.SetStateAction<number>>;
  multiSpeaker: boolean;
  setMultiSpeaker: React.Dispatch<React.SetStateAction<boolean>>;
  speakerA: SpeakerConfig;
  setSpeakerA: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  speakerB: SpeakerConfig;
  setSpeakerB: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  speakerC?: SpeakerConfig;
  setSpeakerC?: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  speakerD?: SpeakerConfig;
  setSpeakerD?: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  sourceLang: string;
  targetLang: string;
  currentLimits: any; 
  onUpgrade: () => void;
  onRefreshVoices?: () => void;
  onConsumeQuota?: (cost: number) => void;
}

const VoiceListItem: React.FC<{ 
    voiceName: string; 
    label: string; 
    sublabel?: string; 
    isLocked?: boolean; 
    isSelected: boolean;
    previewingVoice: string | null;
    onSelect: (v: string) => void;
    onPreview: (v: string) => void;
    onUpgrade: () => void;
    t: (key: string) => string;
}> = React.memo(({ voiceName, label, sublabel, isLocked, isSelected, previewingVoice, onSelect, onPreview, onUpgrade, t }) => (
    <div
        onClick={() => isLocked ? onUpgrade() : onSelect(voiceName)}
        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer border ${isSelected ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'}`}
    >
        <div className="flex items-center gap-2">
            <div>
                <span className="font-semibold flex items-center gap-2">
                    {label}
                </span>
                {sublabel && <span className="text-[10px] text-slate-400 block opacity-70">{sublabel}</span>}
            </div>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onPreview(voiceName); }}
            className="p-2 rounded-full bg-slate-800/50 hover:bg-cyan-500 hover:text-white text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
            {previewingVoice === voiceName ? <LoaderIcon className="w-4 h-4" /> : <PlayCircleIcon className="w-4 h-4" />}
        </button>
    </div>
));

const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, 
    pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed,
    multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, speakerC, setSpeakerC, speakerD, setSpeakerD, sourceLang, targetLang,
    currentLimits, onUpgrade, onConsumeQuota
}) => {
    const geminiAllowed = currentLimits.allowGemini;
    const isGeminiVoiceSelected = GEMINI_VOICES.includes(voice);
    const [voiceMode, setVoiceMode] = useState<'gemini' | 'system'>(isGeminiVoiceSelected && geminiAllowed ? 'gemini' : 'system');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [showAllSystemVoices, setShowAllSystemVoices] = useState(false);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const voicePreviewCache = useRef(new Map<string, Uint8Array>());
    const audioContextRef = useRef<AudioContext | null>(null);

    const voiceNameMap: Record<string, keyof typeof translations> = {
        'Puck': 'voiceMale1', 'Kore': 'voiceFemale1', 'Charon': 'voiceMale2', 'Zephyr': 'voiceFemale2', 'Fenrir': 'voiceMale3',
    };

    const relevantStandardVoices = useMemo(() => {
        let availableList = [...MICROSOFT_AZURE_VOICES];
        const uiLangCode = uiLanguage.toLowerCase();
        
        // فرز الأصوات بحيث تظهر أصوات لغة الواجهة الحالية أولاً
        availableList.sort((a, b) => {
            const aMatch = a.lang.toLowerCase().startsWith(uiLangCode);
            const bMatch = b.lang.toLowerCase().startsWith(uiLangCode);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        if (showAllSystemVoices) return availableList;
        // عرض 25 صوتاً بدلاً من 20 لزيادة التنوع في القائمة الافتراضية
        return availableList.slice(0, 25);
    }, [uiLanguage, showAllSystemVoices]);

    const groupedStyles = useMemo(() => {
        const groups: Record<string, typeof VOICE_STYLES> = {};
        VOICE_STYLES.forEach(style => {
            if (!groups[style.categoryKey]) groups[style.categoryKey] = [];
            groups[style.categoryKey].push(style);
        });
        return groups;
    }, []);

    useEffect(() => {
        if (voiceMode === 'gemini' && !GEMINI_VOICES.includes(voice)) {
            setVoice(GEMINI_VOICES[0]);
        }
    }, [voiceMode, voice, setVoice]); 

    useEffect(() => {
        return () => {
             if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            }
             if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        };
    }, []);

    const handlePreview = async (voiceName: string) => {
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            audioSourceRef.current = null;
        }
        if (previewingVoice === voiceName) { setPreviewingVoice(null); return; }
        setPreviewingVoice(voiceName);
        
        let previewText = "أهلاً بك في صوتلي.";
        if (voiceName.startsWith('fr-')) previewText = "Bienvenue sur Sawtli.";
        else if (voiceName.startsWith('en-')) previewText = "Welcome to Sawtli.";
        else if (voiceName.startsWith('de-')) previewText = "Willkommen bei Sawtli.";
        else if (voiceName.startsWith('es-')) previewText = "Bienvenido a Sawtli.";

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const cacheKey = `preview_${voiceName}`;
        if (voicePreviewCache.current.has(cacheKey)) {
            const pcmData = voicePreviewCache.current.get(cacheKey)!;
            audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => { 
                setPreviewingVoice(null); audioSourceRef.current = null; 
            }, 1.0);
            return;
        }

        try {
            let pcmData;
            if (GEMINI_VOICES.includes(voiceName)) {
                pcmData = await previewVoice(voiceName, previewText, 'Default');
            } else {
                pcmData = await generateStandardSpeech(previewText, voiceName, 0, 'Default');
            }
            if (pcmData) {
                voicePreviewCache.current.set(cacheKey, pcmData); 
                audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => { 
                    setPreviewingVoice(null); audioSourceRef.current = null; 
                }, 1.0);
            } else { setPreviewingVoice(null); }
        } catch (error) { setPreviewingVoice(null); }
    };
    
    const tWrapper = (key: string) => t(key as any, uiLanguage);
    const speakerOptions = voiceMode === 'gemini' 
        ? GEMINI_VOICES.map(v => <option key={v} value={v}>{t(voiceNameMap[v], uiLanguage)}</option>)
        : MICROSOFT_AZURE_VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>);

    const sNameLabel = t('speakerName', uiLanguage);
    const sVoiceLabel = t('speakerVoice', uiLanguage);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('speechSettings', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                     <div className="space-y-3">
                        <label className="text-lg font-bold text-slate-200">{t('voiceLabel', uiLanguage)}</label>
                        <div className="flex p-1 bg-slate-900/50 rounded-lg border border-slate-700 relative mb-4">
                             <button 
                                onClick={() => geminiAllowed ? setVoiceMode('gemini') : onUpgrade()} 
                                className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 relative ${voiceMode === 'gemini' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'} ${!geminiAllowed ? 'opacity-60' : ''}`}
                             >
                                 <SparklesIcon className="w-4 h-4"/> {t('geminiHdVoices', uiLanguage)}
                                 {!geminiAllowed && <LockIcon className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}
                             </button>
                             <button onClick={() => setVoiceMode('system')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'system' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                                 <CheckIcon className="w-4 h-4"/> {t('neuralVoices', uiLanguage)}
                             </button>
                        </div>
                        
                        <div className="text-[10px] text-center mb-3 text-slate-400 bg-slate-900/30 p-2 rounded border border-slate-700 uppercase tracking-widest">
                            {voiceMode === 'gemini' ? t('ultraVoicesDesc', uiLanguage) : t('proVoicesDesc', uiLanguage)}
                        </div>

                        {voiceMode === 'gemini' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GEMINI_VOICES.map(vName => (
                                    <VoiceListItem 
                                        key={vName} 
                                        voiceName={vName} 
                                        label={t(voiceNameMap[vName], uiLanguage)} 
                                        isSelected={voice === vName}
                                        previewingVoice={previewingVoice}
                                        onSelect={setVoice}
                                        onPreview={handlePreview}
                                        onUpgrade={onUpgrade}
                                        t={tWrapper}
                                    />
                                ))}
                            </div>
                        ) : (
                             <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-slate-400 font-bold uppercase">{showAllSystemVoices ? (uiLanguage === 'ar' ? 'المكتبة الكاملة' : 'Global Library') : (uiLanguage === 'ar' ? 'أصوات مقترحة' : 'Quick Picks')}</p>
                                    <button onClick={() => setShowAllSystemVoices(!showAllSystemVoices)} className="text-[10px] font-bold px-3 py-1 rounded-full border bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors uppercase tracking-wider">
                                        {showAllSystemVoices ? (uiLanguage === 'ar' ? 'تصفية' : 'Filter') : (uiLanguage === 'ar' ? 'إظهار الكل' : 'Show All')}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {relevantStandardVoices.map(v => (
                                        <VoiceListItem 
                                            key={v.name} 
                                            voiceName={v.name} 
                                            label={v.label} 
                                            sublabel={`${v.lang} • ${v.gender}`} 
                                            isSelected={voice === v.name}
                                            previewingVoice={previewingVoice}
                                            onSelect={setVoice}
                                            onPreview={handlePreview}
                                            onUpgrade={onUpgrade}
                                            t={tWrapper}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50`}>
                         <h4 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">{t('emotionLabel', uiLanguage)}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('emotionLabel', uiLanguage)}</label>
                                 <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm">
                                     {Object.keys(groupedStyles).map(catKey => (
                                         <optgroup key={catKey} label={t(catKey as any, uiLanguage)}>
                                             {groupedStyles[catKey].map(style => (
                                                 <option key={style.id} value={style.id}>{t(style.labelKey as any, uiLanguage)}</option>
                                             ))}
                                         </optgroup>
                                     ))}
                                 </select>
                             </div>
                             <div className={voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('seedLabel', uiLanguage)}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value) || 0)} className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm font-mono" />
                                        <button onClick={() => setSeed(Math.floor(Math.random() * 100000))} className="p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md text-slate-300 transition-colors"><SwapIcon className="w-5 h-5" /></button>
                                    </div>
                             </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t('studioSpeed', uiLanguage)} ({speed.toFixed(2)}x)</label>
                                <input type="range" min="0.5" max="2.0" step="0.05" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{uiLanguage === 'ar' ? 'التوقف بين الفقرات' : 'Pause between paragraphs'} ({pauseDuration}s)</label>
                                <input type="range" min="0" max="5" step="0.1" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                            </div>
                         </div>
                    </div>

                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 relative border border-slate-700/50`}>
                         {!currentLimits.allowMultiSpeaker && (
                             <div className="absolute inset-0 bg-slate-900/70 rounded-lg z-10 flex items-center justify-center backdrop-blur-[1px] cursor-pointer" onClick={onUpgrade}>
                                <div className="bg-slate-800 px-4 py-2 rounded-full border border-amber-500/50 shadow-lg"><span className="text-sm font-bold text-white">{uiLanguage === 'ar' ? 'ترقية لفتح الميزة' : 'Upgrade to Unlock'}</span></div>
                             </div>
                         )}
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">{t('multiSpeakerSettings', uiLanguage)}</h4>
                            </div>
                            <input type="checkbox" checked={multiSpeaker} onChange={e => setMultiSpeaker(e.target.checked)} className="form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-600 rounded" />
                         </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${!multiSpeaker ? 'opacity-30 pointer-events-none' : ''}`}>
                             <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sNameLabel} 1</label>
                                 <input type="text" value={speakerA.name} onChange={e => setSpeakerA({...speakerA, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white mb-2 text-sm" />
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sVoiceLabel} 1</label>
                                 <select value={speakerA.voice} onChange={e => setSpeakerA({...speakerA, voice: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs">{speakerOptions}</select>
                             </div>
                             <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sNameLabel} 2</label>
                                 <input type="text" value={speakerB.name} onChange={e => setSpeakerB({...speakerB, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white mb-2 text-sm" />
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sVoiceLabel} 2</label>
                                 <select value={speakerB.voice} onChange={e => setSpeakerB({...speakerB, voice: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs">{speakerOptions}</select>
                             </div>
                             <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sNameLabel} 3</label>
                                 <input type="text" value={speakerC?.name || ''} onChange={e => setSpeakerC && setSpeakerC({...speakerC!, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white mb-2 text-sm" />
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sVoiceLabel} 3</label>
                                 <select value={speakerC?.voice || ''} onChange={e => setSpeakerC && setSpeakerC({...speakerC!, voice: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs">{speakerOptions}</select>
                             </div>
                             <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sNameLabel} 4</label>
                                 <input type="text" value={speakerD?.name || ''} onChange={e => setSpeakerD && setSpeakerD({...speakerD!, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white mb-2 text-sm" />
                                 <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{sVoiceLabel} 4</label>
                                 <select value={speakerD?.voice || ''} onChange={e => setSpeakerD && setSpeakerD({...speakerD!, voice: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs">{speakerOptions}</select>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
