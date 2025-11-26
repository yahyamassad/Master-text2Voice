
import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy, ReactElement } from 'react';
import { generateSpeech, translateText, previewVoice } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon, ReportIcon, PauseIcon, VideoCameraIcon, StarIcon, LockIcon, SparklesIcon, TrashIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, translations } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig, GEMINI_VOICES, PLAN_LIMITS, UserTier, UserStats } from './types';
import firebase, { getFirebase } from './firebaseConfig';

type User = firebase.User;

import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument, addToWaitlist } from './services/firestoreService';
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

// --- QUOTA INDICATOR COMPONENT ---
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

    let barColor = 'bg-cyan-500';
    if (dailyPercent > 80) barColor = 'bg-amber-500';
    if (dailyPercent >= 100) barColor = 'bg-red-500';

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


// Main App Component
const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [uiLanguage, setUiLanguage] = useState<Language>(getInitialLanguage);
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>(uiLanguage);
  const [targetLang, setTargetLang] = useState<string>(uiLanguage === 'ar' ? 'en' : 'ar');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTask, setLoadingTask] = useState<string>('');
  const [activePlayer, setActivePlayer] = useState<'source' | 'target' | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  
  // Auth State & Tiers
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

  // Panels and Modals
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
  
  // Settings State
  const [voice, setVoice] = useState('Google US English'); 
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'Kore' });
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [lastGeneratedPCM, setLastGeneratedPCM] = useState<Uint8Array | null>(null);

  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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

  const handleBoost = (type: 'share' | 'rate' | 'invite') => {
      if (!user) return;
      
      let bonus = 0;
      setUserStats(prev => {
          if (type === 'share' && !prev.hasShared) {
              bonus = 50;
              const newStats = { ...prev, hasShared: true, bonusChars: prev.bonusChars + 50 };
              localStorage.setItem(`sawtli_stats_${user.uid}`, JSON.stringify(newStats));
              return newStats;
          }
          if (type === 'rate' && !prev.hasRated) {
              bonus = 100;
              const newStats = { ...prev, hasRated: true, bonusChars: prev.bonusChars + 100 };
              localStorage.setItem(`sawtli_stats_${user.uid}`, JSON.stringify(newStats));
              return newStats;
          }
          return prev;
      });
  };

  const stopAll = useCallback(() => {
    if (apiAbortControllerRef.current) {
      apiAbortControllerRef.current.abort();
      apiAbortControllerRef.current = null;
    }
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.onended = null; 
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect(); 
        } catch (e) { /* Ignore */ }
        audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(() => {});
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
        recognitionRef.current.abort();
        setIsListening(false);
    }
    
    playbackStartTimeRef.current = 0;
    playbackOffsetRef.current = 0;
    isPausedRef.current = false;

    setActivePlayer(null);
    setIsPaused(false);
    setLoadingTask('');
    setIsLoading(false); 
  }, []);

  useEffect(() => {
      if (activePlayer || isPaused) {
          stopAll();
      }
  }, [voice, emotion, speed, pauseDuration, multiSpeaker, speakerA, speakerB, stopAll]);

  useEffect(() => {
    fetch('/api/check-config')
        .then(res => res.json())
        .then(data => setIsApiConfigured(!!data.configured))
        .catch(() => setIsApiConfigured(false));

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

  const refreshVoices = useCallback(() => {
      const voices = window.speechSynthesis.getVoices();
      setSystemVoices(prev => {
          if (voices.length !== prev.length || (prev.length === 0 && voices.length > 0)) {
              return voices;
          }
          return prev;
      });
      
      if (!voice || (!GEMINI_VOICES.includes(voice) && !voices.some(v => v.name === voice))) {
           const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
           if (defaultVoice && !GEMINI_VOICES.includes(voice)) {
               setVoice(defaultVoice.name);
           }
      }
  }, [voice]);

  useEffect(() => {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    const intervalId = setInterval(refreshVoices, 1000);
    const keepAliveInterval = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
        }
    }, 14000);

    return () => {
        window.speechSynthesis.onvoiceschanged = null;
        clearInterval(intervalId);
        clearInterval(keepAliveInterval);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
         if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [refreshVoices]); 

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
        if (settings.sourceLang) setSourceLang(settings.sourceLang);
        if (settings.targetLang) setTargetLang(settings.targetLang);
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const urlSourceText = urlParams.get('sourceText');
      const urlSourceLang = urlParams.get('sourceLang');
      const urlTargetLang = urlParams.get('targetLang');
      
      if(urlSourceText) setSourceText(decodeURIComponent(urlSourceText));
      if(urlSourceLang) setSourceLang(urlSourceLang);
      if(urlTargetLang) setTargetLang(urlTargetLang);
      
      const devModeActive = sessionStorage.getItem('sawtli_dev_mode') === 'true';
      if (devModeActive) setIsDevMode(true);

    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []);

  useEffect(() => {
    try {
      const settings = { voice, emotion, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, sourceLang, targetLang, uiLanguage };
      localStorage.setItem('sawtli_settings', JSON.stringify(settings));
      if (!user && history.length > 0) {
          localStorage.setItem('sawtli_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [voice, emotion, pauseDuration, speed, seed, multiSpeaker, speakerA, speakerB, history, sourceLang, targetLang, uiLanguage, user]);

  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = languageOptions.find(l => l.value === uiLanguage)?.dir || 'ltr';
    document.title = t('pageTitle', uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (effectsDropdownRef.current && !effectsDropdownRef.current.contains(event.target as Node)) {
            setIsEffectsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getCacheKey = (text: string) => {
      const speakers = multiSpeaker ? `${speakerA.voice}-${speakerB.voice}` : 'single';
      return `${text}_${voice}_${emotion}_${speed}_${seed}_${pauseDuration}_${speakers}`;
  };

  const handleSpeak = async (text: string, target: 'source' | 'target') => {
      if (!text.trim()) return;
      
      if (isLoading && activePlayer === target) {
          stopAll();
          return;
      }

      if (userTier === 'visitor') {
          // Allow
      } else {
          if (isTrialExpired) {
              showToast(t('trialExpired', uiLanguage), 'error');
              setIsUpgradeOpen(true);
              return;
          }
          if (isDailyLimitReached) {
              showToast(t('dailyLimitReached', uiLanguage), 'info');
              setIsGamificationOpen(true); 
              return;
          }
          if (isTotalLimitReached) {
              showToast(t('totalLimitReached', uiLanguage), 'error');
              setIsUpgradeOpen(true);
              return;
          }
          if (text.length > dailyCharsRemaining) {
              showToast(`${t('dailyLimitReached', uiLanguage)}. (${dailyCharsRemaining} chars left)`, 'error');
              setIsGamificationOpen(true);
              return;
          }
      }

      const isGeminiVoice = GEMINI_VOICES.includes(voice);

      if (isGeminiVoice && !planConfig.allowGemini) {
          setIsUpgradeOpen(true);
          return;
      }

      if (activePlayer === target && !isPaused) {
          if (isGeminiVoice) {
              if (audioContextRef.current && audioContextRef.current.state === 'running') {
                  const currentTime = audioContextRef.current.currentTime;
                  const elapsed = (currentTime - playbackStartTimeRef.current) * speed;
                  playbackOffsetRef.current += elapsed;
                  
                  isPausedRef.current = true;
                  setIsPaused(true);
                  
                  if (audioSourceRef.current) {
                      try { audioSourceRef.current.stop(); } catch (e) { /* ignore */ }
                      audioSourceRef.current = null;
                  }
              }
          } else {
              window.speechSynthesis.pause();
              setIsPaused(true);
          }
          return;
      }

      if (activePlayer === target && isPaused) {
           if (!isGeminiVoice) {
               window.speechSynthesis.resume();
               setIsPaused(false);
               return;
           }
      } else {
          stopAll(); 
      }

      if (isGeminiVoice) {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            if (!isPaused) {
                setIsLoading(true);
                setLoadingTask(t('generatingSpeech', uiLanguage));
                setActivePlayer(target);
                setError(null);
                isPausedRef.current = false;
            } else {
                setIsPaused(false);
                isPausedRef.current = false;
            }
            
            let textToProcess = text;
            let isTruncated = false;
            
            if (userTier === 'visitor' && text.length > 50) {
                textToProcess = text.substring(0, 50); 
                isTruncated = true;
            }

            const cacheKey = getCacheKey(textToProcess);
            let pcmData: Uint8Array | null = null;

            if (audioCacheRef.current.has(cacheKey)) {
                 pcmData = audioCacheRef.current.get(cacheKey)!;
                 setLastGeneratedPCM(pcmData);
            }

            if (!pcmData) {
                const warmUpTimer = setTimeout(() => {
                    setLoadingTask(t('warmingUp', uiLanguage));
                }, 2000);
                
                const clientTimeout = setTimeout(() => {
                     if(isLoading && activePlayer === target) {
                         stopAll();
                         showToast("Timeout: Generation took too long.", 'error');
                     }
                }, 45000); 

                apiAbortControllerRef.current = new AbortController();
                const signal = apiAbortControllerRef.current.signal;

                try {
                    const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
                    // @ts-ignore
                    const idToken = user ? await user.getIdToken() : undefined;

                    pcmData = await generateSpeech(
                        textToProcess,
                        voice,
                        emotion,
                        pauseDuration,
                        speakersConfig,
                        signal,
                        idToken,
                        speed,
                        seed
                    );
                    
                    clearTimeout(warmUpTimer);
                    clearTimeout(clientTimeout);

                    if (signal.aborted) return;
                    
                    if (pcmData) {
                        if (audioCacheRef.current.size > 20) {
                            const firstKey = audioCacheRef.current.keys().next().value;
                            audioCacheRef.current.delete(firstKey);
                        }
                        audioCacheRef.current.set(cacheKey, pcmData);
                        setLastGeneratedPCM(pcmData);
                        
                        if (userTier !== 'visitor' && userTier !== 'admin') {
                            updateUserStats(textToProcess.length);
                        }
                    }

                } catch (err: any) {
                    clearTimeout(warmUpTimer);
                    clearTimeout(clientTimeout);
                    if (err.message !== 'Aborted' && err.name !== 'AbortError') {
                        console.error("Audio generation failed:", err);
                        showToast(err.message || t('errorUnexpected', uiLanguage), 'error');
                    }
                    setIsLoading(false);
                    setActivePlayer(null);
                    return;
                }
            }
            
            if (pcmData) {
                const startOffset = playbackOffsetRef.current / speed;
                playbackStartTimeRef.current = audioContextRef.current.currentTime;

                audioSourceRef.current = await playAudio(
                    pcmData, 
                    audioContextRef.current, 
                    () => {
                         if (!isPausedRef.current) {
                             setActivePlayer(null);
                             audioSourceRef.current = null;
                             setIsLoading(false);
                             setLoadingTask('');
                             playbackOffsetRef.current = 0;
                             
                             if (isTruncated) {
                                 setTimeout(() => {
                                     const isRtl = uiLanguage === 'ar';
                                     showToast(isRtl ? "هذه معاينة مجانية. سجل للدخول لسماع النص كاملاً." : "Free preview ended. Sign in to hear full text.", 'info');
                                     setIsUpgradeOpen(true);
                                 }, 500);
                             }
                         }
                    }, 
                    speed,
                    startOffset
                );
                
                setIsLoading(false);
            }

      } else {
        try {
            window.speechSynthesis.cancel();
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                let selectedVoice = systemVoices.find(v => v.name === voice);
                
                if (!selectedVoice) {
                    const targetLangCode = target === 'source' ? sourceLang : targetLang;
                    selectedVoice = systemVoices.find(v => v.lang.toLowerCase().includes(targetLangCode.toLowerCase())) 
                                 || systemVoices[0];
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    utterance.lang = selectedVoice.lang;
                } else {
                    const textLangCode = target === 'source' ? sourceLang : targetLang;
                    utterance.lang = translationLanguages.find(l => l.code === textLangCode)?.speechCode || textLangCode;
                }

                utterance.rate = speed;
                nativeUtteranceRef.current = utterance;
                
                utterance.onstart = () => {
                    setActivePlayer(target);
                    setIsPaused(false);
                };
                
                utterance.onend = () => {
                    setActivePlayer(null);
                    setIsPaused(false);
                    nativeUtteranceRef.current = null;
                };
                
                utterance.onerror = (e) => {
                    if (e.error !== 'interrupted' && e.error !== 'canceled') {
                        showToast(t('errorSpeechGenerationSystem', uiLanguage).replace('{voiceName}', voice), 'error');
                    }
                    if(e.error !== 'interrupted') {
                         setActivePlayer(null);
                         nativeUtteranceRef.current = null;
                    }
                };
                
                window.speechSynthesis.speak(utterance);
            }, 50);

        } catch (e) {
            console.error("Failed to initiate speech synthesis:", e);
            showToast(t('errorSpeechGeneration', uiLanguage), 'error');
            setActivePlayer(null);
        }
      }
  };
  
  const handleTranslate = async () => {
      if(isLoading) {
          stopAll();
          return;
      }
      if (!sourceText.trim()) return;
      if (userTier !== 'admin' && sourceText.length > 2000) {
           showToast(t('errorFileTooLarge', uiLanguage), 'error'); 
           return;
      }

      setIsLoading(true);
      setLoadingTask(t('translatingButton', uiLanguage));
      setError(null);
      setTranslatedText('');

      apiAbortControllerRef.current = new AbortController();
      const signal = apiAbortControllerRef.current.signal;
      
      try {
          // @ts-ignore
          const idToken = user ? await user.getIdToken() : undefined;
          const result = await translateText(
              sourceText,
              sourceLang,
              targetLang,
              speakerA.name,
              speakerB.name,
              signal,
              idToken
          );
          
          if (!signal.aborted) {
              const fullTranslation = result.translatedText;
              setTranslatedText(fullTranslation);
              
              const newHistoryItem: HistoryItem = {
                  id: new Date().toISOString(),
                  sourceText,
                  translatedText: fullTranslation,
                  sourceLang,
                  targetLang,
                  timestamp: Date.now()
              };

              if (user) {
                  const { id, timestamp, ...itemToSave } = newHistoryItem;
                  addHistoryItem(user.uid, itemToSave).catch(e => console.error("Failed to save history:", e));
              } else {
                  setHistory(prev => [newHistoryItem, ...prev.slice(49)]);
              }
          }

      } catch (err: any) {
          if (err.message !== 'Aborted' && err.name !== 'AbortError') {
              console.error("Translation failed:", err);
              showToast(err.message || t('errorTranslate', uiLanguage), 'error');
          }
      } finally {
          if(!apiAbortControllerRef.current?.signal.aborted) {
             setIsLoading(false);
             setLoadingTask('');
          }
          if(apiAbortControllerRef.current?.signal === signal) {
            apiAbortControllerRef.current = null;
          }
      }
  };
  
   const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(t('errorMicNotSupported', uiLanguage));
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.lang = translationLanguages.find(l => l.code === sourceLang)?.speechCode || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setMicError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError(t('errorMicPermission', uiLanguage));
      } else if (event.error === 'no-speech') {
          // Ignore
      } else {
        setMicError(event.error);
      }
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setSourceText(prev => prev + finalTranscript);
    };

    recognition.start();
  };


  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };
  
  const handleHistoryLoad = useCallback((item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setIsHistoryOpen(false);
  }, []);
  
  const handleCopy = (text: string, type: 'source' | 'target') => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      if (type === 'source') {
          setCopiedSource(true);
          setTimeout(() => setCopiedSource(false), 2000);
      } else if (type === 'target') {
          setCopiedTarget(true);
          setTimeout(() => setCopiedTarget(false), 2000);
      }
  };

  const handleShareLink = () => {
      const params = new URLSearchParams();
      params.set('sourceText', encodeURIComponent(sourceText));
      params.set('sourceLang', sourceLang);
      params.set('targetLang', targetLang);
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      
      if (user) handleBoost('share');
  };

  const generateAudioBlob = useCallback(async (text: string, format: 'wav' | 'mp3') => {
    if (!text.trim()) return null;

    if (!GEMINI_VOICES.includes(voice)) {
        showToast(t('errorDownloadSystemVoice', uiLanguage), 'error');
        return null;
    }
    
    setError(null);
    setIsLoading(true);
    setLoadingTask(`${t('encoding', uiLanguage)}...`);
    apiAbortControllerRef.current = new AbortController();
    const signal = apiAbortControllerRef.current.signal;
    let blob = null;

    try {
        const cacheKey = getCacheKey(text);
        if (audioCacheRef.current.has(cacheKey)) {
             const pcmData = audioCacheRef.current.get(cacheKey)!;
             if (format === 'wav') {
                blob = createWavBlob(pcmData, 1, 24000);
             } else {
                blob = await createMp3Blob(pcmData, 1, 24000);
             }
        } else {
             const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
             // @ts-ignore
             const idToken = user ? await user.getIdToken() : undefined;

             const pcmData = await generateSpeech(
                text,
                voice,
                emotion,
                pauseDuration,
                speakersConfig,
                signal,
                idToken,
                speed,
                seed
             );

            if (!pcmData) {
                throw new Error(t('errorApiNoAudio', uiLanguage));
            }
            
             if (audioCacheRef.current.size > 20) {
                const firstKey = audioCacheRef.current.keys().next().value;
                audioCacheRef.current.delete(firstKey);
            }
            audioCacheRef.current.set(cacheKey, pcmData);
            
            if (userTier !== 'visitor' && userTier !== 'admin') {
                 updateUserStats(text.length);
            }

            if(signal.aborted) throw new Error('AbortError');
            
            if (format === 'wav') {
                blob = createWavBlob(pcmData, 1, 24000);
            } else {
                blob = await createMp3Blob(pcmData, 1, 24000);
            }
        }
        
    } catch (err: any) {
        if (err.message !== 'Aborted' && err.name !== 'AbortError') {
          console.error(`Audio generation for ${format} failed:`, err);
          showToast(err.message || (format === 'mp3' ? t('errorMp3Encoding', uiLanguage) : t('errorSpeechGeneration', uiLanguage)), 'error');
        }
    } finally {
        setIsLoading(false);
        setLoadingTask('');
        if(apiAbortControllerRef.current?.signal === signal) {
            apiAbortControllerRef.current = null;
        }
    }
    return blob;
  }, [voice, emotion, multiSpeaker, speakerA, speakerB, pauseDuration, uiLanguage, stopAll, user, speed, seed, planConfig, userTier]);

  const handleDownload = useCallback(async (format: 'wav' | 'mp3') => {
    if (userTier === 'visitor') {
        setIsUpgradeOpen(true);
        return;
    }

    const textToProcess = translatedText || sourceText;
    const blob = await generateAudioBlob(textToProcess, format);
    if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sawtli_audio.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    setIsDownloadOpen(false);
  }, [translatedText, sourceText, generateAudioBlob, userTier]);
  
  const handleInsertTag = (tag: string) => {
    const textarea = sourceTextAreaRef.current;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = sourceText;
        const newText = text.substring(0, start) + ` ${tag} ` + text.substring(end);
        setSourceText(newText);
        setIsEffectsOpen(false);

        textarea.focus();
        setTimeout(() => {
            const newCursorPos = start + tag.length + 2;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
    }
  };
  
  const handleAudioStudioOpen = () => {
      setIsAudioStudioOpen(true);
  };

  const handleSignIn = () => {
      const { auth } = getFirebase();
      if (!auth) {
          showToast("Firebase Auth not initialized", 'error');
          return;
      }
      setIsAuthLoading(true);
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
          .catch((error: any) => {
              console.error(error);
              showToast(t('signInError', uiLanguage), 'error');
          })
          .finally(() => {
              setIsAuthLoading(false);
          });
  };

  const handleSignOutAndClose = () => {
      const { auth } = getFirebase();
      if (auth) {
          auth.signOut().then(() => {
              setIsAccountOpen(false);
              showToast("Signed out", 'info');
          });
      }
  };

  const handleClearHistory = async () => {
      if (user) {
          try {
              await clearHistoryForUser(user.uid);
              setHistory([]); 
              showToast(t('historyClearSuccess', uiLanguage), 'success');
          } catch (error) {
              showToast(t('historyClearError', uiLanguage), 'error');
          }
      } else {
          setHistory([]);
          localStorage.removeItem('sawtli_history');
          showToast(t('historyClearSuccess', uiLanguage), 'success');
      }
      setIsHistoryOpen(false);
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      if (confirm(t('deleteAccountConfirmationPrompt', uiLanguage))) {
          try {
              await deleteUserDocument(user.uid);
              await user.delete();
              setIsAccountOpen(false);
              showToast(t('accountDeletedSuccess', uiLanguage), 'success');
          } catch (e) {
              showToast(t('accountDeletionError', uiLanguage), 'error');
          }
      }
  };

  // Updated to return promise success/fail status
  const handleUpgrade = async (tier: 'gold' | 'platinum'): Promise<boolean> => {
      if (!user) {
          showToast(t('signInError', uiLanguage), 'error'); 
          handleSignIn();
          return false;
      }
      
      try {
          await addToWaitlist(user.uid, user.email, tier);
          showToast(t('waitlistSuccess', uiLanguage), 'success');
          return true;
      } catch (e: any) {
          console.error("Failed to join waitlist:", e.message);
          showToast(`Failed to join waitlist: ${e.message || 'Unknown error'}`, 'error');
          return false;
      }
  };

  const handleSetDevMode = (enabled: boolean) => {
      setIsDevMode(enabled);
      sessionStorage.setItem('sawtli_dev_mode', enabled ? 'true' : 'false');
      showToast(enabled ? t('devModeActive', uiLanguage) : t('devModeInactive', uiLanguage), 'success');
  };

  const getButtonState = (target: 'source' | 'target') => {
      const isActive = activePlayer === target;
      if (isActive) {
          if (isPaused) {
              return {
                  icon: <PlayCircleIcon className="w-6 h-6" />,
                  label: t('resumeSpeaking', uiLanguage),
                  className: "bg-amber-600/90 border-amber-400 text-white hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              };
          }
          return {
              icon: <PauseIcon className="w-6 h-6 animate-pulse" />,
              label: t('pauseSpeaking', uiLanguage),
              className: "bg-slate-800 border-cyan-400 text-cyan-400 hover:bg-slate-700 hover:text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          };
      }
      return {
          icon: <SpeakerIcon className="w-6 h-6" />,
          label: target === 'source' ? t('speakSource', uiLanguage) : t('speakTarget', uiLanguage),
          className: "bg-slate-800 border-cyan-500/30 text-cyan-500 hover:bg-slate-700 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
      };
  };

  const isUsingSystemVoice = !GEMINI_VOICES.includes(voice);
  const isSourceRtl = languageOptions.find(l => l.value === sourceLang)?.dir === 'rtl';
  const isTargetRtl = languageOptions.find(l => l.value === targetLang)?.dir === 'rtl';
  const sourceButtonState = getButtonState('source');
  const targetButtonState = getButtonState('target');

  const sourceTextArea = (
        <div className="flex-1 relative group">
            <div className="flex items-center justify-between mb-3">
                <LanguageSelect value={sourceLang} onChange={setSourceLang} />
                <div className="flex items-center gap-2">
                     {sourceText && (
                        <button onClick={() => {setSourceText(''); setTranslatedText('');}} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                     )}
                     <div className="relative" ref={effectsDropdownRef}>
                        <button 
                            onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                            className={`p-2 rounded-lg transition-all ${isEffectsOpen ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
                            title={t('soundEffects', uiLanguage)}
                        >
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                        {isEffectsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-2 grid grid-cols-3 gap-1">
                                    {soundEffects.map((effect) => (
                                        <button
                                            key={effect.tag}
                                            onClick={() => handleInsertTag(effect.tag)}
                                            className="aspect-square flex items-center justify-center text-xl hover:bg-slate-700 rounded-lg transition-colors"
                                            title={t(effect.labelKey as any, uiLanguage)}
                                        >
                                            {effect.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => handleCopy(sourceText, 'source')} className="p-2 text-slate-400 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                        {copiedSource ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div className="relative">
                <textarea
                    ref={sourceTextAreaRef}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t('placeholder', uiLanguage)}
                    className={`w-full h-48 sm:h-64 bg-slate-900/50 border-2 border-slate-700 rounded-2xl p-5 text-lg sm:text-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all resize-none ${isSourceRtl ? 'text-right' : 'text-left'} custom-scrollbar`}
                    dir={isSourceRtl ? 'rtl' : 'ltr'}
                    spellCheck="false"
                />
                <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-500 pointer-events-none bg-slate-900/80 px-2 py-1 rounded">
                    {sourceText.length} chars
                </div>
            </div>
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

    const translatedTextArea = (
        <div className="flex-1 relative">
            <div className="flex items-center justify-between mb-3">
                <LanguageSelect value={targetLang} onChange={setTargetLang} />
                <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(translatedText, 'target')} className="p-2 text-slate-400 hover:text-white transition-colors" title={t('copyTooltip', uiLanguage)}>
                        {copiedTarget ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div className="relative">
                <textarea
                    value={translatedText}
                    readOnly
                    placeholder={t('translationPlaceholder', uiLanguage)}
                    className={`w-full h-48 sm:h-64 bg-slate-900/50 border-2 border-slate-700 rounded-2xl p-5 text-lg sm:text-xl text-white placeholder-slate-600 focus:outline-none transition-all resize-none ${isTargetRtl ? 'text-right' : 'text-left'} custom-scrollbar cursor-default read-only:bg-slate-900/50 read-only:text-white`}
                    dir={isTargetRtl ? 'rtl' : 'ltr'}
                />
            </div>
        </div>
    );

    const swapButton = (
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-10 md:static md:top-auto md:left-auto md:translate-x-0 md:flex md:items-center justify-center">
            <button 
                onClick={swapLanguages}
                className="p-3 bg-slate-800 border-2 border-slate-600 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-400 hover:bg-slate-700 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 group"
                title={t('swapLanguages', uiLanguage)}
            >
                <SwapIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
            </button>
        </div>
    );


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
                            <span className="hidden sm:inline">{languageOptions.find(l => l.value === uiLanguage)?.label || 'ENGLISH'}</span>
                            <span className="sm:hidden">{uiLanguage.toUpperCase()}</span>
                            <ChevronDownIcon className="w-3 h-3" />
                        </button>
                         <select 
                            value={uiLanguage} 
                            onChange={e => setUiLanguage(e.target.value as Language)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer bg-slate-900 text-white"
                        >
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
                        <button 
                            onClick={handleSignIn} 
                            disabled={isAuthLoading}
                            className="border border-cyan-500/50 text-cyan-500 px-4 sm:px-6 py-2 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-400 uppercase text-xs sm:text-sm font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAuthLoading && <LoaderIcon className="w-4 h-4" />}
                            {uiLanguage === 'ar' ? 'دخول' : 'SIGN IN'}
                        </button>
                    )}
                </div>
        </header>

        <main className="w-full space-y-6 flex-grow">
            {showSetupGuide && (
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 mb-6 z-50 relative">
                    <OwnerSetupGuide 
                        uiLanguage={uiLanguage} 
                        isApiConfigured={isApiConfigured} 
                        isFirebaseConfigured={!!getFirebase().app} 
                    />
                </div>
            )}

            <div className="glass-panel rounded-3xl p-5 md:p-8 space-y-6 relative bg-[#1e293b]/80 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)] border-2 border-cyan-500/50">
                
                {error && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{error}</p></div>}
                {micError && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{micError}</p></div>}
                
                <div className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 relative">
                     <ActionButton
                        icon={sourceButtonState.icon}
                        onClick={() => handleSpeak(sourceText, 'source')}
                        label={sourceButtonState.label}
                        className={`w-full sm:w-auto flex-1 max-w-xs ${sourceButtonState.className}`}
                    />
                    
                    <button
                        onClick={handleToggleListening}
                        title={isListening ? t('stopListening', uiLanguage) : t('voiceInput', uiLanguage)}
                        className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 transition-all shadow-xl z-20 active:scale-95 ${
                        isListening 
                        ? 'bg-red-900/30 border-red-500 text-red-500 animate-pulse' 
                        : 'bg-slate-800 border-cyan-500/50 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        }`}
                    >
                        <MicrophoneIcon className="h-8 w-8" />
                    </button>

                    <ActionButton
                        icon={targetButtonState.icon}
                        onClick={() => handleSpeak(translatedText, 'target')}
                        label={targetButtonState.label}
                        disabled={!translatedText.trim()}
                        className={`w-full sm:w-auto flex-1 max-w-xs ${targetButtonState.className}`}
                    />
                </div>

            </div>

             <div className="flex justify-center -mt-10 z-30 relative pointer-events-none">
                <div className="pointer-events-auto">
                     <button 
                        onClick={handleTranslate} 
                        disabled={isLoading} 
                        className="group relative px-12 py-4 rounded-2xl font-bold text-lg tracking-wider uppercase text-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-80 shadow-2xl overflow-hidden bg-slate-700 hover:text-white border-2 border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    >
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
                <ActionCard 
                    icon={linkCopied ? <CheckIcon className="text-green-400 w-10 h-10"/> : <LinkIcon className="w-10 h-10" />} 
                    label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} 
                    onClick={handleShareLink} 
                />
                <ActionCard 
                    icon={<DownloadIcon className="w-10 h-10" />} 
                    label={t('downloadButton', uiLanguage)} 
                    onClick={() => setIsDownloadOpen(true)} 
                    disabled={isLoading || (!sourceText && !translatedText) || isUsingSystemVoice} 
                />
                <ActionCard 
                    icon={<SoundEnhanceIcon className="text-cyan-400 w-10 h-10" />} 
                    label={t('audioStudio', uiLanguage)} 
                    onClick={handleAudioStudioOpen} 
                    disabled={false} 
                    highlight={false}
                />
                <ActionCard icon={<VideoCameraIcon className="w-10 h-10" />} label={uiLanguage === 'ar' ? 'دليل الاستخدام' : 'Tutorial'} onClick={() => setIsTutorialOpen(true)} />
            </div>
            
            <Suspense fallback={null}>
                <Feedback language={uiLanguage} onOpenReport={() => setIsReportOpen(true)} />
            </Suspense>
            
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </main>
        <footer className="w-full pt-4 pb-2 text-center text-slate-500 text-[10px] font-bold border-t border-slate-800 tracking-widest uppercase flex flex-col gap-1">
             <p>© {new Date().getFullYear()} Sawtli Pro • Audio Workstation v4.0</p>
             <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-slate-300 transition-colors underline decoration-slate-700">
                 {uiLanguage === 'ar' ? 'الخصوصية وشروط الاستخدام' : 'Privacy Policy & Terms'}
             </button>
        </footer>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} {...{sourceLang, targetLang, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices}} currentLimits={planConfig} onUpgrade={() => {setIsSettingsOpen(false); setIsUpgradeOpen(true);}} onRefreshVoices={() => window.speechSynthesis.getVoices()} />}
      {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onLoad={handleHistoryLoad}/>}
      {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} allowWav={planConfig.allowWav} onUpgrade={() => setIsUpgradeOpen(true)} />}
      
      {/* Keep AudioStudio mounted but hidden to persist state */}
      <AudioStudioModal 
          isOpen={isAudioStudioOpen}
          onClose={() => setIsAudioStudioOpen(false)} 
          uiLanguage={uiLanguage} 
          voice={voice} 
          sourceAudioPCM={lastGeneratedPCM}
          allowDownloads={planConfig.allowDownloads} 
          allowStudio={planConfig.allowStudio} 
          onUpgrade={() => setIsUpgradeOpen(true)} 
      />

      {isTutorialOpen && <TutorialModal onClose={() => setIsTutorialOpen(false)} uiLanguage={uiLanguage} />}
      {isUpgradeOpen && <UpgradeModal onClose={() => setIsUpgradeOpen(false)} uiLanguage={uiLanguage} currentTier={userTier} onUpgrade={handleUpgrade} onSignIn={() => { setIsUpgradeOpen(false); handleSignIn(); }} />}
      {isGamificationOpen && <GamificationModal onClose={() => setIsGamificationOpen(false)} uiLanguage={uiLanguage} userStats={userStats} onBoost={handleBoost} />}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} uiLanguage={uiLanguage} />}

      <Suspense fallback={null}>
          {isAccountOpen && <AccountModal 
              onClose={() => setIsAccountOpen(false)} 
              uiLanguage={uiLanguage}
              user={user}
              onSignOut={handleSignOutAndClose}
              onClearHistory={handleClearHistory}
              onDeleteAccount={handleDeleteAccount}
              currentTier={userTier}
              onUpgrade={() => { setIsAccountOpen(false); setIsUpgradeOpen(true); }}
              onSetDevMode={handleSetDevMode}
              onOpenOwnerGuide={() => { setIsAccountOpen(false); setShowSetupGuide(true); }}
          />}
          {isReportOpen && <ReportModal onClose={() => setIsReportOpen(false)} uiLanguage={uiLanguage} user={user} />}
      </Suspense>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

const LanguageSelect: React.FC<{ value: string; onChange: (value: string) => void; }> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 px-5 py-3 rounded-lg hover:border-cyan-500/50 transition-colors group shadow-sm relative min-w-[140px]">
            <GlobeIcon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors absolute left-3 pointer-events-none" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-base focus:outline-none uppercase cursor-pointer tracking-wide appearance-none pl-10 pr-6 py-1"
            >
                {translationLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-slate-800 text-white">{lang.name}</option>
                ))}
            </select>
            <ChevronDownIcon className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
    );
};

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}> = ({ icon, label, onClick, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`h-16 px-6 flex items-center justify-center gap-3 font-bold rounded-xl text-lg text-white tracking-wide uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:filter-none border-2 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${className}`}
    >
        {icon}
        <span className="drop-shadow-md">{label}</span>
    </button>
);

const ActionCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    highlight?: boolean;
}> = ({ icon, label, onClick, disabled, highlight }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none 
          bg-slate-800/50 border border-cyan-500/50 text-cyan-500/80 hover:border-cyan-400 hover:text-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:scale-105 transition-all duration-300 group`}
    >
        <div className={`transform transition-transform duration-200 group-hover:-translate-y-1 ${highlight ? 'text-cyan-400' : 'text-slate-300 group-hover:text-cyan-400'}`}>
             {React.cloneElement(icon as ReactElement<any>, { className: 'w-8 h-8 sm:w-10 sm:h-10' })}
        </div>
        <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-400 group-hover:text-white transition-colors`}>
            {label}
        </span>
    </button>
);

const DownloadModal: React.FC<{
    onClose: () => void;
    onDownload: (format: 'wav' | 'mp3') => void;
    uiLanguage: Language;
    isLoading: boolean;
    onCancel: () => void;
    allowWav: boolean;
    onUpgrade: () => void;
}> = ({ onClose, onDownload, uiLanguage, isLoading, onCancel, allowWav, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-2xl shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                        <DownloadIcon className="text-cyan-400"/> {t('downloadPanelTitle', uiLanguage)}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => onDownload('mp3')} 
                            disabled={isLoading}
                            className="btn-tactile flex flex-col items-center justify-center gap-3 p-6 rounded-xl group h-32 hover:bg-slate-700"
                        >
                            <span className="text-4xl font-black text-white group-hover:text-cyan-300 transition-colors">MP3</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standard</span>
                        </button>
                        <button 
                            onClick={() => allowWav ? onDownload('wav') : onUpgrade()}
                            disabled={isLoading}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl relative overflow-hidden border h-32 group transition-all ${allowWav ? 'bg-slate-700 border-slate-600 hover:border-cyan-500/50 hover:bg-slate-600' : 'bg-slate-800 border-slate-700 opacity-60'}`}
                        >
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

export default App;
