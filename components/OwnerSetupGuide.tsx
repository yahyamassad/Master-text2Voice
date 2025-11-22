
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, ChevronDownIcon, CopyIcon, CheckIcon, TrashIcon, InfoIcon } from './icons';

interface OwnerSetupGuideProps {
    uiLanguage: Language;
    isApiConfigured: boolean;
    isFirebaseConfigured: boolean;
}

const OwnerSetupGuide: React.FC<OwnerSetupGuideProps> = ({ uiLanguage, isApiConfigured, isFirebaseConfigured }) => {
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    const [showDebug, setShowDebug] = useState(false);
    
    const handlePermanentDismiss = () => {
        if (window.confirm(uiLanguage === 'ar' ? 'هل أنت متأكد؟ سيتم إخفاء هذا الدليل نهائياً.' : 'Are you sure? This will hide the guide permanently.')) {
            localStorage.setItem('sawtli_hide_setup_guide', 'true');
            setIsGuideOpen(false);
        }
    };
    
    // Masking helper for debug
    const mask = (val?: string) => val ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : 'MISSING';
    
    // Access env safely for debug display
    const env = (import.meta as any)?.env || {};

    if (!isGuideOpen) return null;

    return (
        <div className="p-4 bg-slate-800/95 border border-amber-500/50 rounded-xl text-slate-300 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8">
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
                                ? 'رسالة للمطور: التطبيق لا يرى مفاتيح API بعد.'
                                : 'Dev Message: App cannot see API keys yet.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePermanentDismiss}
                        className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 px-3 py-1.5 rounded-lg transition-colors border border-red-500/30 flex items-center gap-1"
                        title="Don't show again"
                    >
                        <TrashIcon className="w-3 h-3" />
                        {uiLanguage === 'ar' ? 'إخفاء نهائي' : 'Dismiss Forever'}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 border-t border-slate-700 pt-4 space-y-6 text-sm">
                
                {/* CRITICAL NOTICE - REDEPLOY */}
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <CheckIcon className="w-32 h-32 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-blue-400 flex items-center gap-2 text-lg">
                        <InfoIcon className="w-5 h-5" />
                        {uiLanguage === 'ar' ? 'هل أضفت المفاتيح في Vercel؟' : 'Did you add keys in Vercel?'}
                    </h4>
                    <p className="mt-2 text-slate-200 leading-relaxed text-sm">
                        {uiLanguage === 'ar' 
                            ? 'إذا كانت الإجابة نعم، فلا تقلق. Vercel لا يحدث الكود تلقائياً. يجب عليك عمل **Redeploy** يدوياً ليقوم النظام "بحرق" المفاتيح داخل التطبيق.'
                            : 'If yes, Vercel needs a **Redeploy** to bake these variables into the app. The current running code is old.'}
                    </p>
                    <div className="mt-3 inline-block text-xs font-mono bg-black/50 px-3 py-2 rounded text-blue-300 border border-blue-500/30">
                        Vercel Dashboard &gt; Deployments &gt; (3 dots) &gt; Redeploy
                    </div>
                </div>

                {/* Debug Toggle */}
                <div>
                    <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-slate-500 hover:text-slate-300 underline mb-2 flex items-center gap-2">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
                        {showDebug ? 'Hide Debug Info' : 'Show Debug Info (Verify what the app sees)'}
                    </button>
                    
                    {showDebug && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-lg font-mono text-xs border border-slate-700 animate-fade-in-down">
                            <div>
                                <p className="text-slate-500 mb-1 font-bold uppercase">Current Environment Variables:</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between border-b border-slate-800 pb-1"><span>API_KEY (Gemini):</span> <span className={env.API_KEY ? 'text-green-400' : 'text-red-500'}>{mask(env.API_KEY)}</span></div>
                                    <div className="flex justify-between border-b border-slate-800 pb-1"><span>FIREBASE_PROJECT_ID:</span> <span className={env.VITE_FIREBASE_PROJECT_ID ? 'text-green-400' : 'text-red-500'}>{mask(env.VITE_FIREBASE_PROJECT_ID)}</span></div>
                                    <div className="flex justify-between"><span>FIREBASE_API_KEY:</span> <span className={env.VITE_FIREBASE_API_KEY ? 'text-green-400' : 'text-red-500'}>{mask(env.VITE_FIREBASE_API_KEY)}</span></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1 font-bold uppercase">Logic Checks:</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between border-b border-slate-800 pb-1"><span>Gemini Ready:</span> <span className={isApiConfigured ? 'text-green-400' : 'text-red-500'}>{isApiConfigured ? 'TRUE' : 'FALSE'}</span></div>
                                    <div className="flex justify-between"><span>Firebase Ready:</span> <span className={isFirebaseConfigured ? 'text-green-400' : 'text-red-500'}>{isFirebaseConfigured ? 'TRUE' : 'FALSE'}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
            </div>
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
            <h5 className="font-bold text-slate-200">Missing Firebase Config</h5>
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
