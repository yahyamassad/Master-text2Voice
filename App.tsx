import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy } from 'react';
import { generateSpeech, translateText, previewVoice } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, translations } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig } from './types';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebase } from './firebaseConfig';
import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument } from './services/firestoreService';


const Feedback = lazy(() => import('./components/Feedback'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const AudioStudioModal = lazy(() => import('./components/AudioStudioModal'));

interface SettingsModalProps {
  onClose: () => void;
  uiLanguage: Language;
  voice: string;
  setVoice: React.Dispatch<React.SetStateAction<string>>;
  emotion: string;
  setEmotion: React.Dispatch<React.SetStateAction<string>>;
  pauseDuration: number;
  setPauseDuration: React.Dispatch<React.SetStateAction<number>>;
  multiSpeaker: boolean;
  setMultiSpeaker: React.Dispatch<React.SetStateAction<boolean>>;
  speakerA: SpeakerConfig;
  setSpeakerA: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  speakerB: SpeakerConfig;
  setSpeakerB: React.Dispatch<React.SetStateAction<SpeakerConfig>>;
  systemVoices: SpeechSynthesisVoice[];
  sourceLang: string;
  targetLang: string;
}

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

const geminiVoices = ['Puck', 'Kore', 'Charon', 'Zephyr', 'Fenrir'];

// Main App Component
const App: React.FC = () => {
  const MAX_CHARS_PER_REQUEST = 5000;
  // --- STATE MANAGEMENT ---
  const [uiLanguage, setUiLanguage] = useState<Language>('ar');
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('ar');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTask, setLoadingTask] = useState<string>('');
  const [activePlayer, setActivePlayer] = useState<'source' | 'target' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const { isFirebaseConfigured } = useMemo(() => getFirebase(), []);


  // Server Health Check State
  const [serverConfig, setServerConfig] = useState<{ status: 'checking' | 'configured' | 'unconfigured', error: string | null }>({ status: 'checking', error: null });

  // Panels and Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isSharingAudio, setIsSharingAudio] = useState<boolean>(false);

  // Settings State
  const [voice, setVoice] = useState('Puck'); // Now stores voice name for both Gemini and System
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(1.0); // Default to 1s for better experience
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'Kore' });
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);


  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Refs
  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const sourceTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const effectsDropdownRef = useRef<HTMLDivElement>(null);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);


  // --- CORE FUNCTIONS ---
  
  const stopAll = useCallback(() => {
    // Abort any ongoing API calls (translate, download, speak)
    if (apiAbortControllerRef.current) {
      apiAbortControllerRef.current.abort();
      apiAbortControllerRef.current = null;
    }
     // Stop any currently playing Gemini audio
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.stop();
        } catch (e) { /* Ignore if already stopped */ }
        audioSourceRef.current = null;
    }
    
    // Stop any currently playing Native Speech Synthesis
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // Stop voice recognition
    if (recognitionRef.current) {
        recognitionRef.current.abort();
        setIsListening(false);
    }
    // Reset playback and sharing states ONLY. The calling function will handle its own loading state.
    setActivePlayer(null);
    setLoadingTask('');
    setIsSharingAudio(false);
    setIsLoading(false); // Ensure main loading state is also reset
  }, []);

  // --- EFFECTS ---
  
  // Firebase Authentication State Observer & Firestore History Sync
  useEffect(() => {
    const { app } = getFirebase();
    if (isFirebaseConfigured && app) {
        const auth = getAuth(app);
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthLoading(false);

            // Unsubscribe from any previous Firestore listener
            if (firestoreUnsubscribeRef.current) {
                firestoreUnsubscribeRef.current();
                firestoreUnsubscribeRef.current = null;
            }

            if (currentUser) {
                // User is logged in, fetch history from Firestore and subscribe to changes
                firestoreUnsubscribeRef.current = subscribeToHistory(currentUser.uid, (items) => {
                    setHistory(items);
                });
            } else {
                // User is logged out, load history from localStorage
                try {
                    const savedHistory = localStorage.getItem('sawtli_history');
                    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
                } catch (e) {
                    console.error("Failed to load history from localStorage", e);
                    setHistory([]);
                }
            }
        });
        return () => {
            unsubscribeAuth();
             if (firestoreUnsubscribeRef.current) {
                firestoreUnsubscribeRef.current(); // Cleanup Firestore listener on component unmount
            }
        };
    } else {
        // If Firebase is not configured, we are not in an auth-loading state.
        setIsAuthLoading(false);
        // Load local history if Firebase is not configured
        try {
            const savedHistory = localStorage.getItem('sawtli_history');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Failed to load history from localStorage", e); }
    }
  }, [isFirebaseConfigured]);


  // Stop any active audio if the text or settings that would affect it are changed.
  useEffect(() => {
    // Only stop if something is actively playing.
    // This prevents stopping a 'generate' task before it has a chance to play.
    if (activePlayer && (audioSourceRef.current || window.speechSynthesis.speaking)) {
      stopAll();
    }
  }, [sourceText, translatedText, voice, pauseDuration, multiSpeaker, speakerA, speakerB, emotion, stopAll, activePlayer]);


  // Server configuration check
  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        const response = await fetch('/api/check-config');
        const data = await response.json();
        if (data.configured) {
          setServerConfig({ status: 'configured', error: null });
        } else {
          setServerConfig({ status: 'unconfigured', error: data.message || 'API_KEY is missing or invalid.' });
        }
      } catch (err) {
        console.error("Config check failed:", err);
        setServerConfig({ status: 'unconfigured', error: 'Could not connect to the server. This may be a deployment error. Please check the deployment logs.' });
      }
    };
    checkServerConfig();
  }, []);


  // Load system voices
  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if(voices.length > 0) {
            setSystemVoices(voices);
        }
    };
    loadVoices();
    // Voices list can be loaded asynchronously.
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);


  // Load state from localStorage on initial render (settings only now)
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('sawtli_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.voice) setVoice(settings.voice);
        if (settings.emotion) setEmotion(settings.emotion);
        if (settings.pauseDuration) setPauseDuration(settings.pauseDuration);
        if (settings.multiSpeaker) setMultiSpeaker(settings.multiSpeaker);
        if (settings.speakerA) setSpeakerA(settings.speakerA);
        if (settings.speakerB) setSpeakerB(settings.speakerB);
        if (settings.sourceLang) setSourceLang(settings.sourceLang);
        if (settings.targetLang) setTargetLang(settings.targetLang);
        if (settings.uiLanguage) setUiLanguage(settings.uiLanguage);
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const urlSourceText = urlParams.get('sourceText');
      const urlSourceLang = urlParams.get('sourceLang');
      const urlTargetLang = urlParams.get('targetLang');
      if(urlSourceText) setSourceText(decodeURIComponent(urlSourceText));
      if(urlSourceLang) setSourceLang(urlSourceLang);
      if(urlTargetLang) setTargetLang(urlTargetLang);


    } catch (e) {
      console.error("Failed to load state from localStorage or URL", e);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const settings = { voice, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, sourceLang, targetLang, uiLanguage };
      localStorage.setItem('sawtli_settings', JSON.stringify(settings));
       // Only save history to localStorage if the user is NOT logged in.
      if (!user && history.length > 0) {
          localStorage.setItem('sawtli_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [voice, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, history, sourceLang, targetLang, uiLanguage, user]);

  // Set document direction based on UI language
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = languageOptions.find(l => l.value === uiLanguage)?.dir || 'ltr';
  }, [uiLanguage]);

  // Click outside to close sound effects dropdown
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

  // UI STABILITY: Prevent body scroll when a modal is open to avoid "jiggle"
  useEffect(() => {
    const isAnyModalOpen = isSettingsOpen || isHistoryOpen || isDownloadOpen || isAccountOpen || isAudioStudioOpen;
    
    if (isAnyModalOpen) {
        // Get the scrollbar width
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden';
        // Add padding to the body to avoid the content shifting
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
        // Restore default behavior
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    // Cleanup function to restore defaults when the component unmounts
    return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };
  }, [isSettingsOpen, isHistoryOpen, isDownloadOpen, isAccountOpen, isAudioStudioOpen]);
  
  const handleSpeak = async (text: string, target: 'source' | 'target') => {
      if (isLoading || activePlayer) {
          stopAll();
          return;
      }

      if (!text.trim()) return;

      const isGeminiVoice = geminiVoices.includes(voice);

      if (isGeminiVoice) {
            setIsLoading(true);
            setLoadingTask(t('generatingSpeech', uiLanguage));
            setActivePlayer(target);
            setError(null);
            apiAbortControllerRef.current = new AbortController();
            const signal = apiAbortControllerRef.current.signal;

            try {
                const langCode = target === 'source' ? sourceLang : targetLang;
                const langName = translationLanguages.find(l => l.code === langCode)?.name || 'English';
                const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
                
                const idToken = user ? await user.getIdToken() : undefined;

                const pcmData = await generateSpeech(
                    text,
                    voice,
                    emotion,
                    pauseDuration,
                    speakersConfig,
                    signal,
                    idToken
                );
                
                setIsLoading(false); 
                setLoadingTask('');

                if (pcmData) {
                    audioSourceRef.current = await playAudio(pcmData, () => {
                        setActivePlayer(null);
                        audioSourceRef.current = null;
                    });
                } else {
                    stopAll();
                }

            } catch (err: any) {
                if (err.message === 'API_KEY_MISSING') {
                    setError(t('errorApiKeyMissing', uiLanguage));
                } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
                    setError(t('errorRateLimit', uiLanguage));
                } else if (err.name === 'TimeoutError') {
                    setError(t('errorRequestTimeout', uiLanguage));
                } else if (err.name !== 'AbortError') {
                    console.error("Audio generation/playback failed:", err);
                    setError(err.message || t('errorUnexpected', uiLanguage));
                }
                // Full cleanup in case of any error or abort.
                stopAll();
            }
      } else {
        // Use Native Browser Speech Synthesis
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            const selectedVoice = systemVoices.find(v => v.name === voice);
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // CRITICAL BUG FIX: The utterance language MUST match the language of the
                // voice object itself, not the language of the text area. This dramatically
                // increases the reliability of system voices across browsers and platforms.
                utterance.lang = selectedVoice.lang;
            } else {
                 // Fallback if the voice isn't found (e.g., loaded from localStorage but no longer available).
                const textLangCode = target === 'source' ? sourceLang : targetLang;
                const speechLangCode = translationLanguages.find(l => l.code === textLangCode)?.speechCode || textLangCode;
                utterance.lang = speechLangCode;
            }

            nativeUtteranceRef.current = utterance;
            
            utterance.onstart = () => {
                setActivePlayer(target);
            };
            utterance.onend = () => {
                setActivePlayer(null);
                nativeUtteranceRef.current = null;
            };
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e);
                setError(t('errorSpeechGeneration', uiLanguage));
                setActivePlayer(null);
                nativeUtteranceRef.current = null;
            };
            
            window.speechSynthesis.speak(utterance);
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
              
              // --- UI RESPONSIVENESS FIX ---
              // The primary task (translation) is done. Reset loading state
              // immediately so the UI is responsive, while history saving
              // proceeds in the background.
              setIsLoading(false);
              setLoadingTask('');
              if (apiAbortControllerRef.current?.signal === signal) {
                  apiAbortControllerRef.current = null;
              }
              // --- END FIX ---

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
                  setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
              }
          }

      } catch (err: any) {
          if (err.message === 'API_KEY_MISSING') {
              setError(t('errorApiKeyMissing', uiLanguage));
          } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
              setError(t('errorRateLimit', uiLanguage));
          } else if (err.name === 'TimeoutError') {
              setError(t('errorRequestTimeout', uiLanguage));
          } else if (err.name !== 'AbortError') {
              console.error("Translation failed:", err);
              setError(err.message || t('errorTranslate', uiLanguage));
          }
      } finally {
          // This block now serves as a safeguard. If an error occurred during the
          // API call itself, `isLoading` will still be true here, and we must reset it.
          if (isLoading) {
              setIsLoading(false);
              setLoadingTask('');
              if(apiAbortControllerRef.current?.signal === signal) {
                apiAbortControllerRef.current = null;
              }
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
  };

  const generateAudioBlob = useCallback(async (text: string, format: 'wav' | 'mp3') => {
    if (!text.trim()) return null;

    // A system voice cannot be downloaded this way, so show an error.
    if (!geminiVoices.includes(voice)) {
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
        const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
        const idToken = user ? await user.getIdToken() : undefined;

        const pcmData = await generateSpeech(
            text,
            voice,
            emotion,
            pauseDuration,
            speakersConfig,
            signal,
            idToken
        );

      if (!pcmData) {
          throw new Error(t('errorApiNoAudio', uiLanguage));
      }
      if(signal.aborted) throw new Error('AbortError');
      
      if (format === 'wav') {
        blob = createWavBlob(pcmData, 1, 24000);
      } else {
        blob = await createMp3Blob(pcmData, 1, 24000);
      }
    } catch (err: any) {
        if (err.message === 'API_KEY_MISSING') {
            setError(t('errorApiKeyMissing', uiLanguage));
        } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
            setError(t('errorRateLimit', uiLanguage));
        } else if (err.name === 'TimeoutError') {
            setError(t('errorRequestTimeout', uiLanguage));
        } else if (err.name !== 'AbortError') {
          console.error(`Audio generation for ${format} failed:`, err);
          setError(err.message || (format === 'mp3' ? t('errorMp3Encoding', uiLanguage) : t('errorSpeechGeneration', uiLanguage)));
        }
    } finally {
        stopAll();
        if(apiAbortControllerRef.current?.signal === signal) {
            apiAbortControllerRef.current = null;
        }
    }
    return blob;
  }, [voice, emotion, multiSpeaker, speakerA, speakerB, pauseDuration, uiLanguage, stopAll, user]);

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
  
  const handleShareAudio = async () => {
    const textToProcess = translatedText || sourceText;
    setIsSharingAudio(true);
    const blob = await generateAudioBlob(textToProcess, 'mp3');
    setIsSharingAudio(false);

    if (blob) {
      const file = new File([blob], 'sawtli_audio.mp3', { type: 'audio/mpeg' });
      const shareData = {
        title: t('sharedAudioTitle', uiLanguage),
        text: t('sharedAudioText', uiLanguage),
        files: [file],
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.error("Sharing failed", err);
        }
      } else {
        alert(t('shareNotSupported', uiLanguage));
      }
    }
  };
  
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
        // Use a timeout to ensure the state update has rendered before setting selection
        setTimeout(() => {
            const newCursorPos = start + tag.length + 2; // +2 for spaces
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
    }
  };


  const getButtonState = (target: 'source' | 'target') => {
      const isThisPlayerActive = activePlayer === target;

      if (isLoading && loadingTask.startsWith(t('generatingSpeech', uiLanguage)) && isThisPlayerActive) {
           return { 
             icon: <LoaderIcon />, 
             label: loadingTask,
             className: 'bg-red-600 hover:bg-red-500' 
            };
      }
      if (isThisPlayerActive) {
            return {
                icon: <SoundWaveIcon />,
                label: t('stopSpeaking', uiLanguage),
                className: 'bg-red-600 hover:bg-red-500'
            };
      }
      
      const defaultLabel = target === 'source' ? t('speakSource', uiLanguage) : t('speakTarget', uiLanguage);
      const className = target === 'source' 
        ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20' 
        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20';

      return { icon: <SpeakerIcon />, label: defaultLabel, className };
  };

  const handleSignIn = () => {
      const { app } = getFirebase();
      if (!isFirebaseConfigured || !app) {
          console.error('Firebase is not configured. Sign-in is disabled.');
          return;
      }
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch(error => {
          console.error("Sign-in error:", error);
          setError(t('signInError', uiLanguage));
      });
  };

  const handleSignOut = useCallback(() => {
      const { app } = getFirebase();
      if (!isFirebaseConfigured || !app) return;
      
      const auth = getAuth(app);
      signOut(auth).catch(error => {
          console.error("Sign-out error:", error);
      });
  }, [isFirebaseConfigured]);

  const handleClearHistory = useCallback(async () => {
    if (user) {
        // Cloud history
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
        // Local history
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
            // 1. Delete Firestore data (history, etc.)
            await clearHistoryForUser(user.uid);
            // 2. Delete the root user document
            await deleteUserDocument(user.uid);
            // 3. Delete the auth user
            await user.delete();
            alert(t('accountDeletedSuccess', uiLanguage));
            setIsAccountOpen(false);
        } catch (error) {
            console.error("Account deletion error:", error);
            setError(t('accountDeletionError', uiLanguage));
        } finally {
            setIsLoading(false);
            setLoadingTask('');
        }
    }
  }, [user, uiLanguage]);

  const handleSignOutAndClose = useCallback(() => {
    handleSignOut();
    setIsAccountOpen(false);
  }, [handleSignOut]);


  // --- RENDER ---
  const sourceButtonState = getButtonState('source');
  const targetButtonState = getButtonState('target');
  const isServerReady = serverConfig.status === 'configured';
  const isSourceRtl = translationLanguages.find(l => l.code === sourceLang)?.code === 'ar';
  const isTargetRtl = translationLanguages.find(l => l.code === targetLang)?.code === 'ar';
  const isUsingSystemVoice = !geminiVoices.includes(voice);
  const isUiRtl = uiLanguage === 'ar';

  const sourceTextArea = (
    <div className="flex flex-col space-y-3 md:w-1/2">
      <LanguageSelect value={sourceLang} onChange={setSourceLang} />
      <div className="relative flex-grow">
          <textarea
              ref={sourceTextAreaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('placeholder', uiLanguage)}
              maxLength={MAX_CHARS_PER_REQUEST}
              dir={isSourceRtl ? 'rtl' : 'ltr'}
              className={`w-full h-48 p-3 pb-8 pr-10 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${isSourceRtl ? 'text-right' : 'text-left'}`}
          />
          <div className="absolute top-2 right-2">
              <button onClick={() => handleCopy(sourceText, 'source')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-md">
                  {copiedSource ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon />}
              </button>
          </div>
          <div className={`absolute bottom-3 text-xs text-slate-500 ${isUiRtl ? 'left-3' : 'right-3'}`}>{sourceText.length} / {MAX_CHARS_PER_REQUEST}</div>
      </div>
       <div className={`flex items-center min-h-[44px] ${isUsingSystemVoice ? 'opacity-50' : ''}`}>
          <div className="relative" ref={effectsDropdownRef}>
              <button
                  onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                  disabled={isUsingSystemVoice}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm disabled:cursor-not-allowed"
                  title={isUsingSystemVoice ? t('geminiExclusiveFeature', uiLanguage) : t('soundEffects', uiLanguage)}
              >
                  {t('soundEffects', uiLanguage)}
              </button>
              {isEffectsOpen && (
                  <div className="absolute bottom-full mb-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-20 w-48 animate-fade-in-down max-h-60 overflow-y-auto">
                      {soundEffects.map(effect => (
                        <button
                          key={effect.tag}
                          onClick={() => handleInsertTag(effect.tag)}
                          title={t(effect.labelKey as any, uiLanguage)}
                          className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
                        >
                          <span className="text-xl leading-none">{effect.emoji}</span>
                          <span>{t(effect.labelKey as any, uiLanguage)}</span>
                        </button>
                      ))}
                  </div>
              )}
          </div>
      </div>
       <div className="flex items-stretch gap-3">
          <ActionButton
            icon={sourceButtonState.icon}
            onClick={() => handleSpeak(sourceText, 'source')}
            label={sourceButtonState.label}
            disabled={(isLoading && activePlayer !== 'source') || !isServerReady}
            className={`flex-grow ${sourceButtonState.className}`}
          />
          <button
            onClick={handleToggleListening}
            title={isListening ? t('stopListening', uiLanguage) : t('voiceInput', uiLanguage)}
            className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <MicrophoneIcon className="h-6 w-6" />
          </button>
       </div>
    </div>
  );

  const translatedTextArea = (
      <div className="flex flex-col space-y-3 md:w-1/2">
           <LanguageSelect value={targetLang} onChange={setTargetLang} />
           <div className="relative flex-grow">
              <textarea
                  value={translatedText}
                  readOnly
                  placeholder={t('translationPlaceholder', uiLanguage)}
                  dir={isTargetRtl ? 'rtl' : 'ltr'}
                  className={`w-full h-48 p-3 pb-8 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none ${isTargetRtl ? 'pr-10 text-right' : 'pl-10 text-left'}`}
              />
               <div className={`absolute top-2 ${isTargetRtl ? 'right-2' : 'left-2'}`}>
                  <button onClick={() => handleCopy(translatedText, 'target')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-md">
                      {copiedTarget ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon />}
                  </button>
              </div>
              <div className={`absolute bottom-3 text-xs text-slate-500 ${isUiRtl ? 'left-3' : 'right-3'}`}>{translatedText.length} / {MAX_CHARS_PER_REQUEST}</div>
           </div>
           {/* Placeholder for alignment with source text area controls */}
           <div className="min-h-[44px]"></div>
           <div className="flex items-stretch gap-3">
               <ActionButton
                    icon={targetButtonState.icon}
                    onClick={() => handleSpeak(translatedText, 'target')}
                    label={targetButtonState.label}
                    disabled={!translatedText.trim() || (isLoading && activePlayer !== 'target') || !isServerReady}
                    className={`flex-grow ${targetButtonState.className}`}
               />
           </div>
      </div>
  );

  const swapButton = (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 my-4 md:my-0">
         <button onClick={swapLanguages} title={t('swapLanguages', uiLanguage)} className="h-11 w-11 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full transition-transform active:scale-90 border-4 border-slate-800">
            <SwapIcon />
        </button>
     </div>
  );

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center w-full mb-6">
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-0">
                <SawtliLogoIcon className="w-12 h-12 text-cyan-400" />
                 <div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wider">{t('pageTitle', uiLanguage).split(' ')[0]}</h1>
                    <p className="text-slate-400 text-sm sm:text-base">{t('subtitle', uiLanguage)}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-full">
                    <GlobeIcon className="w-5 h-5 text-slate-400"/>
                    <select 
                        value={uiLanguage} 
                        onChange={e => setUiLanguage(e.target.value as Language)}
                        className="bg-transparent text-white focus:outline-none"
                        aria-label={t('selectInterfaceLanguage', uiLanguage)}
                    >
                        {languageOptions.map(lang => (
                            <option key={lang.value} value={lang.value} className="bg-slate-700">{lang.label}</option>
                        ))}
                    </select>
                </div>
                 {isAuthLoading ? (
                    <div className="w-24 h-10 bg-slate-700 rounded-full animate-pulse"></div>
                ) : user ? (
                    <div className="flex items-center gap-2">
                         <button onClick={() => setIsAccountOpen(true)} className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-700 transition-colors" title={t('manageAccount', uiLanguage)}>
                            <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
                            <span className="text-sm font-semibold hidden sm:inline">{user.displayName}</span>
                        </button>
                    </div>
                ) : isFirebaseConfigured ? (
                    <button 
                        onClick={handleSignIn} 
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center gap-2"
                    >
                        <UserIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{t('signIn', uiLanguage)}</span>
                    </button>
                ) : null}
            </div>
           
        </header>

        <main className="w-full space-y-6">
            {!isFirebaseConfigured && !isAuthLoading && <FirebaseConfigNeeded uiLanguage={uiLanguage}/>}

            {/* Main Translator UI */}
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 relative glow-container">
                
                {serverConfig.status === 'unconfigured' && <ConfigErrorOverlay uiLanguage={uiLanguage} />}
                
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{error}</p></div>}
                {micError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{micError}</p></div>}
                
                {serverConfig.status === 'checking' && (
                    <div className="bg-slate-700/50 p-4 rounded-lg text-center mb-4">
                        <p className="flex items-center justify-center gap-2">
                            <LoaderIcon /> {t('checkingServerConfig', uiLanguage)}
                        </p>
                    </div>
                )}

                <div className={`relative flex flex-col md:flex-row gap-4 ${serverConfig.status !== 'configured' ? 'opacity-20 pointer-events-none' : ''}`}>
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
            </div>

            {/* Daily Usage and Translate Button */}
             <div className="flex flex-col sm:flex-row items-center justify-center -mt-2 gap-4">
                <button onClick={handleTranslate} disabled={isLoading || !isServerReady} className="h-12 px-8 flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold rounded-full transition-transform active:scale-95 shadow-lg shadow-cyan-500/20 text-lg transform hover:-translate-y-1">
                    {isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage)) ? <LoaderIcon /> : <TranslateIcon />}
                    <span>
                        {isLoading && loadingTask.startsWith(t('translatingButton', uiLanguage))
                            ? loadingTask
                            : t('translateButton', uiLanguage)}
                    </span>
                </button>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <ActionCard icon={<GearIcon />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
                <ActionCard icon={<HistoryIcon />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
                <ActionCard 
                    icon={linkCopied ? <CheckIcon className="text-green-400"/> : <LinkIcon />} 
                    label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} 
                    onClick={handleShareLink} 
                />
                <ActionCard icon={<DownloadIcon />} label={t('downloadButton', uiLanguage)} onClick={() => setIsDownloadOpen(true)} disabled={isLoading || !isServerReady || isUsingSystemVoice} />
                <ActionCard icon={<SoundEnhanceIcon />} label={t('audioStudio', uiLanguage)} onClick={() => setIsAudioStudioOpen(true)} disabled={isUsingSystemVoice} />
            </div>
            
            {/* Modals & Panels */}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} {...{sourceLang, targetLang, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices}} />}
            {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onLoad={handleHistoryLoad}/>}
            {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} />}
            
            {/* Suspended Modals */}
             <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><LoaderIcon /></div>}>
                {isAccountOpen && <AccountModal 
                    onClose={() => setIsAccountOpen(false)} 
                    uiLanguage={uiLanguage}
                    user={user}
                    onSignOut={handleSignOutAndClose}
                    onClearHistory={handleClearHistory}
                    onDeleteAccount={handleDeleteAccount}
                />}
                {isAudioStudioOpen && <AudioStudioModal onClose={() => setIsAudioStudioOpen(false)} uiLanguage={uiLanguage} />}
                <Feedback language={uiLanguage} />
            </Suspense>
        </main>
      </div>
    </div>
  );
};


// --- SUB-COMPONENTS ---

// Added LanguageSelect component
const LanguageSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
}> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-2 bg-slate-700 p-2 rounded-md">
            <GlobeIcon className="w-5 h-5 text-slate-400" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent text-white focus:outline-none"
            >
                {translationLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-slate-700">{lang.name}</option>
                ))}
            </select>
        </div>
    );
};

// Added ActionButton component
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
        className={`h-11 px-4 flex items-center justify-center gap-3 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shadow-lg text-base ${className}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

// Added ConfigErrorOverlay component
const ConfigErrorOverlay: React.FC<{ uiLanguage: Language }> = ({ uiLanguage }) => (
    <div className="absolute inset-0 bg-slate-800/95 z-20 flex flex-col items-center justify-center p-6 text-center">
        <WarningIcon className="w-16 h-16 text-amber-400 mb-4" />
        <h3 className="text-xl font-bold text-amber-400 mb-2">{t('configNeededTitle', uiLanguage)}</h3>
        <p className="text-slate-300 mb-4">{t('configNeededBody_AppOwner', uiLanguage)}</p>
        <div dir="ltr" className="my-3 p-3 bg-slate-900 rounded-md font-mono text-cyan-300 text-left text-sm">
            <pre className="whitespace-pre-wrap"><code>{`# In your Vercel project settings > Environment Variables:
API_KEY="your-gemini-api-key"`}</code></pre>
        </div>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">
            {t('goToVercelButton', uiLanguage)} <ExternalLinkIcon />
        </a>
        <p className="text-xs text-slate-500 mt-6">{t('configNeededNote_Users', uiLanguage)}</p>
    </div>
);

// Added ActionCard component
const ActionCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
    >
        <div className="text-cyan-400">{icon}</div>
        <span className="text-sm font-semibold text-slate-300">{label}</span>
    </button>
);

// Added SettingsModal component
const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, uiLanguage, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration,
    multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices, sourceLang, targetLang
}) => {
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const handlePreview = async (voiceName: string) => {
        if (previewingVoice) { // Stop any ongoing preview
            if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); } catch (e) { /* ignore */ }
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

        if (geminiVoices.includes(voiceName)) {
            try {
                const pcmData = await previewVoice(voiceName, previewText, 'Default');
                if (pcmData) {
                    audioSourceRef.current = await playAudio(pcmData, () => {
                        setPreviewingVoice(null);
                        audioSourceRef.current = null;
                    });
                } else {
                    setPreviewingVoice(null);
                }
            } catch (error) {
                console.error("Failed to preview Gemini voice:", error);
                setPreviewingVoice(null);
            }
        } else {
            // System voice preview
            try {
                const utterance = new SpeechSynthesisUtterance(previewText);
                const selectedVoice = systemVoices.find(v => v.name === voiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    utterance.lang = selectedVoice.lang; // Use the voice's specific lang for max compatibility
                }
                nativeUtteranceRef.current = utterance;
                utterance.onend = () => {
                    setPreviewingVoice(null);
                    nativeUtteranceRef.current = null;
                };
                utterance.onerror = (e) => {
                    console.error("System voice preview failed:", e);
                    setPreviewingVoice(null);
                };
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error("Failed to initiate system voice preview:", e);
                setPreviewingVoice(null);
            }
        }
    };

    const relevantSystemVoices = useMemo(() => {
        const sourceSpeechCode = translationLanguages.find(l => l.code === sourceLang)?.speechCode.split('-')[0];
        const targetSpeechCode = translationLanguages.find(l => l.code === targetLang)?.speechCode.split('-')[0];
        return systemVoices.filter(v => v.lang.startsWith(sourceSpeechCode || 'xx') || v.lang.startsWith(targetSpeechCode || 'xx'));
    }, [systemVoices, sourceLang, targetLang]);

    const otherSystemVoices = useMemo(() => {
        return systemVoices.filter(v => !relevantSystemVoices.includes(v));
    }, [systemVoices, relevantSystemVoices]);

    const isUsingSystemVoice = !geminiVoices.includes(voice);

    const voiceNameMap: Record<string, keyof typeof translations> = {
        'Puck': 'voiceMale1',
        'Kore': 'voiceFemale1',
        'Charon': 'voiceMale2',
        'Zephyr': 'voiceFemale2',
        'Fenrir': 'voiceMale3',
    };

    const VoiceListItem: React.FC<{ voiceName: string; label: string; sublabel?: string }> = ({ voiceName, label, sublabel }) => (
        <button
            onClick={() => setVoice(voiceName)}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${voice === voiceName ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
            <div>
                <span className="font-semibold">{label}</span>
                {sublabel && <span className="text-xs text-slate-300 block">{sublabel}</span>}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); handlePreview(voiceName); }}
                title={t('previewVoiceTooltip', uiLanguage)}
                className="p-1 rounded-full text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
                {previewingVoice === voiceName ? <LoaderIcon /> : <PlayCircleIcon />}
            </button>
        </button>
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
                        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
                             <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">{t('geminiHdVoices', uiLanguage)}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {geminiVoices.map(vName => (
                                        <VoiceListItem key={vName} voiceName={vName} label={t(voiceNameMap[vName], uiLanguage)} />
                                    ))}
                                </div>
                            </div>
                            {relevantSystemVoices.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-300 mb-2">{t('suggestedVoices', uiLanguage)}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {relevantSystemVoices.map(v => (
                                            <VoiceListItem key={v.name} voiceName={v.name} label={v.name} sublabel={v.lang} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {otherSystemVoices.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-300 mb-2">{t('otherSystemVoices', uiLanguage)}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {otherSystemVoices.map(v => (
                                            <VoiceListItem key={v.name} voiceName={v.name} label={v.name} sublabel={v.lang} />
                                        ))}
                                    </div>
                                </div>
                            )}
                             {systemVoices.length === 0 && <p className="text-sm text-slate-500">{t('noRelevantSystemVoices', uiLanguage)}</p>}
                        </div>
                    </div>

                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity ${isUsingSystemVoice ? 'opacity-50' : ''}`}>
                         <h4 className={`font-semibold ${isUsingSystemVoice ? 'text-slate-400' : 'text-slate-200'}`}>{t('geminiExclusiveFeature', uiLanguage)}</h4>
                         <div>
                            <label htmlFor="emotion-select" className="block text-sm font-medium text-slate-300 mb-1">{t('emotionLabel', uiLanguage)}</label>
                             <select id="emotion-select" value={emotion} onChange={e => setEmotion(e.target.value)} disabled={isUsingSystemVoice} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md disabled:cursor-not-allowed">
                                 <option value="Default">{t('emotionDefault', uiLanguage)}</option>
                                 <option value="Happy">{t('emotionHappy', uiLanguage)}</option>
                                 <option value="Sad">{t('emotionSad', uiLanguage)}</option>
                                 <option value="Formal">{t('emotionFormal', uiLanguage)}</option>
                             </select>
                         </div>
                        <div>
                            <label htmlFor="pause-duration" className="block text-sm font-medium text-slate-300 mb-1">{t('pauseLabel', uiLanguage)}</label>
                            <div className="flex items-center gap-3">
                                 <input id="pause-duration" type="range" min="0" max="5" step="0.1" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} disabled={isUsingSystemVoice} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:cursor-not-allowed" />
                                 <span className="text-cyan-400 font-mono">{pauseDuration.toFixed(1)}{t('seconds', uiLanguage)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`space-y-4 p-4 rounded-lg bg-slate-900/50 transition-opacity ${isUsingSystemVoice ? 'opacity-50' : ''}`}>
                         <div className="flex items-center justify-between">
                             <h4 className="text-lg font-bold text-slate-200">{t('multiSpeakerSettings', uiLanguage)}</h4>
                             <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <InfoIcon className="h-5 w-5 text-slate-400 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-60 p-2 bg-slate-900 text-slate-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        {t('multiSpeakerTooltip', uiLanguage)}
                                    </div>
                                </div>
                                <input type="checkbox" checked={multiSpeaker} onChange={e => setMultiSpeaker(e.target.checked)} disabled={isUsingSystemVoice} className="form-checkbox h-5 w-5 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 disabled:cursor-not-allowed" />
                             </div>
                         </div>
                        <p className="text-xs text-slate-400">{t('multiSpeakerExclusive', uiLanguage)}</p>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${!multiSpeaker || isUsingSystemVoice ? 'opacity-50 pointer-events-none' : ''}`}>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 1</label>
                                 <input type="text" value={speakerA.name} onChange={e => setSpeakerA({...speakerA, name: e.target.value})} placeholder={t('speaker1', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 1</label>
                                 <select value={speakerA.voice} onChange={e => setSpeakerA({...speakerA, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md">
                                     {geminiVoices.map(v => <option key={v} value={v}>{v}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">{t('speakerName', uiLanguage)} 2</label>
                                 <input type="text" value={speakerB.name} onChange={e => setSpeakerB({...speakerB, name: e.target.value})} placeholder={t('speaker2', uiLanguage)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md" />
                                 <label className="block text-sm font-medium text-slate-300 mt-2 mb-1">{t('speakerVoice', uiLanguage)} 2</label>
                                 <select value={speakerB.voice} onChange={e => setSpeakerB({...speakerB, voice: e.target.value})} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md">
                                    {geminiVoices.map(v => <option key={v} value={v}>{v}</option>)}
                                 </select>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Added DownloadModal component
const DownloadModal: React.FC<{
    onClose: () => void;
    onDownload: (format: 'wav' | 'mp3') => void;
    uiLanguage: Language;
    isLoading: boolean;
    onCancel: () => void;
}> = ({ onClose, onDownload, uiLanguage, isLoading, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('downloadPanelTitle', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label={t('closeButton', uiLanguage)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {isLoading ? (
                    <div className="text-center py-8">
                        <LoaderIcon />
                        <p className="mt-2 text-slate-300">{t('encoding', uiLanguage)}</p>
                        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm">
                            {t('stopSpeaking', uiLanguage)}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <p className="text-sm text-slate-400">{t('downloadFormat', uiLanguage)}</p>
                        <button onClick={() => onDownload('mp3')} className="w-full p-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">
                            MP3 (Recommended)
                        </button>
                        <button onClick={() => onDownload('wav')} className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
                            WAV (Uncompressed)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const FirebaseConfigNeeded: React.FC<{ uiLanguage: Language }> = ({ uiLanguage }) => {
    // FIX: Correctly destructure useState
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    const [varsCopyButtonText, setVarsCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));
    const [rulesCopyButtonText, setRulesCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));

    useEffect(() => {
      setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage));
      setRulesCopyButtonText(t('firebaseSetupCopyButton', uiLanguage));
    }, [uiLanguage]);

    const firebaseEnvVars = [
      'VITE_FIREBASE_API_KEY="your-api-key"',
      'VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"',
      'VITE_FIREBASE_PROJECT_ID="your-project-id"',
      'VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"',
      'VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"',
      'VITE_FIREBASE_APP_ID="your-app-id"',
    ].join('\n');
    
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{documents=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow anyone to read/create feedback, but not edit/delete
    match /feedback/{feedbackId} {
      allow read, create: if true;
      allow update, delete: if false;
    }
  }
}`;

    const handleCopy = (textToCopy: string, buttonType: 'vars' | 'rules') => {
        navigator.clipboard.writeText(textToCopy);
        if(buttonType === 'vars') {
            setVarsCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
            setTimeout(() => setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
        } else if (buttonType === 'rules') {
            setRulesCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
            setTimeout(() => setRulesCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
        }
    };
    return (
        <div className="p-4 sm:p-6 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300">
            <div className="text-center">
                <h3 className="text-xl font-bold text-amber-400">{t('feedbackConfigNeededTitle', uiLanguage)}</h3>
                <p className="mt-2 text-slate-400">{t('feedbackConfigNeededBody', uiLanguage)}</p>
            </div>
            <div className="mt-4 border-t border-slate-600 pt-4">
                 <button 
                    onClick={() => setIsGuideOpen(!isGuideOpen)} 
                    className="w-full flex justify-between items-center text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                >
                    <span className="font-bold">{t('firebaseSetupGuideTitle', uiLanguage)}</span>
                    <ChevronDownIcon className={`transform transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
                 </button>
                  {isGuideOpen && (
                    <div className="mt-4 space-y-4 animate-fade-in text-sm">
                        {/* Step 1 */}
                        <div className="p-3 bg-slate-900/50 rounded-md">
                            <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep1Title', uiLanguage)}</h4>
                            <p className="mt-1 text-slate-400">{t('firebaseSetupStep1Body', uiLanguage)}</p>
                            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 transition-colors">
                                {t('firebaseSetupStep1Button', uiLanguage)} <ExternalLinkIcon />
                            </a>
                        </div>
                        {/* Step 2 */}
                         <div className="p-3 bg-slate-900/50 rounded-md">
                            <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep2Title', uiLanguage)}</h4>
                            <p className="mt-1 text-slate-400">{t('firebaseSetupStep2Body', uiLanguage)}</p>
                        </div>
                        {/* Step 3 */}
                        <div className="p-3 bg-slate-900/50 rounded-md">
                            <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep3Title', uiLanguage)}</h4>
                            <p className="mt-1 text-slate-400">{t('firebaseSetupStep3Body', uiLanguage)}</p>
                            <div dir="ltr" className="relative my-3 p-3 bg-slate-900 rounded-md font-mono text-xs text-cyan-300 text-left">
                                <pre className="whitespace-pre-wrap"><code>{firebaseEnvVars}</code></pre>
                                <button onClick={() => handleCopy(firebaseEnvVars, 'vars')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                                    <CopyIcon /> {varsCopyButtonText}
                                </button>
                            </div>
                        </div>
                         {/* Step 4 */}
                        <div className="p-3 bg-slate-900/50 rounded-md">
                            <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep4Title', uiLanguage)}</h4>
                            <p className="mt-1 text-slate-400">{t('firebaseSetupStep4Body', uiLanguage)}</p>
                            <div dir="ltr" className="relative my-3 p-3 bg-slate-900 rounded-md font-mono text-xs text-yellow-300 text-left">
                                <pre className="whitespace-pre-wrap"><code>{firestoreRules}</code></pre>
                                <button onClick={() => handleCopy(firestoreRules, 'rules')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                                  <CopyIcon /> {rulesCopyButtonText}
                                </button>
                            </div>
                        </div>
                        {/* Step 5 */}
                         <div className="p-3 bg-slate-900/50 rounded-md">
                            <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep5Title', uiLanguage)}</h4>
                            <p className="mt-1 text-slate-400">{t('firebaseSetupStep5Body', uiLanguage)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add default export for App component
export default App;
