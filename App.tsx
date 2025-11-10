
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SpeakerIcon, SoundWaveIcon, LoaderIcon, DownloadIcon, TranslateIcon,
  StopIcon, ReplayIcon, SwapIcon, MicrophoneIcon, GearIcon,
  HistoryIcon, LinkIcon, ShareIcon, UserIcon, SawtliLogoIcon, SoundEnhanceIcon, CopyIcon, CheckIcon,
} from './components/icons';
import { History } from './components/History';
import AccountModal from './components/AccountModal';
import AudioStudioModal from './components/AudioStudioModal';
import Feedback from './components/Feedback';
import OwnerSetupGuide from './components/OwnerSetupGuide';

import { generateSpeech, translateText } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument } from './services/firestoreService';
import { t, Language, languageOptions, translationLanguages, LanguageListItem } from './i18n/translations';
import { isFirebaseConfigured, auth } from './firebaseConfig';
// Fix: Use Firebase v8 imports and types to match project dependencies
// FIX: Use compat libraries for Firebase v9 with v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { HistoryItem, SpeakerConfig } from './types';

// Debounce helper
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const App: React.FC = () => {
  // Main State
  const [uiLanguage, setUiLanguage] = useState<Language>('en');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ar');

  // UI & Loading State
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'source' | 'target' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activePlayback, setActivePlayback] = useState<'source' | 'target' | null>(null);
  const [sourceCopied, setSourceCopied] = useState(false);
  const [targetCopied, setTargetCopied] = useState(false);
  
  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Speech Settings State
  const [voice, setVoice] = useState('Kore');
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(0.5);
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [speakers, setSpeakers] = useState<{ speakerA: SpeakerConfig, speakerB: SpeakerConfig }>({
    speakerA: { name: 'يزن', voice: 'Puck' },
    speakerB: { name: 'لانا', voice: 'Kore' },
  });

  // Data & Auth State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  // Fix: Use Firebase v8 User type
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- Effects ---

  // Set document language and direction
  useEffect(() => {
    const currentLang = languageOptions.find(l => l.value === uiLanguage);
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = currentLang?.dir || 'ltr';
  }, [uiLanguage]);

  // Check server configuration on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/check-config');
        const data = await res.json();
        setIsApiConfigured(data.configured);
      } catch (err) {
        setIsApiConfigured(false);
      }
    };
    checkConfig();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    // Fix: Use Firebase v8 onAuthStateChanged method
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setHistoryItems([]); // Clear history on sign out
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore History Subscription
  useEffect(() => {
    if (user && isFirebaseConfigured) {
      const unsubscribe = subscribeToHistory(user.uid, setHistoryItems);
      return () => unsubscribe();
    }
  }, [user]);
  
  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = sourceLang;

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setSourceText(currentText => currentText + finalTranscript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setError(t('errorMicPermission', uiLanguage));
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
    }
  }, [sourceLang, uiLanguage]);
  
  // --- Handlers ---

  const displaySuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return;

    setIsTranslating(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
        const idToken = await user?.getIdToken();
        const data = await translateText(
            sourceText,
            sourceLang,
            targetLang,
            speakers.speakerA.name,
            speakers.speakerB.name,
            abortControllerRef.current.signal,
            idToken
        );
        setTranslatedText(data.translatedText);

        if (user) {
            addHistoryItem(user.uid, {
                sourceText,
                translatedText: data.translatedText,
                sourceLang,
                targetLang,
            });
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(err.message || t('errorTranslate', uiLanguage));
        }
    } finally {
        setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, speakers, user, uiLanguage]);
  
  const debouncedTranslate = useMemo(() => debounce(handleTranslate, 1000), [handleTranslate]);

  useEffect(() => {
    if (sourceText.trim()) {
      debouncedTranslate();
    }
  }, [sourceText, debouncedTranslate]);

  const handleStop = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setActivePlayback(null);
  }, []);
  
  const handleSpeak = useCallback(async (textToSpeak: string, type: 'source' | 'target') => {
    if (!textToSpeak.trim() || isGenerating) return;

    handleStop();
    setIsGenerating(type);
    setError(null);
    setActivePlayback(type);
    abortControllerRef.current = new AbortController();

    try {
        const idToken = await user?.getIdToken();
        const audioData = await generateSpeech(
            textToSpeak,
            voice,
            emotion,
            pauseDuration,
            isMultiSpeaker ? speakers : undefined,
            abortControllerRef.current.signal,
            idToken
        );
        
        if (audioData) {
            setIsPlaying(true);
            audioSourceRef.current = await playAudio(audioData, () => {
                setIsPlaying(false);
                setActivePlayback(null);
            });
        } else {
            setError(t('errorApiNoAudio', uiLanguage));
            setActivePlayback(null);
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
             setError(err.message || t('errorSpeechGeneration', uiLanguage));
        }
        setActivePlayback(null);
    } finally {
        setIsGenerating(null);
    }
  }, [voice, emotion, pauseDuration, isMultiSpeaker, speakers, user, handleStop, uiLanguage]);

  const handleCopy = (text: string, type: 'source' | 'target') => {
    navigator.clipboard.writeText(text);
    if (type === 'source') {
        setSourceCopied(true);
        setTimeout(() => setSourceCopied(false), 2000);
    } else {
        setTargetCopied(true);
        setTimeout(() => setTargetCopied(false), 2000);
    }
  };

  const handleDownload = async (text: string, format: 'wav' | 'mp3') => {
      if (!text.trim()) return;

      const idToken = await user?.getIdToken();
      const audioData = await generateSpeech(text, voice, emotion, pauseDuration, isMultiSpeaker ? speakers : undefined, undefined, idToken);
      if (!audioData) {
          setError(t('errorApiNoAudio', uiLanguage));
          return;
      }
      
      let blob: Blob;
      let extension: string;

      if (format === 'mp3') {
          blob = await createMp3Blob(audioData, 1, 24000);
          extension = 'mp3';
      } else {
          blob = createWavBlob(audioData, 1, 24000);
          extension = 'wav';
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sawtli-audio.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
        setError(t('errorMicNotSupported', uiLanguage));
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        setSourceText(''); // Clear text before starting
        recognitionRef.current.start();
        setIsListening(true);
    }
  };
  
  // Auth Handlers
  const handleSignIn = async () => {
    // Fix: Use Firebase v8 syntax for Google Sign-In
    if (!isFirebaseConfigured || !auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (err) {
        setError(t('signInError', uiLanguage));
    }
  };

  const handleSignOut = async () => {
    // Fix: Use Firebase v8 syntax for Sign-Out
    if (!auth) return;
    await auth.signOut();
    setIsAccountOpen(false);
  };
  
  const handleClearHistory = async () => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear your entire cloud history?')) {
        try {
            await clearHistoryForUser(user.uid);
            displaySuccess(t('historyClearSuccess', uiLanguage));
        } catch (err) {
            setError(t('historyClearError', uiLanguage));
        }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth) return;
    if (window.confirm(t('deleteAccountConfirmationPrompt', uiLanguage))) {
        try {
            await clearHistoryForUser(user.uid);
            await deleteUserDocument(user.uid);
            // Fix: Use Firebase v8 user.delete() method
            await user.delete();
            displaySuccess(t('accountDeletedSuccess', uiLanguage));
            setIsAccountOpen(false);
        } catch (err) {
            setError(t('accountDeletionError', uiLanguage));
        }
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setIsHistoryOpen(false);
  };
  
  // --- Render ---

  const showOwnerGuide = isApiConfigured === false || (isFirebaseConfigured === false && !user);

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <SawtliLogoIcon className="h-8 w-auto" />
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Sawtli</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><HistoryIcon/></button>
          {isFirebaseConfigured && (
            user ? (
              <button onClick={() => setIsAccountOpen(true)}><img src={user.photoURL!} alt="user" className="w-8 h-8 rounded-full" /></button>
            ) : (
              <button onClick={handleSignIn} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><UserIcon /></button>
            )
          )}
        </div>
      </header>
      
      <main className="flex-grow flex flex-col p-4 gap-4">
        {showOwnerGuide && <OwnerSetupGuide uiLanguage={uiLanguage} isApiConfigured={isApiConfigured!} isFirebaseConfigured={isFirebaseConfigured} />}

        {error && <div className="p-3 bg-red-500/20 text-red-300 rounded-lg text-center">{error}</div>}
        {successMessage && <div className="p-3 bg-green-500/20 text-green-300 rounded-lg text-center">{successMessage}</div>}

        <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4">
            {/* Source Text Column */}
            <div className="flex flex-col gap-2">
                <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t('placeholder', uiLanguage)}
                    className="w-full h-full flex-grow p-4 bg-slate-800 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <button onClick={() => handleSpeak(sourceText, 'source')} disabled={isGenerating !== null || !sourceText.trim()} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 transition-colors">
                            {isGenerating === 'source' ? <LoaderIcon /> : (activePlayback === 'source' && isPlaying ? <SoundWaveIcon /> : <SpeakerIcon />)}
                        </button>
                        {(isPlaying && activePlayback === 'source') && <button onClick={handleStop} className="p-2 rounded-full hover:bg-slate-600 transition-colors"><StopIcon/></button>}
                        <button onClick={handleVoiceInput} className={`p-2 rounded-full hover:bg-slate-600 transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}>
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>
                    </div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => handleCopy(sourceText, 'source')} className="p-2 rounded-full hover:bg-slate-600 transition-colors">
                            {sourceCopied ? <CheckIcon/> : <CopyIcon/>}
                         </button>
                        <button onClick={() => handleDownload(sourceText, 'mp3')} className="p-2 rounded-full hover:bg-slate-600 transition-colors"><DownloadIcon/></button>
                     </div>
                </div>
            </div>

            {/* Controls Column */}
            <div className="flex flex-col items-center justify-center gap-4">
                <button onClick={handleTranslate} disabled={isTranslating || !sourceText.trim()} className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 transition-colors">
                    {isTranslating ? <LoaderIcon /> : <TranslateIcon/>}
                </button>
                 <button onClick={() => {
                     const tempLang = sourceLang;
                     setSourceLang(targetLang);
                     setTargetLang(tempLang);
                     setSourceText(translatedText);
                     setTranslatedText(sourceText);
                 }} className="p-3 rounded-full hover:bg-slate-600 transition-colors">
                    <SwapIcon />
                </button>
            </div>
            
            {/* Translated Text Column */}
            <div className="flex flex-col gap-2">
                <textarea
                    value={translatedText}
                    readOnly
                    placeholder={t('translationPlaceholder', uiLanguage)}
                    className="w-full h-full flex-grow p-4 bg-slate-800 border-2 border-slate-700 rounded-lg resize-none"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSpeak(translatedText, 'target')} disabled={isGenerating !== null || !translatedText.trim()} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 transition-colors">
                             {isGenerating === 'target' ? <LoaderIcon /> : (activePlayback === 'target' && isPlaying ? <SoundWaveIcon /> : <SpeakerIcon />)}
                        </button>
                         {(isPlaying && activePlayback === 'target') && <button onClick={handleStop} className="p-2 rounded-full hover:bg-slate-600 transition-colors"><StopIcon/></button>}
                    </div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => handleCopy(translatedText, 'target')} className="p-2 rounded-full hover:bg-slate-600 transition-colors">
                            {targetCopied ? <CheckIcon/> : <CopyIcon/>}
                         </button>
                         <button onClick={() => handleDownload(translatedText, 'mp3')} className="p-2 rounded-full hover:bg-slate-600 transition-colors"><DownloadIcon/></button>
                     </div>
                </div>
            </div>
        </div>
        
        <button onClick={() => setShowFeedback(!showFeedback)} className="text-sm text-slate-400 hover:text-cyan-400 self-center mt-4">
            {showFeedback ? t('closeButton', uiLanguage) : t('feedbackTitle', uiLanguage)}
        </button>
        {showFeedback && <div className="max-w-2xl w-full mx-auto"><Feedback language={uiLanguage} /></div>}

      </main>

      <footer className="p-4 flex justify-center items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><GearIcon/></button>
          <button onClick={() => setIsAudioStudioOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors"><SoundEnhanceIcon/></button>
      </footer>
      
      {/* Modals */}
      {isHistoryOpen && <History items={historyItems} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={handleClearHistory} onLoad={handleLoadHistory} />}
      {isAccountOpen && user && <AccountModal user={user} onClose={() => setIsAccountOpen(false)} uiLanguage={uiLanguage} onSignOut={handleSignOut} onClearHistory={handleClearHistory} onDeleteAccount={handleDeleteAccount} />}
      {isAudioStudioOpen && <AudioStudioModal onClose={() => setIsAudioStudioOpen(false)} uiLanguage={uiLanguage} />}

    </div>
  );
}

export default App;
