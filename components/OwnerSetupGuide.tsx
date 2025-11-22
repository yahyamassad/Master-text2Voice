
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, CheckIcon, StopIcon } from './icons';

interface OwnerSetupGuideProps {
    uiLanguage: Language;
    isApiConfigured: boolean;
    isFirebaseConfigured: boolean;
}

const OwnerSetupGuide: React.FC<OwnerSetupGuideProps> = ({ uiLanguage, isApiConfigured, isFirebaseConfigured }) => {
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    const [showDebug, setShowDebug] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    // Check if manually dismissed previously
    useEffect(() => {
        if (sessionStorage.getItem('sawtli_setup_dismissed') === 'true') {
            setIsDismissed(true);
        }
    }, []);

    if (isDismissed) return null;

    const handleDismiss = () => {
        sessionStorage.setItem('sawtli_setup_dismissed', 'true');
        setIsDismissed(true);
    };
    
    // Masking helper for debug
    const mask = (val?: string) => val ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : 'MISSING / UNDEFINED';
    
    // Access env safely for debug display
    const env = (import.meta as any)?.env || {};

    return (
        <div className="p-4 bg-slate-800/90 border border-amber-500/50 rounded-xl text-slate-300 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className="bg-amber-900/30 p-2 rounded-lg border border-amber-500/30 animate-pulse">
                        <WarningIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-400 text-lg">{t('appOwnerNoticeTitle', uiLanguage)}</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl">
                            {uiLanguage === 'ar' 
                                ? 'يبدو أن التطبيق لا يرى المفاتيح بعد. إذا كنت قد أضفتها في Vercel، يرجى إعادة النشر (Redeploy).'
                                : 'The app cannot see the keys yet. If you added them in Vercel, you MUST Redeploy.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleDismiss}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-600"
                    >
                        {uiLanguage === 'ar' ? 'إخفاء الدليل (أعرف ماذا أفعل)' : 'Dismiss (I know what I\'m doing)'}
                    </button>
                    <button 
                        onClick={() => setIsGuideOpen(!isGuideOpen)} 
                        className="text-slate-400 hover:text-white p-1"
                    >
                        <ChevronDownIcon className={`transform transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            
            {isGuideOpen && (
                <div className="mt-4 border-t border-slate-700 pt-4 space-y-6 animate-fade-in-down text-sm">
                    
                    {/* CRITICAL NOTICE - REDEPLOY */}
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2">
                            <CheckIcon className="w-5 h-5" />
                            {uiLanguage === 'ar' ? 'هل المفاتيح موجودة في Vercel؟' : 'Are keys already in Vercel?'}
                        </h4>
                        <p className="mt-1 text-slate-300 leading-relaxed">
                            {uiLanguage === 'ar' 
                                ? 'متغيرات البيئة التي تبدأ بـ `VITE_` يتم دمجها أثناء البناء (Build Time). إذا أضفت المفاتيح للتو، **لن تعمل** حتى تقوم بعمل **Redeploy** في Vercel.'
                                : 'Environment variables starting with `VITE_` are baked in at build time. If you just added the keys, they **will not work** until you trigger a **Redeploy** in Vercel.'}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-blue-300 border border-blue-500/20">
                                Vercel Dashboard {'>'} Deployments {'>'} ... {'>'} Redeploy
                            </span>
                        </div>
                    </div>

                    {/* Debug Toggle */}
                    <div>
                        <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-slate-500 hover:text-slate-300 underline mb-2">
                            {showDebug ? 'Hide Debug Info' : 'Show Debug Info (What the app sees)'}
                        </button>
                        
                        {showDebug && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-lg font-mono text-xs border border-slate-700">
                                <div>
                                    <p className="text-slate-500 mb-1">Client Status (Vite):</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><span>API_KEY:</span> <span className={env.API_KEY ? 'text-green-400' : 'text-red-500'}>{mask(env.API_KEY)}</span></div>
                                        <div className="flex justify-between"><span>VITE_FIREBASE_PROJECT_ID:</span> <span className={env.VITE_FIREBASE_PROJECT_ID ? 'text-green-400' : 'text-red-500'}>{mask(env.VITE_FIREBASE_PROJECT_ID)}</span></div>
                                        <div className="flex justify-between"><span>VITE_FIREBASE_API_KEY:</span> <span className={env.VITE_FIREBASE_API_KEY ? 'text-green-400' : 'text-red-500'}>{mask(env.VITE_FIREBASE_API_KEY)}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-1">App Logic Status:</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><span>Gemini Configured:</span> <span className={isApiConfigured ? 'text-green-400' : 'text-red-500'}>{isApiConfigured ? 'YES' : 'NO'}</span></div>
                                        <div className="flex justify-between"><span>Firebase Configured:</span> <span className={isFirebaseConfigured ? 'text-green-400' : 'text-red-500'}>{isFirebaseConfigured ? 'YES' : 'NO'}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const FirebaseSetup: React.FC<{ uiLanguage: Language }> = ({ uiLanguage }) => {
    const [varsCopyButtonText, setVarsCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));

     const firebaseClientEnvVars = [
      'VITE_FIREBASE_API_KEY="your-api-key"',
      'VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"',
      'VITE_FIREBASE_PROJECT_ID="your-project-id"',
      'VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"',
      'VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"',
      'VITE_FIREBASE_APP_ID="your-app-id"',
    ].join('\n');

    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        setVarsCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
        setTimeout(() => setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
    };

    return (
        <div className="space-y-2">
            <h5 className="font-bold text-slate-200">Configuration Values (Reference)</h5>
            <div dir="ltr" className="relative p-3 bg-slate-900 rounded-md font-mono text-xs text-cyan-300 text-left border border-slate-700">
                <pre className="whitespace-pre-wrap opacity-50"><code>{firebaseClientEnvVars}</code></pre>
                <button onClick={() => handleCopy(firebaseClientEnvVars)} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                    <CopyIcon /> {varsCopyButtonText}
                </button>
            </div>
        </div>
    );
};

export default OwnerSetupGuide;
