import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech, translateText, SpeechSpeed } from './services/geminiService';
import { decodeAudioData, createWavBlob, createMp3Blob } from './utils/audioUtils';
import { SpeakerIcon, LoaderIcon, DownloadIcon, TranslateIcon, StopIcon, GlobeIcon, ChevronDownIcon, ReplayIcon } from './components/icons';
import { t, languageOptions, Language, Direction, translationLanguages, LanguageListItem } from './i18n/translations';
import { Feedback } from './components/Feedback';

type VoiceType = 'Puck' | 'Kore';
type DownloadFormat = 'wav' | 'mp3';
type ActiveSpeaker = 'source' | 'target' | null;

interface AudioCacheItem {
    pcm: Uint8Array;
    buffer: AudioBuffer;
}

const App: React.FC = () => {
  const [sourceText, setSourceText] = useState<string>('Hello, world! How are you today?\n\nThis is a second paragraph to demonstrate the pause feature.');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('fr');
  
  const [voice, setVoice] = useState<VoiceType>('Puck'); // Puck: Male, Kore: Female
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  const [pauseDuration, setPauseDuration] = useState<number>(1.0);
  
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<ActiveSpeaker>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [pcmData, setPcmData] = useState<Uint8Array | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('mp3');
  
  const [language, setLanguage] = useState<Language>('en');
  const [direction, setDirection] = useState<Direction>('ltr');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const activeSpeakerRef = useRef<ActiveSpeaker>(null);
  const audioCacheRef = useRef(new Map<string, AudioCacheItem>());
  const playbackStateRef = useRef({
    source: { position: 0, startTime: 0 },
    target: { position: 0, startTime: 0 }
  });


  // Keep ref in sync with state to avoid stale closures in async callbacks
  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  // Set default language from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langFromUrl = params.get('lang') as Language;
    const selectedOption = languageOptions.find(opt => opt.value === langFromUrl);
    if (selectedOption) {
        setLanguage(selectedOption.value);
        setDirection(selectedOption.dir);
    }
  }, []);

  // Update document attributes and title when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = t('title', language);
  }, [language, direction]);

  // Handle clicks outside language dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
            setIsLangDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    const selectedOption = languageOptions.find(opt => opt.value === newLang);
    if (selectedOption) {
      setLanguage(selectedOption.value);
      setDirection(selectedOption.dir);
      
      const params = new URLSearchParams(window.location.search);
      params.set('lang', newLang);
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    setIsLangDropdownOpen(false);
  };
  
  const findLanguageName = (code: string): string => {
      return translationLanguages.find(lang => lang.code === code)?.name || code;
  }

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setError(null);
    setTranslatedText('');

    try {
        const sourceLangName = findLanguageName(sourceLang);
        const targetLangName = findLanguageName(targetLang);
        const result = await translateText(sourceText, sourceLangName, targetLangName);
        setTranslatedText(result);
    } catch (err) {
        console.error(err);
        setError(t('errorTranslate', language));
    } finally {
        setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, language]);


  const handleSpeechAction = useCallback(async (textToSpeak: string, textLangCode: string, speakerType: 'source' | 'target') => {
    // 1. If the user clicks the button of the active speaker, it's a 'PAUSE' action.
    if (activeSpeaker === speakerType) {
        if (audioSourceRef.current && audioContextRef.current) {
            const elapsed = audioContextRef.current.currentTime - playbackStateRef.current[speakerType].startTime;
            playbackStateRef.current[speakerType].position += elapsed;
            audioSourceRef.current.onended = null; // Prevent onended from firing after manual stop
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        setActiveSpeaker(null);
        setIsGeneratingSpeech(false);
        return;
    }

    // --- It's a 'PLAY' or 'RESUME' action from here ---
    // 2. Stop any currently playing audio stream (could be the other speaker).
    if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
        // Also reset the position of the speaker that was just interrupted.
        if (activeSpeaker) {
            playbackStateRef.current[activeSpeaker].position = 0;
        }
    }
    
    // Helper function to encapsulate the audio playback logic
    const playAudio = async (audioBuffer: AudioBuffer, speaker: 'source' | 'target') => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        audioSourceRef.current = source;

        const offset = playbackStateRef.current[speaker].position;
        const startOffset = (offset < audioBuffer.duration) ? offset : 0;
        
        playbackStateRef.current[speaker].startTime = audioContext.currentTime - startOffset;
        source.start(0, startOffset);

        source.onended = () => {
            if (audioSourceRef.current === source) {
                playbackStateRef.current[speaker].position = 0;
                audioSourceRef.current = null;
                // Use a functional update to ensure we are not working with stale state,
                // making the UI update instantly and reliably.
                setActiveSpeaker(prev => prev === speaker ? null : prev);
            }
        };
    };
    
    if (!textToSpeak.trim()) return;

    setError(null);
    
    const textLangName = findLanguageName(textLangCode);
    const cacheKey = `${textLangCode}:${voice}:${speed}:${pauseDuration}:${textToSpeak}`;

    if (audioCacheRef.current.has(cacheKey)) {
        setActiveSpeaker(speakerType);
        const cachedAudio = audioCacheRef.current.get(cacheKey)!;
        setPcmData(cachedAudio.pcm);
        await playAudio(cachedAudio.buffer, speakerType);
    } else {
        playbackStateRef.current[speakerType].position = 0;
        
        setIsGeneratingSpeech(true);
        setActiveSpeaker(speakerType);
        try {
            const generatedPcm = await generateSpeech(textToSpeak, voice, speed, textLangName, pauseDuration);
            
            if (activeSpeakerRef.current !== speakerType) {
                setIsGeneratingSpeech(false);
                return; 
            }
            
            if (generatedPcm) {
                if (!audioContextRef.current) {
                     audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioBuffer = await decodeAudioData(generatedPcm, audioContextRef.current, 24000, 1);
                
                audioCacheRef.current.set(cacheKey, { pcm: generatedPcm, buffer: audioBuffer });
                
                setPcmData(generatedPcm);
                setIsGeneratingSpeech(false);
                await playAudio(audioBuffer, speakerType);
            } else {
                throw new Error('API_NO_AUDIO');
            }
        } catch (err) {
            console.error(err);
            setPcmData(null); 
            let errorMessage = t('errorUnexpected', language);
            if (err instanceof Error) {
                if (err.message === 'API_NO_AUDIO') {
                    errorMessage = t('errorApiNoAudio', language);
                } else if (err.message === 'GEMINI_API_ERROR') {
                    errorMessage = t('errorGemini', language);
                }
            }
            setError(errorMessage);
            setActiveSpeaker(null);
            setIsGeneratingSpeech(false);
            audioSourceRef.current = null;
            playbackStateRef.current[speakerType].position = 0;
        }
    }
  }, [voice, speed, language, activeSpeaker, pauseDuration]);
  
  const handleResetAndPlay = (textToSpeak: string, textLangCode: string, speakerType: 'source' | 'target') => {
      if (audioSourceRef.current) {
          audioSourceRef.current.onended = null;
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
      }
      playbackStateRef.current[speakerType].position = 0;
      setActiveSpeaker(null);
      
      // Use a small timeout to allow the UI to process the 'stop' state change
      // before immediately initiating the 'play' action, ensuring a smooth transition.
      setTimeout(() => {
          handleSpeechAction(textToSpeak, textLangCode, speakerType);
      }, 50);
  };

  const handleDownload = () => {
    if (!pcmData) return;

    let blob: Blob;
    if (downloadFormat === 'wav') {
      blob = createWavBlob(pcmData, 1, 24000);
    } else {
      blob = createMp3Blob(pcmData, 1, 24000);
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `gemini-speech.${downloadFormat}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const currentLanguageLabel = languageOptions.find(opt => opt.value === language)?.label;

  const isSourceActive = activeSpeaker === 'source';
  const isSourceLoading = isSourceActive && isGeneratingSpeech;
  const isSourcePaused = !isSourceActive && playbackStateRef.current.source.position > 0;
  const isTargetActive = activeSpeaker === 'target';
  const isTargetLoading = isTargetActive && isGeneratingSpeech;
  const isTargetPaused = !isTargetActive && playbackStateRef.current.target.position > 0;


  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 transform transition-all hover:scale-[1.01] duration-300 relative">
        <div ref={langDropdownRef} className="absolute top-4 ltr:left-4 rtl:right-4 z-10">
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
        
        <div className="text-center pt-10 sm:pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">
            {t('title', language)}
          </h1>
          <p className="text-slate-400 mt-2">
            {t('subtitle', language)}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-center animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Text Area */}
            <div className="flex flex-col space-y-2">
                <label htmlFor="source-lang" className="text-slate-300">{t('sourceLanguage', language)}</label>
                <select id="source-lang" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5">
                    {translationLanguages.map((lang: LanguageListItem) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t('placeholder', language)}
                    className="w-full h-48 p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 placeholder-slate-500"
                    disabled={isTranslating}
                />
                <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeechAction(sourceText, sourceLang, 'source')}
                      disabled={isTranslating || !sourceText.trim()}
                      className="flex-grow flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95"
                    >
                      {isSourceLoading ? <LoaderIcon /> : isSourceActive ? <StopIcon /> : <SpeakerIcon />}
                      <span>
                        {isSourceLoading
                          ? t('generatingSpeech', language)
                          : isSourceActive
                          ? t('stopSpeaking', language)
                          : isSourcePaused
                          ? t('resumeSpeaking', language)
                          : t('speakSource', language)}
                      </span>
                    </button>
                    {isSourcePaused && (
                        <button
                          onClick={() => handleResetAndPlay(sourceText, sourceLang, 'source')}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors transform active:scale-90"
                          aria-label={t('replay', language)}
                        >
                            <ReplayIcon />
                        </button>
                    )}
                </div>
            </div>
            {/* Target Text Area */}
            <div className="flex flex-col space-y-2">
                <label htmlFor="target-lang" className="text-slate-300">{t('targetLanguage', language)}</label>
                <select id="target-lang" value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5">
                    {translationLanguages.map((lang: LanguageListItem) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                <textarea
                    value={translatedText}
                    readOnly
                    placeholder={t('translationPlaceholder', language)}
                    className="w-full h-48 p-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 placeholder-slate-500 cursor-not-allowed"
                />
                 <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeechAction(translatedText, targetLang, 'target')}
                      disabled={isTranslating || !translatedText.trim()}
                      className="flex-grow flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95"
                    >
                      {isTargetLoading ? <LoaderIcon /> : isTargetActive ? <StopIcon /> : <SpeakerIcon />}
                      <span>
                        {isTargetLoading
                          ? t('generatingSpeech', language)
                          : isTargetActive
                          ? t('stopSpeaking', language)
                          : isTargetPaused
                          ? t('resumeSpeaking', language)
                          : t('speakTarget', language)}
                      </span>
                    </button>
                    {isTargetPaused && (
                         <button
                          onClick={() => handleResetAndPlay(translatedText, targetLang, 'target')}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors transform active:scale-90"
                          aria-label={t('replay', language)}
                        >
                            <ReplayIcon />
                        </button>
                    )}
                 </div>
            </div>
        </div>
        
        <div className="pt-4">
             <button
              onClick={handleTranslate}
              disabled={isTranslating || isGeneratingSpeech || !sourceText.trim()}
              className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg shadow-cyan-600/20"
            >
              {isTranslating ? (
                <>
                  <LoaderIcon />
                  <span>{t('translatingButton', language)}</span>
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
        <div className="border-t border-slate-700 pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice & Speed Controls */}
                <div className="space-y-4">
                    <div className="flex justify-center gap-8 text-slate-300">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                            <input type="radio" name="voice" value="Puck" checked={voice === 'Puck'} onChange={() => setVoice('Puck')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isTranslating || isGeneratingSpeech}/>
                            <span>{t('maleVoice', language)}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                            <input type="radio" name="voice" value="Kore" checked={voice === 'Kore'} onChange={() => setVoice('Kore')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isTranslating || isGeneratingSpeech} />
                            <span>{t('femaleVoice', language)}</span>
                        </label>
                    </div>
                     <div className="text-center space-y-2">
                        <p className="text-slate-300">{t('speechSpeed', language)}</p>
                        <div className="flex justify-center gap-4 text-slate-300">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="slow" checked={speed === 'slow'} onChange={() => setSpeed('slow')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isTranslating || isGeneratingSpeech} /><span>{t('speedSlow', language)}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="normal" checked={speed === 'normal'} onChange={() => setSpeed('normal')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isTranslating || isGeneratingSpeech} /><span>{t('speedNormal', language)}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="fast" checked={speed === 'fast'} onChange={() => setSpeed('fast')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isTranslating || isGeneratingSpeech} /><span>{t('speedFast', language)}</span></label>
                        </div>
                    </div>
                    <div className="text-center space-y-3 pt-2">
                        <label htmlFor="pause-duration" className="text-slate-300 flex justify-center items-center gap-2">
                            {t('paragraphPause', language)}
                            <span className="font-mono text-cyan-400 bg-slate-900/50 px-2 py-0.5 rounded-md text-sm">{pauseDuration.toFixed(1)}{t('seconds', language)}</span>
                        </label>
                        <input
                            id="pause-duration"
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={pauseDuration}
                            onChange={(e) => setPauseDuration(parseFloat(e.target.value))}
                            disabled={isTranslating || isGeneratingSpeech}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full"
                        />
                    </div>
                </div>
                {/* Download Section */}
                <div className={`transition-opacity duration-500 ${pcmData && !isGeneratingSpeech && !activeSpeaker ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div className="bg-slate-700/50 p-4 rounded-lg space-y-4 h-full flex flex-col justify-center">
                        <div className="flex justify-center items-center gap-4 sm:gap-8 text-slate-300">
                            <span className="font-bold text-sm sm:text-base">{t('downloadFormat', language)}</span>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" value="mp3" checked={downloadFormat === 'mp3'} onChange={() => setDownloadFormat('mp3')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2"/><span>MP3</span></label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" value="wav" checked={downloadFormat === 'wav'} onChange={() => setDownloadFormat('wav')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2"/><span>WAV</span></label>
                        </div>
                        <button onClick={handleDownload} className="w-full flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg shadow-slate-600/20">
                            <DownloadIcon />
                            <span>{`${t('downloadButton', language)} (${downloadFormat.toUpperCase()})`}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {/* Feedback Section */}
        <div className="border-t border-slate-700 mt-2 pt-6">
            <Feedback language={language} />
        </div>
      </div>
      <footer className="text-slate-500 mt-6 text-sm">
        Copy Right @Yahya Massad - 2025
      </footer>
    </div>
  );
};

export default App;
