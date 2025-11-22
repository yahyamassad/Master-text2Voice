
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, Language, translationLanguages, translations } from '../i18n/translations';
import { SpeakerConfig, GEMINI_VOICES } from '../types';
import { LoaderIcon, PlayCircleIcon, InfoIcon, SwapIcon, LockIcon, ReplayIcon } from './icons';
import { previewVoice } from '../services/geminiService';
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
  systemVoices: SpeechSynthesisVoice[];
  sourceLang: string;
  targetLang: string;
  currentLimits: any; 
  onUpgrade: () => void;
  onRefreshVoices?: () => void; // New prop
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, 
    pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed,
    multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices, sourceLang, targetLang,
    currentLimits, onUpgrade, onRefreshVoices
}) => {
    const isGeminiVoiceSelected = GEMINI_VOICES.includes(voice);
    const [voiceMode, setVoiceMode] = useState<'gemini' | 'system'>(isGeminiVoiceSelected ? 'gemini' : 'system');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const voicePreviewCache = useRef(new Map<string, Uint8Array>());
    // Keep a reference to an AudioContext to reuse it and bypass autoplay blocks
    const audioContextRef = useRef<AudioContext | null>(null);

    // Force refresh on mount to catch late-loading voices
    useEffect(() => {
        if (onRefreshVoices) {
            onRefreshVoices();
        }
    }, []);

    const relevantSystemVoices = useMemo(() => {
        const sourceLangCode = sourceLang.toLowerCase();
        const targetLangCode = targetLang.toLowerCase();

        const filtered = systemVoices.filter(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            return vLang.startsWith(sourceLangCode) || vLang.startsWith(targetLangCode);
        });

        // 3. If no voices found for specific languages, return ALL voices to avoid empty list
        return filtered.length > 0 ? filtered : systemVoices;
    }, [systemVoices, sourceLang, targetLang]);

    // When switching modes, select the first voice from the new list if the current one doesn't belong.
    useEffect(() => {
        if (voiceMode === 'gemini' && !GEMINI_VOICES.includes(voice)) {
            setVoice(GEMINI_VOICES[0]);
        } else if (voiceMode === 'system' && GEMINI_VOICES.includes(voice)) {
            if (relevantSystemVoices.length > 0) {
                setVoice(relevantSystemVoices[0].name);
            } else if(systemVoices.length > 0) {
                 setVoice(systemVoices[0].name);
            }
        }
    }, [voiceMode, voice, setVoice, systemVoices, relevantSystemVoices]);

    // Cleanup on unmount or close
    useEffect(() => {
        return () => {
             if (audioSourceRef.current) {
                try { 
                    audioSourceRef.current.stop(); 
                    audioSourceRef.current.disconnect();
                } catch (e) { /* ignore */ }
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
             if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);


    const handlePreview = async (voiceName: string) => {
        if (previewingVoice) { // Stop any ongoing preview
            if (audioSourceRef.current) {
                try { 
                    audioSourceRef.current.stop(); 
                    audioSourceRef.current.disconnect();
                } catch (e) { /* ignore */ }
                audioSourceRef.current = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            setPreviewingVoice(null);
            if (previewingVoice === voiceName) return; // If it was a stop request, just stop.
        }

        setPreviewingVoice(voiceName);
        const previewText = t('voicePreviewText', uiLanguage);

        if (GEMINI_VOICES.includes(voiceName)) {
             // Initialize AudioContext immediately on user interaction
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const cacheKey = `${voiceName}-${uiLanguage}`;
            if (voicePreviewCache.current.has(cacheKey)) {
                const pcmData = voicePreviewCache.current.get(cacheKey)!;
                // Use the current speed setting for preview
                audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => {
                    setPreviewingVoice(null);
                    audioSourceRef.current = null;
                }, speed);
                return;
            }

            try {
                const pcmData = await previewVoice(voiceName, previewText, 'Default');
                if (pcmData) {
                    voicePreviewCache.current.set(cacheKey, pcmData); // Cache the result
                    // Use the current speed setting for preview
                    audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => {
                        setPreviewingVoice(null);
                        audioSourceRef.current = null;
                    }, speed);
                } else {
                    console.error("No PCM data returned for preview");
                    setPreviewingVoice(null);
                    // Feedback to user
                    alert(uiLanguage === 'ar' ? 'فشل تحميل معاينة الصوت' : 'Failed to load voice preview');
                }
            } catch (error) {
                console.error("Failed to preview Gemini voice:", error);
                setPreviewingVoice(null);
            }
        } else {
            // System voice preview
            try {
                window.speechSynthesis.cancel(); // Clear queue explicitly
                
                const utterance = new SpeechSynthesisUtterance(previewText);
                const selectedVoice = systemVoices.find(v => v.name === voiceName);
                
                if (selectedVoice) {
                    // Explicitly set the voice object, not just name/lang
                    utterance.voice = selectedVoice;
                    utterance.lang = selectedVoice.lang; 
                }
                // Apply speed to system preview too
                utterance.rate = speed;
                
                nativeUtteranceRef.current = utterance;
                utterance.onend = () => {
                    setPreviewingVoice(null);
                    nativeUtteranceRef.current = null;
                };
                utterance.onerror = (e) => {
                    console.error("System voice preview failed:", e);
                    setPreviewingVoice(null);
                };
                
                // Short delay to ensure cancel takes effect in some browsers
                setTimeout(() => {
                    window.speechSynthesis.speak(utterance);
                }, 10);
                
            } catch (e) {
                console.error("Failed to initiate system voice preview:", e);
                setPreviewingVoice(null);
            }
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
                                {relevantSystemVoices.length > 0 ? (
                                    relevantSystemVoices.map(v => <VoiceListItem key={v.name} voiceName={v.name} label={v.name} sublabel={v.lang} />)
                                ) : (
                                    <div className="text-center p-4 border border-slate-700 rounded-lg bg-slate-900/30 flex flex-col items-center gap-3">
                                        <p className="text-sm text-slate-400">{t('noRelevantSystemVoices', uiLanguage)}</p>
                                        {onRefreshVoices && (
                                            <button 
                                                onClick={onRefreshVoices}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded-full text-xs font-bold flex items-center gap-2 transition-colors"
                                            >
                                                <ReplayIcon className="w-4 h-4" />
                                                {uiLanguage === 'ar' ? 'تحديث القائمة' : 'Refresh Voices'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity relative ${voiceMode === 'system' ? 'opacity-40 pointer-events-none' : ''}`}>
                         {/* Lock Overlay for Effects if not allowed */}
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
                             
                             {/* Seed Control */}
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
                         {/* Lock Overlay for MultiSpeaker if not allowed */}
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
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${!multiSpeaker || voiceMode === 'system' ? 'opacity-50 pointer-events-none' : ''}`}>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 1</label>
                                 <input type="text" value={speakerA.name} onChange={e => setSpeakerA({...speakerA, name: e.target.value})} placeholder={t('speaker1', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 1</label>
                                 <select value={speakerA.voice} onChange={e => setSpeakerA({...speakerA, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                     {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 2</label>
                                 <input type="text" value={speakerB.name} onChange={e => setSpeakerB({...speakerB, name: e.target.value})} placeholder={t('speaker2', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 2</label>
                                 <select value={speakerB.voice} onChange={e => setSpeakerB({...speakerB, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white">
                                    {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
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
