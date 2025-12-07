
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, Language, translations } from '../i18n/translations';
import { SpeakerConfig, GEMINI_VOICES, MICROSOFT_AZURE_VOICES } from '../types';
import { LoaderIcon, PlayCircleIcon, InfoIcon, SwapIcon, SparklesIcon, CheckIcon } from './icons';
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
  onUpgrade: () => void;
  onRefreshVoices?: () => void; 
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
                {sublabel && <span className="text-xs text-slate-400 block">{sublabel}</span>}
            </div>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onPreview(voiceName); }}
            title={t('previewVoiceTooltip')}
            className="p-2 rounded-full bg-slate-800/50 hover:bg-cyan-500 hover:text-white text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
            {previewingVoice === voiceName ? <LoaderIcon /> : <PlayCircleIcon />}
        </button>
    </div>
));

const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, 
    pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed,
    multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, speakerC, setSpeakerC, speakerD, setSpeakerD, sourceLang, targetLang,
    currentLimits, onUpgrade
}) => {
    const isGeminiVoiceSelected = GEMINI_VOICES.includes(voice);
    const [voiceMode, setVoiceMode] = useState<'gemini' | 'system'>(isGeminiVoiceSelected ? 'gemini' : 'system');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [showAllSystemVoices, setShowAllSystemVoices] = useState(false);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const voicePreviewCache = useRef(new Map<string, Uint8Array>());
    const audioContextRef = useRef<AudioContext | null>(null);

    const isPlatinumOrAdmin = currentLimits.dailyLimit === Infinity && currentLimits.totalTrialLimit >= 750000;

    const voiceNameMap: Record<string, keyof typeof translations> = {
        'Puck': 'voiceMale1', 'Kore': 'voiceFemale1', 'Charon': 'voiceMale2', 'Zephyr': 'voiceFemale2', 'Fenrir': 'voiceMale3',
    };

    const relevantStandardVoices = useMemo(() => {
        if (showAllSystemVoices) return MICROSOFT_AZURE_VOICES;
        const sourceLangCode = sourceLang.toLowerCase();
        const targetLangCode = targetLang.toLowerCase();
        const uiLangCode = uiLanguage.toLowerCase(); 
        const filtered = MICROSOFT_AZURE_VOICES.filter(v => {
            const vLang = v.lang.toLowerCase();
            if (v.name === voice) return true;
            return vLang.includes(sourceLangCode) || vLang.includes(targetLangCode) || vLang.includes(uiLangCode);
        });
        return filtered.length > 0 ? filtered : MICROSOFT_AZURE_VOICES;
    }, [sourceLang, targetLang, uiLanguage, showAllSystemVoices, voice]);

    const neuralVoices = relevantStandardVoices;

    // Group Voice Styles
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
        } else if (voiceMode === 'system' && GEMINI_VOICES.includes(voice)) {
            if (relevantStandardVoices.length > 0) {
                setVoice(relevantStandardVoices[0].name);
            }
        }
    }, [voiceMode, setVoice]); 

    useEffect(() => {
        return () => {
             if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            }
             if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
        };
    }, []);

    const handlePreview = async (voiceName: string) => {
        // 1. Stop any existing playback immediately
        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); audioSourceRef.current.disconnect(); } catch (e) { }
            audioSourceRef.current = null;
        }
        
        // 2. Toggle off if clicking same voice
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

        const previewKey = `previewText_${langCode}` as keyof typeof translations;
        const previewText = t(previewKey, uiLanguage) || "Hello, I am ready.";

        // 3. Ensure Audio Context is ready
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const cacheKey = `${voiceName}-${langCode}`;
        
        // 4. Check Cache
        if (voicePreviewCache.current.has(cacheKey)) {
            const pcmData = voicePreviewCache.current.get(cacheKey)!;
            // Use current selected speed for preview or default to 1.0
            audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => { 
                setPreviewingVoice(null); 
                audioSourceRef.current = null; 
            }, speed);
            return;
        }

        try {
            let pcmData;
            // Note: Previews use 'Default' emotion to be quick
            if (GEMINI_VOICES.includes(voiceName)) {
                pcmData = await previewVoice(voiceName, previewText, 'Default');
            } else {
                pcmData = await generateStandardSpeech(previewText, voiceName, 0, 'Default');
            }

            if (pcmData) {
                voicePreviewCache.current.set(cacheKey, pcmData); 
                audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => { 
                    setPreviewingVoice(null); 
                    audioSourceRef.current = null; 
                }, speed);
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
        
        // Auto-adjust speed based on recommended setting for that style
        const style = VOICE_STYLES.find(s => s.id === selectedId);
        if (style && style.recommendedSpeed) {
            setSpeed(style.recommendedSpeed);
        } else if (selectedId === 'Default') {
            setSpeed(1.0);
        }
    };

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
                             <button onClick={() => setVoiceMode('gemini')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'gemini' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                                 <SparklesIcon className="w-4 h-4"/> {t('geminiHdVoices', uiLanguage)}
                             </button>
                             <button onClick={() => setVoiceMode('system')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'system' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                                 <CheckIcon className="w-4 h-4"/> {t('systemVoices', uiLanguage)}
                             </button>
                        </div>
                        
                        {/* Voice Marketing Fluff */}
                        <div className="text-xs text-center mb-3 text-slate-400 bg-slate-900/30 p-2 rounded border border-slate-700">
                            {voiceMode === 'gemini' ? t('ultraVoicesDesc', uiLanguage) : t('proVoicesDesc', uiLanguage)}
                        </div>

                        {voiceMode === 'gemini' ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {GEMINI_VOICES.map(vName => (
                                        <VoiceListItem 
                                            key={vName} 
                                            voiceName={vName} 
                                            label={t(voiceNameMap[vName], uiLanguage)} 
                                            isLocked={!currentLimits.allowGemini}
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
                                        {showAllSystemVoices 
                                            ? (uiLanguage === 'ar' ? 'عرض كل الأصوات' : 'Showing ALL voices')
                                            : t('suggestedVoices', uiLanguage)}
                                    </p>
                                    <button 
                                        onClick={() => setShowAllSystemVoices(!showAllSystemVoices)} 
                                        className={`text-xs font-bold px-2 py-1 rounded border ${showAllSystemVoices ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-700 border-slate-600 text-slate-300'}`}
                                    >
                                        {uiLanguage === 'ar' ? 'إظهار الكل' : 'Show All'}
                                    </button>
                                </div>

                                {relevantStandardVoices.length === 0 && (
                                    <div className="text-center p-4 border border-slate-700 rounded-lg bg-slate-900/30 flex flex-col items-center gap-3 text-slate-500 italic">
                                        No voices available for this language.
                                    </div>
                                )}

                                {neuralVoices.length > 0 && (
                                    <div className="space-y-2">
                                        {neuralVoices.map(v => (
                                            <VoiceListItem 
                                                key={v.name} 
                                                voiceName={v.name} 
                                                label={v.label} 
                                                sublabel={`${v.lang} • ${v.gender}`} 
                                                isSelected={voice === v.name}
                                                isLocked={!currentLimits.allowWav && false} // Basic allows Azures too
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
                    
                    {/* --- NEW VOICE STYLES SELECTOR --- */}
                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative`}>
                         <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                             {t('emotionLabel', uiLanguage)}
                         </h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="emotion-select" className="block text-sm font-medium text-slate-300 mb-1">{t('emotionLabel', uiLanguage)}</label>
                                 <select 
                                    id="emotion-select" 
                                    value={emotion} 
                                    onChange={handleStyleChange} 
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                 >
                                     <option value="Default">{t('emotionDefault', uiLanguage)}</option>
                                     
                                     {/* Grouped Styles */}
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

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="speed-slider" className="block text-sm font-medium text-slate-300">{t('studioSpeed', uiLanguage)}</label>
                                <span className="text-cyan-400 font-mono text-xs">{speed.toFixed(2)}x</span>
                            </div>
                            <input 
                                id="speed-slider" 
                                type="range" 
                                min="0.5" 
                                max="2.0" 
                                step="0.05" 
                                value={speed} 
                                onChange={e => setSpeed(parseFloat(e.target.value))} 
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                            />
                        </div>

                        <div>
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
                             
                             <div className={`relative ${!isPlatinumOrAdmin ? 'opacity-60 pointer-events-none' : ''}`}>
                                <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                                    {t('speakerName', uiLanguage)} 3
                                </label>
                                <input 
                                    type="text" 
                                    value={speakerC?.name || 'Haya'} 
                                    onChange={e => setSpeakerC && setSpeakerC({...speakerC!, name: e.target.value})} 
                                    placeholder={t('speaker3', uiLanguage)} 
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" 
                                />
                                <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 3</label>
                                <select 
                                    value={speakerC?.voice || 'Zephyr'} 
                                    onChange={e => setSpeakerC && setSpeakerC({...speakerC!, voice: e.target.value})} 
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                >
                                    {speakerOptions}
                                </select>
                            </div>

                            <div className={`relative ${!isPlatinumOrAdmin ? 'opacity-60 pointer-events-none' : ''}`}>
                                <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                                    {t('speakerName', uiLanguage)} 4
                                </label>
                                <input 
                                    type="text" 
                                    value={speakerD?.name || 'Rana'} 
                                    onChange={e => setSpeakerD && setSpeakerD({...speakerD!, name: e.target.value})} 
                                    placeholder={t('speaker4', uiLanguage)} 
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" 
                                />
                                <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 4</label>
                                <select 
                                    value={speakerD?.voice || 'Fenrir'} 
                                    onChange={e => setSpeakerD && setSpeakerD({...speakerD!, voice: e.target.value})} 
                                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                                >
                                    {speakerOptions}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
