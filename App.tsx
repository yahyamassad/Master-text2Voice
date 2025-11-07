import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy } from 'react';
import { generateSpeech, translateText, previewVoice } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, ExternalLinkIcon, SoundEnhanceIcon, UserIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig } from './types';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebase } from './firebaseConfig';
import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument } from './services/firestoreService';


const Feedback = lazy(() => import('./components/Feedback'));
const AccountModal = lazy(() => import('./components/AccountModal'));


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

const geminiVoices = ['Puck', 'Kore', 'Zephyr', 'Charon', 'Fenrir'];

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


  // Daily Usage State
  const [dailyUsage, setDailyUsage] = useState<{ used: number; limit: number } | null>(null);

  // Server Health Check State
  const [serverConfig, setServerConfig] = useState<{ status: 'checking' | 'configured' | 'unconfigured', error: string | null }>({ status: 'checking', error: null });

  // Panels and Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState<boolean>(false);
  const [isAudioControlOpen, setIsAudioControlOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
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
    const { isFirebaseConfigured } = getFirebase();
    if (isFirebaseConfigured) {
        const auth = getAuth();
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
  }, []);


  // Stop any active audio if the text or settings that would affect it are changed.
  useEffect(() => {
    // Only stop if something is actively playing.
    // This prevents stopping a 'generate' task before it has a chance to play.
    if (activePlayer && (audioSourceRef.current || window.speechSynthesis.speaking)) {
      stopAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText, translatedText, voice, emotion, pauseDuration, multiSpeaker, speakerA, speakerB]);


  // Server configuration check
  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.configured) {
          setServerConfig({ status: 'configured', error: null });
        } else {
          setServerConfig({ status: 'unconfigured', error: data.message });
        }
      } catch (err) {
        console.error("Health check failed:", err);
        setServerConfig({ status: 'unconfigured', error: 'Could not connect to the server to verify configuration. Please check your network or deployment status.' });
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

                const { pcmData, usage } = await generateSpeech(
                    text,
                    voice,
                    1.0, // speed
                    langName,
                    pauseDuration,
                    emotion,
                    speakersConfig,
                    signal,
                    idToken
                );
                
                if (usage) setDailyUsage(usage);
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
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = systemVoices.find(v => v.name === voice);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.lang = selectedVoice?.lang || (target === 'source' ? sourceLang : targetLang);
        
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
          
          if (result.usage) setDailyUsage(result.usage);

          if (!signal.aborted) {
              const fullTranslation = result.data.translatedText;
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
                // Save to Firestore (don't need id or timestamp, Firestore adds its own)
                const { id, timestamp, ...itemToSave } = newHistoryItem;
                await addHistoryItem(user.uid, itemToSave);
              } else {
                // Save to local state and update localStorage via useEffect
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
          setIsLoading(false);
          setLoadingTask('');
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
  
  const handleHistoryLoad = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setIsHistoryOpen(false);
  };
  
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
        const langCode = translatedText ? targetLang : sourceLang;
        const langName = translationLanguages.find(l => l.code === langCode)?.name || 'English';
        const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
        const idToken = user ? await user.getIdToken() : undefined;

        const { pcmData, usage } = await generateSpeech(
            text,
            voice,
            1.0, // speed
            langName,
            pauseDuration,
            emotion,
            speakersConfig,
            signal,
            idToken
        );
        
        if(usage) setDailyUsage(usage);

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
  }, [voice, multiSpeaker, speakerA, speakerB, pauseDuration, emotion, uiLanguage, stopAll, translatedText, sourceLang, targetLang, user]);

  const handleDownload = async (format: 'wav' | 'mp3') => {
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
  };
  
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
      const { isFirebaseConfigured } = getFirebase();
      if (!isFirebaseConfigured) {
          alert('Firebase is not configured. Sign-in is disabled.');
          return;
      }
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch(error => {
          console.error("Sign-in error:", error);
          setError(t('signInError', uiLanguage));
      });
  };

  const handleSignOut = () => {
      const { isFirebaseConfigured } = getFirebase();
      if (!isFirebaseConfigured) return;
      
      const auth = getAuth();
      signOut(auth).catch(error => {
          console.error("Sign-out error:", error);
      });
  };

  const handleClearHistory = async () => {
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
  };

  const handleDeleteAccount = async () => {
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
  };


  // --- RENDER ---
  const sourceButtonState = getButtonState('source');
  const targetButtonState = getButtonState('target');
  const isServerReady = serverConfig.status === 'configured';
  const isSourceRtl = translationLanguages.find(l => l.code === sourceLang)?.code === 'ar';
  const isTargetRtl = translationLanguages.find(l => l.code === targetLang)?.code === 'ar';
  const isUsingSystemVoice = !geminiVoices.includes(voice);

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
              className={`w-full h-48 p-3 pr-10 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors ${isSourceRtl ? 'text-right' : 'text-left'}`}
          />
          <div className="absolute top-2 right-2">
              <button onClick={() => handleCopy(sourceText, 'source')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-md">
                  {copiedSource ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon />}
              </button>
          </div>
          <div className={`absolute bottom-2 text-xs text-slate-500 ${isSourceRtl ? 'left-2' : 'right-2'}`}>{sourceText.length} / {MAX_CHARS_PER_REQUEST}</div>
      </div>
       <div className={`flex items-center gap-2 flex-wrap bg-slate-900/50 p-2 rounded-lg ${isUsingSystemVoice ? 'opacity-50' : ''}`}>
          <span className="text-xs font-bold text-slate-400">{t('soundEffects', uiLanguage)}:</span>
            <div className="relative" ref={effectsDropdownRef}>
                <button
                    onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                    disabled={isUsingSystemVoice}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm disabled:cursor-not-allowed"
                    title={isUsingSystemVoice ? t('geminiExclusiveFeature', uiLanguage) : t('addEffect', uiLanguage)}
                >
                    {t('addEffect', uiLanguage)}
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
                  className={`w-full h-48 p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none ${isTargetRtl ? 'pr-10 text-right' : 'pl-10 text-left'}`}
              />
               <div className={`absolute top-2 ${isTargetRtl ? 'right-2' : 'left-2'}`}>
                  <button onClick={() => handleCopy(translatedText, 'target')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-md">
                      {copiedTarget ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon />}
                  </button>
              </div>
              <div className={`absolute bottom-2 text-xs text-slate-500 ${isTargetRtl ? 'left-2' : 'right-2'}`}>{translatedText.length} / {MAX_CHARS_PER_REQUEST}</div>
           </div>
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
                ) : (
                    <button onClick={handleSignIn} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{t('signIn', uiLanguage)}</span>
                    </button>
                )}
            </div>
           
        </header>

        <main className="w-full space-y-6">
            {/* Main Translator UI */}
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 relative glow-container">
                
                {serverConfig.status === 'unconfigured' && <ConfigErrorOverlay uiLanguage={uiLanguage} errorMessage={serverConfig.error || ''} />}
                
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{error}</p></div>}
                {micError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{micError}</p></div>}
                
                {serverConfig.status === 'checking' && (
                    <div className="bg-slate-700/50 p-4 rounded-lg text-center mb-4">
                        <p className="flex items-center justify-center gap-2">
                            <LoaderIcon /> {t('checkingServerConfig', uiLanguage)}
                        </p>
                    </div>
                )}

                <div className={`relative flex flex-col md:flex-row gap-4 ${serverConfig.status === 'unconfigured' ? 'opacity-20 pointer-events-none' : ''}`}>
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
                 {isServerReady && dailyUsage && (
                    <div className="text-xs text-center text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                       <span>{t('dailyUsageLabel', uiLanguage)}: </span>
                       <span className="font-mono">{dailyUsage.used.toLocaleString()} / {dailyUsage.limit.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                <ActionCard icon={<GearIcon />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
                <ActionCard icon={<SoundEnhanceIcon />} label={t('audioControl', uiLanguage)} onClick={() => setIsAudioControlOpen(true)} />
                <ActionCard icon={<HistoryIcon />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
                <ActionCard 
                    icon={linkCopied ? <CheckIcon className="text-green-400"/> : <LinkIcon />} 
                    label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} 
                    onClick={handleShareLink} 
                />
                <ActionCard icon={<DownloadIcon />} label={t('downloadButton', uiLanguage)} onClick={() => setIsDownloadOpen(true)} disabled={isLoading || !isServerReady || isUsingSystemVoice} />
                <ActionCard 
                    icon={isSharingAudio ? <LoaderIcon /> : <ShareIcon />}
                    label={isSharingAudio ? t('sharingAudio', uiLanguage) : t('shareAudio', uiLanguage)} 
                    onClick={handleShareAudio} 
                    disabled={isSharingAudio || isLoading || !isServerReady || isUsingSystemVoice}
                />
            </div>
            
            {/* Modals & Panels */}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} {...{sourceLang, targetLang, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices}} />}
            {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onLoad={handleHistoryLoad}/>}
            {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask.startsWith(t('encoding', uiLanguage))} onCancel={stopAll} />}
            {isAudioControlOpen && <AudioControlModal onClose={() => setIsAudioControlOpen(false)} uiLanguage={uiLanguage} />}


            {/* Suspended Modals */}
             <Suspense fallback={<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><LoaderIcon /></div>}>
                {isAccountOpen && <AccountModal 
                    onClose={() => setIsAccountOpen(false)} 
                    uiLanguage={uiLanguage}
                    user={user}
                    dailyUsage={dailyUsage}
                    onSignOut={() => {
                        handleSignOut();
                        setIsAccountOpen(false);
                    }}
                    onClearHistory={handleClearHistory}
                    onDeleteAccount={handleDeleteAccount}
                />}
                <Feedback language={uiLanguage} />
            </Suspense>
        </main>
      </div>
    </div>
  );
};


// --- SUB-COMPONENTS ---

const ConfigErrorOverlay: React.FC<{uiLanguage: Language, errorMessage: string}> = ({ uiLanguage, errorMessage }) => {
  const vercelLink = "https://vercel.com/dashboard";
  const variableName = errorMessage.includes('API_KEY') ? 'API_KEY' : 'Environment Variable';

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex items-center justify-center p-4 rounded-2xl">
      <div className="bg-slate-800 border-2 border-red-500/50 rounded-2xl shadow-2xl p-6 max-w-lg w-full text-center space-y-4 animate-fade-in-down">
        <div className="w-14 h-14 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
          <WarningIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-300">{t('configNeededTitle', uiLanguage)}</h3>
        <p className="text-slate-400 text-sm">{t('configNeededBody_AppOwner', uiLanguage)}</p>
        <div dir="ltr" className="my-2 p-3 bg-slate-900 rounded-md font-mono text-cyan-300 text-left text-sm">
          <div><span className="text-slate-500">Name:</span> {variableName}</div>
          <div><span className="text-slate-500">Value:</span> sk-YourGeminiApiKey...</div>
        </div>
        <a href={vercelLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-500 transition-colors">
          {t('goToVercelButton', uiLanguage)} <ExternalLinkIcon className="h-4 w-4" />
        </a>
        <p className="text-xs text-slate-500 pt-2">{t('configNeededNote_Users', uiLanguage)}</p>
      </div>
    </div>
  );
};


const LanguageSelect: React.FC<{ value: string, onChange: (value: string) => void }> = ({ value, onChange }) => (
    <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="h-10 px-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 text-base w-full"
    >
        {translationLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
    </select>
);

const ActionButton: React.FC<{
    icon: React.ReactNode, onClick: () => void, label: string, disabled: boolean, className?: string,
}> = ({ icon, onClick, label, disabled, className = "" }) => (
     <button onClick={onClick} disabled={disabled} title={label} className={`h-11 px-4 flex items-center justify-center gap-2 text-white font-bold rounded-lg transition-all transform active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed ${className}`}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label}</span>
    </button>
);

const ActionCard: React.FC<{icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean}> = ({icon, label, onClick, disabled}) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className="bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-slate-700/80 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <div className="text-cyan-400">{icon}</div>
        <span className="text-sm font-semibold text-slate-300">{label}</span>
    </button>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, uiLanguage, voice, setVoice, emotion, setEmotion, pauseDuration, setPauseDuration, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, systemVoices, sourceLang, targetLang }) => {
    const voiceOptions = [ {id: 'Puck', label: t('voicePuck', uiLanguage)}, {id: 'Kore', label: t('voiceKore', uiLanguage)}, {id: 'Zephyr', label: t('voiceZephyr', uiLanguage)}, {id: 'Charon', label: t('voiceCharon', uiLanguage)}, {id: 'Fenrir', label: t('voiceFenrir', uiLanguage)} ];
    const isGeminiVoiceSelected = geminiVoices.includes(voice);

    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [isSystemSpeaking, setIsSystemSpeaking] = useState(false);
    const previewAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const previewAbortControllerRef = useRef<AbortController | null>(null);

    const stopPreview = useCallback(() => {
        previewAbortControllerRef.current?.abort();
        previewAbortControllerRef.current = null;
        previewAudioSourceRef.current?.stop();
        previewAudioSourceRef.current = null;
        window.speechSynthesis.cancel();
        setPreviewingVoice(null);
        setIsSystemSpeaking(false);
    }, []);

    useEffect(() => {
      // Cleanup function to stop any preview when the modal is closed
      return () => {
          stopPreview();
      };
    }, [stopPreview]);
    
    // Stop preview if the main voice selection changes
    useEffect(() => {
        stopPreview();
    }, [voice, stopPreview]);


    const handleGeminiPreview = async (voiceId: string) => {
        if (previewingVoice === voiceId) {
            stopPreview();
            return;
        }
        stopPreview();
        setPreviewingVoice(voiceId);
        previewAbortControllerRef.current = new AbortController();

        try {
            const { pcmData } = await previewVoice(voiceId, t('voicePreviewText', uiLanguage), previewAbortControllerRef.current.signal);
            if (previewAbortControllerRef.current.signal.aborted) return;

            if (pcmData) {
                previewAudioSourceRef.current = await playAudio(pcmData, () => {
                    setPreviewingVoice(null);
                    previewAudioSourceRef.current = null;
                });
            } else {
                setPreviewingVoice(null);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Preview failed:", err);
                // Optionally show a user-facing error
            }
            setPreviewingVoice(null);
        }
    };
    
    const handleSystemPreview = () => {
        if (isSystemSpeaking) {
            stopPreview();
            return;
        }
        stopPreview();

        const selectedSystemVoice = systemVoices.find(v => v.name === voice);
        if (!selectedSystemVoice) return;
        
        const utterance = new SpeechSynthesisUtterance(t('voicePreviewText', uiLanguage));
        utterance.voice = selectedSystemVoice;
        utterance.lang = selectedSystemVoice.lang;
        utterance.onstart = () => setIsSystemSpeaking(true);
        utterance.onend = () => setIsSystemSpeaking(false);
        utterance.onerror = () => setIsSystemSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    };


    const relevantSystemVoices = useMemo(() => {
        if (!systemVoices || systemVoices.length === 0) {
            return { suggested: [], other: [] };
        }

        const sourceLangCode = sourceLang.split('-')[0];
        const targetLangCode = targetLang.split('-')[0];
        const suggestedLangs = new Set([sourceLangCode, targetLangCode, 'ar']); // Also suggest arabic voices

        const uniqueVoices = Array.from(new Map(systemVoices.map(v => [v.name, v])).values()) as SpeechSynthesisVoice[];
        
        const suggested: SpeechSynthesisVoice[] = [];
        const other: SpeechSynthesisVoice[] = [];

        uniqueVoices.forEach(v => {
            const voiceLangCode = (v.lang || '').split('-')[0];
            if (suggestedLangs.has(voiceLangCode)) {
                suggested.push(v);
            } else {
                other.push(v);
            }
        });
        
        const sorter = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => a.name.localeCompare(b.name);
        suggested.sort(sorter);
        other.sort(sorter);

        return { suggested, other };
    }, [systemVoices, sourceLang, targetLang]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('speechSettings', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Gemini HD Voices */}
                    <div className="space-y-4 p-4 border border-cyan-500/30 rounded-lg">
                         <label className="block text-sm font-bold text-cyan-400">{t('geminiHdVoices', uiLanguage)}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {voiceOptions.map(opt => (
                                <div key={opt.id} className="flex items-center">
                                    <button 
                                        onClick={() => handleGeminiPreview(opt.id)} 
                                        title={t('previewVoiceTooltip', uiLanguage)} 
                                        className="p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                                        disabled={previewingVoice && previewingVoice !== opt.id}
                                    >
                                        {previewingVoice === opt.id ? <LoaderIcon /> : <PlayCircleIcon />}
                                    </button>
                                    <button onClick={() => setVoice(opt.id)} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${voice === opt.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{opt.label}</button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-3 text-center">{t('geminiVoicesNote', uiLanguage)}</p>
                        <div className={`${!isGeminiVoiceSelected ? 'opacity-50 cursor-not-allowed' : ''}`} title={!isGeminiVoiceSelected ? t('geminiExclusiveFeature', uiLanguage) : ''}>
                            <label className="block text-sm font-bold text-slate-300 pt-2">{t('speechEmotion', uiLanguage)}</label>
                            <select value={emotion} onChange={e => setEmotion(e.target.value)} disabled={!isGeminiVoiceSelected} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md disabled:cursor-not-allowed">
                                <option value="Default">{t('emotionDefault', uiLanguage)}</option>
                                <option value="Happy">{t('emotionHappy', uiLanguage)}</option>
                                <option value="Sad">{t('emotionSad', uiLanguage)}</option>
                                <option value="Formal">{t('emotionFormal', uiLanguage)}</option>
                            </select>
                            <label className="block text-sm font-bold text-slate-300 pt-4">{t('pauseLabel', uiLanguage)}</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="5" step="0.5" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} disabled={!isGeminiVoiceSelected} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed" />
                                <span className="text-sm text-cyan-400 w-16 text-center">{pauseDuration.toFixed(1)}{t('seconds', uiLanguage)}</span>
                            </div>
                        </div>
                    </div>
                     {/* System Voices */}
                    {(relevantSystemVoices.suggested.length > 0 || relevantSystemVoices.other.length > 0) && (
                        <div className="space-y-4 p-4 border border-slate-700 rounded-lg">
                             <label className="block text-sm font-bold text-slate-300">{t('systemVoices', uiLanguage)}</label>
                             <div className="flex items-center gap-2">
                                <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md">
                                    <>
                                        {/* This placeholder is shown when a Gemini voice is selected */}
                                        <option value="" disabled>{t('selectVoice', uiLanguage)}</option>
                                        
                                        {relevantSystemVoices.suggested.length > 0 && (
                                            <optgroup label={t('suggestedVoices', uiLanguage)}>
                                                {relevantSystemVoices.suggested.map((v) => (
                                                    <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        
                                        {relevantSystemVoices.other.length > 0 && (
                                            <optgroup label={t('otherSystemVoices', uiLanguage)}>
                                                {relevantSystemVoices.other.map((v) => (
                                                    <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </>
                                </select>
                                <button
                                    onClick={handleSystemPreview}
                                    disabled={isGeminiVoiceSelected || previewingVoice !== null}
                                    title={t('previewSystemVoice', uiLanguage)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSystemSpeaking ? <StopIcon /> : <PlayCircleIcon />}
                                </button>
                             </div>
                        </div>
                    )}
                    {/* Multi Speaker Settings */}
                    <div className={`space-y-4 p-4 border border-slate-700 rounded-lg ${!isGeminiVoiceSelected ? 'opacity-50 cursor-not-allowed' : ''}`} title={!isGeminiVoiceSelected ? t('geminiExclusiveFeature', uiLanguage) : ''}>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-300">{t('multiSpeakerSettings', uiLanguage)}</label>
                            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={multiSpeaker} onChange={() => setMultiSpeaker(!multiSpeaker)} disabled={!isGeminiVoiceSelected} className="sr-only peer" /><div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div></label>
                        </div>
                        <p className="text-xs text-slate-400">{t('enableMultiSpeakerInfo', uiLanguage)}</p>
                        {multiSpeaker && isGeminiVoiceSelected && (
                            <div className="space-y-4 pt-2 animate-fade-in-down">
                                <p className="text-xs text-cyan-300 bg-cyan-900/50 p-2 rounded-md">{t('multiSpeakerInfo', uiLanguage)}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400">{t('speakerName', uiLanguage)}</label>
                                        <input type="text" value={speakerA.name} onChange={e => setSpeakerA({...speakerA, name: e.target.value})} placeholder={t('speaker1', uiLanguage)} className="mt-1 w-full p-2 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-sm" />
                                    </div>
                                     <div>
                                        <label className="text-xs text-slate-400">{t('speakerVoice', uiLanguage)}</label>
                                        <select value={speakerA.voice} onChange={e => setSpeakerA({...speakerA, voice: e.target.value})} className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm">
                                            {voiceOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400">{t('speakerName', uiLanguage)}</label>
                                        <input type="text" value={speakerB.name} onChange={e => setSpeakerB({...speakerB, name: e.target.value})} placeholder={t('speaker2', uiLanguage)} className="mt-1 w-full p-2 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-sm" />
                                    </div>
                                     <div>
                                        <label className="text-xs text-slate-400">{t('speakerVoice', uiLanguage)}</label>
                                        <select value={speakerB.voice} onChange={e => setSpeakerB({...speakerB, voice: e.target.value})} className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm">
                                            {voiceOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
};

const DownloadModal: React.FC<{onClose: () => void, onDownload: (format: 'wav' | 'mp3') => void, uiLanguage: Language, isLoading: boolean, onCancel: () => void}> = ({onClose, onDownload, uiLanguage, isLoading, onCancel}) => {
    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold text-cyan-400 text-center mb-6">{t('downloadPanelTitle', uiLanguage)}</h3>
                <div className="flex flex-col space-y-3">
                     <button onClick={() => onDownload('wav')} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        {isLoading ? <LoaderIcon /> : 'WAV'}
                     </button>
                      <button onClick={() => onDownload('mp3')} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        {isLoading ? <LoaderIcon /> : 'MP3'}
                      </button>
                      {isLoading && (
                        <button onClick={onCancel} className="w-full mt-2 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <StopIcon /> {t('stopSpeaking', uiLanguage)}
                        </button>
                      )}
                </div>
            </div>
        </div>
    )
};

const AudioControlModal: React.FC<{onClose: () => void, uiLanguage: Language}> = ({onClose, uiLanguage}) => {
    
    // STARTUP CRASH FIX: Convert component definitions from const arrow functions to standard function declarations.
    // This hoists the functions, ensuring they are defined before the AudioControlModal's JSX tries to render them,
    // which prevents a "Cannot access '...' before initialization" error.
    
    function StaticKnob({label, value}: {label: string, value: number}) {
        const rotation = -135 + (value / 100) * 270;
        return (
            <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 p-1 bg-slate-900 rounded-full shadow-inner">
                  <div 
                    className="w-full h-full bg-gradient-radial from-slate-600 to-slate-800 rounded-full relative flex items-center justify-center border-2 border-slate-700"
                    style={{transform: `rotate(${rotation}deg)`}}
                  >
                    <div className="w-1 h-5 bg-cyan-300 absolute top-1 rounded-full shadow-[0_0_5px_#22d3ee]"></div>
                    <div className="absolute w-full h-full rounded-full border border-black/20"></div>
                  </div>
                </div>
                <span className="text-sm text-slate-300 font-semibold mt-1">{label}</span>
                <span className="text-xs font-mono text-cyan-400">{value}</span>
            </div>
        );
    };

    function StaticSlider({label, value}: {label: string, value: number}) {
        return (
            <div className="w-full">
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-semibold">{label}</span>
                    <span className="font-mono text-white">{value}</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full relative group">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${value}%` }}></div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-cyan-400 shadow-[0_0_5px_#22d3ee,0_0_10px_#22d3ee] transition-transform group-hover:scale-110" style={{ left: `calc(${value}% - 10px)` }}></div>
                </div>
            </div>
        );
    };
    
    function StaticVerticalSlider({label, value}: {label: string, value: number}) {
        return (
            <div className="flex flex-col items-center justify-end gap-2 h-full">
                <div className="relative w-4 h-32 bg-slate-900 rounded-full group">
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-b-full" style={{ height: `${value}%` }}></div>
                    <div className="absolute left-1/2 -translate-x-1/2 w-6 h-2 bg-white rounded-sm border-2 border-cyan-400 shadow-[0_0_5px_#22d3ee] transition-transform group-hover:scale-110" style={{ bottom: `calc(${value}% - 4px)` }}></div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1">{label}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-cyan-500/20 w-full max-w-3xl rounded-2xl shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('audioControlTitle', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-3 mb-4 text-center bg-cyan-900/50 border border-cyan-500/30 rounded-lg">
                    <p className="font-bold text-cyan-300">{t('comingSoon', uiLanguage)}</p>
                    <p className="text-xs text-cyan-400">{t('featureUnavailable', uiLanguage)}</p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* EQ Column */}
                        <div className="md:col-span-1 p-4 bg-slate-900/50 border border-slate-700 rounded-lg shadow-inner">
                            <h4 className="text-sm font-bold text-slate-300 mb-4 text-center tracking-widest">{t('equalizer', uiLanguage)}</h4>
                            <div className="flex justify-around items-end h-32 gap-3">
                                <StaticVerticalSlider label="60Hz" value={60} />
                                <StaticVerticalSlider label="250Hz" value={40} />
                                <StaticVerticalSlider label="1kHz" value={75} />
                                <StaticVerticalSlider label="4kHz" value={55} />
                                <StaticVerticalSlider label="12kHz" value={65} />
                            </div>
                        </div>

                        {/* Center Column */}
                        <div className="md:col-span-1 space-y-6">
                             {/* Master Section */}
                            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg shadow-inner">
                                <h4 className="text-sm font-bold text-slate-300 mb-4 text-center tracking-widest">{t('masterSection', uiLanguage)}</h4>
                                <StaticSlider label={t('masterVolume', uiLanguage)} value={80} />
                                <div className="flex justify-around mt-6">
                                    <StaticKnob label={t('stereoWidth', uiLanguage)} value={75}/>
                                </div>
                            </div>
                            {/* Dynamics */}
                            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg shadow-inner">
                                <h4 className="text-sm font-bold text-slate-300 mb-4 text-center tracking-widest">{t('dynamics', uiLanguage)}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                   <StaticKnob label={t('compressor', uiLanguage)} value={40} />
                                   <StaticKnob label={t('limiter', uiLanguage)} value={95} />
                                </div>
                            </div>
                        </div>

                        {/* Effects Column */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-4 shadow-inner">
                                <h4 className="text-sm font-bold text-slate-300 text-center tracking-widest">{t('effects', uiLanguage)}</h4>
                                <StaticSlider label={t('reverb', uiLanguage)} value={30}/>
                                <StaticSlider label={t('echo', uiLanguage)} value={15}/>
                                <StaticSlider label={t('chorus', uiLanguage)} value={50}/>
                            </div>
                             <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg shadow-inner">
                                 <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-300">{t('hdAudio', uiLanguage)}</label>
                                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" disabled defaultChecked className="sr-only peer" /><div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default App;