
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { generateSpeech, translateText, previewVoice } from './services/geminiService';
import { playAudio, createWavBlob, createMp3Blob, decodeAudioData } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, PauseIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages, LanguageListItem } from './i18n/translations';
import { History } from './components/History';
const Feedback = React.lazy(() => import('./components/Feedback'));

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export interface SpeakerConfig {
    name: string;
    voice: string;
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

// Main App Component
const App: React.FC = () => {
  const MAX_CHARS = 5000;
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
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [audioCache, setAudioCache] = useState<Record<'source' | 'target', Uint8Array | null>>({ source: null, target: null });


  // Panels and Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isSharingAudio, setIsSharingAudio] = useState<boolean>(false);

  // Settings State
  const [voice, setVoice] = useState('Puck');
  const [speed, setSpeed] = useState(1.0);
  const [emotion, setEmotion] = useState('Default');
  const [pauseDuration, setPauseDuration] = useState(0);
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'Puck' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'Kore' });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Voice Input State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const sourceTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const effectsDropdownRef = useRef<HTMLDivElement>(null);


  // --- CORE FUNCTIONS ---

  const stopPlayback = useCallback(() => {
    if (audioSourceNodeRef.current) {
        audioSourceNodeRef.current.onended = null; 
        try { audioSourceNodeRef.current.stop(); } catch(e) {}
    }
    if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch(e) {}
    }
    audioSourceNodeRef.current = null;
    audioContextRef.current = null;
    setPlaybackState('stopped');
    setActivePlayer(null);
  }, []);
  
  const stopAll = useCallback(() => {
    if (apiAbortControllerRef.current) {
      apiAbortControllerRef.current.abort();
    }
    if (recognitionRef.current) {
        recognitionRef.current.abort();
        setIsListening(false);
    }
    stopPlayback();
    setIsLoading(false);
    setLoadingTask('');
    setIsSharingAudio(false);
  }, [stopPlayback]);

  // --- EFFECTS ---

  // Clear audio cache when text or settings change
  useEffect(() => {
    if (playbackState !== 'stopped' && activePlayer === 'source') stopPlayback();
    setAudioCache(c => ({...c, source: null}));
  }, [sourceText, voice, speed, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, stopPlayback]);

  useEffect(() => {
    if (playbackState !== 'stopped' && activePlayer === 'target') stopPlayback();
    setAudioCache(c => ({...c, target: null}));
  }, [translatedText, voice, speed, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, stopPlayback]);


  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('sawtli_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedSettings = localStorage.getItem('sawtli_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.voice) setVoice(settings.voice);
        if (settings.speed) setSpeed(settings.speed);
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
      const settings = { voice, speed, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, sourceLang, targetLang, uiLanguage };
      localStorage.setItem('sawtli_settings', JSON.stringify(settings));
      if (history.length > 0) {
          localStorage.setItem('sawtli_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [voice, speed, emotion, pauseDuration, multiSpeaker, speakerA, speakerB, history, sourceLang, targetLang, uiLanguage]);

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


  const handleSpeak = useCallback(async (text: string, langCode: string, target: 'source' | 'target') => {
      // Case 1: Clicked on a playing button -> Pause
      if (playbackState === 'playing' && activePlayer === target) {
          if (audioContextRef.current) {
              audioContextRef.current.suspend();
              setPlaybackState('paused');
          }
          return;
      }

      // Case 2: Clicked on a paused button -> Resume
      if (playbackState === 'paused' && activePlayer === target) {
          if (audioContextRef.current) {
              audioContextRef.current.resume();
              setPlaybackState('playing');
          }
          return;
      }
      
      // Case 3: A new playback is requested
      if (playbackState !== 'stopped') {
          stopPlayback();
      }
      
      if (!text.trim()) return;

      setActivePlayer(target);
      setError(null);

      try {
          let pcmData = audioCache[target];

          if (!pcmData) {
              setIsLoading(true);
              setLoadingTask(t('generatingSpeech', uiLanguage));
              apiAbortControllerRef.current = new AbortController();
              const signal = apiAbortControllerRef.current.signal;

              const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
              const languageName = translationLanguages.find(l => l.code === langCode)?.name || 'English';

              const generatedPcm = await generateSpeech(text, voice, speed, languageName, pauseDuration, emotion, speakersConfig, signal);
              
              setIsLoading(false);
              setLoadingTask('');

              if (signal.aborted) throw new Error('AbortError');
              if (!generatedPcm) throw new Error(t('errorApiNoAudio', uiLanguage));
              
              pcmData = generatedPcm;
              setAudioCache(prev => ({ ...prev, [target]: pcmData }));
          }

          if (pcmData) {
              const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              audioContextRef.current = context;

              if (context.state === 'suspended') {
                  await context.resume();
              }
              
              const audioBuffer = await decodeAudioData(pcmData, context, 24000, 1);
              const source = context.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(context.destination);
              
              source.onended = () => {
                  if (audioContextRef.current && audioContextRef.current.state !== 'suspended') {
                     stopPlayback();
                  }
              };

              source.start(0);
              audioSourceNodeRef.current = source;
              setPlaybackState('playing');
          }
      } catch (err: any) {
          if (err.name !== 'AbortError') {
              console.error("Speech generation/playback failed:", err);
              setError(err.message || t('errorUnexpected', uiLanguage));
          }
          stopPlayback();
          setIsLoading(false);
          setLoadingTask('');
      }
  }, [playbackState, activePlayer, audioCache, multiSpeaker, speakerA, speakerB, voice, speed, pauseDuration, emotion, uiLanguage, stopPlayback]);
  
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
          const result = await translateText(sourceText, sourceLang, targetLang, speakerA.name, speakerB.name, signal);
          setTranslatedText(result.translatedText);

          const newHistoryItem: HistoryItem = {
              id: new Date().toISOString(),
              sourceText,
              translatedText: result.translatedText,
              sourceLang,
              targetLang,
              timestamp: Date.now()
          };
          setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);

      } catch (err: any) {
          if (err.name !== 'AbortError') {
              console.error("Translation failed:", err);
              setError(err.message || t('errorTranslate', uiLanguage));
          }
      } finally {
          setIsLoading(false);
          setLoadingTask('');
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
  
  const handleCopy = (text: string, type: 'target') => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      if (type === 'target') {
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

  const generateAudioBlob = useCallback(async (text: string, langCode: string, format: 'wav' | 'mp3') => {
    if (!text.trim()) return null;
    setError(null);
    setLoadingTask(t('encoding', uiLanguage));
    setIsLoading(true);

    apiAbortControllerRef.current = new AbortController();
    const signal = apiAbortControllerRef.current.signal;

    try {
      const speakersConfig = multiSpeaker ? { speakerA, speakerB } : undefined;
      const languageName = translationLanguages.find(l => l.code === langCode)?.name || 'English';
      const pcmData = await generateSpeech(text, voice, speed, languageName, pauseDuration, emotion, speakersConfig, signal);
      if (!pcmData) throw new Error(t('errorApiNoAudio', uiLanguage));

      if (format === 'wav') {
        return createWavBlob(pcmData, 1, 24000);
      } else {
        return await createMp3Blob(pcmData, 1, 24000);
      }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(`Audio generation for ${format} failed:`, err);
          setError(err.message || (format === 'mp3' ? t('errorMp3Encoding', uiLanguage) : t('errorSpeechGeneration', uiLanguage)));
        }
        return null;
    } finally {
        setIsLoading(false);
        setLoadingTask('');
    }
  }, [multiSpeaker, speakerA, speakerB, voice, speed, pauseDuration, emotion, uiLanguage]);

  const handleDownload = async (format: 'wav' | 'mp3') => {
    const textToProcess = translatedText || sourceText;
    const langToProcess = translatedText ? targetLang : sourceLang;
    const blob = await generateAudioBlob(textToProcess, langToProcess, format);
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
    const langToProcess = translatedText ? targetLang : sourceLang;
    setIsSharingAudio(true);
    const blob = await generateAudioBlob(textToProcess, langToProcess, 'mp3');
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
      const defaultLabel = target === 'source' ? t('speakSource', uiLanguage) : t('speakTarget', uiLanguage);
      
      if (activePlayer !== target) {
          return { icon: <SpeakerIcon />, label: defaultLabel };
      }

      switch (playbackState) {
          case 'playing':
              return { icon: <PauseIcon />, label: t('pauseSpeaking', uiLanguage) };
          case 'paused':
              return { icon: <PlayCircleIcon />, label: t('resumeSpeaking', uiLanguage) };
          case 'stopped':
          default:
              return { icon: <SpeakerIcon />, label: defaultLabel };
      }
  };


  // --- RENDER ---
  const sourceButtonState = getButtonState('source');
  const targetButtonState = getButtonState('target');

  const sourceTextArea = (
    <div className="flex flex-col space-y-3 md:w-1/2">
      <LanguageSelect value={sourceLang} onChange={setSourceLang} />
      <div className="relative flex-grow">
          <textarea
              ref={sourceTextAreaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('placeholder', uiLanguage)}
              maxLength={MAX_CHARS}
              className="w-full h-48 p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-500">{sourceText.length} / {MAX_CHARS}</div>
      </div>
       <div className="flex items-center gap-2 flex-wrap bg-slate-900/50 p-2 rounded-lg">
          <span className="text-xs font-bold text-slate-400">{t('soundEffects', uiLanguage)}:</span>
            <div className="relative" ref={effectsDropdownRef}>
                <button
                    onClick={() => setIsEffectsOpen(!isEffectsOpen)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm"
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
            icon={isLoading && activePlayer === 'source' ? <LoaderIcon /> : sourceButtonState.icon}
            onClick={() => handleSpeak(sourceText, sourceLang, 'source')}
            label={isLoading && activePlayer === 'source' ? loadingTask : sourceButtonState.label}
            disabled={(isLoading && activePlayer !== 'source')}
            className="flex-grow bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20"
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
                  className="w-full h-48 p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none"
              />
               <div className="absolute top-2 right-2">
                  <button onClick={() => handleCopy(translatedText, 'target')} title={t('copyTooltip', uiLanguage)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-md">
                      {copiedTarget ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon />}
                  </button>
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-slate-500">{translatedText.length} / {MAX_CHARS}</div>
           </div>
           <ActionButton
                icon={isLoading && activePlayer === 'target' ? <LoaderIcon /> : targetButtonState.icon}
                onClick={() => handleSpeak(translatedText, targetLang, 'target')}
                label={isLoading && activePlayer === 'target' ? loadingTask : targetButtonState.label}
                disabled={!translatedText.trim() || (isLoading && activePlayer !== 'target')}
                className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
           />
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
        </header>

        <main className="w-full space-y-6">
            {/* Main Translator UI */}
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 relative glow-container">
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{error}</p></div>}
                {micError && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4"><p>{micError}</p></div>}
                
                <div className="relative flex flex-col md:flex-row gap-4">
                    {sourceTextArea}
                    {swapButton}
                    {translatedTextArea}
                </div>
            </div>

            {/* Central Translate Button */}
             <div className="flex items-center justify-center -mt-2">
                <button onClick={handleTranslate} disabled={isLoading && loadingTask !== '' && loadingTask !== t('translatingButton', uiLanguage)} className="h-12 px-8 flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold rounded-full transition-transform active:scale-95 shadow-lg shadow-cyan-500/20 text-lg transform hover:-translate-y-1">
                    {isLoading && loadingTask === t('translatingButton', uiLanguage) ? <LoaderIcon /> : <TranslateIcon />}
                    <span>
                        {isLoading && loadingTask === t('translatingButton', uiLanguage) 
                            ? t('translatingButtonStop', uiLanguage) 
                            : t('translateButton', uiLanguage)}
                    </span>
                </button>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-center">
                <ActionCard icon={<GearIcon />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
                <ActionCard icon={<HistoryIcon />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
                <ActionCard 
                    icon={linkCopied ? <CheckIcon className="text-green-400"/> : <LinkIcon />} 
                    label={linkCopied ? t('linkCopied', uiLanguage) : t('shareSettings', uiLanguage)} 
                    onClick={handleShareLink} 
                />
                <ActionCard icon={<DownloadIcon />} label={t('downloadButton', uiLanguage)} onClick={() => setIsDownloadOpen(true)} />
                <ActionCard 
                    icon={isSharingAudio ? <LoaderIcon /> : <ShareIcon />}
                    label={isSharingAudio ? t('sharingAudio', uiLanguage) : t('shareAudio', uiLanguage)} 
                    onClick={handleShareAudio} 
                    disabled={isSharingAudio}
                />
            </div>
            
            {/* Modals & Panels */}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} uiLanguage={uiLanguage} {...{voice, setVoice, speed, setSpeed, emotion, setEmotion, pauseDuration, setPauseDuration, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, stopAll}} />}
            {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={() => { setHistory([]); localStorage.removeItem('sawtli_history'); }} onLoad={handleHistoryLoad}/>}
            {isDownloadOpen && <DownloadModal onClose={() => setIsDownloadOpen(false)} onDownload={handleDownload} uiLanguage={uiLanguage} isLoading={isLoading && loadingTask === t('encoding', uiLanguage)} />}

            {/* Feedback Section */}
            <Suspense fallback={<div className="flex justify-center p-8"><LoaderIcon /></div>}>
                <Feedback language={uiLanguage} />
            </Suspense>
        </main>
      </div>
    </div>
  );
};


// --- SUB-COMPONENTS ---

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

const SettingsModal: React.FC<any> = ({ onClose, uiLanguage, voice, setVoice, speed, setSpeed, emotion, setEmotion, pauseDuration, setPauseDuration, multiSpeaker, setMultiSpeaker, speakerA, setSpeakerA, speakerB, setSpeakerB, stopAll }) => {
    const voiceOptions = [ {id: 'Puck', label: t('voicePuck', uiLanguage)}, {id: 'Kore', label: t('voiceKore', uiLanguage)}, {id: 'Zephyr', label: t('voiceZephyr', uiLanguage)}, {id: 'Charon', label: t('voiceCharon', uiLanguage)}, {id: 'Fenrir', label: t('voiceFenrir', uiLanguage)} ];
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const previewAbortControllerRef = useRef<AbortController | null>(null);

    const handlePreview = async (voiceId: string) => {
        if (previewingVoice) {
            previewAbortControllerRef.current?.abort();
            setPreviewingVoice(null);
            return;
        }
        setPreviewingVoice(voiceId);
        previewAbortControllerRef.current = new AbortController();
        try {
            const pcmData = await previewVoice(voiceId, t('voicePreviewText', uiLanguage), previewAbortControllerRef.current.signal);
            if (pcmData) {
                await playAudio(pcmData, () => setPreviewingVoice(null));
            } else {
                setPreviewingVoice(null);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error("Preview failed:", err);
            setPreviewingVoice(null);
        }
    };

    useEffect(() => {
        return () => { // Cleanup on unmount
            previewAbortControllerRef.current?.abort();
            stopAll();
        }
    }, [stopAll]);

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
                    {/* Single Speaker Settings */}
                    <div className="space-y-4 p-4 border border-slate-700 rounded-lg">
                        <label className="block text-sm font-bold text-slate-300">{t('voiceLabel', uiLanguage)}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {voiceOptions.map(opt => (
                                <div key={opt.id} className="flex items-center">
                                    <button onClick={() => handlePreview(opt.id)} title={t('previewVoiceTooltip', uiLanguage)} className="p-2 text-cyan-400 hover:text-cyan-300">
                                        {previewingVoice === opt.id ? <StopIcon /> : <PlayCircleIcon />}
                                    </button>
                                    <button onClick={() => setVoice(opt.id)} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${voice === opt.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{opt.label}</button>
                                </div>
                            ))}
                        </div>
                        <label className="block text-sm font-bold text-slate-300 pt-2">{t('speechEmotion', uiLanguage)}</label>
                        <select value={emotion} onChange={e => setEmotion(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md">
                            <option value="Default">{t('emotionDefault', uiLanguage)}</option>
                            <option value="Happy">{t('emotionHappy', uiLanguage)}</option>
                            <option value="Sad">{t('emotionSad', uiLanguage)}</option>
                            <option value="Formal">{t('emotionFormal', uiLanguage)}</option>
                        </select>
                        <label className="block text-sm font-bold text-slate-300 pt-2">{t('pauseLabel', uiLanguage)}</label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="0" max="5" step="0.5" value={pauseDuration} onChange={e => setPauseDuration(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                            <span className="text-sm text-cyan-400 w-12 text-center">{pauseDuration.toFixed(1)}{t('seconds', uiLanguage)}</span>
                        </div>
                    </div>

                    {/* Multi Speaker Settings */}
                    <div className="space-y-4 p-4 border border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-300">{t('multiSpeakerSettings', uiLanguage)}</label>
                            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={multiSpeaker} onChange={() => setMultiSpeaker(!multiSpeaker)} className="sr-only peer" /><div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div></label>
                        </div>
                        <p className="text-xs text-slate-400">{t('enableMultiSpeakerInfo', uiLanguage)}</p>
                        {multiSpeaker && (
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

const DownloadModal: React.FC<{onClose: () => void, onDownload: (format: 'wav' | 'mp3') => void, uiLanguage: Language, isLoading: boolean}> = ({onClose, onDownload, uiLanguage, isLoading}) => {
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
                </div>
            </div>
        </div>
    )
};


export default App;
