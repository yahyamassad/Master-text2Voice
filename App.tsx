
import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy, ReactElement } from 'react';
import { generateSpeech, translateText, previewVoice } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon, ReportIcon, PauseIcon, VideoCameraIcon, StarIcon, LockIcon, SparklesIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, translations } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig, GEMINI_VOICES, PLAN_LIMITS, UserTier, UserStats } from './types';
// FIX: Import Auth functions from SDK directly, instances from config
import { getFirebase } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument } from './services/firestoreService';
import { AudioStudioModal } from './components/AudioStudioModal'; 
import SettingsModal from './components/SettingsModal';
import TutorialModal from './components/TutorialModal';
import UpgradeModal from './components/UpgradeModal';
import GamificationModal from './components/GamificationModal';
import OwnerSetupGuide from './components/OwnerSetupGuide';

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
  const [isPaused, setIsPaused] = useState<boolean>(false); // New state for Pause/Resume
  const [error, setError] = useState<string | null>(null);
  
  // Auth State & Tiers
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  // REMOVED stale useMemo for isFirebaseConfigured to prevent logic traps
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(true); // Assume true initially to prevent flash
  
  // Subscription State (Mock for Demo)
  const [userSubscription, setUserSubscription] = useState<'free' | 'gold' | 'platinum'>('free');
  
  // Owner/Dev State override - DISABLED BY DEFAULT FOR PRODUCTION
  // Use the secret key 'sawtli-master' in Account > Developer Powers to activate.
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  // Guide Visibility State
  // HIDDEN BY DEFAULT. Only visible if 'setup=true' is in URL.
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Check for Setup Trigger in URL
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('setup') === 'true') {
          setShowSetupGuide(true);
      }
  }, []);

  // User Statistics for Quotas & Gamification
  // Initialized with safe defaults, updated from storage on load
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

  // Panels and Modals State
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
  
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  
  // Settings State
  // Use a system voice by default for the free "Taste" experience
  const [voice, setVoice] = useState('Google US English'); 
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(1.0);
  const [speed, setSpeed] = useState(1.0); // Speed state
  const [seed, setSeed] = useState(42); // Seed for deterministic output
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'Kore' });
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);


  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Store the LAST generated PCM audio for editing in the Studio
  const [lastGeneratedPCM, setLastGeneratedPCM] = useState<Uint8Array | null>(null);

  // Refs
  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const sourceTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const effectsDropdownRef = useRef<HTMLDivElement>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Caching Ref - Stores PCM data
  const audioCacheRef = useRef<Map<string, Uint8Array>>(new Map());
  
  // Keep a reference to an AudioContext to reuse it and bypass autoplay blocks
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- PLAYBACK TRACKING FOR GEMINI RESUME ---
  const playbackStartTimeRef = useRef<number>(0);
  const playbackOffsetRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false); // Ref to track pause state inside callbacks

  // --- DERIVED STATE FOR TIERS & LIMITS ---
  const userTier: UserTier = isDevMode ? 'admin' : (user ? userSubscription : 'visitor');
  const planConfig = PLAN_LIMITS[userTier];
  
  // Calculate dynamic limits based on stats
  const currentDailyLimit = planConfig.dailyLimit; // Base daily limit
  const effectiveTotalLimit = planConfig.totalTrialLimit + userStats.bonusChars;
  const daysSinceStart = Math.floor((Date.now() - userStats.trialStartDate) / (1000 * 60 * 60 * 24));
  const isTrialExpired = userTier === 'free' && daysSinceStart > planConfig.trialDays;
  
  // Calculate remaining
  const dailyCharsRemaining = Math.max(0, currentDailyLimit - userStats.dailyCharsUsed);
  const totalCharsRemaining = Math.max(0, effectiveTotalLimit - userStats.totalCharsUsed);
  
  // Logic for "Over Limit"
  const isDailyLimitReached = userTier !== 'admin' && userStats.dailyCharsUsed >= currentDailyLimit;
  const isTotalLimitReached = userTier !== 'admin' && userStats.totalCharsUsed >= effectiveTotalLimit;
  
  const isOverLimit = (textLength: number) => {
      if (userTier === 'admin') return false;
      if (isTrialExpired) return true;
      if (userTier === 'visitor') return textLength > planConfig.maxCharsPerRequest;
      
      // For free users, check remaining capacity
      return textLength > dailyCharsRemaining || textLength > totalCharsRemaining;
  };

  const isProOrAbove = userTier === 'gold' || userTier === 'platinum' || userTier === 'admin';

  // --- CORE FUNCTIONS ---
  
  // --- STATS MANAGEMENT ---
  const loadUserStats = (userId: string) => {
      const key = `sawtli_stats_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
          const parsed = JSON.parse(stored);
          // Check if day changed to reset daily usage
          const today = new Date().toISOString().split('T')[0];
          if (parsed.lastUsageDate !== today) {
              parsed.dailyCharsUsed = 0;
              parsed.lastUsageDate = today;
              localStorage.setItem(key, JSON.stringify(parsed));
          }
          setUserStats(parsed);
      } else {
          // Initialize new stats
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
      if (userTier === 'admin' || userTier === 'visitor') return; // Don't track admin or visitor persistently like this
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
              // Share gives daily boost? No, let's add to total capacity effectively extending trial volume
              // Or maybe just add a chunk. Let's add 50 chars to TOTAL allowed.
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
          // Invite logic would go here
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
    // Check if API Key is configured on server
    fetch('/api/check-config')
        .then(res => res.json())
        .then(data => setIsApiConfigured(!!data.configured))
        .catch(() => setIsApiConfigured(false)); // If fetch fails, assume config issue or network

    // INITIAL AUTH CHECK
    const { app, auth } = getFirebase();
    if (auth) {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthLoading(false);

            if (firestoreUnsubscribeRef.current) {
                firestoreUnsubscribeRef.current();
                firestoreUnsubscribeRef.current = null;
            }

            if (currentUser) {
                // If user is logged in, hide guide
                setShowSetupGuide(false);

                setUserSubscription('free'); // Default to free trial logic
                loadUserStats(currentUser.uid); // Load stats
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
            unsubscribeAuth();
             if (firestoreUnsubscribeRef.current) firestoreUnsubscribeRef.current();
        };
    } else {
        // Fallback if auth init fails temporarily
        setIsAuthLoading(false);
        try {
            const savedHistory = localStorage.getItem('sawtli_history');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Failed to load history", e); }
    }
  }, []); // Run once on mount. getFirebase() is stable.

  // --- ROBUST SYSTEM VOICE LOADING ---
  // Helper to refresh voices and update state if changed
  const refreshVoices = useCallback(() => {
      const voices = window.speechSynthesis.getVoices();
      setSystemVoices(prev => {
          // Update if count changed OR if we had 0 voices and now have some
          if (voices.length !== prev.length || (prev.length === 0 && voices.length > 0)) {
              return voices;
          }
          return prev;
      });
      
      // Ensure current voice selection is valid
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

    // Aggressive Polling for Mobile/Chrome that might miss the event
    // Some browsers (Chrome Android) load voices asynchronously without firing events reliably
    const intervalId = setInterval(refreshVoices, 1000);

    // Keep Alive for SpeechSynthesis (it times out after 15s in Chrome)
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

      // --- QUOTA CHECKING LOGIC ---
      // Visitor: strict 100 chars.
      if (userTier === 'visitor') {
          if (text.length > planConfig.maxCharsPerRequest) {
              // "The Sip" Strategy: We truncate later
          }
      } else {
          // Member Logic
          if (isTrialExpired) {
              setError(t('trialExpired', uiLanguage));
              setIsUpgradeOpen(true);
              return;
          }
          if (isDailyLimitReached) {
              setError(t('dailyLimitReached', uiLanguage));
              setIsGamificationOpen(true); // Offer boost
              return;
          }
          if (isTotalLimitReached) {
              setError(t('totalLimitReached', uiLanguage));
              setIsUpgradeOpen(true);
              return;
          }
          // If text is longer than remaining daily quota
          if (text.length > dailyCharsRemaining) {
              setError(`${t('dailyLimitReached', uiLanguage)}. (${dailyCharsRemaining} chars left)`);
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
            
            // --- "THE SIP" & TRUNCATION LOGIC ---
            let textToProcess = text;
            if (userTier === 'visitor' && text.length > planConfig.maxCharsPerRequest) {
                textToProcess = text.substring(0, planConfig.maxCharsPerRequest);
            }

            const cacheKey = getCacheKey(textToProcess); // Cache based on what we actually send
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
                         setError("Timeout: Generation took too long.");
                     }
                }, 45000); 

                apiAbortControllerRef.current = new AbortController();
                const signal = apiAbortControllerRef.current.signal;

                try {
                    const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
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
                        
                        // --- CONSUME QUOTA ---
                        // Only consume if it was a fresh generation (not cached)
                        if (userTier !== 'visitor' && userTier !== 'admin') {
                            updateUserStats(textToProcess.length);
                        }
                    }

                } catch (err: any) {
                    clearTimeout(warmUpTimer);
                    clearTimeout(clientTimeout);
                    if (err.message !== 'Aborted' && err.name !== 'AbortError') {
                        console.error("Audio generation failed:", err);
                        setError(err.message || t('errorUnexpected', uiLanguage));
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
                             
                             // Visitor Tease after playback ends
                             if (userTier === 'visitor' && text.length > planConfig.maxCharsPerRequest) {
                                 setTimeout(() => setIsUpgradeOpen(true), 500);
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
                    // Fallback logic: case-insensitive match and loose searching
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
                        setError(t('errorSpeechGenerationSystem', uiLanguage).replace('{voiceName}', voice));
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
            setError(t('errorSpeechGeneration', uiLanguage));
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
      // Translate consumes quota? No, translation is usually cheap/free in this model
      // But let's apply the generic "Over Limit" check just in case user pastes a book
      if (userTier !== 'admin' && sourceText.length > 2000) {
           setError(t('errorFileTooLarge', uiLanguage)); // Reusing error message for simplicity
           return;
      }

      setIsLoading(true);
      setLoadingTask(t('translatingButton', uiLanguage));
      setError(null);
      setTranslatedText('');

      apiAbortControllerRef.current = new AbortController();
      const signal = apiAbortControllerRef.current.signal;
      
      try {
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
              setError(err.message || t('errorTranslate', uiLanguage));
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
      
      // Gamification: Share Bonus
      if (user) handleBoost('share');
  };

  const generateAudioBlob = useCallback(async (text: string, format: 'wav' | 'mp3') => {
    if (!text.trim()) return null;

    if (format === 'wav' && !planConfig.allowWav) {
        setIsUpgradeOpen(true);
        return null;
    }
    if (!planConfig.allowDownloads) {
        setIsUpgradeOpen(true);
        return null;
    }

    if (!GEMINI_VOICES.includes(voice)) {
        setError(t('errorDownloadSystemVoice', uiLanguage));
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
            
            // CONSUME QUOTA FOR DOWNLOAD? 
            // Usually we charged at generation. Downloading cached audio should be free.
            // If we regenerated, generateSpeech logic inside would consume.
            // BUT wait, handleSpeak consumes. generateAudioBlob calls generateSpeech directly.
            // So yes, generateSpeech logic needs to know if it should consume.
            // For now, let's assume downloading consumes quota if not cached.
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
          setError(err.message || (format === 'mp3' ? t('errorMp3Encoding', uiLanguage) : t('errorSpeechGeneration', uiLanguage)));
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
  }, [translatedText, sourceText, generateAudioBlob]);
  
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
      if(planConfig.allowStudio) {
          setIsAudioStudioOpen(true);
      } else {
          setIsUpgradeOpen(true);
      }
  };


  const getButtonState = (target: 'source' | 'target') => {
      const isThisPlayerActive = activePlayer === target;
      const isGemini = GEMINI_VOICES.includes(voice);

      if (isLoading && (loadingTask.startsWith(t('generatingSpeech', uiLanguage)) || loadingTask.startsWith(t('warmingUp', uiLanguage))) && isThisPlayerActive) {
           return { 
             icon: <StopIcon />, 
             label: t('stopSpeaking', uiLanguage), 
             className: 'bg-red-600 hover:bg-red-500 animate-pulse shadow-red-900/50 border-red-500' 
            };
      }
      
      if (isThisPlayerActive) {
          return {
              icon: isPaused ? <PlayCircleIcon className="h-6 w-6" /> : <PauseIcon />,
              label: isPaused ? t('resumeSpeaking', uiLanguage) : t('pauseSpeaking', uiLanguage),
              className: isPaused ? 'bg-green-600 hover:bg-green-500 border-green-500 shadow-green-900/50' : 'bg-amber-600 hover:bg-amber-500 border-amber-500 shadow-amber-900/50'
          };
      }
      
      const defaultLabel = target === 'source' ? t('speakSource', uiLanguage) : t('speakTarget', uiLanguage);
      const className = 'bg-slate-800 hover:bg-slate-700 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] text-cyan-400';

      return { icon: <SpeakerIcon className="text-cyan-400" />, label: defaultLabel, className };
  };

  const handleSignIn = async () => {
      console.log("Attempting to Sign In...");
      // CRITICAL FIX: Attempt to get the auth instance safely.
      const { auth } = getFirebase();
      
      // SAFE ACCESS to environment variable to prevent crashes in preview
      const env = (import.meta as any)?.env || {};
      const envApiKey = env.VITE_FIREBASE_API_KEY;

      // 1. Check if Env Vars exist at all.
      if (!envApiKey) {
          // Explicit alert for debugging the silent failure
          alert("Configuration Error: VITE_FIREBASE_API_KEY is missing in the browser.\n\nIf you are on Vercel: You MUST Redeploy (rebuild) the app after adding Environment Variables for them to take effect.");
          
          setShowSetupGuide(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      // 2. If Env Vars exist but 'auth' is null, it means Initialization FAILED.
      if (!auth) {
          const isRtl = uiLanguage === 'ar';
          const msg = isRtl 
            ? "فشل تهيئة خدمة Firebase. يرجى التحقق من صحة مفاتيح API في المتغيرات وإعادة تحميل الصفحة."
            : "Firebase initialization failed. Please check your API keys in environment variables and refresh.";
          alert(msg);
          console.error("Sign-in blocked: Auth not initialized despite env vars present.");
          return;
      }
      
      // 3. Proceed with Sign In
      setIsAuthLoading(true);
      const provider = new GoogleAuthProvider();
      
      try {
          console.log("Calling signInWithPopup...");
          const result = await signInWithPopup(auth, provider);
          console.log("Sign In Successful", result.user.uid);
          
          setUser(result.user);
          
          // Re-initialize listeners with new user
          loadUserStats(result.user.uid);
          if (firestoreUnsubscribeRef.current) firestoreUnsubscribeRef.current();
          firestoreUnsubscribeRef.current = subscribeToHistory(result.user.uid, (items) => {
              setHistory(items);
          });

      } catch (error: any) {
          console.error("Sign-in error:", error);
          
          const errorCode = error.code;
          const errorMessage = error.message;
          const errorString = JSON.stringify(error).toLowerCase();

          // --- INTELLIGENT ERROR HANDLING ---
          
          // Check for Google Cloud API Key restrictions (Referer Blocked)
          if (errorString.includes('blocked') || errorString.includes('referer') || errorString.includes('403') || errorString.includes('missing required data')) {
               const domain = window.location.origin;
               const isRtl = uiLanguage === 'ar';
               const msg = isRtl
                 ? `🛑 تنبيه أمني: تم رفض الاتصال.\n\nالسبب المرجح: مفتاح API الخاص بك مقيد ولا يسمح للنطاق الحالي بالوصول.\n\nالحل:\n1. اذهب إلى Google Cloud Console > Credentials\n2. عدّل مفتاح API وأضف هذه الروابط إلى "Web Restrictions":\n   - https://${window.location.hostname}/*\n   - https://YOUR-PROJECT-ID.firebaseapp.com/*`
                 : `🛑 Security Alert: Connection Refused.\n\nLikely Cause: Your API Key restrictions block this domain.\n\nFix:\n1. Go to Google Cloud Console > Credentials\n2. Edit your API Key and add these URLs to "Web Restrictions":\n   - https://${window.location.hostname}/*\n   - https://YOUR-PROJECT-ID.firebaseapp.com/*`;
               alert(msg);
               return;
          }

          if (errorCode === 'auth/popup-closed-by-user') {
               // If closed by user AND not on localhost, it's often a configuration crash
               if (window.location.hostname !== 'localhost') {
                   const isRtl = uiLanguage === 'ar';
                   const msg = isRtl
                     ? `⚠️ تم إغلاق النافذة فجأة.\n\nإذا لم تقم بإغلاقها بنفسك، فهذا يعني أن نطاق "${window.location.hostname}" غير مسموح له بالدخول.\n\nالحل: أضف هذا النطاق إلى قائمة "Authorized Domains" في Firebase Console > Authentication.`
                     : `⚠️ Popup Closed Unexpectedly.\n\nIf you didn't close it, it means "${window.location.hostname}" is not authorized.\n\nFix: Add this domain to "Authorized Domains" in Firebase Console > Authentication.`;
                   alert(msg);
               }
          } else if (errorCode === 'auth/operation-not-allowed') {
               const isRtl = uiLanguage === 'ar';
               const msg = isRtl 
                 ? `خطأ: العملية غير مسموح بها (${errorCode}).\nيرجى التأكد من تفعيل مزود Google في Firebase Console > Authentication.`
                 : `Error: Operation not allowed (${errorCode}).\nPlease ensure the Google provider is enabled in Firebase Console > Authentication.`;
               alert(msg);
          } else if (errorCode === 'auth/unauthorized-domain') {
               const domain = window.location.hostname;
               const isRtl = uiLanguage === 'ar';
               const msg = isRtl 
                 ? `🛑 النطاق غير مصرح به (${errorCode}).\n\nالنطاق الحالي: ${domain}\n\nالحل: يجب إضافة هذا النطاق إلى قائمة "Authorized Domains" في Firebase Console > Authentication > Settings.`
                 : `🛑 Unauthorized Domain (${errorCode}).\n\nCurrent Domain: ${domain}\n\nFix: Add this domain to "Authorized Domains" in Firebase Console > Authentication > Settings.`;
               alert(msg);
          } else if (errorCode === 'auth/invalid-api-key') {
               alert("Invalid API Key. Please check Vercel environment variables.");
          } else {
               // Fallback: Show the raw code to help debugging
               const isRtl = uiLanguage === 'ar';
               const msg = isRtl 
                 ? `فشل تسجيل الدخول.\nالكود: ${errorCode}\nالرسالة: ${errorMessage}\n\nنصيحة للمطور: تأكد من إعدادات OAuth Client ID في Google Cloud.`
                 : `Sign-in failed.\nCode: ${errorCode}\nMessage: ${errorMessage}\n\nTip for Dev: Check OAuth Client ID settings in Google Cloud.`;
               alert(msg);
          }
      } finally {
          setIsAuthLoading(false);
      }
  };

  const handleSignOut = useCallback(() => {
      const { auth } = getFirebase();
      
      // Force clear dev mode sticky session
      sessionStorage.removeItem('sawtli_dev_mode');
      setIsDevMode(false);

      if (auth) {
          signOut(auth).catch(error => console.error("Sign-out error:", error));
      }
      
      // Manually clear state to ensure UI updates immediately
      setUser(null);
      setHistory([]);
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (user) {
        if(window.confirm(t('clearCloudHistoryInfo', uiLanguage))) {
            try {
                await clearHistoryForUser(user.uid);
                alert(t('historyClearSuccess', uiLanguage));
            } catch (e) {
                console.error(e);
                alert(t('historyClearError', uiLanguage));
            }
        }
    } else {
        setHistory([]);
        localStorage.removeItem('sawtli_history');
    }
  }, [user, uiLanguage]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    if (window.confirm(t('deleteAccountConfirmationPrompt', uiLanguage))) {
        setIsLoading(true);
        setLoadingTask('Deleting account...');
        try {
            await clearHistoryForUser(user.uid);
            await deleteUserDocument(user.uid);
            // Note: Ideally we should delete the Auth user too, but that requires strict re-authentication.
            // For this demo, we just wipe data and sign out.
            
            alert(t('accountDeletedSuccess', uiLanguage));
            setIsAccountOpen(false);
            handleSignOut(); // Log them out
        } catch (error) {
            console.error("Account deletion error:", error);
            setError(t('accountDeletionError', uiLanguage));
        } finally {
            setIsLoading(false);
            setLoadingTask('');
        }
    }
  }, [user, uiLanguage, handleSignOut]);

  const handleSignOutAndClose = useCallback(() => {
    handleSignOut();
    setIsAccountOpen(false);
  }, [handleSignOut]);
  
  const handleSetDevMode = (enabled: boolean) => {
      setIsDevMode(enabled);
      if(enabled) {
          sessionStorage.setItem('sawtli_dev_mode', 'true');
      } else {
          sessionStorage.removeItem('sawtli_dev_mode');
      }
  };
  
  const handleUpgrade = (tier: 'gold' | 'platinum') => {
      setIsUpgradeOpen(false);
  };


  // --- RENDER ---
  const sourceButtonState = getButtonState('source');
  const targetButtonState = getButtonState('target');
  const isUsingSystemVoice = !GEMINI_VOICES.includes(voice);
  const isSourceRtl = translationLanguages.find(l => l.code === sourceLang)?.code === 'ar';
  const isTargetRtl = translationLanguages.find(l => l.code === targetLang)?.code === 'ar';
  const isUiRtl = uiLanguage === 'ar';

  // --- VISUAL QUOTA INDICATOR ---
  const QuotaIndicator = () => {
      if (userTier === 'admin' || userTier === 'gold' || userTier === 'platinum') return null;
      
      if (userTier === 'visitor') {
          return (
              <div className="w-full h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-4 text-xs font-mono font-bold tracking-widest text-slate-500 select-none relative overflow-hidden">
                   <span className="text-cyan-500/70">VISITOR MODE</span>
                   <span className="text-amber-500 cursor-pointer hover:underline" onClick={() => setIsUpgradeOpen(true)}>
                       {uiLanguage === 'ar' ? 'سجل للحصول على 5000 حرف' : 'Sign In for 5000 chars'}
                   </span>
              </div>
          );
      }

      // Free User Logic
      return (
          <div className="w-full h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-4 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-500 select-none relative overflow-hidden">
               {/* Daily Progress */}
               <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-500 ${isDailyLimitReached ? 'bg-red-500' : 'bg-cyan-500'}`} 
                    style={{ width: `${Math.min(100, (userStats.dailyCharsUsed / currentDailyLimit) * 100)}%` }}>
               </div>
               
               <div className="flex items-center gap-3 z-10">
                   <span className={isDailyLimitReached ? 'text-red-500' : 'text-cyan-500'}>
                       {t('dailyUsageLabel', uiLanguage)}: {userStats.dailyCharsUsed} / {currentDailyLimit}
                   </span>
                   {isDailyLimitReached && !isTotalLimitReached && (
                       <button 
                        onClick={() => setIsGamificationOpen(true)} 
                        className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] animate-pulse hover:bg-amber-500"
                       >
                           {t('boostQuota', uiLanguage)}
                       </button>
                   )}
               </div>

               <div className="flex items-center gap-2 z-10">
                   <span className={isTrialExpired ? 'text-red-500' : 'text-slate-400'}>
                       {t('daysLeft', uiLanguage)}: {planConfig.trialDays - daysSinceStart}
                   </span>
               </div>
          </div>
      );
  };

  const sourceTextArea = (
    <div className="flex flex-col w-full md:w-1/2">
      {/* INNER CONTAINER - Clean styling without heavy stroke */}
      <div className="relative group rounded-2xl border border-slate-700/50 bg-[#0f172a] overflow-hidden h-full flex flex-col">
              
              {/* HEADER: Language Select & Tools */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-[#1e293b]/30 backdrop-blur-sm">
                  <LanguageSelect value={sourceLang} onChange={setSourceLang} />
                  
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleCopy(sourceText, 'source')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                          {copiedSource ? <CheckIcon className="h-4 w-4 text-green-400"/> : <CopyIcon className="h-4 w-4" />}
                      </button>
                       {/* Effects Button */}
                      <div className={`relative ${isUsingSystemVoice || !planConfig.allowEffects ? 'opacity-70' : ''}`} ref={effectsDropdownRef}>
                          <button
                              onClick={() => planConfig.allowEffects ? setIsEffectsOpen(!isEffectsOpen) : setIsUpgradeOpen(true)}
                              disabled={isUsingSystemVoice}
                              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 rounded-lg transition-colors"
                              title={!planConfig.allowEffects ? "Upgrade to unlock effects" : t('soundEffects', uiLanguage)}
                          >
                              <SparklesIcon className="w-4 h-4" />
                          </button>
                           {isEffectsOpen && (
                              <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-30 w-56 animate-fade-in-down max-h-64 overflow-y-auto">
                                  {soundEffects.map(effect => (
                                    <button
                                      key={effect.tag}
                                      onClick={() => handleInsertTag(effect.tag)}
                                      className="w-full flex items-center gap-3 text-left px-4 py-3 text-slate-200 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                                    >
                                      <span className="text-lg leading-none">{effect.emoji}</span>
                                      <span className="text-xs font-bold uppercase tracking-wider">{t(effect.labelKey as any, uiLanguage)}</span>
                                    </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* BODY: Text Area */}
              <div className="flex-grow relative bg-[#0f172a]">
                  <textarea
                      ref={sourceTextAreaRef}
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder={t('placeholder', uiLanguage)}
                      // Note: Max length is just a UI safeguard, real check happens on Speak click
                      maxLength={userTier === 'admin' ? 999999 : 5000} 
                      dir={isSourceRtl ? 'rtl' : 'ltr'}
                      className={`w-full h-64 sm:h-72 p-5 bg-transparent border-none resize-none text-lg md:text-xl font-normal leading-loose tracking-normal focus:ring-0 outline-none placeholder-slate-600 text-slate-200
                        ${isSourceRtl ? 'text-right' : 'text-left'}`}
                  />
              </div>
              
              {/* FOOTER: Counters & HUD */}
              <QuotaIndicator />
      </div>
    </div>
  );

  const translatedTextArea = (
      <div className="flex flex-col w-full md:w-1/2">
           {/* INNER CONTAINER - Clean styling without heavy stroke */}
           <div className="relative group rounded-2xl border border-slate-700/50 bg-[#0f172a] overflow-hidden h-full flex flex-col">
                    
                    {/* HEADER */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-[#1e293b]/30 backdrop-blur-sm">
                        <LanguageSelect value={targetLang} onChange={setTargetLang} />
                        <button onClick={() => handleCopy(translatedText, 'target')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                            {copiedTarget ? <CheckIcon className="h-4 w-4 text-green-400"/> : <CopyIcon className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-grow bg-[#0f172a]">
                        <textarea
                            value={translatedText}
                            readOnly
                            placeholder={t('translationPlaceholder', uiLanguage)}
                            dir={isTargetRtl ? 'rtl' : 'ltr'}
                            className={`w-full h-64 sm:h-72 p-5 bg-transparent border-none resize-none text-lg md:text-xl font-normal leading-loose tracking-normal focus:ring-0 outline-none placeholder-slate-600 text-slate-200
                                ${isTargetRtl ? 'text-right' : 'text-left'}`}
                        />
                    </div>

                     {/* FOOTER */}
                    <div className="w-full h-10 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-4 text-sm font-mono font-bold tracking-widest text-slate-500 select-none">
                        <span className="text-cyan-500/70">TRANSLATION</span>
                        <span>{translatedText.length.toString().padStart(4, '0')} CHARS</span>
                    </div>
           </div>
      </div>
  );

  const swapButton = (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 my-6 md:my-0 pointer-events-none">
         <button onClick={swapLanguages} title={t('swapLanguages', uiLanguage)} className="pointer-events-auto h-12 w-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-full transition-all active:scale-90 border border-slate-600 hover:border-cyan-400 shadow-xl group">
            <SwapIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>
     </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-6 relative overflow-hidden bg-[#0f172a] text-slate-50">
      
      {/* Background Gradient Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[100px]"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-2rem)] z-10 relative">

        {/* Header - New Layout: Left(Lang Btn) - Center(Stacked Logo) - Right(Sign In Btn) */}
        <header className="flex items-center justify-between w-full my-6 py-4 px-4 sm:px-8 relative z-40 mt-12">
                
                {/* Left: Language Button */}
                 <div className="flex justify-start w-1/3">
                    <div className="relative group">
                        <button className="border border-cyan-500/50 text-cyan-500 px-6 sm:px-8 py-3 rounded-lg hover:bg-cyan-950/30 hover:border-cyan-400 uppercase text-base sm:text-lg font-bold tracking-widest transition-all flex items-center gap-2">
                            <span className="hidden sm:inline">{languageOptions.find(l => l.value === uiLanguage)?.label || 'ENGLISH'}</span>
                            <span className="sm:hidden">{uiLanguage.toUpperCase()}</span>
                            <ChevronDownIcon className="w-3 h-3" />
                        </button>
                        {/* Dropdown logic */}
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

                {/* Center: Stacked Logo (New SVG) */}
                <div className="flex flex-col items-center justify-center w-1/3">
                     <SawtliLogoIcon className="w-auto h-16 sm:h-24" />
                </div>

                {/* Right: Auth Button */}
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
            {/* Owner Setup Guide - HIDDEN by default unless ?setup=true is in URL or force shown */}
            {showSetupGuide && !user && (
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 mb-6 z-50 relative">
                    <OwnerSetupGuide 
                        uiLanguage={uiLanguage} 
                        isApiConfigured={isApiConfigured} 
                        // FIX: Passing the correct client-side config check from getFirebase
                        isFirebaseConfigured={!!getFirebase().app} 
                    />
                </div>
            )}

            {/* Main Interface Panel - Added Turquoise Stroke & Glow Here */}
            <div className="glass-panel rounded-3xl p-5 md:p-8 space-y-6 relative bg-[#1e293b]/80 backdrop-blur-sm shadow-[0_0_20px_rgba(34,211,238,0.15)] border-2 border-cyan-500/50">
                
                {error && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{error}</p></div>}
                {micError && <div className="bg-red-950/50 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm mb-4 font-bold flex items-center gap-3 animate-fade-in-down"><WarningIcon className="w-5 h-5 flex-shrink-0 text-red-400"/> <p>{micError}</p></div>}
                
                <div className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
                
                {/* Centralized Controls Row */}
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

            {/* Translate Button (Floating) */}
             <div className="flex justify-center -mt-10 z-30 relative pointer-events-none">
                <div className="pointer-events-auto">
                     <button 
                        onClick={handleTranslate} 
                        disabled={isLoading} 
                        className="group relative px-12 py-4 rounded-2xl font-bold text-lg tracking-wider uppercase text-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-80 shadow-2xl overflow-hidden bg-slate-700 hover:text-white border-2 border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    >
                        {/* Fancy Gradient Hover Effect */}
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-3">
                             {isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage)) ? <LoaderIcon className="w-6 h-6"/> : <TranslateIcon className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />}
                             <span>{isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage)) ? loadingTask : t('translateButton', uiLanguage)}</span>
                        </div>
                     </button>
                </div>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pb-4">
                <ActionCard icon={<GearIcon className="w-10 h-10" />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
                <ActionCard icon={<HistoryIcon className="w-10 h-10" />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
                <ActionCard 
                    icon={linkCopied ? <CheckIcon className="text-green-400 w-10 h-10"/> : <LinkIcon className="w-10 h-10" />} 
                    label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} 
                    onClick={handleShareLink} 
                />
                <ActionCard 
                    icon={!planConfig.allowDownloads ? <LockIcon className="text-amber-500 w-10 h-10"/> : <DownloadIcon className="w-10 h-10" />} 
                    label={t('downloadButton', uiLanguage)} 
                    onClick={() => planConfig.allowDownloads ? setIsDownloadOpen(true) : setIsUpgradeOpen(true)} 
                    disabled={isLoading || (!sourceText && !translatedText) || isUsingSystemVoice} 
                />
                <ActionCard 
                    icon={!planConfig.allowStudio ? <LockIcon className="text-amber-500 w-10 h-10"/> : <SoundEnhanceIcon className="text-cyan-400 w-10 h-10" />} 
                    label={t('audioStudio', uiLanguage)} 
                    onClick={handleAudioStudioOpen} 
                    disabled={false} 
                    highlight={true}
                />
                <ActionCard icon={<VideoCameraIcon className="w-10 h-10" />} label={uiLanguage === 'ar' ? 'دليل الاستخدام' : 'Tutorial'} onClick={() => setIsTutorialOpen(true)} />
            </div>
            
            {/* --- FEEDBACK SECTION (Lazy Loaded but inline) --- */}
            <Suspense fallback={null}>
                <Feedback language={uiLanguage} onOpenReport={() => setIsReportOpen(true)} />
            </Suspense>

        </main>
        <footer className="w-full pt-4 pb-2 text-center text-slate-500 text-[10px] font-bold border-t border-slate-800 tracking-widest uppercase">
             <p>© {new Date().getFullYear()} Sawtli Pro • Audio Workstation v4.0</p>
        </footer>
      </div>

      {/* --- MODALS RENDERED HERE AT ROOT LEVEL --- */}
      {/* This prevents stacking context issues with the header/main wrapper */}
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} {...{sourceLang, targetLang, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration, speed, setSpeed, seed, setSeed, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices}} currentLimits={planConfig} onUpgrade={() => {setIsSettingsOpen(false); setIsUpgradeOpen(true);}} onRefreshVoices={() => window.speechSynthesis.getVoices()} />}
      {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onLoad={handleHistoryLoad}/>}
      {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} allowWav={planConfig.allowWav} onUpgrade={() => setIsUpgradeOpen(true)} />}
      {isAudioStudioOpen && <AudioStudioModal 
          onClose={() => setIsAudioStudioOpen(false)} 
          uiLanguage={uiLanguage} 
          voice={voice} 
          sourceAudioPCM={lastGeneratedPCM}
          allowDownloads={planConfig.allowDownloads} // Pass explicit permission
          onUpgrade={() => setIsUpgradeOpen(true)} // Pass upgrade handler
      />}
      {isTutorialOpen && <TutorialModal onClose={() => setIsTutorialOpen(false)} uiLanguage={uiLanguage} />}
      {isUpgradeOpen && <UpgradeModal onClose={() => setIsUpgradeOpen(false)} uiLanguage={uiLanguage} currentTier={userTier} onUpgrade={handleUpgrade} onSignIn={() => { setIsUpgradeOpen(false); handleSignIn(); }} />}
      {isGamificationOpen && <GamificationModal onClose={() => setIsGamificationOpen(false)} uiLanguage={uiLanguage} userStats={userStats} onBoost={handleBoost} />}

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
          />}
          {isReportOpen && <ReportModal onClose={() => setIsReportOpen(false)} uiLanguage={uiLanguage} user={user} />}
      </Suspense>

    </div>
  );
};


// --- SUB-COMPONENTS ---

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
