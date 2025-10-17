import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech, translateText, SpeechSpeed } from './services/geminiService';
import { decode, decodeAudioData, createWavBlob, createMp3Blob } from './utils/audioUtils';
import { SpeakerIcon, LoaderIcon, DownloadIcon, TranslateIcon } from './components/icons';
import { t, languageOptions, Language, Direction, translationLanguages, LanguageListItem } from './i18n/translations';
import { Feedback } from './components/Feedback';

type VoiceType = 'Puck' | 'Kore';
type DownloadFormat = 'wav' | 'mp3';

const App: React.FC = () => {
  const [sourceText, setSourceText] = useState<string>('Hello, world! How are you today?');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('fr');
  
  const [voice, setVoice] = useState<VoiceType>('Puck'); // Puck: Male, Kore: Female
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [pcmData, setPcmData] = useState<Uint8Array | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('mp3');
  
  const [language, setLanguage] = useState<Language>('ar');
  const [direction, setDirection] = useState<Direction>('rtl');
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    const selectedOption = languageOptions.find(opt => opt.value === newLang);
    if (selectedOption) {
      setLanguage(selectedOption.value);
      setDirection(selectedOption.dir);
    }
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


  const handleGenerateSpeech = useCallback(async (textToSpeak: string, textLangCode: string) => {
    if (!textToSpeak.trim()) return;

    setIsGeneratingSpeech(true);
    setError(null);
    setPcmData(null); 

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const textLangName = findLanguageName(textLangCode);
      const base64Audio = await generateSpeech(textToSpeak, voice, speed, textLangName);
      if (!base64Audio) {
        throw new Error('API_NO_AUDIO');
      }

      const decodedAudio = decode(base64Audio);
      setPcmData(decodedAudio);

      const audioBuffer = await decodeAudioData(decodedAudio, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

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
    } finally {
      setIsGeneratingSpeech(false);
    }
  }, [voice, speed, language]);

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

  const isLoading = isTranslating || isGeneratingSpeech;

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 transform transition-all hover:scale-[1.01] duration-300 relative">
        <div className="absolute top-4 ltr:left-4 rtl:right-4">
          <select
            onChange={handleLanguageChange}
            value={language}
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"
            aria-label={t('selectInterfaceLanguage', language)}
          >
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
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
                    disabled={isLoading}
                />
                <button
                  onClick={() => handleGenerateSpeech(sourceText, sourceLang)}
                  disabled={isLoading || !sourceText.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95"
                >
                  <SpeakerIcon />
                  <span>{t('speakSource', language)}</span>
                </button>
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
                 <button
                  onClick={() => handleGenerateSpeech(translatedText, targetLang)}
                  disabled={isLoading || !translatedText.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95"
                >
                  <SpeakerIcon />
                  <span>{t('speakTarget', language)}</span>
                </button>
            </div>
        </div>
        
        <div className="pt-4">
             <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
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
                            <input type="radio" name="voice" value="Puck" checked={voice === 'Puck'} onChange={() => setVoice('Puck')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isLoading}/>
                            <span>{t('maleVoice', language)}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                            <input type="radio" name="voice" value="Kore" checked={voice === 'Kore'} onChange={() => setVoice('Kore')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isLoading} />
                            <span>{t('femaleVoice', language)}</span>
                        </label>
                    </div>
                     <div className="text-center space-y-2">
                        <p className="text-slate-300">{t('speechSpeed', language)}</p>
                        <div className="flex justify-center gap-4 text-slate-300">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="slow" checked={speed === 'slow'} onChange={() => setSpeed('slow')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isLoading} /><span>{t('speedSlow', language)}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="normal" checked={speed === 'normal'} onChange={() => setSpeed('normal')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isLoading} /><span>{t('speedNormal', language)}</span></label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"><input type="radio" name="speed" value="fast" checked={speed === 'fast'} onChange={() => setSpeed('fast')} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2" disabled={isLoading} /><span>{t('speedFast', language)}</span></label>
                        </div>
                    </div>
                </div>
                {/* Download Section */}
                <div className={`transition-opacity duration-500 ${pcmData && !isGeneratingSpeech ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
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