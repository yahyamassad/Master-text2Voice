
import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy, ReactElement } from 'react';
import { generateSpeech, translateText, previewVoice, addDiacritics } from './services/geminiService';
import { generateStandardSpeech, generateMultiSpeakerStandardSpeech } from './services/standardVoiceService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon, ReportIcon, PauseIcon, VideoCameraIcon, StarIcon, LockIcon, SparklesIcon, TrashIcon, WandIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, translations } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig, GEMINI_VOICES, GOOGLE_STUDIO_VOICES, PLAN_LIMITS, UserTier, UserStats } from './types';
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
        const savedSettings = localStorage.getItem('sawtli_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.uiLanguage && languageOptions.some(l => l.value === settings.uiLanguage)) {
                return settings.uiLanguage;
            }
        }
        
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'ar') return 'ar';
        if (browserLang === 'fr') return 'fr';
        if (browserLang === 'es') return 'es';
        if (browserLang === 'pt') return 'pt';
        
    } catch (e) {
        // Ignore errors and fall back to default
    }
    return 'en'; // Default to English
};

// --- TOAST NOTIFICATION SYSTEM ---
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

const QuotaIndicator: React.FC<{
    stats: UserStats;
    tier: UserTier;
    limits: typeof PLAN_LIMITS['free'];
    uiLanguage: Language;
    onUpgrade: () => void;
    onBoost: () => void;
}> = ({ stats, tier, limits, uiLanguage, onUpgrade, onBoost }) => {
    if (tier === 'admin' || tier === 'gold' || tier === 'platinum') return null;
    
    if (tier === 'visitor') {
        return (
            <div className="w-full h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-4 text-xs font-mono font-bold tracking-widest text-slate-500 select-none relative overflow-hidden rounded-b-2xl">
                 <span className="text-cyan-500/70">VISITOR MODE</span>
                 <span className="text-amber-500 cursor-pointer hover:underline" onClick={onUpgrade}>
                     {uiLanguage === 'ar' ? 'سجل للحصول على 5000 حرف' : 'Sign In for 5000 chars'}
                 </span>
            </div>
        );
    }

    const dailyUsed = stats.dailyCharsUsed;
    const dailyLimit = limits.dailyLimit;
    const dailyPercent = dailyLimit === Infinity ? 0 : Math.min(100, (dailyUsed / dailyLimit) * 100);
    const isDailyLimitReached = dailyUsed >= dailyLimit;

    return (
        <div className="w-full h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-4 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-500 select-none relative overflow-hidden rounded-b-2xl">
            <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-500 ${isDailyLimitReached ? 'bg-red-500' : 'bg-cyan-500'}`} 
                style={{ width: `${dailyPercent}%` }}>
            </div>
            
            <div className="flex items-center gap-3 z-10">
                <span className={isDailyLimitReached ? 'text-red-500' : 'text-cyan-500'}>
                    {t('dailyUsageLabel', uiLanguage)}: {dailyUsed} / {dailyLimit}
                </span>
                {isDailyLimitReached && (
                    <button 
                    onClick={onBoost} 
                    className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] animate-pulse hover:bg-amber-500"
                    >
                        {t('boostQuota', uiLanguage)}
                    </button>
                )}
            </div>
        </div>
    );
};

// UI Helpers
const ActionButton: React.FC<{ icon: React.ReactNode, onClick: () => void, label: string, disabled?: boolean, className?: string }> = ({ icon, onClick, label, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${className}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean, highlight?: boolean }> = ({ icon, label, onClick, disabled, highlight }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-95 h-32 ${highlight ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-slate-500'} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
    >
        {icon}
        <span className="text-xs font-bold text-slate-300 text-center uppercase tracking-wide">{label}</span>
    </button>
);

const DownloadModal: React.FC<{ onClose: () => void, onDownload: (format: 'mp3' | 'wav') => void, uiLanguage: Language, isLoading: boolean, onCancel: () => void, allowWav: boolean, onUpgrade: () => void }> = ({ onClose, onDownload, uiLanguage, isLoading, onCancel, allowWav, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">{t('downloadPanelTitle', uiLanguage)}</h3>
                
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <LoaderIcon className="w-10 h-10 text-cyan-400" />
                        <p className="text-slate-300">{t('encoding', uiLanguage)}</p>
                        <button onClick={onCancel} className="text-red-400 text-sm hover:underline">{t('closeButton', uiLanguage)}</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button onClick={() => onDownload('mp3')} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white flex items-center justify-between px-4 transition-colors group">
                            <span>MP3</span>
                            <span className="text-xs text-slate-400 group-hover:text-white">Standard</span>
                        </button>
                        <button onClick={() => { if(allowWav) onDownload('wav'); else onUpgrade(); }} className={`w-full py-3 rounded-lg font-bold flex items-center justify-between px-4 transition-colors group ${allowWav ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'}`}>
                            <span>WAV</span>
                            <div className="flex items-center gap-2">
                                {!allowWav && <LockIcon className="w-3 h-3" />}
                                <span className={`text-xs ${allowWav ? 'text-cyan-200' : 'text-slate-600'}`}>HD Studio</span>
                            </div>
                        </button>
                        <button onClick={onClose} className="w-full py-2 text-slate-400 hover:text-white text-sm mt-2">{t('closeButton', uiLanguage)}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>(getInitialLanguage);
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>(uiLanguage);
  const [targetLang, setTargetLang] = useState<string>(uiLanguage === 'ar' ? 'en' : 'ar');
  
  useEffect(() => {
      setSourceLang(uiLanguage);
      setTargetLang(uiLanguage === 'ar' ? 'en' : 'ar');
  }, [uiLanguage]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTask, setLoadingTask] = useState<string>('');
  const [activePlayer, setActivePlayer] = useState<'source' | 'target' | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(true); 
  const [userSubscription, setUserSubscription] = useState<'free' | 'gold' | 'platinum'>('free');
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('setup') === 'true') {
          setShowSetupGuide(true);
      }
  }, []);

  const [userStats, setUserStats] = useState<UserStats>({
      trialStartDate: Date.now(),
      totalCharsUsed: 0,
      dailyCharsUsed: 0,
      lastUsageDate: new Date().toISOString().split('T')[0],
      hasRated: false,
      hasShared: false,
      invitedCount: 0,
      bonusChars: 0
  });

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

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
  }, []);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const userTier: UserTier = isDevMode ? 'admin' : (user ? userSubscription : 'visitor');
  const planConfig = PLAN_LIMITS[userTier];
  
  const currentDailyLimit = planConfig.dailyLimit;
  const effectiveTotalLimit = planConfig.totalTrialLimit + userStats.bonusChars;
  const daysSinceStart = Math.floor((Date.now() - userStats.trialStartDate) / (1000 * 60 * 60 * 24));
  const isTrialExpired = userTier === 'free' && daysSinceStart > planConfig.trialDays;
  const dailyCharsRemaining = Math.max(0, currentDailyLimit - userStats.dailyCharsUsed);
  const isDailyLimitReached = userTier !== 'admin' && userStats.dailyCharsUsed >= currentDailyLimit;
  const isTotalLimitReached = userTier !== 'admin' && userStats.totalCharsUsed >= effectiveTotalLimit;
  
  const loadUserStats = (userId: string) => {
      const key = `sawtli_stats_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
          const parsed = JSON.parse(stored);
          const today = new Date().toISOString().split('T')[0];
          if (parsed.lastUsageDate !== today) {
              parsed.dailyCharsUsed = 0;
              parsed.lastUsageDate = today;
              localStorage.setItem(key, JSON.stringify(parsed));
          }
          setUserStats(parsed);
      } else {
          const newStats: UserStats = {
              trialStartDate: Date.now(),
              totalCharsUsed: 0,
              dailyCharsUsed: 0,
              lastUsageDate: new Date().toISOString().split('T')[0],
              hasRated: false,
              hasShared: false,
              invitedCount: 0,
              bonusChars: 0
          };
          localStorage.setItem(key, JSON.stringify(newStats));
          setUserStats(newStats);
      }
  };

  const updateUserStats = (charsConsumed: number) => {
      if (userTier === 'admin' || userTier === 'visitor') return; 
      if (!user) return;

      setUserStats(prev => {
          const newStats = {
              ...prev,
              totalCharsUsed: prev.totalCharsUsed + charsConsumed,
              dailyCharsUsed: prev.dailyCharsUsed + charsConsumed
          };
          localStorage.setItem(`sawtli_stats_${user.uid}`, JSON.stringify(newStats));
          return newStats;
      });
  };

  const stopAll = useCallback(() => {
      if (audioSourceRef.current) {
          try {
              audioSourceRef.current.stop();
              audioSourceRef.current.disconnect();
          } catch (e) {
              // ignore
          }
          audioSourceRef.current = null;
      }
      
      if (apiAbortControllerRef.current) {
          apiAbortControllerRef.current.abort();
          apiAbortControllerRef.current = null;
      }

      setIsLoading(false);
      setLoadingTask('');
      setActivePlayer(null);
      setIsPaused(false);
      isPausedRef.current = false;
      playbackOffsetRef.current = 0;
      playbackStartTimeRef.current = 0;
  }, []);

  const handleSignIn = async () => {
      setIsAuthLoading(true);
      const { auth } = getFirebase();
      if (!auth) {
          showToast(t('signInNotConfigured', uiLanguage), 'error');
          setIsAuthLoading(false);
          return;
      }
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
          await auth.signInWithPopup(provider);
      } catch (error: any) {
          console.error("Sign in error", error);
          showToast(t('signInError', uiLanguage), 'error');
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleSignOutAndClose = async () => {
      const { auth } = getFirebase();
      if (auth) {
          await auth.signOut();
          setUser(null);
          setIsAccountOpen(false);
          showToast("Signed out", 'info');
      }
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      if (confirm(t('deleteAccountConfirmationPrompt', uiLanguage))) {
          try {
              await deleteUserDocument(user.uid);
              const { auth } = getFirebase();
              if (auth && auth.currentUser) {
                  await auth.currentUser.delete();
              }
              setIsAccountOpen(false);
              showToast(t('accountDeletedSuccess', uiLanguage), 'success');
          } catch (e) {
              console.error(e);
              showToast(t('accountDeletionError', uiLanguage), 'error');
          }
      }
  };

  const handleSetDevMode = (enabled: boolean) => {
      if (enabled) {
          sessionStorage.setItem('sawtli_dev_mode', 'true');
          setIsDevMode(true);
      } else {
          sessionStorage.removeItem('sawtli_dev_mode');
          setIsDevMode(false);
      }
  };

  const handleBoost = (type: 'share' | 'rate' | 'invite') => {
      let bonus = 0;
      if (type === 'share') bonus = 50;
      if (type === 'rate') bonus = 100;
      if (type === 'invite') bonus = 200;
      
      setUserStats(prev => {
          const newStats = { ...prev, bonusChars: prev.bonusChars + bonus };
          if (type === 'share') newStats.hasShared = true;
          if (type === 'rate') newStats.hasRated = true;
          
          if (user) {
              localStorage.setItem(`sawtli_stats_${user.uid}`, JSON.stringify(newStats));
          }
          return newStats;
      });
      showToast(t('bonusAdded', uiLanguage), 'success');
  };

  const handleUpgrade = async (tier: 'gold' | 'platinum') => {
      if (!user) {
          setIsUpgradeOpen(false);
          handleSignIn();
          return false;
      }
      try {
          await addToWaitlist(user.uid, user.email, tier);
          return true; 
      } catch (e) {
          console.error(e);
          showToast("Error joining waitlist", 'error');
          return false;
      }
  };

  const handleAudioStudioOpen = () => {
      setIsAudioStudioOpen(true);
  };

  const handleShareLink = () => {
      const params = new URLSearchParams();
      if (sourceText) params.set('sourceText', encodeURIComponent(sourceText));
      params.set('sourceLang', sourceLang);
      params.set('targetLang', targetLang);
      
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast(t('linkCopied', uiLanguage), 'success');
  };

  const handleDownload = async (format: 'mp3' | 'wav') => {
      if (!lastGeneratedPCM) {
          showToast("No audio to download", 'error');
          return;
      }

      setLoadingTask(t('encoding', uiLanguage));
      setIsLoading(true);

      try {
          let blob: Blob;
          if (format === 'wav') {
              blob = createWavBlob(lastGeneratedPCM, 1, 24000);
          } else {
              blob = await createMp3Blob(lastGeneratedPCM, 1, 24000);
          }
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sawtli_audio.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error(e);
          showToast(t('errorMp3Encoding', uiLanguage), 'error');
      } finally {
          setIsLoading(false);
          setLoadingTask('');
          setIsDownloadOpen(false);
      }
  };

  const handleHistoryLoad = (item: HistoryItem) => {
      setSourceText(item.sourceText);
      setTranslatedText(item.translatedText);
      setSourceLang(item.sourceLang);
      setTargetLang(item.targetLang);
      setIsHistoryOpen(false);
  };

  const handleTranslate = async () => {
      if (!sourceText.trim()) return;
      
      stopAll();
      setIsLoading(true);
      setLoadingTask(t('translatingButton', uiLanguage));
      
      try {
          apiAbortControllerRef.current = new AbortController();
          const { translatedText: result, speakerMapping } = await translateText(
              sourceText, 
              sourceLang, 
              targetLang, 
              'Speaker 1', 
              'Speaker 2', 
              apiAbortControllerRef.current.signal
          );
          
          setTranslatedText(result);
          
          if (user) {
              addHistoryItem(user.uid, {
                  sourceText,
                  translatedText: result,
                  sourceLang,
                  targetLang
              });
          } else {
              const newItem: HistoryItem = {
                  id: Date.now().toString(),
                  sourceText,
                  translatedText: result,
                  sourceLang,
                  targetLang,
                  timestamp: Date.now()
              };
              setHistory(prev => {
                  const updated = [newItem, ...prev].slice(0, 50);
                  localStorage.setItem('sawtli_history', JSON.stringify(updated));
                  return updated;
              });
          }
      } catch (e: any) {
          if (e.message !== 'Aborted') {
              console.error(e);
              showToast(t('errorTranslate', uiLanguage), 'error');
          }
      } finally {
          setIsLoading(false);
          setLoadingTask('');
      }
  };

  const handleToggleListening = () => {
      if (isListening) {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
          return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          showToast(t('errorMicNotSupported', uiLanguage), 'error');
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = languageOptions.find(l => l.value === sourceLang)?.value || 'en';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
              }
          }
          if (finalTranscript) {
              setSourceText(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
      };

      recognition.onerror = (event: any) => {
          console.error(event.error);
          setMicError(t('errorMicPermission', uiLanguage));
          setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
  };
  
  // Auth useEffect
  useEffect(() => {
    fetch('/api/check-config').then(res => res.json()).then(data => setIsApiConfigured(!!data.configured)).catch(() => setIsApiConfigured(false));
    const { auth } = getFirebase();
    if (auth) {
        // @ts-ignore
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser: any) => {
            setUser(currentUser);
            setIsAuthLoading(false);
            if (firestoreUnsubscribeRef.current) {
                firestoreUnsubscribeRef.current();
                firestoreUnsubscribeRef.current = null;
            }
            if (currentUser) {
                setShowSetupGuide(false);
                setUserSubscription('free');
                loadUserStats(currentUser.uid);
                firestoreUnsubscribeRef.current = subscribeToHistory(currentUser.uid, (items) => {
                    setHistory(items);
                });
            } else {
                setUserSubscription('free'); 
                try {
                    const savedHistory = localStorage.getItem('sawtli_history');
                    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
                } catch (e) {
                    console.error("Failed to load history", e);
                    setHistory([]);
                }
            }
        });
        return () => {
            // @ts-ignore
            if(typeof unsubscribeAuth === 'function') unsubscribeAuth();
             if (firestoreUnsubscribeRef.current) firestoreUnsubscribeRef.current();
        };
    } else {
        setIsAuthLoading(false);
        try {
            const savedHistory = localStorage.getItem('sawtli_history');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Failed to load history", e); }
    }
  }, []); 

  useEffect(() => {
      if (!voice) setVoice('Puck');
  }, []);

  useEffect(() => {
      return () => {
         if (audioContextRef.current) {
             audioContextRef.current.close().catch(() => {});
         }
      };
  }, []);

  // Settings useEffects
  useEffect(() => {
    try {
      const savedSettingsRaw = localStorage.getItem('sawtli_settings');
      if (savedSettingsRaw) {
        const settings = JSON.parse(savedSettingsRaw);
        if (settings.voice) setVoice(settings.voice);
        if (settings.emotion) setEmotion(settings.emotion);
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
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const urlSourceText = urlParams.get('sourceText');
      const urlSourceLang = urlParams.get('sourceLang');
      const urlTargetLang = urlParams.get('targetLang');
      
      if(urlSourceText) setSourceText(decodeURIComponent(urlSourceText));
      if(urlSourceLang) {
          setSourceLang(urlSourceLang);
      } 
      if(urlTargetLang) setTargetLang(urlTargetLang);
      
      const devModeActive = sessionStorage.getItem('sawtli_dev_mode') === 'true';
      if (devModeActive) setIsDevMode(true);

    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []); 

  useEffect(() => {
    try {
      const settings = { voice, emotion, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, speakerC, speakerD, sourceLang, targetLang, uiLanguage };
      localStorage.setItem('sawtli_settings', JSON.stringify(settings));
      if (!user && history.length > 0) {
          localStorage.setItem('sawtli_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [voice, emotion, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, speakerC, speakerD, history, sourceLang, targetLang, uiLanguage, user]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = languageOptions.find(l => l.value === uiLanguage)?.dir || 'ltr';
    document.title = t('pageTitle', uiLanguage);
  }, [uiLanguage]);

  const getCacheKey = (text: string) => {
      const speakers = multiSpeaker ? `${speakerA.voice}-${speakerB.voice}-${speakerC.voice}-${speakerD.voice}` : 'single';
      return `${text}_${voice}_${emotion}_${speed}_${seed}_${pauseDuration}_${speakers}`;
  };

  const handleSpeak = async (text: string, target: 'source' | 'target') => {
      if (!text.trim()) return;
      if (isLoading && activePlayer === target) { stopAll(); return; }
      
      if (userTier === 'visitor') { /* allow */ } else {
          if (isTrialExpired) { showToast(t('trialExpired', uiLanguage), 'error'); setIsUpgradeOpen(true); return; }
          if (isDailyLimitReached) { showToast(t('dailyLimitReached', uiLanguage), 'info'); setIsGamificationOpen(true); return; }
          if (isTotalLimitReached) { showToast(t('totalLimitReached', uiLanguage), 'error'); setIsUpgradeOpen(true); return; }
      }

      const isGeminiVoice = GEMINI_VOICES.includes(voice);
      if (isGeminiVoice && !planConfig.allowGemini) { setIsUpgradeOpen(true); return; }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

      if (activePlayer === target && !isPaused) {
          if (audioContextRef.current && audioContextRef.current.state === 'running') {
              const elapsed = (audioContextRef.current.currentTime - playbackStartTimeRef.current) * speed;
              playbackOffsetRef.current += elapsed;
              isPausedRef.current = true;
              setIsPaused(true);
              if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) { /* ignore */ } audioSourceRef.current = null; }
          }
          return;
      }

      if (activePlayer === target && isPaused) { setIsPaused(false); isPausedRef.current = false; } 
      else { stopAll(); setIsLoading(true); setLoadingTask(t('generatingSpeech', uiLanguage)); setActivePlayer(target); setError(null); isPausedRef.current = false; }

      let textToProcess = text;
      let isTruncated = false;
      if (userTier === 'visitor' && text.length > 50) { textToProcess = text.substring(0, 50); isTruncated = true; }

      const cacheKey = getCacheKey(textToProcess);
      let pcmData: Uint8Array | null = null;
      if (audioCacheRef.current.has(cacheKey)) { pcmData = audioCacheRef.current.get(cacheKey)!; setLastGeneratedPCM(pcmData); }

      if (!pcmData) {
          const warmUpTimer = setTimeout(() => { setLoadingTask(t('warmingUp', uiLanguage)); }, 2000);
          const clientTimeout = setTimeout(() => { if(isLoading && activePlayer === target) { stopAll(); showToast("Timeout", 'error'); } }, 45000); 
          apiAbortControllerRef.current = new AbortController();
          const signal = apiAbortControllerRef.current.signal;

          try {
              if (isGeminiVoice) {
                  // GEMINI MODE
                  const speakersConfig = multiSpeaker ? { speakerA, speakerB, speakerC, speakerD } : undefined;
                  // @ts-ignore
                  const idToken = user ? await user.getIdToken() : undefined;
                  pcmData = await generateSpeech(textToProcess, voice, emotion, pauseDuration, speakersConfig, signal, idToken, speed, seed);
              } else {
                  // STUDIO/STANDARD MODE
                  if (multiSpeaker) {
                      pcmData = await generateMultiSpeakerStandardSpeech(
                          textToProcess,
                          { speakerA, speakerB, speakerC, speakerD },
                          voice 
                      );
                  } else {
                      pcmData = await generateStandardSpeech(textToProcess, voice);
                  }
              }
              
              clearTimeout(warmUpTimer); clearTimeout(clientTimeout);
              if (signal.aborted) return;
              if (pcmData) {
                  if (audioCacheRef.current.size > 20) { const firstKey = audioCacheRef.current.keys().next().value; audioCacheRef.current.delete(firstKey); }
                  audioCacheRef.current.set(cacheKey, pcmData); setLastGeneratedPCM(pcmData);
                  if (userTier !== 'visitor' && userTier !== 'admin') { updateUserStats(textToProcess.length); }
              }
          } catch (err: any) {
              clearTimeout(warmUpTimer); clearTimeout(clientTimeout);
              if (err.message !== 'Aborted') { console.error("Audio failed:", err); showToast(err.message || t('errorUnexpected', uiLanguage), 'error'); }
              setIsLoading(false); setActivePlayer(null); return;
          }
      }
      
      if (pcmData) {
          const startOffset = playbackOffsetRef.current / speed;
          playbackStartTimeRef.current = audioContextRef.current.currentTime;
          audioSourceRef.current = await playAudio(pcmData, audioContextRef.current, () => {
                   if (!isPausedRef.current) {
                       setActivePlayer(null); audioSourceRef.current = null; setIsLoading(false); setLoadingTask(''); playbackOffsetRef.current = 0;
                       if (isTruncated) { setTimeout(() => { showToast(uiLanguage === 'ar' ? "هذه معاينة مجانية." : "Free preview ended.", 'info'); setIsUpgradeOpen(true); }, 500); }
                   }
              }, speed, startOffset);
          setIsLoading(false);
      }
  };
  
  const handleClearHistory = async () => {
      if (user) { try { await clearHistoryForUser(user.uid); setHistory([]); showToast(t('historyClearSuccess', uiLanguage), 'success'); } catch (error) { showToast(t('historyClearError', uiLanguage), 'error'); } } 
      else { setHistory([]); localStorage.removeItem('sawtli_history'); showToast(t('historyClearSuccess', uiLanguage), 'success'); }
      setIsHistoryOpen(false);
  };

  const handleDeleteHistoryItem = async (itemId: string) => {
      if (user) {
          try {
              await deleteHistoryItem(user.uid, itemId);
          } catch (e) {
              console.error(e);
              showToast("Failed to delete item", 'error');
          }
      } else {
          const newHistory = history.filter(item => item.id !== itemId);
          setHistory(newHistory);
          localStorage.setItem('sawtli_history', JSON.stringify(newHistory));
      }
  };

  // UI Definitions
  const sourceButtonState = {
      icon: isLoading && activePlayer === 'source' ? <LoaderIcon className="w-5 h-5" /> : (activePlayer === 'source' ? <SoundWaveIcon className="w-5 h-5 text-cyan-400" animate={true} /> : <SpeakerIcon className="w-5 h-5" />),
      label: isLoading && activePlayer === 'source' ? loadingTask : (activePlayer === 'source' ? t('listening', uiLanguage) : t('speakSource', uiLanguage)),
      className: activePlayer === 'source' ? 'bg-slate-800 text-cyan-400 border border-cyan-500/50' : 'bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white'
  };

  const targetButtonState = {
      icon: isLoading && activePlayer === 'target' ? <LoaderIcon className="w-5 h-5" /> : (activePlayer === 'target' ? <SoundWaveIcon className="w-5 h-5 text-green-400" animate={true} /> : <SpeakerIcon className="w-5 h-5" />),
      label: isLoading && activePlayer === 'target' ? loadingTask : (activePlayer === 'target' ? t('listening', uiLanguage) : t('speakTarget', uiLanguage)),
      className: activePlayer === 'target' ? 'bg-slate-800 text-green-400 border border-green-500/50' : 'bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white'
  };

  const sourceTextArea = (
      <div className="flex-1 relative group">
          <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('sourceLanguage', uiLanguage)}</span>
              <div className="flex items-center gap-2">
                  <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:border-cyan-500 outline-none">
                      {translationLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                  <button onClick={() => { navigator.clipboard.writeText(sourceText); setCopiedSource(true); setTimeout(() => setCopiedSource(false), 2000); }} className="text-slate-500 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                      {copiedSource ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setSourceText('')} className="text-slate-500 hover:text-red-400 transition-colors" title="Clear">
                      <TrashIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
          <textarea
              ref={sourceTextAreaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('placeholder', uiLanguage)}
              className="w-full h-40 sm:h-48 bg-slate-900/50 p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-slate-700 text-lg transition-all placeholder:text-slate-600"
              dir="auto"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
              <span className="text-xs text-slate-600">{sourceText.length} chars</span>
          </div>
      </div>
  );

  const translatedTextArea = (
      <div className="flex-1 relative group">
          <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('targetLanguage', uiLanguage)}</span>
              <div className="flex items-center gap-2">
                  <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:border-cyan-500 outline-none">
                      {translationLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                  <button onClick={() => { navigator.clipboard.writeText(translatedText); setCopiedTarget(true); setTimeout(() => setCopiedTarget(false), 2000); }} className="text-slate-500 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                      {copiedTarget ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
              </div>
          </div>
          <textarea
              value={translatedText}
              readOnly
              placeholder={t('translationPlaceholder', uiLanguage)}
              className="w-full h-40 sm:h-48 bg-slate-900/30 p-4 rounded-xl resize-none focus:outline-none border border-slate-800 text-lg text-slate-300 placeholder:text-slate-700"
              dir="auto"
          />
      </div>
  );

  const swapButton = (
      <div className="flex items-center justify-center md:pt-8">
          <button 
              onClick={() => {
                  setSourceLang(targetLang);
                  setTargetLang(sourceLang);
                  setSourceText(translatedText);
                  setTranslatedText(sourceText);
              }}
              className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all transform hover:rotate-180 duration-300 shadow-lg"
              title={t('swapLanguages', uiLanguage)}
          >
              <SwapIcon className="w-6 h-6" />
          </button>
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-6 relative overflow-hidden bg-[#0f172a] text-slate-50">
      
      {/* Background and Header */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-2rem)] z-10 relative">
        <header className="flex items-center justify-between w-full my-6 py-4 px-4 sm:px-8 relative z-40 mt-12">
                 <div className="flex justify-start w-1/3">
                    <div className="relative group">
                        <button className="border border-cyan-500/50 text-cyan-500 px-6 sm:px-8 py-3 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-400 uppercase text-base sm:text-lg font-bold tracking-widest transition-all flex items-center gap-2">
                            <span className="hidden sm:inline">{languageOptions.find(l => l.value === uiLanguage)?.label || 'ENGLISH'}</span>
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
                     <SawtliLogoIcon className="w-auto h-20 sm:h-28" />
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
                {/* Error Messages */}
                {error && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{error}</p></div>}
                {micError && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{micError}</p></div>}
                
                <div className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
                
                {/* Control Buttons */}
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
                <ActionCard icon={<VideoCameraIcon className="w-10 h-10" />} label={uiLanguage === 'ar' ? 'دليل الاستخدام' : 'Tutorial'} onClick={() => setIsTutorialOpen(true)} />
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
        systemVoices={GOOGLE_STUDIO_VOICES as any} 
        sourceLang={sourceLang} targetLang={targetLang}
        currentLimits={planConfig} 
        onUpgrade={() => {setIsSettingsOpen(false); setIsUpgradeOpen(true);}} 
      />}
      
      {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onDelete={handleDeleteHistoryItem} onLoad={handleHistoryLoad}/>}
      {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} allowWav={planConfig.allowWav} onUpgrade={() => setIsUpgradeOpen(true)} />}
      
      <AudioStudioModal isOpen={isAudioStudioOpen} onClose={() => setIsAudioStudioOpen(false)} uiLanguage={uiLanguage} voice={voice} sourceAudioPCM={lastGeneratedPCM} allowDownloads={planConfig.allowDownloads} allowStudio={planConfig.allowStudio} userTier={userTier} onUpgrade={() => setIsUpgradeOpen(true)} />
      {isTutorialOpen && <TutorialModal onClose={() => setIsTutorialOpen(false)} uiLanguage={uiLanguage} />}
      {isUpgradeOpen && <UpgradeModal onClose={() => setIsUpgradeOpen(false)} uiLanguage={uiLanguage} currentTier={userTier} onUpgrade={handleUpgrade} onSignIn={() => { setIsUpgradeOpen(false); handleSignIn(); }} />}
      {isGamificationOpen && <GamificationModal onClose={() => setIsGamificationOpen(false)} uiLanguage={uiLanguage} userStats={userStats} onBoost={handleBoost} />}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} uiLanguage={uiLanguage} />}

      <Suspense fallback={null}>
          {isAccountOpen && <AccountModal onClose={() => setIsAccountOpen(false)} uiLanguage={uiLanguage} user={user} onSignOut={handleSignOutAndClose} onClearHistory={handleClearHistory} onDeleteAccount={handleDeleteAccount} currentTier={userTier} userStats={userStats} limits={planConfig} onUpgrade={() => { setIsAccountOpen(false); setIsUpgradeOpen(true); }} onSetDevMode={handleSetDevMode} onOpenOwnerGuide={() => { setIsAccountOpen(false); setShowSetupGuide(true); }} />}
          {isReportOpen && <ReportModal onClose={() => setIsReportOpen(false)} uiLanguage={uiLanguage} user={user} />}
      </Suspense>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
