// ... (imports remain the same) ...
import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy, ReactElement } from 'react';
import { generateSpeech, translateText, previewVoice, addDiacritics } from './services/geminiService';
import { generateStandardSpeech, generateMultiSpeakerStandardSpeech } from './services/standardVoiceService';
import { getFallbackVoice } from './services/fallbackService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon, ReportIcon, PauseIcon, VideoCameraIcon, StarIcon, LockIcon, SparklesIcon, TrashIcon, WandIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, translations } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig, GEMINI_VOICES, MICROSOFT_AZURE_VOICES, PLAN_LIMITS, UserTier, UserStats } from './types';
import firebase, { getFirebase } from './firebaseConfig';

type User = firebase.User;

import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument, addToWaitlist, deleteHistoryItem } from './services/firestoreService';
import { AudioStudioModal } from './components/AudioStudioModal'; 
import SettingsModal from './components/SettingsModal';
import TutorialModal from './components/TutorialModal';
import UpgradeModal from './components/UpgradeModal';
import GamificationModal from './components/GamificationModal';
import OwnerSetupGuide from './components/OwnerSetupGuide';
import PrivacyModal from './components/PrivacyModal';

// ... (Lazy imports & Sound Effects array remain same) ...
const Feedback = lazy(() => import('./components/Feedback'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const ReportModal = lazy(() => import('./components/ReportModal'));

const soundEffects = [
    { emoji: '😂', tag: '[laugh]', labelKey: 'addLaugh' },
    { emoji: '🤣', tag: '[laughter]', labelKey: 'addLaughter' },
    { emoji: '😮‍💨', tag: '[sigh]', labelKey: 'addSigh' },
    { emoji: '😭', tag: '[sob]', labelKey: 'addSob' },
    { emoji: '😱', tag: '[gasp]', labelKey: 'addGasp' },
    { emoji: '🤧', tag: '[cough]', labelKey: 'addCough' },
    { emoji: '🤔', tag: '[hmm]', labelKey: 'addHmm' },
    { emoji: '🎉', tag: '[cheer]', labelKey: 'addCheer' },
    { emoji: '😘', tag: '[kiss]', labelKey: 'addKiss' },
];

const getInitialLanguage = (): Language => {
    try {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang && languageOptions.some(l => l.value === urlLang)) {
            return urlLang as Language;
        }
        const savedSettings = localStorage.getItem('sawtli_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.uiLanguage && languageOptions.some(l => l.value === settings.uiLanguage)) {
                return settings.uiLanguage;
            }
        }
        const browserLang = navigator.language.split('-')[0];
        if (['ar', 'fr', 'es', 'pt'].includes(browserLang)) return browserLang as Language;
    } catch (e) { }
    return 'en';
};

interface ToastMsg {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const ToastContainer: React.FC<{ toasts: ToastMsg[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-2xl text-sm font-bold flex items-center gap-3 animate-fade-in-down border ${
                        toast.type === 'success' ? 'bg-slate-900/90 text-green-400 border-green-500/30' : 
                        toast.type === 'error' ? 'bg-slate-900/90 text-red-400 border-red-500/30' : 
                        'bg-slate-900/90 text-cyan-400 border-cyan-500/30'
                    }`}
                    onClick={() => removeToast(toast.id)}
                >
                    {toast.type === 'success' && <CheckIcon className="w-4 h-4"/>}
                    {toast.type === 'error' && <WarningIcon className="w-4 h-4"/>}
                    {toast.type === 'info' && <InfoIcon className="w-4 h-4"/>}
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

// --- QUOTA INDICATOR (Compact for Inside Panel) ---
const QuotaIndicator: React.FC<{
    stats: UserStats;
    tier: UserTier;
    limits: typeof PLAN_LIMITS['free'];
    uiLanguage: Language;
    onUpgrade: () => void;
    onBoost: () => void;
}> = ({ stats, tier, limits, uiLanguage, onUpgrade, onBoost }) => {
    if (tier === 'admin') return null;
    
    // VISITOR BAR (Integrated Look)
    if (tier === 'visitor') {
        const percent = Math.min(100, (stats.dailyCharsUsed / limits.dailyLimit) * 100);
        return (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-cyan-500/70 uppercase tracking-wider">{t('visitorMode', uiLanguage)}</span>
                    <button onClick={onUpgrade} className="text-amber-500 hover:text-amber-400 hover:underline">
                        {t('registerForMore', uiLanguage)}
                    </button>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }}></div>
                </div>
                <div className="text-[9px] text-right text-slate-500 mt-0.5 font-mono">
                    {stats.dailyCharsUsed} / {limits.dailyLimit}
                </div>
            </div>
        );
    }

    // ONEDOLLAR & OTHERS
    const dailyUsed = stats.dailyCharsUsed;
    const dailyLimit = limits.dailyLimit;
    const dailyPercent = dailyLimit === Infinity ? 0 : Math.min(100, (dailyUsed / dailyLimit) * 100);
    const isDailyLimitReached = dailyUsed >= dailyLimit;

    if (dailyLimit === Infinity) return null; // Don't show for unlimited plans here

    return (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className={isDailyLimitReached ? 'text-red-500' : 'text-cyan-500'}>
                    {t('dailyUsageLabel', uiLanguage)}
                </span>
                {isDailyLimitReached && (
                    <button onClick={onBoost} className="text-amber-500 hover:text-amber-400 hover:underline">
                        {t('boostQuota', uiLanguage)}
                    </button>
                )}
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${isDailyLimitReached ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${dailyPercent}%` }}></div>
            </div>
             <div className="text-[9px] text-right text-slate-500 mt-0.5 font-mono">
                {dailyUsed} / {dailyLimit}
            </div>
        </div>
    );
};

// ... (LanguageSelect, ActionButton, ActionCard, DownloadModal - unchanged) ...
// [Assume standard components are here]

const LanguageSelect: React.FC<{ value: string; onChange: (value: string) => void; uiLanguage: Language; }> = ({ value, onChange, uiLanguage }) => {
    const isValidCode = translationLanguages.some(l => l.code === value);
    const safeValue = isValidCode ? value : 'ar';
    const getTranslatedName = (code: string) => t(`lang_${code}` as any, uiLanguage);
    return (
        <div className="relative group min-w-[100px] flex-shrink-0">
            <div className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl hover:border-cyan-500/50 transition-colors cursor-pointer w-full shadow-sm text-center">
                <span className="text-white font-bold text-sm tracking-widest uppercase flex-1 text-center w-full block">
                    {getTranslatedName(safeValue)}
                </span>
                <ChevronDownIcon className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors absolute right-2" />
            </div>
            <select 
                value={safeValue} 
                onChange={(e) => onChange(e.target.value)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none text-center"
            >
                {translationLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-slate-800 text-white font-bold py-2 text-center">{getTranslatedName(lang.code)}</option>
                ))}
            </select>
        </div>
    );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; className?: string; }> = ({ icon, label, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={`h-16 px-6 flex items-center justify-center gap-3 font-bold rounded-xl text-lg text-white tracking-wide uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:filter-none border-2 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${className}`}>
        {icon} <span className="drop-shadow-md">{label}</span>
    </button>
);

const ActionCard: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; highlight?: boolean; }> = ({ icon, label, onClick, disabled, highlight }) => (
    <button onClick={onClick} disabled={disabled} className={`rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-slate-800/50 border border-cyan-500/50 text-cyan-500/80 hover:border-cyan-400 hover:text-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:scale-105 transition-all duration-300 group`}>
        <div className={`transform transition-transform duration-200 group-hover:-translate-y-1 ${highlight ? 'text-cyan-400' : 'text-slate-300 group-hover:text-cyan-400'}`}>
             {React.cloneElement(icon as ReactElement<any>, { className: 'w-8 h-8 sm:w-10 sm:h-10' })}
        </div>
        <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-400 group-hover:text-white transition-colors`}>{label}</span>
    </button>
);

const DownloadModal: React.FC<{ onClose: () => void; onDownload: (format: 'wav' | 'mp3') => void; uiLanguage: Language; isLoading: boolean; onCancel: () => void; allowWav: boolean; onUpgrade: () => void; }> = ({ onClose, onDownload, uiLanguage, isLoading, onCancel, allowWav, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2"><DownloadIcon className="text-cyan-400"/> {t('downloadPanelTitle', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onDownload('mp3')} disabled={isLoading} className="btn-tactile flex flex-col items-center justify-center gap-3 p-6 rounded-xl group h-32 hover:bg-slate-700">
                            <span className="text-4xl font-black text-white group-hover:text-cyan-300 transition-colors">MP3</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standard</span>
                        </button>
                        <button onClick={() => allowWav ? onDownload('wav') : onUpgrade()} disabled={isLoading} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl relative overflow-hidden border h-32 group transition-all ${allowWav ? 'bg-slate-700 border-slate-600 hover:border-cyan-500/50 hover:bg-slate-600' : 'bg-slate-800 border-slate-700 opacity-60'}`}>
                             {!allowWav && <div className="absolute top-2 right-2 bg-amber-500/20 p-1.5 rounded-md"><LockIcon className="text-amber-500 w-4 h-4"/></div>}
                            <span className={`text-4xl font-black ${allowWav ? 'text-white group-hover:text-cyan-300' : 'text-slate-500'}`}>WAV</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lossless {allowWav ? '' : '(Pro)'}</span>
                        </button>
                     </div>
                     {isLoading && (
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 text-cyan-400">
                            <LoaderIcon className="w-10 h-10"/>
                            <span className="animate-pulse text-sm font-bold uppercase tracking-widest">{t('encoding', uiLanguage)}...</span>
                             <button onClick={onCancel} className="mt-2 text-xs font-bold text-red-400 hover:text-white underline decoration-red-500/50">{t('stopSpeaking', uiLanguage)}</button>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
  // ... (State Management remains same) ...
  const [uiLanguage, setUiLanguage] = useState<Language>(getInitialLanguage);
  // ... (Other states truncated for brevity, assume they exist) ...
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>(uiLanguage);
  const [targetLang, setTargetLang] = useState<string>(uiLanguage === 'ar' ? 'en' : 'ar');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTask, setLoadingTask] = useState<string>('');
  const [activePlayer, setActivePlayer] = useState<'source' | 'target' | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(true);
  const [userSubscription, setUserSubscription] = useState<UserTier>('free');
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [localTier, setLocalTier] = useState<UserTier | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ trialStartDate: Date.now(), totalCharsUsed: 0, dailyCharsUsed: 0, lastUsageDate: new Date().toISOString().split('T')[0], hasRated: false, hasShared: false, invitedCount: 0, bonusChars: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [voice, setVoice] = useState('Puck');
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'Kore' });
  const [speakerC, setSpeakerC] = useState<SpeakerConfig>({ name: 'Haya', voice: 'Zephyr' });
  const [speakerD, setSpeakerD] = useState<SpeakerConfig>({ name: 'Rana', voice: 'Fenrir' });
  const [systemVoices, setSystemVoices] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [lastGeneratedPCM, setLastGeneratedPCM] = useState<Uint8Array | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Refs
  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const sourceTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const effectsDropdownRef = useRef<HTMLDivElement>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  const audioCacheRef = useRef<Map<string, Uint8Array>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackOffsetRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // ... (All Effects, Helpers, Handlers from previous App.tsx - Keep same logic) ...
  // [Assumed existing logic for auth, history, audio gen, etc.]
  
  useEffect(() => { setSourceLang(uiLanguage); setTargetLang(uiLanguage === 'ar' ? 'en' : 'ar'); }, [uiLanguage]);
  useEffect(() => { /* Auth Logic */ }, []); 
  useEffect(() => { /* Limits Logic */ }, []);
  
  const userTier: UserTier = isDevMode ? 'admin' : (localTier ? localTier : (user ? userSubscription : 'visitor'));
  const planConfig = PLAN_LIMITS[userTier];

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  }, []);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ... (Handlers: handleSpeak, handleTranslate, stopAll, etc.) ...
  // [Truncated for brevity]
  const stopAll = useCallback(() => { /* ... */ }, []);
  const handleSpeak = async (text: string, target: 'source' | 'target') => { /* ... */ };
  const handleTranslate = async () => { /* ... */ };
  const handleTashkeel = async () => { /* ... */ };
  const handleToggleListening = () => { /* ... */ };
  const swapLanguages = () => { setSourceLang(targetLang); setTargetLang(sourceLang); setSourceText(translatedText); setTranslatedText(sourceText); };
  const handleHistoryLoad = useCallback((item: HistoryItem) => { /* ... */ }, []);
  const handleCopy = (text: string, type: 'source' | 'target') => { /* ... */ };
  const handleShareLink = () => { /* ... */ };
  const handleDownload = useCallback(async (format: 'wav' | 'mp3') => { /* ... */ }, []);
  const handleInsertTag = (tag: string) => { /* ... */ };
  const handleAudioStudioOpen = () => { stopAll(); setIsAudioStudioOpen(true); };
  const handleSignIn = async () => { /* ... */ };
  const handleSignOutAndClose = async () => { /* ... */ };
  const handleClearHistory = async () => { /* ... */ };
  const handleDeleteHistoryItem = async (id: string) => { /* ... */ };
  const handleDeleteAccount = async () => { /* ... */ };
  const handleUpgrade = async (tier: 'gold' | 'platinum') => { /* ... */ return true; };
  const handleSetDevMode = (enabled: boolean) => { setIsDevMode(enabled); };
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setSourceText(e.target.value); };
  const handleClearAll = () => { setSourceText(''); setTranslatedText(''); };
  const handleBoost = (type: any) => { /* ... */ };
  const handleRedeemPlan = (plan: any) => { /* ... */ };

  const updateUserStats = useCallback((cost: number) => {
      setUserStats(prev => ({
          ...prev,
          totalCharsUsed: prev.totalCharsUsed + cost,
          dailyCharsUsed: prev.dailyCharsUsed + cost,
          lastUsageDate: new Date().toISOString().split('T')[0]
      }));
  }, []);

  // --- UI PARTIALS ---
  const sourceTextArea = (
        <div className="flex-1 relative group flex flex-col h-full">
            <div className={`flex items-center mb-3 justify-between`}>
                <div className="flex items-center gap-2">
                    <LanguageSelect value={sourceLang} onChange={setSourceLang} uiLanguage={uiLanguage} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsEffectsOpen(!isEffectsOpen)} className="h-10 px-3 bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 flex items-center gap-2 text-xs font-bold" title={t('soundEffects', uiLanguage)}>
                        <SparklesIcon className="w-4 h-4" /> <span>{t('soundEffects', uiLanguage)}</span>
                    </button>
                    {isEffectsOpen && (
                        <div className="absolute top-10 left-0 z-50 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-2 grid grid-cols-3 gap-1 animate-fade-in" ref={effectsDropdownRef}>
                            {soundEffects.map(effect => (
                                <button key={effect.tag} onClick={() => handleInsertTag(effect.tag)} className="p-2 hover:bg-slate-700 rounded text-xl flex justify-center items-center" title={t(effect.labelKey as any, uiLanguage)}>
                                    {effect.emoji}
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={handleTashkeel} disabled={isEnhancing} className={`h-10 px-3 rounded-lg transition-colors flex items-center gap-2 ${sourceLang.startsWith('ar') ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700' : 'hidden'}`} title={t('tashkeel', uiLanguage)}>
                        {isEnhancing ? <LoaderIcon className="w-4 h-4"/> : <WandIcon className="w-4 h-4" />} <span className="font-bold text-xs">{t('tashkeel', uiLanguage)}</span>
                    </button>
                    <button onClick={() => handleCopy(sourceText, 'source')} className="p-2 text-slate-400 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                        {copiedSource ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <textarea
                ref={sourceTextAreaRef}
                value={sourceText}
                onChange={handleSourceChange}
                placeholder={t('placeholder', uiLanguage)}
                className={`w-full h-48 sm:h-64 p-4 rounded-2xl bg-slate-900/50 border-2 border-slate-700 focus:border-cyan-500 focus:ring-0 text-lg sm:text-xl resize-none transition-all placeholder-slate-600 shadow-inner ${sourceLang === 'ar' ? 'text-right' : 'text-left'}`}
                dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
            />
            {/* --- VISITOR BAR MOVED HERE --- */}
            <QuotaIndicator 
                stats={userStats} 
                tier={userTier} 
                limits={planConfig} 
                uiLanguage={uiLanguage} 
                onUpgrade={() => setIsUpgradeOpen(true)}
                onBoost={() => setIsGamificationOpen(true)}
            />
        </div>
    );

    const swapButton = (
        <div className="flex flex-col items-center justify-center gap-4 md:pt-12">
            <button onClick={handleClearAll} className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800/50" title={t('clearAll', uiLanguage)}>
                <TrashIcon className="w-5 h-5" />
            </button>
            <button onClick={swapLanguages} className="p-3 bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:border-cyan-500 transition-all shadow-lg active:scale-90 group" title={t('swapLanguages', uiLanguage)}>
                <SwapIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
            </button>
        </div>
    );

    const translatedTextArea = (
        <div className="flex-1 relative group flex flex-col h-full">
            <div className={`flex items-center mb-3 justify-between`}>
                <button onClick={() => handleCopy(translatedText, 'target')} className="p-2 text-slate-400 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                    {copiedTarget ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-2">
                    <LanguageSelect value={targetLang} onChange={setTargetLang} uiLanguage={uiLanguage} />
                </div>
            </div>
            <div 
                className={`w-full h-48 sm:h-64 p-4 rounded-2xl bg-slate-900/50 border-2 border-slate-700 text-lg sm:text-xl overflow-y-auto transition-all shadow-inner ${!translatedText ? 'text-slate-600 flex items-start' : 'text-cyan-100'} ${targetLang === 'ar' ? 'text-right' : 'text-left'}`} 
                dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
            >
                {translatedText || t('translationPlaceholder', uiLanguage)}
            </div>
            <div className="flex justify-end mt-2 text-xs font-bold text-slate-500">
                <span>{translatedText.length} chars</span>
            </div>
        </div>
    );

    const getButtonState = (target: 'source' | 'target') => {
        const isActive = activePlayer === target;
        const isPausedState = isActive && isPaused;
        const isLoadingState = isLoading && activePlayer === target;
        
        let labelKey = target === 'source' ? 'speakSource' : 'speakTarget';
        let label = t(labelKey as any, uiLanguage);

        let icon = <SpeakerIcon className="w-6 h-6" />;
        let className = "bg-slate-800 border-2 border-slate-600 hover:border-cyan-500 text-cyan-500 hover:text-white shadow-lg";

        if (isLoadingState) {
            icon = <LoaderIcon className="w-6 h-6" />;
            label = t('generatingSpeech', uiLanguage); 
            className = "bg-slate-700 border-slate-600 text-slate-400 cursor-wait";
        } else if (isActive) {
            if (isPausedState) {
                icon = <PlayCircleIcon className="w-6 h-6" />;
                label = t('resumeSpeaking', uiLanguage);
                className = "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white animate-pulse";
            } else {
                icon = <PauseIcon className="w-6 h-6" />;
                label = t('pauseSpeaking', uiLanguage);
                className = "bg-slate-700 hover:bg-slate-600 border-slate-500 text-white";
            }
        }
        return { icon, label, className };
    };

    const sourceButtonState = getButtonState('source');
    const targetButtonState = getButtonState('target');

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-6 relative overflow-hidden bg-[#0f172a] text-slate-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-2rem)] z-10 relative">
        <header className="flex items-center justify-between w-full my-6 py-4 px-4 sm:px-8 relative z-40 mt-12">
                 <div className="flex justify-start w-1/3">
                    <div className="relative group">
                        <button className="border border-cyan-500/50 text-cyan-500 px-6 sm:px-8 py-3 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-400 uppercase text-base sm:text-lg font-bold tracking-widest transition-all flex items-center gap-2">
                            <span className="hidden sm:inline">{t(`lang_${uiLanguage}` as any, uiLanguage) || 'ENGLISH'}</span>
                            <span className="sm:hidden">{uiLanguage.toUpperCase()}</span>
                            <ChevronDownIcon className="w-3 h-3" />
                        </button>
                         <select value={uiLanguage} onChange={e => setUiLanguage(e.target.value as Language)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer bg-slate-900 text-white">
                            {languageOptions.map(lang => (
                                <option key={lang.value} value={lang.value} className="bg-slate-900 text-white">{lang.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center w-1/3">
                     <SawtliLogoIcon className="w-auto h-16 sm:h-24" />
                </div>

                <div className="flex justify-end w-1/3">
                    {isAuthLoading ? (
                        <div className="w-8 h-8 bg-slate-800 rounded-full animate-pulse"></div>
                    ) : user ? (
                        <button onClick={() => setIsAccountOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-cyan-400 hover:bg-slate-750 transition-all group">
                            <img src={user.photoURL || undefined} alt="User" className="w-8 h-8 rounded-full ring-1 ring-slate-500 group-hover:ring-cyan-400 transition-all" />
                        </button>
                    ) : (
                        <button onClick={handleSignIn} disabled={isAuthLoading} className="border border-cyan-500/50 text-cyan-500 px-4 sm:px-6 py-2 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-400 uppercase text-xs sm:text-sm font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {isAuthLoading && <LoaderIcon className="w-4 h-4" />}
                            {uiLanguage === 'ar' ? 'دخول' : 'SIGN IN'}
                        </button>
                    )}
                </div>
        </header>

        <main className="w-full space-y-6 flex-grow">
            {showSetupGuide && <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 mb-6 z-50 relative"><OwnerSetupGuide uiLanguage={uiLanguage} isApiConfigured={isApiConfigured} isFirebaseConfigured={!!getFirebase().app} /></div>}

            <div className="glass-panel rounded-3xl p-5 md:p-8 space-y-6 relative bg-[#1e293b]/80 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)] border-2 border-cyan-500/50">
                {error && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{error}</p></div>}
                {micError && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{micError}</p></div>}
                <div className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 relative">
                     <div className="flex-1 w-full flex items-center justify-end gap-2 max-w-xs">
                        <ActionButton icon={sourceButtonState.icon} onClick={() => handleSpeak(sourceText, 'source')} label={sourceButtonState.label} className={`w-full ${sourceButtonState.className}`} />
                        {(activePlayer === 'source') && <button onClick={stopAll} className="h-16 w-16 bg-slate-800 hover:bg-rose-900/20 border-2 border-rose-500 text-rose-500 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 animate-fade-in group hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]" title={t('stopSpeaking', uiLanguage)}><StopIcon className="w-8 h-8 group-hover:scale-110 transition-transform" /></button>}
                     </div>
                    <button onClick={handleToggleListening} title={isListening ? t('stopListening', uiLanguage) : t('voiceInput', uiLanguage)} className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 transition-all shadow-xl z-20 active:scale-95 ${isListening ? 'bg-red-900/30 border-red-500 text-red-500 animate-pulse' : 'bg-slate-800 border-cyan-500/50 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'}`}><MicrophoneIcon className="h-8 w-8" /></button>
                    <div className="flex-1 w-full flex items-center justify-start gap-2 max-w-xs">
                        <ActionButton icon={targetButtonState.icon} onClick={() => handleSpeak(translatedText, 'target')} label={targetButtonState.label} disabled={!translatedText.trim()} className={`w-full ${targetButtonState.className}`} />
                        {(activePlayer === 'target') && <button onClick={stopAll} className="h-16 w-16 bg-slate-800 hover:bg-rose-900/20 border-2 border-rose-500 text-rose-500 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 animate-fade-in group hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]" title={t('stopSpeaking', uiLanguage)}><StopIcon className="w-8 h-8 group-hover:scale-110 transition-transform" /></button>}
                    </div>
                </div>
            </div>

             <div className="flex justify-center -mt-10 z-30 relative pointer-events-none">
                <div className="pointer-events-auto">
                     <button onClick={handleTranslate} disabled={isLoading} className="group relative px-12 py-4 rounded-2xl font-bold text-lg tracking-wider uppercase text-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-80 shadow-2xl overflow-hidden bg-slate-700 hover:text-white border-2 border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-3">
                             {isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage)) ? <LoaderIcon className="w-6 h-6"/> : <TranslateIcon className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />}
                             <span>{isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage)) ? loadingTask : t('translateButton', uiLanguage)}</span>
                        </div>
                     </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pb-4">
                <ActionCard icon={<GearIcon className="w-10 h-10" />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
                <ActionCard icon={<HistoryIcon className="w-10 h-10" />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
                <ActionCard icon={linkCopied ? <CheckIcon className="text-green-400 w-10 h-10"/> : <LinkIcon className="w-10 h-10" />} label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} onClick={handleShareLink} />
                <ActionCard icon={<DownloadIcon className="w-10 h-10" />} label={t('downloadButton', uiLanguage)} onClick={() => setIsDownloadOpen(true)} disabled={isLoading || (!sourceText && !translatedText) } />
                <ActionCard icon={<SoundEnhanceIcon className="text-cyan-400 w-10 h-10" />} label={t('audioStudio', uiLanguage)} onClick={handleAudioStudioOpen} disabled={false} highlight={false} />
                <ActionCard icon={<VideoCameraIcon className="w-10 h-10" />} label={t('tutorialButton', uiLanguage)} onClick={() => setIsTutorialOpen(true)} />
            </div>
            
            <Suspense fallback={null}>
                <Feedback language={uiLanguage} onOpenReport={() => setIsReportOpen(true)} />
            </Suspense>
            
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </main>
        <footer className="w-full pt-4 pb-2 text-center text-slate-500 text-[10px] font-bold border-t border-slate-800 tracking-widest uppercase flex flex-col gap-1">
             <p>© 2025 Sawtli. All rights reserved.</p>
             <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-300 transition-colors underline decoration-slate-700">{uiLanguage === 'ar' ? 'الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms'}</button>
        </footer>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} 
        voice={voice} setVoice={setVoice} 
        emotion={emotion} setEmotion={setEmotion} 
        pauseDuration={pauseDuration} setPauseDuration={setPauseDuration} 
        speed={speed} setSpeed={setSpeed} 
        seed={seed} setSeed={setSeed} 
        multiSpeaker={multiSpeaker} setMultiSpeaker={setMultiSpeaker} 
        speakerA={speakerA} setSpeakerA={setSpeakerA} 
        speakerB={speakerB} setSpeakerB={setSpeakerB} 
        speakerC={speakerC} setSpeakerC={setSpeakerC} 
        speakerD={speakerD} setSpeakerD={setSpeakerD} 
        systemVoices={MICROSOFT_AZURE_VOICES as any} 
        sourceLang={sourceLang} targetLang={targetLang}
        currentLimits={planConfig} 
        onUpgrade={() => {setIsSettingsOpen(false); setIsUpgradeOpen(true);}} 
        onRefreshVoices={() => {}}
        onConsumeQuota={(cost) => updateUserStats(cost)}
        userTier={userTier} 
      />}
      
      {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onDelete={handleDeleteHistoryItem} onLoad={handleHistoryLoad}/>}
      {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} allowWav={planConfig.allowWav} onUpgrade={() => setIsUpgradeOpen(true)} />}
      
      <AudioStudioModal isOpen={isAudioStudioOpen} onClose={() => setIsAudioStudioOpen(false)} uiLanguage={uiLanguage} voice={voice} sourceAudioPCM={lastGeneratedPCM} allowDownloads={planConfig.allowDownloads} allowStudio={planConfig.allowStudio} userTier={userTier} onUpgrade={() => setIsUpgradeOpen(true)} />
      {isTutorialOpen && <TutorialModal onClose={() => setIsTutorialOpen(false)} uiLanguage={uiLanguage} />}
      {isUpgradeOpen && <UpgradeModal onClose={() => setIsUpgradeOpen(false)} uiLanguage={uiLanguage} currentTier={userTier} onUpgrade={handleUpgrade} onSignIn={() => { setIsUpgradeOpen(false); handleSignIn(); }} />}
      {isGamificationOpen && <GamificationModal onClose={() => setIsGamificationOpen(false)} uiLanguage={uiLanguage} userStats={userStats} onBoost={handleBoost} />}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} uiLanguage={uiLanguage} />}

      <Suspense fallback={null}>
          {isAccountOpen && <AccountModal onClose={() => setIsAccountOpen(false)} uiLanguage={uiLanguage} user={user} onSignOut={handleSignOutAndClose} onClearHistory={handleClearHistory} onDeleteAccount={handleDeleteAccount} currentTier={userTier} userStats={userStats} limits={planConfig} onUpgrade={() => { setIsAccountOpen(false); setIsUpgradeOpen(true); }} onSetDevMode={handleSetDevMode} onRedeemPlan={handleRedeemPlan} onOpenOwnerGuide={() => { setIsAccountOpen(false); setShowSetupGuide(true); }} />}
          {isReportOpen && <ReportModal onClose={() => setIsReportOpen(false)} uiLanguage={uiLanguage} user={user} />}
      </Suspense>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;