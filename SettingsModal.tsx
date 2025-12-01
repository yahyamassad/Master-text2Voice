import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, Language, translationLanguages, translations } from '../i18n/translations';
import { SpeakerConfig, GEMINI_VOICES, AWS_STANDARD_VOICES, StandardVoice } from '../types';
import { LoaderIcon, PlayCircleIcon, InfoIcon, SwapIcon, LockIcon, ReplayIcon, UserIcon } from './icons';
import { previewVoice } from '../services/geminiService';
import { generateStandardSpeech } from '../services/standardVoiceService';
import { playAudio } from '../utils/audioUtils';

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

const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, 
    pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed,
    multiSpeaker, setMultiSpeaker, 
    speakerA, setSpeakerA, 
    speakerB, setSpeakerB,
    speakerC, setSpeakerC,
    speakerD, setSpeakerD,
    sourceLang, targetLang,
    currentLimits, onUpgrade
}) => {
    const isGeminiVoiceSelected = GEMINI_VOICES.includes(voice);
    const [voiceMode, setVoiceMode] = useState<'gemini' | 'system'>(isGeminiVoiceSelected ? 'gemini' : 'system');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [showAllSystemVoices, setShowAllSystemVoices] = useState(false);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const voicePreviewCache = useRef(new Map<string, Uint8Array>());
    
    const audioContextRef = useRef<AudioContext | null>(null);

    // Filter Standard Voices based on language
    const relevantStandardVoices = useMemo(() => {
        if (showAllSystemVoices) return AWS_STANDARD_VOICES;

        const sourceLangCode = sourceLang.toLowerCase();
        const targetLangCode = targetLang.toLowerCase();

        const filtered = AWS_STANDARD_VOICES.filter(v => {
            const vLang = v.lang.toLowerCase();
            return vLang.startsWith(sourceLangCode) || vLang.startsWith(targetLangCode) || vLang.includes(sourceLangCode) || vLang.includes(targetLangCode);
        });

        return filtered.length > 0 ? filtered : AWS_STANDARD_VOICES;
    }, [sourceLang, targetLang, showAllSystemVoices]);

    // Auto-select voice when switching modes if current voice is invalid for mode
    useEffect(() => {
        if (voiceMode === 'gemini' && !GEMINI_VOICES.includes(voice)) {
            setVoice(GEMINI_VOICES[0]);
        } else if (voiceMode === 'system' && GEMINI_VOICES.includes(voice)) {
            // Pick first relevant standard voice
            if (relevantStandardVoices.length > 0) {
                setVoice(relevantStandardVoices[0].name);
            }
        }
    }, [voiceMode, voice, setVoice, relevantStandardVoices]);

    useEffect(() => {
        return () => {
             if (audioSourceRef.current) {
                try { 
                    audioSourceRef.current.stop(); 
                    audioSourceRef.current.disconnect();
                } catch (e) { /* ignore */ }
            }
             if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);


    const handlePreview = async (voiceName: string) => {
        if (previewingVoice) { 
            if (audioSourceRef.current) {
                try { 
                    audioSourceRef.current.stop(); 
                    audioSourceRef.current.disconnect();
                } catch (e) { /* ignore */ }
                audioSourceRef.current = null;
            }
            setPreviewingVoice(null);
            if (previewingVoice === voiceName) return; 
        }

        setPreviewingVoice(voiceName);
        const previewText = t('voicePreviewText', uiLanguage);

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const cacheKey = `${voiceName}-${uiLanguage}`;
        if (voicePreviewCache.current.has(cacheKey)) {
            const pcmData = voicePreviewCache.current.get(cacheKey)!;
            audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => {
                setPreviewingVoice(null);
                audioSourceRef.current = null;
            }, speed);
            return;
        }

        try {
            let pcmData;
            
            if (GEMINI_VOICES.includes(voiceName)) {
                pcmData = await previewVoice(voiceName, previewText, 'Default');
            } else {
                // AWS Standard Preview
                pcmData = await generateStandardSpeech(previewText, voiceName);
            }

            if (pcmData) {
                voicePreviewCache.current.set(cacheKey, pcmData); 
                audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => {
                    setPreviewingVoice(null);
                    audioSourceRef.current = null;
                }, speed);
            } else {
                console.error("No PCM data returned for preview");
                setPreviewingVoice(null);
            }
        } catch (error) {
            console.error("Failed to preview voice:", error);
            setPreviewingVoice(null);
        }
    };
    
    const voiceNameMap: Record<string, keyof typeof translations> = {
        'Puck': 'voiceMale1', 'Kore': 'voiceFemale1', 'Charon': 'voiceMale2', 'Zephyr': 'voiceFemale2', 'Fenrir': 'voiceMale3',
    };

    const VoiceListItem: React.FC<{ voiceName: string; label: string; sublabel?: string; isLocked?: boolean }> = ({ voiceName, label, sublabel, isLocked }) => (
        <div
            onClick={() => setVoice(voiceName)}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer border ${voice === voiceName ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'}`}
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
                onClick={(e) => { e.stopPropagation(); handlePreview(voiceName); }}
                title={t('previewVoiceTooltip', uiLanguage)}
                className="p-2 rounded-full bg-slate-800/50 hover:bg-cyan-500 hover:text-white text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
                {previewingVoice === voiceName ? <LoaderIcon /> : <PlayCircleIcon />}
            </button>
        </div>
    );

    // Component for individual speaker input
    const SpeakerInput = ({ 
        index, 
        config, 
        setConfig, 
        locked = false 
    }: { 
        index: number, 
        config: SpeakerConfig, 
        setConfig: (c: SpeakerConfig) => void, 
        locked?: boolean 
    }) => (
        <div className={`relative ${locked ? 'opacity-70' : ''}`}>
            {locked && (
                <div 
                    className="absolute inset-0 z-10 bg-slate-900/50 flex items-center justify-center cursor-pointer rounded-lg border border-transparent hover:border-cyan-400 transition-colors"
                    onClick={onUpgrade}
                >
                    <div className="bg-slate-800 p-2 rounded-full shadow-lg border border-slate-600 flex items-center gap-2">
                        <LockIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Platinum</span>
                    </div>
                </div>
            )}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Speaker {index}
                </label>
                <div className="space-y-2">
                    <input 
                        type="text" 
                        value={config.name} 
                        onChange={e => setConfig({...config, name: e.target.value})} 
                        placeholder={`Name (e.g. Speaker ${index})`}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <select 
                        value={config.voice} 
                        onChange={e => setConfig({...config, voice: e.target.value})} 
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                        {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('speechSettings', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label={t('closeButton', uiLanguage)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-6">
                     <div className="space-y-3">
                        <label className="text-lg font-bold text-slate-200">{t('voiceLabel', uiLanguage)}</label>
                        
                        <div className="flex p-1 bg-slate-900/50 rounded-lg border border-slate-700 relative mb-4">
                             <button onClick={() => setVoiceMode('gemini')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${voiceMode === 'gemini' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                                 {t('geminiHdVoices', uiLanguage)}
                                 {!currentLimits.allowGemini && <LockIcon className="w-3 h-3 text-amber-400" />}
                             </button>
                             <button onClick={() => setVoiceMode('system')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${voiceMode === 'system' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>{t('systemVoices', uiLanguage)}</button>
                        </div>

                        {voiceMode === 'gemini' ? (
                            <div className="space-y-2">
                                <div className="text-xs text-amber-400 bg-amber-900/20 p-2 rounded border border-amber-500/30 mb-2 flex gap-2 items-center">
                                    <InfoIcon className="w-4 h-4 flex-shrink-0" />
                                    {t('previewVoiceTooltip', uiLanguage)}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {GEMINI_VOICES.map(vName => (
                                        <VoiceListItem 
                                            key={vName} 
                                            voiceName={vName} 
                                            label={t(voiceNameMap[vName], uiLanguage)} 
                                            isLocked={!currentLimits.allowGemini} 
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-slate-400">
                                        {showAllSystemVoices 
                                            ? (uiLanguage === 'ar' ? 'عرض كل الأصوات القياسية' : 'Showing ALL Standard voices')
                                            : t('noRelevantSystemVoices', uiLanguage)}
                                    </p>
                                    <button 
                                        onClick={() => setShowAllSystemVoices(!showAllSystemVoices)} 
                                        className={`text-xs font-bold px-2 py-1 rounded border ${showAllSystemVoices ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-700 border-slate-600 text-slate-300'}`}
                                    >
                                        {uiLanguage === 'ar' ? 'إظهار الكل' : 'Show All'}
                                    </button>
                                </div>

                                {relevantStandardVoices.length > 0 ? (
                                    relevantStandardVoices.map(v => <VoiceListItem key={v.name} voiceName={v.name} label={v.label} sublabel={`${v.lang} • ${v.gender}`} />)
                                ) : (
                                    <div className="text-center p-4 border border-slate-700 rounded-lg bg-slate-900/30 flex flex-col items-center gap-3 text-slate-500 italic">
                                        No standard voices available for this language.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative ${voiceMode === 'system' ? 'opacity-40 pointer-events-none' : ''}`}>
                         {voiceMode === 'gemini' && !currentLimits.allowEffects && (
                             <div className="absolute inset-0 bg-slate-900/70 rounded-lg z-10 flex items-center justify-center backdrop-blur-[1px] cursor-pointer border border-slate-700" onClick={onUpgrade}>
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-amber-500/50 shadow-lg hover:bg-slate-700 transition-colors">
                                     <LockIcon className="text-amber-400 w-5 h-5" />
                                     <span className="text-sm font-bold text-white">{uiLanguage === 'ar' ? 'انضم للقائمة لفتح التحكم المتقدم' : 'Join Waitlist to unlock Advanced Controls'}</span>
                                </div>
                             </div>
                         )}

                         <h4 className="font-semibold text-slate-200">{t('geminiVoiceSettings', uiLanguage)}</h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className={voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}>
                                <label htmlFor="emotion-select" className="block text-sm font-medium text-slate-300 mb-1">{t('emotionLabel', uiLanguage)}</label>
                                 <select id="emotion-select" value={emotion} onChange={e => setEmotion(e.target.value)} disabled={voiceMode === 'system'} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md disabled:cursor-not-allowed text-white">
                                     <option value="Default">{t('emotionDefault', uiLanguage)}</option>
                                     <option value="Happy">{t('emotionHappy', uiLanguage)}</option>
                                     <option value="Sad">{t('emotionSad', uiLanguage)}</option>
                                     <option value="Formal">{t('emotionFormal', uiLanguage)}</option>
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
                                            className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-md disabled:cursor-not-allowed text-white"
                                        />
                                        <button
                                            onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                                            disabled={voiceMode === 'system'}
                                            title={t('seedTooltip', uiLanguage)}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md text-slate-300 hover:text-white transition-colors disabled:cursor-not-allowed"
                                        >
                                            <SwapIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                             </div>
                         </div>

                        <div className={voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}>
                            <label htmlFor="pause-duration" className="block text-sm font-medium text-slate-300 mb-1">{t('pauseLabel', uiLanguage)}</label>
                            <div className="flex items-center gap-3">
                                 <input id="pause-duration" type="range" min="0" max="5" step="0.1" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} disabled={voiceMode === 'system'} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:cursor-not-allowed" />
                                 <span className="text-cyan-400 font-mono">{pauseDuration.toFixed(1)}{t('seconds', uiLanguage)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative ${voiceMode === 'system' ? 'opacity-40 pointer-events-none' : ''}`}>
                         {voiceMode === 'gemini' && !currentLimits.allowMultiSpeaker && (
                             <div className="absolute inset-0 bg-slate-900/70 rounded-lg z-10 flex items-center justify-center backdrop-blur-[1px] cursor-pointer border border-slate-700" onClick={onUpgrade}>
                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-amber-500/50 shadow-lg hover:bg-slate-700 transition-colors">
                                     <LockIcon className="text-amber-400 w-5 h-5" />
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
                            <input type="checkbox" checked={multiSpeaker} onChange={e => setMultiSpeaker(e.target.checked)} disabled={voiceMode === 'system'} className="form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 disabled:cursor-not-allowed" />
                         </div>
                        
                        {/* QUAD SPEAKER GRID */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${!multiSpeaker || voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}`}>
                             <SpeakerInput index={1} config={speakerA} setConfig={setSpeakerA} />
                             <SpeakerInput index={2} config={speakerB} setConfig={setSpeakerB} />
                             
                             {/* Speaker 3 & 4 (Platinum Locked) */}
                             {speakerC && setSpeakerC && (
                                 <SpeakerInput 
                                    index={3} 
                                    config={speakerC} 
                                    setConfig={setSpeakerC} 
                                    locked={currentLimits.maxSpeakers < 3} 
                                 />
                             )}
                             {speakerD && setSpeakerD && (
                                 <SpeakerInput 
                                    index={4} 
                                    config={speakerD} 
                                    setConfig={setSpeakerD} 
                                    locked={currentLimits.maxSpeakers < 4} 
                                 />
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;