
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech, SpeakerConfig, previewVoice } from './services/geminiService';
import { translateText } from './services/geminiService';
import { decodeAudioData, createWavBlob, createMp3Blob } from './utils/audioUtils';
import { SpeakerIcon, SoundWaveIcon, LoaderIcon, DownloadIcon, TranslateIcon, StopIcon, GlobeIcon, ChevronDownIcon, ReplayIcon, SwapIcon, CopyIcon, CheckIcon, MicrophoneIcon, GearIcon, HistoryIcon, LinkIcon, ShareIcon, InfoIcon, PlayCircleIcon, SawtliLogoIcon } from './components/icons';
// FIX: Import `translations` object to correctly type the `labelKey` for `allVoices` array below.
import { t, languageOptions, Language, Direction, translationLanguages, LanguageListItem, translations } from './i18n/translations';
import { Feedback } from './components/Feedback';
import { History } from './components/History';

// Fix: Add types for the Web Speech API to resolve TypeScript errors.
// These are not always included in default DOM typings.
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void; // Add abort method
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export interface HistoryItem {
    id: string;
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
    speakerMapping: Record<string, string> | null;
}

// FIX: Corrected the list of voices to only include those officially supported by the TTS model.
// This resolves the primary bug where most voices were failing to generate speech.
type VoiceType = 'Puck' | 'Kore' | 'Zephyr' | 'Charon' | 'Fenrir';
type EmotionType = 'Default' | 'Happy' | 'Sad' | 'Formal';
type ActiveSpeaker = 'source' | 'target' | null;
type DownloadFormat = 'wav' | 'mp3';
type CopiedStatus = 'source' | 'target' | 'link' | null;

interface AudioCacheItem {
    pcm: Uint8Array;
}

interface TranslationCacheItem {
    translatedText: string;
    speakerMapping: Record<string, string> | null;
}


// Create a single, shared AudioContext instance for the entire application lifetime.
// This prevents hitting browser limits on the number of concurrent AudioContexts.
let globalAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!globalAudioContext || globalAudioContext.state === 'closed') {
        // The sample rate must match the audio from the API (24000 Hz).
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return globalAudioContext;
};

/**
 * A robust, centralized async function to get a running AudioContext.
 * It handles resuming a suspended context and gracefully recovers by creating a new
 * context if the existing one fails to resume. This is the core of the audio fix.
 */
const getResumedAudioContext = async (): Promise<AudioContext> => {
    let audioContext = getAudioContext();

    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.warn("AudioContext resume failed, trying to re-create.", e);
            if (globalAudioContext && globalAudioContext.state !== 'closed') {
                // await the close() to ensure resources are released before creating a new one.
                await globalAudioContext.close().catch(err => console.error("Error closing faulty context:", err));
            }
            globalAudioContext = null;
            
            audioContext = getAudioContext(); // Get the new instance
            if (audioContext.state === 'suspended') {
                // Last attempt to resume the new context
                await audioContext.resume();
            }
        }
    }
    
    // If it's still not running after all attempts, something is fundamentally wrong.
    if (audioContext.state !== 'running') {
        throw new Error(`AudioContext failed to start. Current state: ${audioContext.state}`);
    }

    return audioContext;
};

// Helper function to determine text direction based on language code
const getDirectionForLang = (langCode: string): 'ltr' | 'rtl' => {
    const rtlLangs = ['ar', 'he', 'fa', 'ur'];
    return rtlLangs.includes(langCode) ? 'rtl' : 'ltr';
};


const App: React.FC = () => {
  // FIX: Added missing `=` to the useState declaration. This was causing a major syntax error.
  const [sourceText, setSourceText] = useState<string>('يزن: مرحباً يا عالم! كيف حالك اليوم؟\n\nلآنا: أنا بخير، شكراً لسؤالك!');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('ar');
  const [targetLang, setTargetLang] = useState<string>('en');
  
  const [voice, setVoice] = useState<VoiceType>('Zephyr');
  const [emotion, setEmotion] = useState<EmotionType>('Default');
  const [speed, setSpeed] = useState<number>(1.0); // Now a rate, e.g., 0.75, 1.0, 1.25
  const [pauseDuration, setPauseDuration] = useState<number>(1.0);

  // New state for multi-speaker configuration
  const [isMultiSpeakerMode, setIsMultiSpeakerMode] = useState<boolean>(true);
  // FIX: Updated default speaker voices to valid, supported options ('Puck', 'Kore'). And updated default names.
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'يزن', voice: 'Zephyr' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'لآنا', voice: 'Kore' });
  
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<ActiveSpeaker>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [lastPlayedPcm, setLastPlayedPcm] = useState<Uint8Array | null>(null);
  
  const [language, setLanguage] = useState<Language>('ar');
  const [direction, setDirection] = useState<Direction>('rtl');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('mp3');
  const [isEncodingMp3, setIsEncodingMp3] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copied, setCopied] = useState<CopiedStatus>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState<string | null>(null);
  const [speakerMapping, setSpeakerMapping] = useState<Record<string, string> | null>(null);
  
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const activeSpeakerRef = useRef<ActiveSpeaker>(null);
  const audioCacheRef = useRef(new Map<string, AudioCacheItem>());
  const translationCacheRef = useRef(new Map<string, TranslationCacheItem>());
  const previewAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewCacheRef = useRef(new Map<VoiceType, Uint8Array>());
  // Fix: Correctly type the recognitionRef to use the defined SpeechRecognition interface.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const apiAbortControllerRef = useRef<AbortController | null>(null);
  const previewAbortControllerRef = useRef<AbortController | null>(null);
  
  // Refs for chunked audio playback
  const audioQueueRef = useRef<Uint8Array[]>([]);
  const isPlayingQueueRef = useRef(false);
  const currentChunkSourceRef = useRef<AudioBufferSourceNode | null>(null);


  const isWebShareSupported = !!(navigator.share && navigator.canShare);

  // Keep ref in sync with state to avoid stale closures in async callbacks
  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  // Load history from localStorage on initial load
  useEffect(() => {
      try {
          const storedHistory = localStorage.getItem('translationHistory');
          if (storedHistory) {
              setHistory(JSON.parse(storedHistory));
          }
      } catch (error) {
          console.error("Failed to load history from localStorage:", error);
      }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
      try {
          localStorage.setItem('translationHistory', JSON.stringify(history));
      } catch (error) {
          console.error("Failed to save history to localStorage:", error);
      }
  }, [history]);

  // Combined effect for initial app setup from URL, localStorage, or browser settings.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Set UI Language
    const langFromUrl = params.get('lang') as Language | null;
    const langFromStorage = localStorage.getItem('appLanguage') as Language | null;
    let initialLang: Language = 'en'; // Default
    const isValidLang = (lang: string | null): lang is Language => !!lang && languageOptions.some(opt => opt.value === lang);

    if (isValidLang(langFromUrl)) {
        initialLang = langFromUrl;
    } else if (isValidLang(langFromStorage)) {
        initialLang = langFromStorage;
    } else {
        const browserLang = navigator.language.split('-')[0];
        if (isValidLang(browserLang)) {
            initialLang = browserLang;
        }
    }
    const selectedOption = languageOptions.find(opt => opt.value === initialLang) ?? languageOptions[1];
    setLanguage(selectedOption.value);
    setDirection(selectedOption.dir);
    localStorage.setItem('appLanguage', selectedOption.value);

    // 2. Set translation and speech settings from URL if they exist
    const sl = params.get('sl');
    if (sl && translationLanguages.some(l => l.code === sl)) setSourceLang(sl);
    else if (translationLanguages.some(l => l.code === selectedOption.value)) {
        // Fallback to sync with UI language if no 'sl' param
        setSourceLang(selectedOption.value);
    }

    const tl = params.get('tl');
    if (tl && translationLanguages.some(l => l.code === tl)) setTargetLang(tl);

    const text = params.get('text');
    if (text) setSourceText(decodeURIComponent(text));
    
    const voiceParam = params.get('voice') as VoiceType;
    if (voiceParam && allVoices.some(v => v.value === voiceParam)) setVoice(voiceParam);
    
    const emotionParam = params.get('emotion') as EmotionType;
    if (emotionParam && ['Default', 'Happy', 'Sad', 'Formal'].includes(emotionParam)) setEmotion(emotionParam);

    const speedParam = params.get('speed');
    if (speedParam && !isNaN(parseFloat(speedParam))) setSpeed(parseFloat(speedParam));
    
    const pauseParam = params.get('pause');
    if (pauseParam && !isNaN(parseFloat(pauseParam))) setPauseDuration(parseFloat(pauseParam));

  }, []);

  // Update document attributes and title when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = t('pageTitle', language);
  }, [language, direction]);

  // Handle clicks outside dropdowns/modals to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setIsLangDropdownOpen(false);
        }
        if (settingsModalRef.current && !settingsModalRef.current.contains(event.target as Node)) {
            // Stop any preview playback when closing the modal
            if (previewAudioSourceRef.current) {
                previewAudioSourceRef.current.stop();
                previewAudioSourceRef.current = null;
                setIsPreviewingVoice(null);
            }
            if (previewAbortControllerRef.current) {
                previewAbortControllerRef.current.abort();
            }
            setIsSettingsModalOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup speech recognition and audio contexts on component unmount
  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        if (apiAbortControllerRef.current) {
            apiAbortControllerRef.current.abort();
        }
        if (previewAbortControllerRef.current) {
            previewAbortControllerRef.current.abort();
        }
        if (globalAudioContext && globalAudioContext.state !== 'closed') {
             globalAudioContext.close().catch(e => console.error("Error closing main audio context:", e));
             globalAudioContext = null;
        }
    };
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    const selectedOption = languageOptions.find(opt => opt.value === newLang);
    if (selectedOption) {
      setLanguage(selectedOption.value);
      setDirection(selectedOption.dir);
       // Sync source language with UI language for a better UX
       if (translationLanguages.some(l => l.code === selectedOption.value)) {
          setSourceLang(selectedOption.value);
       }
      
      const params = new URLSearchParams(window.location.search);
      params.set('lang', newLang);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      localStorage.setItem('appLanguage', selectedOption.value);
    }
    setIsLangDropdownOpen(false);
  };
  
  const findLanguageName = (code: string): string => {
      return translationLanguages.find(lang => lang.code === code)?.name || code;
  }

  const handleTranslate = useCallback(async () => {
    if (isTranslating) {
        if (apiAbortControllerRef.current) {
            apiAbortControllerRef.current.abort();
        }
        setIsTranslating(false);
        return;
    }
    if (!sourceText.trim()) return;

    const cacheKey = `${sourceLang}:${targetLang}:${speakerA.name}:${speakerB.name}:${sourceText}`;
    if (translationCacheRef.current.has(cacheKey)) {
        const cachedResult = translationCacheRef.current.get(cacheKey)!;
        setTranslatedText(cachedResult.translatedText);
        setSpeakerMapping(cachedResult.speakerMapping);
        return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslatedText('');
    setSpeakerMapping(null);

    apiAbortControllerRef.current = new AbortController();
    const signal = apiAbortControllerRef.current.signal;

    try {
        const sourceLangName = findLanguageName(sourceLang);
        const targetLangName = findLanguageName(targetLang);
        
        const result = await translateText(sourceText, sourceLangName, targetLangName, speakerA.name, speakerB.name, signal);
        
        setTranslatedText(result.translatedText);
        setSpeakerMapping(result.speakerMapping);
        translationCacheRef.current.set(cacheKey, result);

        // Add to history
        const newHistoryItem: HistoryItem = {
            id: `hist-${Date.now()}`,
            sourceText,
            translatedText: result.translatedText,
            sourceLang,
            targetLang,
            timestamp: Date.now(),
            speakerMapping: result.speakerMapping,
        };
        setHistory(prev => [newHistoryItem, ...prev.filter(item => item.sourceText !== sourceText)]);


    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.log("Translation aborted by user.");
        } else {
            console.error(err);
            setError(t('errorTranslate', language));
        }
    } finally {
        setIsTranslating(false);
        apiAbortControllerRef.current = null;
    }
  }, [sourceText, sourceLang, targetLang, language, speakerA.name, speakerB.name, isTranslating]);


  // Hard reset function for all audio playback.
  const stopAllAudio = useCallback(() => {
    if (apiAbortControllerRef.current) {
        apiAbortControllerRef.current.abort();
        apiAbortControllerRef.current = null;
    }
    if (currentChunkSourceRef.current) {
        currentChunkSourceRef.current.onended = null;
        try { currentChunkSourceRef.current.stop(); } catch (e) {}
        currentChunkSourceRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    
    setActiveSpeaker(null);
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, []);


  const handleSpeechAction = useCallback(async (textToSpeak: string, textLangCode: string, speakerType: 'source' | 'target') => {
    // If user clicks stop, or a different button
    if ((isPlaying || isLoadingAudio) && activeSpeaker === speakerType) {
        stopAllAudio();
        return;
    }
    
    if (activeSpeaker !== null) {
        stopAllAudio();
    }
    
    if (!textToSpeak.trim()) return;

    setActiveSpeaker(speakerType);
    setIsLoadingAudio(true);
    setError(null);

    const audioContext = await getResumedAudioContext();

    const playNextChunk = async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingQueueRef.current = false;
            stopAllAudio(); // Finished queue
            return;
        }

        isPlayingQueueRef.current = true;
        const pcm = audioQueueRef.current.shift()!;
        
        try {
            const audioBuffer = await decodeAudioData(pcm, audioContext, 24000, 1);
            if (activeSpeakerRef.current !== speakerType) { // Check if cancelled while decoding
                stopAllAudio();
                return;
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);

            currentChunkSourceRef.current = source;

            source.onended = () => {
                currentChunkSourceRef.current = null;
                if (isPlayingQueueRef.current) {
                    playNextChunk();
                }
            };
        } catch (e) {
            console.error("Error playing chunk:", e);
            setError(t('errorUnexpected', language));
            stopAllAudio();
        }
    };

    apiAbortControllerRef.current = new AbortController();
    const signal = apiAbortControllerRef.current.signal;

    try {
        // FIX: Conditionally chunk text. For multi-speaker mode, the entire text must be sent in one go
        // to provide the necessary context for the model to assign different voices correctly.
        // For single-speaker mode, we retain the chunking for a faster, streaming-like response.
        const chunks = isMultiSpeakerMode && speakerA.name.trim() && speakerB.name.trim()
            ? [textToSpeak.trim()].filter(Boolean) // Use the whole text as a single chunk
            : textToSpeak.split(/\n+/).filter(p => p.trim().length > 0); // Original chunking for single voice

        if (chunks.length === 0) {
            stopAllAudio();
            return;
        }
        
        let fullPcmChunks: Uint8Array[] = [];

        for (const chunk of chunks) {
            if (signal.aborted) throw new Error('AbortError');
            
            let speakersForApi;
            if (isMultiSpeakerMode) {
                if (speakerType === 'target' && speakerMapping) {
                     speakersForApi = {
                        speakerA: { name: speakerMapping[speakerA.name] || speakerA.name, voice: speakerA.voice },
                        speakerB: { name: speakerMapping[speakerB.name] || speakerB.name, voice: speakerB.voice }
                    };
                } else if (speakerType === 'source') {
                    speakersForApi = { speakerA, speakerB };
                }
            }
            const textLangName = findLanguageName(textLangCode);

            const pcm = await generateSpeech(
                chunk, voice, speed, textLangName, pauseDuration, emotion, 
                speakersForApi, signal
            );
            
            if (pcm) {
                audioQueueRef.current.push(pcm);
                fullPcmChunks.push(pcm);
                
                if (!isPlayingQueueRef.current) {
                    setIsLoadingAudio(false);
                    setIsPlaying(true);
                    playNextChunk();
                }
            }
        }
        
        // After all chunks are fetched, combine them for download/share
        // This won't run if playback was cancelled
        if (fullPcmChunks.length > 0) {
           const combinedPcm = new Uint8Array(fullPcmChunks.reduce((acc, val) => acc + val.length, 0));
           let offset = 0;
           for(const chunk of fullPcmChunks) {
               combinedPcm.set(chunk, offset);
               offset += chunk.length;
           }
           setLastPlayedPcm(combinedPcm);
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Speech action failed:", err);
            setError(t('errorUnexpected', language));
        }
        stopAllAudio();
    }
  }, [voice, speed, language, activeSpeaker, isPlaying, isLoadingAudio, pauseDuration, emotion, speakerA, speakerB, isMultiSpeakerMode, speakerMapping, stopAllAudio]);
  

  const handleListen = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
        setError(t('errorMicNotSupported', language));
        return;
    }

    // Stop listening: A robust, manual cleanup process.
    if (isListening) {
        if (recognitionRef.current) {
            // Detach all event handlers to prevent lingering events from causing state issues
            recognitionRef.current.onstart = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            
            // Gracefully stop the recognition
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        // Manually and synchronously update the state to ensure the UI is responsive.
        setIsListening(false);
        return;
    }
    
    // Start listening
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    const selectedLangDetails = translationLanguages.find(lang => lang.code === sourceLang);
    const speechLangCode = selectedLangDetails ? selectedLangDetails.speechCode : sourceLang;

    recognition.lang = speechLangCode;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setSourceText('');
    };

    recognition.onend = () => {
        // This handler is now primarily for "natural" stops (e.g., after silence).
        // It defensively checks if it's still the active recognition instance before cleaning up.
        if (recognitionRef.current === recognition) {
             recognitionRef.current = null;
             setIsListening(false);
        }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setError(t('errorMicPermission', language));
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') { // 'no-speech' is a common, non-critical error
            setError(t('errorUnexpected', language));
        }
        
        // Always run cleanup to reset state, but only if this is the active instance.
        if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
            setIsListening(false);
        }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!recognitionRef.current) return;
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        setSourceText(transcript);
    };
    
    recognition.start();
  }, [isListening, sourceLang, language]);


  const handleDownload = async () => {
    if (!lastPlayedPcm) return;

    let blob: Blob;
    let filename: string;
    
    if (downloadFormat === 'mp3') {
        setIsEncodingMp3(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 10));
            blob = await createMp3Blob(lastPlayedPcm, 1, 24000);
            filename = 'sawtli-speech.mp3';
        } catch (e) {
            console.error("MP3 encoding failed:", e);
            setError(t('errorMp3Encoding', language));
            setIsEncodingMp3(false);
            return;
        } finally {
            setIsEncodingMp3(false);
        }
    } else {
        blob = createWavBlob(lastPlayedPcm, 1, 24000);
        filename = 'sawtli-speech.wav';
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const handleShareAudio = async () => {
    if (!lastPlayedPcm) return;
    if (!isWebShareSupported) {
        setError(t('shareNotSupported', language));
        return;
    }

    setIsSharing(true);
    setError(null);
    try {
        const blob = await createMp3Blob(lastPlayedPcm, 1, 24000);
        const file = new File([blob], 'sawtli-speech.mp3', { type: 'audio/mpeg' });
        
        await navigator.share({
            files: [file],
            title: t('sharedAudioTitle', language),
            text: t('sharedAudioText', language),
        });
    } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
            console.error("Web Share API failed:", err);
            setError(t('errorUnexpected', language));
        }
    } finally {
        setIsSharing(false);
    }
  };

  const handleShareLink = () => {
      const params = new URLSearchParams();
      params.set('sl', sourceLang);
      params.set('tl', targetLang);
      params.set('text', encodeURIComponent(sourceText));
      params.set('voice', voice);
      params.set('emotion', emotion);
      params.set('speed', speed.toString());
      params.set('pause', pauseDuration.toString());
      
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

      navigator.clipboard.writeText(url).then(() => {
          handleCopy(url, 'link');
      });
  };

  const handleSwapLanguages = () => {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      setSourceText(translatedText);
      setTranslatedText(sourceText);
      setSpeakerMapping(null); // Clear mapping as the context has changed
  };

  const handleCopy = (text: string, type: 'source' | 'target' | 'link') => {
      if (!text) return;
      if (type !== 'link') {
        navigator.clipboard.writeText(text);
      }
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
  };

  const handleClearHistory = () => {
      setHistory([]);
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
      setSourceText(item.sourceText);
      setTranslatedText(item.translatedText);
      setSourceLang(item.sourceLang);
      setTargetLang(item.targetLang);
      setSpeakerMapping(item.speakerMapping);
      setIsHistoryModalOpen(false);
  };

  const handlePreviewVoice = async (voiceToPreview: VoiceType) => {
    if (previewAudioSourceRef.current) {
        previewAudioSourceRef.current.onended = null;
        try { previewAudioSourceRef.current.stop(); } catch(e) {}
        previewAudioSourceRef.current = null;
    }
    if (previewAbortControllerRef.current) {
        previewAbortControllerRef.current.abort();
    }

    if (isPreviewingVoice === voiceToPreview) {
        setIsPreviewingVoice(null);
        return;
    }

    setIsPreviewingVoice(voiceToPreview);
    setError(null);
    
    previewAbortControllerRef.current = new AbortController();
    const signal = previewAbortControllerRef.current.signal;

    try {
        const audioContext = await getResumedAudioContext();

        let pcm: Uint8Array | null;
        if (previewCacheRef.current.has(voiceToPreview)) {
            pcm = previewCacheRef.current.get(voiceToPreview)!;
        } else {
            const sampleText = t('voicePreviewText', language);
            pcm = await previewVoice(voiceToPreview, sampleText, signal);
            if (pcm) {
                previewCacheRef.current.set(voiceToPreview, pcm);
            }
        }

        if (pcm) {
            const buffer = await decodeAudioData(pcm, audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
            previewAudioSourceRef.current = source;
            source.onended = () => {
                if (previewAudioSourceRef.current === source) {
                    setIsPreviewingVoice(null);
                    previewAudioSourceRef.current = null;
                }
            };
        } else {
            throw new Error("Preview API returned no audio");
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Voice preview failed:", err);
            setError(t('errorUnexpected', language));
        }
        setIsPreviewingVoice(null);
    }
  };


  const currentLanguageLabel = languageOptions.find(opt => opt.value === language)?.label;
  
  const MAX_CHARS = 5000;
  const isUIBlocked = isTranslating || isListening || isSharing || !!isPreviewingVoice;

  // FIX: Use `keyof typeof translations` instead of `keyof typeof t` for `labelKey`.
  // `t` is a function, and `keyof typeof t` does not correctly represent the keys of the translation object, leading to type errors.
  // FIX: The list of voices has been corrected to include only the 5 supported voices.
  const allVoices: { value: VoiceType; labelKey: keyof typeof translations }[] = [
      { value: 'Puck', labelKey: 'voicePuck' },
      { value: 'Zephyr', labelKey: 'voiceZephyr' },
      { value: 'Kore', labelKey: 'voiceKore' },
      { value: 'Charon', labelKey: 'voiceCharon' },
      { value: 'Fenrir', labelKey: 'voiceFenrir' },
  ];

  // Logic for dynamic textarea padding
  const pageDir = direction;
  const sourceTextDir = getDirectionForLang(sourceLang);
  let sourcePaddingClass = '';
  if (pageDir === 'rtl' && sourceTextDir === 'ltr') {
      sourcePaddingClass = 'pl-10';
  } else if (pageDir === 'ltr' && sourceTextDir === 'rtl') {
      sourcePaddingClass = 'pr-10';
  }

  const targetTextDir = getDirectionForLang(targetLang);
  let targetPaddingClass = '';
  if (pageDir === 'rtl' && targetTextDir === 'ltr') {
      targetPaddingClass = 'pl-10';
  } else if (pageDir === 'ltr' && targetTextDir === 'rtl') {
      targetPaddingClass = 'pr-10';
  }

  // Button state logic
  const isSourceActive = activeSpeaker === 'source';
  const isSourceLoading = isLoadingAudio && isSourceActive;
  const isSourcePlaying = isPlaying && isSourceActive;

  const isTargetActive = activeSpeaker === 'target';
  const isTargetLoading = isLoadingAudio && isTargetActive;
  const isTargetPlaying = isPlaying && isTargetActive;

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 transform transition-all duration-300 relative glow-container">
        <div ref={langDropdownRef} className="absolute top-4 ltr:left-4 rtl:right-4 z-20">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 p-2 w-36 justify-between transition-colors hover:bg-slate-600"
            aria-label={t('selectInterfaceLanguage', language)}
            aria-haspopup="true"
            aria-expanded={isLangDropdownOpen}
          >
            <GlobeIcon />
            <span className="flex-grow text-center">{currentLanguageLabel}</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isLangDropdownOpen && (
             <div className="absolute top-full mt-1 w-36 bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden animate-fade-in-down">
                {languageOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleLanguageChange(option.value)}
                    className="w-full text-sm text-left px-4 py-2 hover:bg-cyan-600 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          )}
        </div>
        
        <div className="text-center pt-10 sm:pt-6">
            <div className="flex items-center justify-center gap-3 mb-2">
                <SawtliLogoIcon className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wider">
                    Sawtli
                </h1>
            </div>
            <p className="text-cyan-400 text-md">
                {t('subtitle', language)}
            </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center text-sm animate-fade-in-down">
            {error}
          </div>
        )}
        
        {copied === 'link' && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-lg text-center text-sm animate-fade-in-down">
            {t('linkCopied', language)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Source Text Area */}
            <div className="flex flex-col space-y-2">
                <label htmlFor="source-lang" className="text-sm text-slate-300">{t('sourceLanguage', language)}</label>
                <select 
                    id="source-lang" 
                    value={sourceLang} 
                    onChange={(e) => setSourceLang(e.target.value)} 
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                    dir={getDirectionForLang(sourceLang)}
                    disabled={activeSpeaker !== null}
                >
                    {translationLanguages.map((lang: LanguageListItem) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                <div className="relative">
                    <textarea
                        value={sourceText}
                        onChange={(e) => {
                            setSourceText(e.target.value);
                            setTranslatedText('');
                            setSpeakerMapping(null);
                        }}
                        placeholder={isListening ? t('listening', language) : t('placeholder', language)}
                        className={`w-full h-48 p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 placeholder-slate-500 text-base ${sourcePaddingClass}`}
                        disabled={isTranslating || activeSpeaker !== null}
                        readOnly={isListening}
                        maxLength={MAX_CHARS}
                        dir={getDirectionForLang(sourceLang)}
                    />
                    <button 
                        onClick={() => handleCopy(sourceText, 'source')} 
                        className="absolute top-2 ltr:right-2 rtl:left-2 p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors" 
                        aria-label={t('copy', language)}
                        title={t('copyTooltip', language)}
                    >
                        {copied === 'source' ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                    <div className="text-right text-xs text-slate-400 mt-1">{sourceText.length} / {MAX_CHARS}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                      onClick={handleListen}
                      disabled={isUIBlocked || activeSpeaker !== null}
                      className={`h-11 flex-grow flex items-center justify-center gap-2 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm disabled:cursor-not-allowed disabled:bg-slate-700 ${isListening ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-cyan-700 hover:bg-cyan-600'}`}
                      aria-label={isListening ? t('stopListening', language) : t('voiceInput', language)}
                      title={isListening ? t('stopListening', language) : t('voiceInput', language)}
                    >
                      {isListening ? <StopIcon /> : <MicrophoneIcon className="w-5 h-5" />}
                      <span>{isListening ? t('listening', language) : t('voiceInput', language)}</span>
                    </button>
                    <button
                      onClick={() => handleSpeechAction(sourceText, sourceLang, 'source')}
                      disabled={isUIBlocked || !sourceText.trim() || isTargetActive}
                      className="h-11 flex-grow flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm"
                    >
                      {isSourceLoading ? <LoaderIcon /> : isSourcePlaying ? <SoundWaveIcon /> : <SpeakerIcon />}
                      <span>
                        {isSourceLoading || isSourcePlaying
                          ? t('stopSpeaking', language)
                          : t('speakSource', language)}
                      </span>
                    </button>
                </div>
            </div>

            {/* Swap Button */}
            <div className="my-2 md:my-0">
                <button 
                    onClick={handleSwapLanguages}
                    disabled={activeSpeaker !== null} 
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed" 
                    aria-label={t('swapLanguages', language)}
                >
                    <SwapIcon />
                </button>
            </div>

            {/* Target Text Area */}
            <div className="flex flex-col space-y-2">
                <label htmlFor="target-lang" className="text-sm text-slate-300">{t('targetLanguage', language)}</label>
                <select 
                    id="target-lang" 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)} 
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                    dir={getDirectionForLang(targetLang)}
                    disabled={activeSpeaker !== null}
                >
                    {translationLanguages.map((lang: LanguageListItem) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                <div className="relative">
                    <textarea
                        value={translatedText}
                        readOnly
                        placeholder={t('translationPlaceholder', language)}
                        className={`w-full h-48 p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 placeholder-slate-500 cursor-not-allowed text-base ${targetPaddingClass}`}
                        dir={getDirectionForLang(targetLang)}
                    />
                    <button 
                        onClick={() => handleCopy(translatedText, 'target')} 
                        className="absolute top-2 ltr:right-2 rtl:left-2 p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors" 
                        aria-label={t('copy', language)}
                        title={t('copyTooltip', language)}
                    >
                        {copied === 'target' ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                    <div className="text-right text-xs text-slate-400 mt-1">{translatedText.length} / {MAX_CHARS}</div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeechAction(translatedText, targetLang, 'target')}
                      disabled={isUIBlocked || !translatedText.trim() || isSourceActive}
                      className="h-11 flex-grow flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm"
                    >
                      {isTargetLoading ? <LoaderIcon /> : isTargetPlaying ? <SoundWaveIcon /> : <SpeakerIcon />}
                      <span>
                        {isTargetLoading || isTargetPlaying
                          ? t('stopSpeaking', language)
                          : t('speakTarget', language)}
                      </span>
                    </button>
                 </div>
            </div>
        </div>
        
        <div className="pt-2">
             <button
              onClick={handleTranslate}
              disabled={isUIBlocked || activeSpeaker !== null}
              className="h-11 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg shadow-cyan-600/20 text-sm font-semibold"
            >
              {isTranslating ? (
                <>
                  <StopIcon />
                  <span>{t('translatingButtonStop', language)}</span>
                </>
              ) : (
                <>
                  <TranslateIcon />
                  <span>{t('translateButton', language)}</span>
                </>
              )}
            </button>
        </div>

        {/* Controls and Download */}
        <div className="border-t border-slate-700 pt-5 flex flex-wrap items-center justify-center gap-4">
            <button
                onClick={() => setIsSettingsModalOpen(true)}
                disabled={isTranslating || activeSpeaker !== null || isListening || isSharing}
                className="h-11 flex items-center justify-center gap-2 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700"
                aria-label={t('openSpeechSettings', language)}
            >
                <GearIcon />
                <span>{t('speechSettings', language)}</span>
            </button>

            <button
                onClick={() => setIsHistoryModalOpen(true)}
                disabled={isTranslating || activeSpeaker !== null || isListening || isSharing}
                className="h-11 flex items-center justify-center gap-2 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700"
                aria-label={t('historyButton', language)}
            >
                <HistoryIcon />
                <span>{t('historyButton', language)}</span>
            </button>
            
            <button
                onClick={handleShareLink}
                disabled={isTranslating || activeSpeaker !== null || isListening || isSharing || !sourceText.trim()}
                title={t('shareSettingsTooltip', language)}
                className="h-11 flex items-center justify-center gap-2 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700"
                aria-label={t('shareSettings', language)}
            >
                <LinkIcon />
                <span>{t('shareSettings', language)}</span>
            </button>

            <div className={`transition-opacity duration-500 flex items-center justify-center gap-4 ${lastPlayedPcm && !isLoadingAudio && !activeSpeaker ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="radio" name="format" value="mp3" checked={downloadFormat === 'mp3'} onChange={() => setDownloadFormat('mp3')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                        MP3
                    </label>
                     <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="radio" name="format" value="wav" checked={downloadFormat === 'wav'} onChange={() => setDownloadFormat('wav')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                        WAV
                    </label>
                </div>
                <button 
                    onClick={handleDownload} 
                    disabled={isEncodingMp3 || isSharing}
                    className="h-11 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm"
                >
                    {isEncodingMp3 ? <LoaderIcon /> : <DownloadIcon />}
                    <span>{isEncodingMp3 ? t('encoding', language) : `${t('downloadButton', language)}`}</span>
                </button>
                <button
                    onClick={handleShareAudio}
                    disabled={isEncodingMp3 || isSharing || !isWebShareSupported}
                    title={!isWebShareSupported ? t('shareNotSupported', language) : t('shareAudioTooltip', language)}
                    className="h-11 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform active:scale-95 text-sm"
                    aria-label={t('shareAudio', language)}
                >
                    {isSharing ? <LoaderIcon /> : <ShareIcon />}
                    <span>{isSharing ? t('sharingAudio', language) : t('shareAudio', language)}</span>
                </button>
            </div>
        </div>
        
        {isSettingsModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-down p-4">
                <div ref={settingsModalRef} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 relative">
                    <button onClick={() => setIsSettingsModalOpen(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors" aria-label="Close settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h3 className="text-xl font-semibold text-center text-cyan-400">{t('speechSettings', language)}</h3>
                    
                    <div className="space-y-4 text-sm">
                        {/* Voice Selection */}
                        <div>
                            <label htmlFor="voice-select" className="block text-slate-300 mb-1">{t('voiceLabel', language)}</label>
                            <div className="flex items-center gap-2">
                                <select id="voice-select" value={voice} onChange={(e) => setVoice(e.target.value as VoiceType)} disabled={isUIBlocked} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 flex-grow">
                                    {allVoices.map(v => <option key={v.value} value={v.value}>{t(v.labelKey, language)}</option>)}
                                </select>
                                <button type="button" onClick={() => handlePreviewVoice(voice)} disabled={isUIBlocked} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('previewVoiceTooltip', language)}>
                                    {isPreviewingVoice === voice ? <LoaderIcon /> : <PlayCircleIcon />}
                                </button>
                            </div>
                        </div>
                        {/* Emotion Selection */}
                        <div>
                            <label htmlFor="emotion-select" className="block text-slate-300 mb-1">{t('speechEmotion', language)}</label>
                            <select id="emotion-select" value={emotion} onChange={(e) => setEmotion(e.target.value as EmotionType)} disabled={isUIBlocked} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50">
                                {(['Default', 'Happy', 'Sad', 'Formal'] as EmotionType[]).map(e => (
                                    <option key={e} value={e}>{t(`emotion${e}` as any, language)}</option>
                                ))}
                            </select>
                        </div>
                        {/* Speed Selection */}
                        <div>
                            <label htmlFor="speed-select" className="block text-slate-300 mb-1">{t('speedLabel', language)}</label>
                            <select id="speed-select" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} disabled={isUIBlocked} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50">
                                <option value={0.75}>{t('speedVerySlow', language)}</option>
                                <option value={0.9}>{t('speedSlow', language)}</option>
                                <option value={1.0}>{t('speedNormal', language)}</option>
                                <option value={1.1}>{t('speedFast', language)}</option>
                                <option value={1.25}>{t('speedVeryFast', language)}</option>
                            </select>
                        </div>
                        {/* Pause Selection */}
                        <div>
                            <label htmlFor="pause-select" className="block text-slate-300 mb-1">{t('pauseLabel', language)}</label>
                            <select id="pause-select" value={pauseDuration} onChange={(e) => setPauseDuration(parseFloat(e.target.value))} disabled={isUIBlocked} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50">
                                {[0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].map(s => (
                                    <option key={s} value={s}>{s.toFixed(1)} {t('seconds', language)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Multi-speaker settings */}
                    <div className="border-t border-slate-700 pt-4 space-y-4">
                         <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-cyan-400">{t('multiSpeakerSettings', language)}</h4>
                            <div className="relative group">
                                <InfoIcon className="text-slate-400 cursor-pointer" />
                                <div className="absolute bottom-full ltr:right-0 rtl:left-0 mb-2 w-64 p-2 bg-slate-900 text-slate-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {t('multiSpeakerInfo', language)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                            <div className="flex-grow cursor-pointer" onClick={() => setIsMultiSpeakerMode(!isMultiSpeakerMode)}>
                                <p className="text-sm font-medium text-slate-300">{t('enableMultiSpeaker', language)}</p>
                                <p className="text-xs text-slate-400 font-normal">{t('enableMultiSpeakerInfo', language)}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="multi-speaker-toggle" 
                                    className="sr-only peer" 
                                    checked={isMultiSpeakerMode}
                                    onChange={() => setIsMultiSpeakerMode(!isMultiSpeakerMode)}
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] ltr:left-[2px] rtl:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                            </label>
                        </div>
                        <div className={`transition-opacity duration-300 space-y-4 ${isMultiSpeakerMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="speakerA-name" className="text-sm block text-slate-300 mb-1">{t('speakerName', language)} 1</label>
                                    <input type="text" id="speakerA-name" value={speakerA.name} onChange={(e) => setSpeakerA({...speakerA, name: e.target.value})} placeholder={t('speaker1', language)} disabled={!isMultiSpeakerMode} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
                                </div>
                                <div>
                                    <label htmlFor="speakerA-voice" className="text-sm block text-slate-300 mb-1">{t('speakerVoice', language)} 1</label>
                                    <div className="flex items-center gap-2">
                                        <select id="speakerA-voice" value={speakerA.voice} onChange={(e) => setSpeakerA({...speakerA, voice: e.target.value as VoiceType})} disabled={!isMultiSpeakerMode} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 flex-grow">
                                            {allVoices.map(v => <option key={v.value} value={v.value}>{t(v.labelKey, language)}</option>)}
                                        </select>
                                        <button type="button" onClick={() => handlePreviewVoice(speakerA.voice as VoiceType)} disabled={isUIBlocked || !isMultiSpeakerMode} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('previewVoiceTooltip', language)}>
                                            {isPreviewingVoice === speakerA.voice && isMultiSpeakerMode ? <LoaderIcon /> : <PlayCircleIcon />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="speakerB-name" className="text-sm block text-slate-300 mb-1">{t('speakerName', language)} 2</label>
                                    <input type="text" id="speakerB-name" value={speakerB.name} onChange={(e) => setSpeakerB({...speakerB, name: e.target.value})} placeholder={t('speaker2', language)} disabled={!isMultiSpeakerMode} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50" />
                                </div>
                                <div>
                                    <label htmlFor="speakerB-voice" className="text-sm block text-slate-300 mb-1">{t('speakerVoice', language)} 2</label>
                                    <div className="flex items-center gap-2">
                                        <select id="speakerB-voice" value={speakerB.voice} onChange={(e) => setSpeakerB({...speakerB, voice: e.target.value as VoiceType})} disabled={!isMultiSpeakerMode} className="w-full p-2.5 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 flex-grow">
                                            {allVoices.map(v => <option key={v.value} value={v.value}>{t(v.labelKey, language)}</option>)}
                                        </select>
                                        <button type="button" onClick={() => handlePreviewVoice(speakerB.voice as VoiceType)} disabled={isUIBlocked || !isMultiSpeakerMode} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('previewVoiceTooltip', language)}>
                                            {isPreviewingVoice === speakerB.voice && isMultiSpeakerMode ? <LoaderIcon /> : <PlayCircleIcon />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isHistoryModalOpen && (
            <History 
                items={history}
                language={language}
                onClose={() => setIsHistoryModalOpen(false)}
                onClear={handleClearHistory}
                onLoad={handleLoadHistoryItem}
            />
        )}


        {/* Feedback Section */}
        <div className="border-t border-slate-700 mt-2 pt-4">
            <Feedback language={language} />
        </div>
      </div>
      <footer className="text-slate-500 mt-4 text-xs">
        Copyright &copy; Yahya Massad - 2024
      </footer>
    </div>
  );
};

export default App;
