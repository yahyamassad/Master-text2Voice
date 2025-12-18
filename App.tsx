
import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo, lazy, ReactElement } from 'react';
import { generateSpeech, translateText, addDiacritics } from './services/geminiService';
import { generateStandardSpeech, generateMultiSpeakerStandardSpeech } from './services/standardVoiceService';
import { playAudio, createWavBlob, createMp3Blob } from './utils/audioUtils';
import {
  SawtliLogoIcon, LoaderIcon, StopIcon, SpeakerIcon, TranslateIcon, SwapIcon, GearIcon, HistoryIcon, DownloadIcon, ShareIcon, CopyIcon, CheckIcon, LinkIcon, GlobeIcon, PlayCircleIcon, MicrophoneIcon, SoundWaveIcon, WarningIcon, UserIcon, SoundEnhanceIcon, ChevronDownIcon, InfoIcon, ReportIcon, PauseIcon, VideoCameraIcon, StarIcon, LockIcon, SparklesIcon, TrashIcon, WandIcon
} from './components/icons';
import { t, Language, languageOptions, translationLanguages } from './i18n/translations';
import { History } from './components/History';
import { HistoryItem, SpeakerConfig, GEMINI_VOICES, MICROSOFT_AZURE_VOICES, PLAN_LIMITS, UserTier, UserStats } from './types';
import firebase, { getFirebase } from './firebaseConfig';
import { subscribeToHistory, addHistoryItem, clearHistoryForUser, deleteUserDocument, addToWaitlist, deleteHistoryItem } from './services/firestoreService';

// Lazy Components
const Feedback = lazy(() => import('./components/Feedback'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const ReportModal = lazy(() => import('./components/ReportModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const AudioStudioModal = lazy(() => import('./components/AudioStudioModal'));
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));
const TutorialModal = lazy(() => import('./components/TutorialModal'));
const PrivacyModal = lazy(() => import('./components/PrivacyModal'));

type User = firebase.User;

const getInitialLanguage = (): Language => {
    try {
        const saved = localStorage.getItem('sawtli_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.uiLanguage) return parsed.uiLanguage;
        }
        const browserLang = navigator.language.split('-')[0];
        if (['ar', 'fr', 'es', 'pt'].includes(browserLang)) return browserLang as Language;
    } catch (e) {}
    return 'ar';
};

const App: React.FC = () => {
  const [uiLanguage, setUiLanguage] = useState<Language>(getInitialLanguage);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<string>(uiLanguage);
  const [targetLang, setTargetLang] = useState<string>(uiLanguage === 'ar' ? 'en' : 'ar');
  
  const [isLoading, setIsLoading] = useState(false);
  const [activePlayer, setActivePlayer] = useState<'source' | 'target' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userTier, setUserTier] = useState<UserTier>('free');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Settings
  const [voice, setVoice] = useState('ar-SA-HamedNeural');
  const [emotion, setEmotion] = useState('Default');
  const [speed, setSpeed] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [pauseDuration, setPauseDuration] = useState(1.0);
  const [multiSpeaker, setMultiSpeaker] = useState(false);
  const [speakerA, setSpeakerA] = useState<SpeakerConfig>({ name: 'Yazan', voice: 'ar-SA-HamedNeural' });
  const [speakerB, setSpeakerB] = useState<SpeakerConfig>({ name: 'Lana', voice: 'ar-EG-SalmaNeural' });
  const [speakerC, setSpeakerC] = useState<SpeakerConfig>({ name: 'Haya', voice: 'ar-JO-SanaNeural' });
  const [speakerD, setSpeakerD] = useState<SpeakerConfig>({ name: 'Rana', voice: 'ar-SY-AmanyNeural' });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Auth & Stats Sync
  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((u) => {
        setUser(u as User);
        setIsAuthLoading(false);
        if (u) {
            subscribeToHistory(u.uid, setHistory);
        }
    });
    return () => unsubscribe();
  }, []);

  const handleTranslate = async () => {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    try {
        const result = await translateText(sourceText, sourceLang, targetLang);
        // التعديل الجذري: التأكد من وجود النص قبل استدعاء أي خصائص
        if (result && result.translatedText) {
            setTranslatedText(result.translatedText);
            if (user) {
                await addHistoryItem(user.uid, {
                    sourceText,
                    translatedText: result.translatedText,
                    sourceLang,
                    targetLang
                });
            }
        } else {
            throw new Error("Invalid response from translator");
        }
    } catch (e: any) {
        console.error("Translation error:", e);
        alert(uiLanguage === 'ar' ? "فشلت الترجمة، يرجى المحاولة لاحقاً" : "Translation failed, please try again.");
    } finally {
        setIsLoading(true); // لغرض العرض فقط ثم إغلاقها
        setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleSignIn = async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (e) {
        console.error("Sign in failed", e);
    }
  };

  const stopAll = useCallback(() => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
    }
    setActivePlayer(null);
    setIsPaused(false);
  }, []);

  const handleSpeak = async (text: string, target: 'source' | 'target') => {
    if (!text.trim()) return;
    if (activePlayer === target && !isPaused) {
        stopAll();
        return;
    }
    stopAll();
    setActivePlayer(target);
    
    try {
        const pcm = await generateStandardSpeech(text, voice, pauseDuration, emotion);
        if (pcm) {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext();
            audioSourceRef.current = await playAudio(pcm, audioContextRef.current, () => setActivePlayer(null), speed);
        }
    } catch (e) {
        setActivePlayer(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-cyan-500/30">
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <SawtliLogoIcon className="h-12 w-auto" />
        <div className="flex items-center gap-4">
            {isAuthLoading ? (
                <LoaderIcon className="w-6 h-6 animate-spin text-slate-500" />
            ) : user ? (
                <button onClick={() => setIsAccountOpen(true)} className="flex items-center gap-2 bg-slate-800 p-1.5 pr-4 rounded-full border border-slate-700 hover:border-cyan-500 transition-all">
                    <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-bold">{user.displayName}</span>
                </button>
            ) : (
                <button onClick={handleSignIn} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-900/20">
                    {uiLanguage === 'ar' ? 'دخول' : 'Sign In'}
                </button>
            )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Source Box */}
            <div className="bg-slate-800/50 border-2 border-slate-700 rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm font-bold outline-none">
                        {translationLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <button onClick={() => setSourceText('')} className="text-slate-500 hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>
                <textarea 
                    value={sourceText}
                    onChange={e => setSourceText(e.target.value)}
                    dir="auto"
                    className="w-full h-64 bg-transparent resize-none text-xl outline-none placeholder:text-slate-600"
                    placeholder={t('placeholder', uiLanguage)}
                />
                <div className="flex justify-between items-center mt-4">
                    <button 
                        onClick={() => handleSpeak(sourceText, 'source')}
                        className={`p-4 rounded-2xl transition-all ${activePlayer === 'source' ? 'bg-red-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-cyan-400'}`}
                    >
                        {activePlayer === 'source' ? <StopIcon className="w-6 h-6"/> : <SpeakerIcon className="w-6 h-6"/>}
                    </button>
                    <span className="text-xs font-mono text-slate-500">{sourceText.length} chars</span>
                </div>
            </div>

            {/* Swap Button */}
            <button 
                onClick={() => {
                    const temp = sourceText; setSourceText(translatedText); setTranslatedText(temp);
                    const tempL = sourceLang; setSourceLang(targetLang); setTargetLang(tempL);
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-slate-900 border-2 border-slate-700 p-3 rounded-full hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-2xl md:block hidden"
            >
                <SwapIcon className="w-6 h-6" />
            </button>

            {/* Target Box */}
            <div className="bg-slate-800/80 border-2 border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-900/10">
                <div className="flex justify-between items-center mb-4">
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm font-bold outline-none text-cyan-400">
                        {translationLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <button onClick={() => navigator.clipboard.writeText(translatedText)} className="text-slate-500 hover:text-white"><CopyIcon className="w-5 h-5"/></button>
                </div>
                <div dir="auto" className="w-full h-64 overflow-y-auto text-xl text-cyan-50 font-medium whitespace-pre-wrap">
                    {translatedText || <span className="text-slate-600 italic">{t('translationPlaceholder', uiLanguage)}</span>}
                </div>
                <div className="flex justify-between items-center mt-4">
                    <button 
                        onClick={() => handleSpeak(translatedText, 'target')}
                        disabled={!translatedText}
                        className={`p-4 rounded-2xl transition-all ${activePlayer === 'target' ? 'bg-red-500 text-white' : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400'}`}
                    >
                        {activePlayer === 'target' ? <StopIcon className="w-6 h-6"/> : <SpeakerIcon className="w-6 h-6"/>}
                    </button>
                    <span className="text-xs font-mono text-slate-500">{translatedText.length} chars</span>
                </div>
            </div>
        </div>

        {/* Action Center */}
        <div className="flex justify-center">
            <button 
                onClick={handleTranslate}
                disabled={isLoading || !sourceText}
                className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-12 py-4 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-cyan-900/40 transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
            >
                <div className="flex items-center gap-3">
                    {isLoading ? <LoaderIcon className="w-6 h-6 animate-spin" /> : <TranslateIcon className="w-6 h-6" />}
                    <span>{isLoading ? t('translatingButton', uiLanguage) : t('translateButton', uiLanguage)}</span>
                </div>
            </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <FeatureCard icon={<GearIcon />} label={t('speechSettings', uiLanguage)} onClick={() => setIsSettingsOpen(true)} />
            <FeatureCard icon={<HistoryIcon />} label={t('historyButton', uiLanguage)} onClick={() => setIsHistoryOpen(true)} />
            <FeatureCard icon={<SoundEnhanceIcon className="text-cyan-400"/>} label={t('audioStudio', uiLanguage)} onClick={() => setIsAudioStudioOpen(true)} />
            <FeatureCard icon={<DownloadIcon />} label={t('downloadButton', uiLanguage)} onClick={() => {}} />
            <FeatureCard icon={<VideoCameraIcon />} label={t('tutorialButton', uiLanguage)} onClick={() => setIsTutorialOpen(true)} />
            <FeatureCard icon={<InfoIcon />} label={uiLanguage === 'ar' ? 'الخصوصية' : 'Privacy'} onClick={() => {}} />
        </div>

        <Suspense fallback={null}>
            <Feedback language={uiLanguage} onOpenReport={() => {}} />
        </Suspense>
      </main>

      {/* Modals - Lazy Loaded */}
      <Suspense fallback={null}>
          {isSettingsOpen && <SettingsModal 
            onClose={() => setIsSettingsOpen(false)} 
            uiLanguage={uiLanguage}
            voice={voice} setVoice={setVoice}
            emotion={emotion} setEmotion={setEmotion}
            speed={speed} setSpeed={setSpeed}
            seed={seed} setSeed={setSeed}
            pauseDuration={pauseDuration} setPauseDuration={setPauseDuration}
            multiSpeaker={multiSpeaker} setMultiSpeaker={setMultiSpeaker}
            speakerA={speakerA} setSpeakerA={setSpeakerA}
            speakerB={speakerB} setSpeakerB={setSpeakerB}
            speakerC={speakerC} setSpeakerC={setSpeakerC}
            speakerD={speakerD} setSpeakerD={setSpeakerD}
            sourceLang={sourceLang} targetLang={targetLang}
            currentLimits={PLAN_LIMITS[userTier]}
            onUpgrade={() => setIsUpgradeOpen(true)}
          />}
          {isHistoryOpen && <History items={history} language={uiLanguage} onClose={() => setIsHistoryOpen(false)} onClear={() => {}} onLoad={(item) => { setSourceText(item.sourceText); setTranslatedText(item.translatedText); setIsHistoryOpen(false); }} />}
          {isAudioStudioOpen && <AudioStudioModal isOpen onClose={() => setIsAudioStudioOpen(false)} uiLanguage={uiLanguage} voice={voice} userTier={userTier} />}
          {isTutorialOpen && <TutorialModal onClose={() => setIsTutorialOpen(false)} uiLanguage={uiLanguage} />}
          {isAccountOpen && <AccountModal onClose={() => setIsAccountOpen(false)} uiLanguage={uiLanguage} user={user} onSignOut={() => firebase.auth().signOut()} currentTier={userTier} userStats={{} as any} limits={PLAN_LIMITS[userTier]} onUpgrade={() => setIsUpgradeOpen(true)} onSetDevMode={() => {}} onOpenOwnerGuide={() => {}} onClearHistory={() => {}} onDeleteAccount={() => {}} />}
          {isUpgradeOpen && <UpgradeModal onClose={() => setIsUpgradeOpen(false)} uiLanguage={uiLanguage} currentTier={userTier} onUpgrade={async () => true} onSignIn={handleSignIn} />}
      </Suspense>
    </div>
  );
};

const FeatureCard = ({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="bg-slate-800/40 border border-slate-700 hover:border-cyan-500/50 p-6 rounded-3xl flex flex-col items-center gap-3 transition-all hover:-translate-y-1 group">
        <div className="text-slate-400 group-hover:text-cyan-400 transition-colors">
            {React.cloneElement(icon, { className: "w-8 h-8" })}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-200">{label}</span>
    </button>
);

export default App;
