
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, Language, translations } from '../i18n/translations';
import { SpeakerConfig, GEMINI_VOICES, MICROSOFT_AZURE_VOICES, UserTier } from '../types';
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
  systemVoices: any[]; 
  sourceLang: string;
  targetLang: string;
  currentLimits: any;
  userTier?: UserTier; 
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
        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer border ${isSelected ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'} ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
        <div className="flex items-center gap-2">
            <div>
                <span className="font-semibold flex items-center gap-2">
                    {label}
                    {isLocked && <LockIcon className="w-3 h-3 text-amber-400" />}
                </span>
                {sublabel && <span className="text-xs text-slate-400 block">{sublabel}</span>}
            </div>
        </div>
        <button
            onClick={(e) => { 
                e.stopPropagation(); 
                if (isLocked) {
                    onUpgrade();
                } else {
                    onPreview(voiceName); 
                }
            }}
            title={isLocked ? "Upgrade to Preview" : t('previewVoiceTooltip')}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${isLocked ? 'bg-slate-800/50 text-slate-500 hover:bg-slate-800' : 'bg-slate-800/50 hover:bg-cyan-500 hover:text-white text-slate-300'}`}
        >
            {previewingVoice === voiceName ? <LoaderIcon /> : (isLocked ? <LockIcon className="w-4 h-4"/> : <PlayCircleIcon />)}
        </button>
    </div>
));

const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, 
    pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed,
    multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, speakerC, setSpeakerC, speakerD, setSpeakerD, sourceLang, targetLang,
    currentLimits, onUpgrade, onConsumeQuota, userTier = 'visitor'
}) => {
    // FORCE CHECK: If gemini is not allowed by plan, default to system immediately
    const canUseGemini = currentLimits.allowGemini;
    const isGeminiVoiceSelected = GEMINI_VOICES.includes(voice);
    
    // Initial state honors the restriction
    const [voiceMode, setVoiceMode] = useState<'gemini' | 'system'>(isGeminiVoiceSelected && canUseGemini ? 'gemini' : 'system');
    
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [showAllSystemVoices, setShowAllSystemVoices] = useState(false);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const isPlatinumOrAdmin = currentLimits.dailyLimit === Infinity && currentLimits.totalTrialLimit >= 750000;

    const voiceNameMap: Record<string, keyof typeof translations> = {
        'Puck': 'voiceMale1', 'Kore': 'voiceFemale1', 'Charon': 'voiceMale2', 'Zephyr': 'voiceFemale2', 'Fenrir': 'voiceMale3',
    };

    const relevantStandardVoices = useMemo(() => {
        // Filter by UI Language primarily for Visitors/Free
        const uiLangCode = uiLanguage.toLowerCase();
        // Fallback matching: 'ar' matches 'ar-SA', 'ar-EG', etc.
        const matchesUiLang = (v: any) => v.lang.toLowerCase().startsWith(uiLangCode) || v.lang.toLowerCase().includes(uiLangCode);

        // --- VISITOR RESTRICTION (Only 2 Voices matching UI Lang) ---
        if (userTier === 'visitor') {
            const visitorVoices = MICROSOFT_AZURE_VOICES.filter(matchesUiLang);
            // If no match found (rare), fallback to first 2 of EN
            if (visitorVoices.length === 0) return MICROSOFT_AZURE_VOICES.filter(v => v.lang.startsWith('en')).slice(0, 2);
            return visitorVoices.slice(0, 2);
        }

        // --- FREE USER RESTRICTION (Only 4 Voices matching UI Lang) ---
        if (userTier === 'free') {
            const freeVoices = MICROSOFT_AZURE_VOICES.filter(matchesUiLang);
            if (freeVoices.length === 0) return MICROSOFT_AZURE_VOICES.filter(v => v.lang.startsWith('en')).slice(0, 4);
            return freeVoices.slice(0, 4);
        }

        // --- PAID USERS ---
        if (showAllSystemVoices) return MICROSOFT_AZURE_VOICES;
        const sourceLangCode = sourceLang.toLowerCase();
        const targetLangCode = targetLang.toLowerCase();
        
        const filtered = MICROSOFT_AZURE_VOICES.filter(v => {
            const vLang = v.lang.toLowerCase();
            if (v.name === voice) return true;
            return vLang.includes(sourceLangCode) || vLang.includes(targetLangCode) || vLang.includes(uiLangCode);
        });
        return filtered.length > 0 ? filtered : MICROSOFT_AZURE_VOICES;
    }, [sourceLang, targetLang, uiLanguage, showAllSystemVoices, voice, userTier]);

    const groupedStyles = useMemo(() => {
        const groups: Record<string, typeof VOICE_STYLES> = {};
        VOICE_STYLES.forEach(style => {
            if (!groups[style.categoryKey]) groups[style.categoryKey] = [];
            groups[style.categoryKey].push(style);
        });
        return groups;
    }, []);

    // STRICT WATCHER: If plan changes or component mounts with invalid state, revert to system
    useEffect(() => {
        if (!canUseGemini && voiceMode === 'gemini') {
            setVoiceMode('system');
            // If current voice is Gemini, reset to first safe system voice
            if (GEMINI_VOICES.includes(voice) && relevantStandardVoices.length > 0) {
                setVoice(relevantStandardVoices[0].name);
            }
        }
    }, [canUseGemini, voiceMode, voice, setVoice, relevantStandardVoices]);

    useEffect(() => {
        return () => {
             if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            }
             if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        };
    }, []);

    const handlePreview = async (voiceName: string) => {
        // SECURITY CHECK: Strictly block Gemini preview if not allowed
        if (GEMINI_VOICES.includes(voiceName) && !canUseGemini) {
            onUpgrade();
            return;
        }

        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            audioSourceRef.current = null;
        }
        
        if (previewingVoice === voiceName) {
            setPreviewingVoice(null);
            return;
        }

        setPreviewingVoice(voiceName);
        
        let langCode: string = uiLanguage; 
        if (!GEMINI_VOICES.includes(voiceName)) {
            const voiceObj = MICROSOFT_AZURE_VOICES.find(v => v.name === voiceName);
            if (voiceObj) langCode = voiceObj.lang;
            else if (voiceName.includes('-')) langCode = voiceName.split('-')[0];
        }

        const previewTexts: Record<string, string> = {
            'ar': "أهلاً بك في صوتلي.",
            'en': "Welcome to Sawtli.",
            'fr': "Bienvenue sur Sawtli.",
            'es': "Hola, soy Sawtli.",
            'pt': "Olá, sou Sawtli."
        };
        
        const langPrefix = langCode.split('-')[0];
        const previewText = previewTexts[langPrefix] || previewTexts['en'];

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        try {
            // Minimal charge for short preview
            if (onConsumeQuota) onConsumeQuota(20);

            let pcmData;
            if (GEMINI_VOICES.includes(voiceName)) {
                pcmData = await previewVoice(voiceName, previewText, 'Default');
            } else {
                pcmData = await generateStandardSpeech(previewText, voiceName, 0, 'Default');
            }

            if (pcmData) {
                audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => { 
                    setPreviewingVoice(null); 
                    audioSourceRef.current = null; 
                }, 1.0);
            } else {
                setPreviewingVoice(null);
            }
        } catch (error) {
            console.error("Failed to preview voice:", error);
            setPreviewingVoice(null);
        }
    };
    
    const tWrapper = (key: string) => t(key as any, uiLanguage);
    const speakerOptions = voiceMode === 'gemini' 
        ? GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)
        : relevantStandardVoices.map(v => <option key={v.name} value={v.name}>{v.label}</option>);

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setEmotion(selectedId);
        const style = VOICE_STYLES.find(s => s.id === selectedId);
        if (style && style.recommendedSpeed) {
            setSpeed(style.recommendedSpeed);
        } else if (selectedId === 'Default') {
            setSpeed(1.0);
        }
    };

    const incrementSpeed = () => setSpeed(prev => Math.min(2.0, parseFloat((prev + 0.05).toFixed(2))));
    const decrementSpeed = () => setSpeed(prev => Math.max(0.5, parseFloat((prev - 0.05).toFixed(2))));
    const resetSpeed = () => setSpeed(1.0);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('speechSettings', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-6">
                     <div className="space-y-3">
                        <label className="text-lg font-bold text-slate-200">{t('voiceLabel', uiLanguage)}</label>
                        <div className="flex p-1 bg-slate-900/50 rounded-lg border border-slate-700 relative mb-4">
                             <button 
                                onClick={() => !canUseGemini ? onUpgrade() : setVoiceMode('gemini')} 
                                disabled={!canUseGemini}
                                className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'gemini' ? 'bg-cyan-600 text-white' : 'bg-transparent text-slate-400'} ${!canUseGemini ? 'opacity-30 cursor-not-allowed bg-slate-800/50' : 'hover:bg-slate-700'}`}
                             >
                                 <SparklesIcon className="w-4 h-4"/> 
                                 {t('geminiHdVoices', uiLanguage)}
                                 {!canUseGemini && <LockIcon className="w-3 h-3 text-amber-500"/>}
                             </button>
                             <button onClick={() => setVoiceMode('system')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'system' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                                 <CheckIcon className="w-4 h-4"/> {t('systemVoices', uiLanguage)}
                             </button>
                        </div>
                        
                        <div className="text-xs text-center mb-3 text-slate-400 bg-slate-900/30 p-2 rounded border border-slate-700">
                            {voiceMode === 'gemini' ? t('ultraVoicesDesc', uiLanguage) : t('proVoicesDesc', uiLanguage)}
                        </div>

                        {voiceMode === 'gemini' ? (
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-cyan-300 text-center mb-2 animate-pulse">{t('polyglotBadge', uiLanguage)}</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {GEMINI_VOICES.map(vName => (
                                        <VoiceListItem 
                                            key={vName} 
                                            voiceName={vName} 
                                            label={t(voiceNameMap[vName], uiLanguage)} 
                                            isLocked={!canUseGemini} 
                                            isSelected={voice === vName}
                                            previewingVoice={previewingVoice}
                                            onSelect={setVoice}
                                            onPreview={handlePreview}
                                            onUpgrade={onUpgrade}
                                            t={tWrapper}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-slate-400">
                                        {userTier === 'visitor' ? (uiLanguage==='ar'?'يظهر صوتين فقط للزوار':'Visitor limit: 2 voices') 
                                         : userTier === 'free' ? (uiLanguage==='ar'?'يظهر 4 أصوات فقط للخطة المجانية':'Free Plan: 4 Arabic Voices')
                                         : showAllSystemVoices ? (uiLanguage === 'ar' ? 'عرض كل الأصوات' : 'Showing ALL voices') : t('suggestedVoices', uiLanguage)}
                                    </p>
                                    {userTier !== 'visitor' && userTier !== 'free' && (
                                        <button 
                                            onClick={() => setShowAllSystemVoices(!showAllSystemVoices)} 
                                            className={`text-xs font-bold px-2 py-1 rounded border ${showAllSystemVoices ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-700 border-slate-600 text-slate-300'}`}
                                        >
                                            {uiLanguage === 'ar' ? 'إظهار الكل' : 'Show All'}
                                        </button>
                                    )}
                                </div>
                                {relevantStandardVoices.length === 0 && (
                                    <div className="text-center p-4 border border-slate-700 rounded-lg bg-slate-900/30 flex flex-col items-center gap-3 text-slate-500 italic">
                                        No voices available for this language.
                                    </div>
                                )}
                                {relevantStandardVoices.length > 0 && (
                                    <div className="space-y-2">
                                        {relevantStandardVoices.map(v => (
                                            <VoiceListItem 
                                                key={v.name} 
                                                voiceName={v.name} 
                                                label={v.label} 
                                                sublabel={`${v.lang} • ${v.gender}`} 
                                                isSelected={voice === v.name}
                                                isLocked={false}
                                                previewingVoice={previewingVoice}
                                                onSelect={setVoice}
                                                onPreview={handlePreview}
                                                onUpgrade={onUpgrade}
                                                t={tWrapper}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* ... Emotions & Rest of UI ... */}
                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative`}>
                         {!currentLimits.allowEffects && (
                             <div className="absolute inset-0 bg-slate-900/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-[1px] cursor-pointer border border-slate-700" onClick={onUpgrade}>
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-amber-500/50 shadow-lg hover:bg-slate-700 transition-colors">
                                     <LockIcon className="w-4 h-4 text-amber-500" />
                                     <span className="text-sm font-bold text-white">{uiLanguage === 'ar' ? 'ترقية للتحكم بالمشاعر' : 'Upgrade for Emotions'}</span>
                                </div>
                             </div>
                         )}

                         <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                             {t('emotionLabel', uiLanguage)}
                         </h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="emotion-select" className="block text-sm font-medium text-slate-300 mb-1">{t('emotionLabel', uiLanguage)}</label>
                                 <select id="emotion-select" value={emotion} onChange={handleStyleChange} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                     {Object.keys(groupedStyles).map(catKey => (
                                         <optgroup key={catKey} label={t(catKey as any, uiLanguage)}>
                                             {groupedStyles[catKey].map(style => (
                                                 <option key={style.id} value={style.id}>
                                                     {t(style.labelKey as any, uiLanguage)}
                                                 </option>
                                             ))}
                                         </optgroup>
                                     ))}
                                 </select>
                             </div>
                             
                             <div className={voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}>
                                    <label htmlFor="seed-input" className="block text-sm font-medium text-slate-300 mb-1">{t('seedLabel', uiLanguage)}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="seed-input"
                                            type="number"
                                            value={seed}
                                            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                                            disabled={voiceMode === 'system'}
                                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                        />
                                        <button
                                            onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                                            disabled={voiceMode === 'system'}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md text-slate-300 hover:text-white transition-colors"
                                        >
                                            <SwapIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                             </div>
                         </div>

                        {/* --- SPEED SLIDER WITH LOCK --- */}
                        <div className="relative">
                            {!currentLimits.allowSpeed && (
                                <div className="absolute inset-0 bg-slate-900/80 rounded-lg z-20 flex items-center justify-center backdrop-blur-[1px] cursor-pointer" onClick={onUpgrade}>
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-800 px-2 py-1 rounded border border-amber-500/30">
                                        <LockIcon className="w-3 h-3" /> {uiLanguage==='ar'?'سرعة':'Speed'}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-300">{t('studioSpeed', uiLanguage)}</label>
                                <button onClick={resetSpeed} className="text-[10px] text-slate-400 underline hover:text-white">{t('studioReset', uiLanguage)}</button>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-lg border border-slate-700">
                                <button onClick={decrementSpeed} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 text-white font-bold">-</button>
                                <div className="flex-grow relative">
                                    <input 
                                        type="range" 
                                        min="0.5" 
                                        max="2.0" 
                                        step="0.05" 
                                        value={speed} 
                                        onChange={e => setSpeed(parseFloat(e.target.value))} 
                                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                                    />
                                </div>
                                <span className="text-cyan-400 font-mono font-bold w-12 text-center text-lg">{speed.toFixed(2)}x</span>
                                <button onClick={incrementSpeed} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 text-white font-bold">+</button>
                            </div>
                        </div>

                        {/* --- PAUSE SLIDER WITH LOCK --- */}
                        <div className="relative">
                            {!currentLimits.allowPause && (
                                <div className="absolute inset-0 bg-slate-900/80 rounded-lg z-20 flex items-center justify-center backdrop-blur-[1px] cursor-pointer" onClick={onUpgrade}>
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-800 px-2 py-1 rounded border border-amber-500/30">
                                        <LockIcon className="w-3 h-3" /> {uiLanguage==='ar'?'توقف':'Pause'}
                                    </div>
                                </div>
                            )}
                            <label htmlFor="pause-duration" className="block text-sm font-medium text-slate-300 mb-1">{t('pauseLabel', uiLanguage)}</label>
                            <div className="flex items-center gap-3">
                                 <input id="pause-duration" type="range" min="0" max="5" step="0.1" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                 <span className="text-cyan-400 font-mono">{pauseDuration.toFixed(1)}{t('seconds', uiLanguage)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative`}>
                         {!currentLimits.allowMultiSpeaker && (
                             <div className="absolute inset-0 bg-slate-900/70 rounded-lg z-10 flex items-center justify-center backdrop-blur-[1px] cursor-pointer border border-slate-700" onClick={onUpgrade}>
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-amber-500/50 shadow-lg hover:bg-slate-700 transition-colors">
                                     <span className="text-sm font-bold text-white">{uiLanguage === 'ar' ? 'انضم للقائمة' : 'Join Waitlist'}</span>
                                </div>
                             </div>
                         )}

                         {/* ... MultiSpeaker UI remains same ... */}
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-slate-200">{t('multiSpeakerSettings', uiLanguage)}</h4>
                                <div className="relative group">
                                    <InfoIcon className="h-5 w-5 text-slate-400 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900 text-slate-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        {t('multiSpeakerTooltip', uiLanguage)}
                                    </div>
                                </div>
                            </div>
                            <input type="checkbox" checked={multiSpeaker} onChange={e => setMultiSpeaker(e.target.checked)} className="form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500" />
                         </div>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${!multiSpeaker ? 'opacity-50 pointer-events-none' : ''}`}>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 1</label>
                                 <input type="text" value={speakerA.name} onChange={e => setSpeakerA({...speakerA, name: e.target.value})} placeholder={t('speaker1', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 1</label>
                                 <select value={speakerA.voice} onChange={e => setSpeakerA({...speakerA, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                     {speakerOptions}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 2</label>
                                 <input type="text" value={speakerB.name} onChange={e => setSpeakerB({...speakerB, name: e.target.value})} placeholder={t('speaker2', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 2</label>
                                 <select value={speakerB.voice} onChange={e => setSpeakerB({...speakerB, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                    {speakerOptions}
                                 </select>
                             </div>
                             {/* ... Speakers 3 & 4 ... */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
