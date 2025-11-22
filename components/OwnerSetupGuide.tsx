
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
    const [serverStatus, setServerStatus] = useState<any>(null);
    const [checking, setChecking] = useState(false);
    
    const handlePermanentDismiss = () => {
        if (window.confirm(uiLanguage === 'ar' ? 'هل أنت متأكد؟ سيتم إخفاء هذا الدليل نهائياً.' : 'Are you sure? This will hide the guide permanently.')) {
            localStorage.setItem('sawtli_hide_setup_guide', 'true');
            setIsGuideOpen(false);
        }
    };
    
    const checkServerConfig = async () => {
        setChecking(true);
        try {
            const res = await fetch('/api/check-config');
            const data = await res.json();
            setServerStatus(data);
        } catch (e) {
            setServerStatus({ error: 'Failed to connect' });
        } finally {
            setChecking(false);
        }
    };

    // Access env safely for debug display (Client Side)
    const env = (import.meta as any)?.env || {};
    const mask = (val?: string) => val ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : 'MISSING';

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
                                ? 'رسالة للمطور: التطبيق يحتاج للتأكد من مفاتيح API.'
                                : 'Dev Message: App needs to verify API keys.'}
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
                    <h4 className="font-bold text-blue-400 flex items-center gap-2 text-lg">
                        <InfoIcon className="w-5 h-5" />
                        {uiLanguage === 'ar' ? 'الخطوة الأولى: تحقق من السيرفر' : 'Step 1: Verify Server'}
                    </h4>
                    <p className="mt-2 text-slate-300 text-sm mb-3">
                        {uiLanguage === 'ar' 
                            ? 'اضغط الزر أدناه لنسأل السيرفر: "ماذا ترى؟" سيظهر لك أجزاء من المفاتيح للتأكد.' 
                            : 'Click below to ask the server "What do you see?".'}
                    </p>
                    
                    <button 
                        onClick={checkServerConfig} 
                        disabled={checking}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold text-xs transition-colors"
                    >
                        {checking ? 'Checking...' : (uiLanguage === 'ar' ? 'تحقق الآن' : 'Check Live Config')}
                    </button>

                    {serverStatus && (
                        <div className="mt-3 p-3 bg-black/50 rounded border border-slate-600 font-mono text-xs">
                            <div className="flex justify-between border-b border-slate-700 pb-1 mb-1">
                                <span>Gemini API Key:</span>
                                <span className={serverStatus.details?.gemini?.includes('Present') ? 'text-green-400' : 'text-red-500'}>
                                    {serverStatus.details?.gemini || 'Unknown'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Firebase Project:</span>
                                <span className={serverStatus.details?.firebase?.includes('Present') ? 'text-green-400' : 'text-red-500'}>
                                    {serverStatus.details?.firebase || 'Unknown'}
                                </span>
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
            <h5 className="font-bold text-slate-200">Missing Firebase Client Config</h5>
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
