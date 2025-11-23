
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, CopyIcon, TrashIcon, InfoIcon } from './icons';

// --- Interfaces ---
interface ServerStatus {
    configured: boolean;
    error?: string;
    details?: {
        gemini?: string;
        firebaseProject?: string;
        firebaseEmail?: string;
        firebaseKey?: string;
    };
}

interface OwnerSetupGuideProps {
    uiLanguage: Language;
    isApiConfigured: boolean;
    isFirebaseConfigured: boolean;
}

// --- Helper Components ---

function StatusRow({ label, value }: { label: string, value?: string }) {
    const isOk = value?.includes('Present') || value?.includes('Valid');
    return (
        <div className="grid grid-cols-[1fr_2fr] gap-2 items-center border-b border-slate-700 pb-2 last:border-0">
            <span className="text-slate-400">{label}:</span>
            <span className={isOk ? 'text-green-400 font-bold' : 'text-red-500 font-bold'}>
                {value || 'Unknown'}
            </span>
        </div>
    );
}

function FirebaseSetup({ uiLanguage }: { uiLanguage: Language }) {
    const [varsCopyButtonText, setVarsCopyButtonText] = useState(t('firebaseSetupCopyButton', uiLanguage));

    const firebaseClientEnvVars = [
      'VITE_FIREBASE_API_KEY="your-api-key"',
      'VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"',
      'VITE_FIREBASE_PROJECT_ID="your-project-id"',
      'VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"',
      'VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"',
      'VITE_FIREBASE_APP_ID="your-app-id"',
    ].join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(firebaseClientEnvVars);
        setVarsCopyButtonText(t('firebaseSetupCopiedButton', uiLanguage));
        setTimeout(() => setVarsCopyButtonText(t('firebaseSetupCopyButton', uiLanguage)), 2000);
    };

    return (
        <div className="space-y-2 mt-4 border-t border-slate-700 pt-4">
            <h5 className="font-bold text-slate-200">Missing Firebase Client Config (Frontend)</h5>
            <div dir="ltr" className="relative p-3 bg-slate-900 rounded-md font-mono text-xs text-cyan-300 text-left border border-slate-700">
                <pre className="whitespace-pre-wrap opacity-50"><code>{firebaseClientEnvVars}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1"
                >
                    <CopyIcon className="w-3 h-3" /> {varsCopyButtonText}
                </button>
            </div>
        </div>
    );
}

// --- Main Component ---

export default function OwnerSetupGuide({ uiLanguage, isApiConfigured, isFirebaseConfigured }: OwnerSetupGuideProps) {
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [checking, setChecking] = useState(false);
    
    useEffect(() => {
        // Auto-check logic could go here
    }, [isApiConfigured, isFirebaseConfigured]);

    const handlePermanentDismiss = () => {
        const confirmMsg = uiLanguage === 'ar' ? 'هل أنت متأكد؟ سيتم إخفاء هذا الدليل نهائياً.' : 'Are you sure? This will hide the guide permanently.';
        if (window.confirm(confirmMsg)) {
            localStorage.setItem('sawtli_hide_setup_guide', 'true');
            setIsGuideOpen(false);
        }
    };
    
    const checkServerConfig = async () => {
        setChecking(true);
        try {
            const res = await fetch('/api/check-config');
            if (!res.ok) throw new Error('Status ' + res.status);
            const data = await res.json();
            setServerStatus(data);
        } catch (e) {
            console.error(e);
            setServerStatus({ configured: false, error: 'Failed to connect to API. Check Vercel logs.' });
        } finally {
            setChecking(false);
        }
    };

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
                                ? 'رسالة للمطور: هذا القسم يظهر لك فقط لمساعدتك في حل مشاكل الإعداد.'
                                : 'Dev Message: This section is visible only to you to help debug setup issues.'}
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
                
                {/* Diagnostics Panel */}
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg relative overflow-hidden">
                    <h4 className="font-bold text-blue-400 flex items-center gap-2 text-lg">
                        <InfoIcon className="w-5 h-5" />
                        {uiLanguage === 'ar' ? 'فحص حالة السيرفر المباشرة' : 'Live Server Configuration Check'}
                    </h4>
                    <p className="mt-2 text-slate-300 text-sm mb-3">
                        {uiLanguage === 'ar' 
                            ? 'اضغط الزر أدناه لنسأل السيرفر عما يراه من متغيرات البيئة.' 
                            : 'Click below to ask the server what Environment Variables it actually sees.'}
                    </p>
                    
                    <button 
                        onClick={checkServerConfig} 
                        disabled={checking}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold text-xs transition-colors flex items-center gap-2"
                    >
                        {checking ? <span>Checking...</span> : <span>{uiLanguage === 'ar' ? 'تحقق الآن' : 'Run Diagnostic'}</span>}
                    </button>

                    {serverStatus && !serverStatus.error && serverStatus.details && (
                        <div className="mt-4 p-4 bg-black/50 rounded-lg border border-slate-600 font-mono text-xs space-y-3 select-text">
                            <StatusRow label="Gemini API Key" value={serverStatus.details.gemini} />
                            <StatusRow label="Firebase Project" value={serverStatus.details.firebaseProject} />
                            <StatusRow label="Firebase Email" value={serverStatus.details.firebaseEmail} />
                            <StatusRow label="Private Key" value={serverStatus.details.firebaseKey} />
                            
                            {serverStatus.details.firebaseKey?.includes('single long line') && (
                                <div className="mt-2 p-2 bg-red-900/20 border border-red-500/50 text-red-200 rounded">
                                    <strong>Fix Required:</strong> The Private Key in Vercel is missing newlines. 
                                    Open Vercel Settings, delete the key, and paste it again. Ensure it looks like multiple lines, or replace spaces with real newlines.
                                </div>
                            )}
                        </div>
                    )}
                    
                    {serverStatus && serverStatus.error && (
                        <div className="mt-3 p-2 bg-red-900/50 text-red-200 rounded border border-red-500 text-xs">
                            {serverStatus.error}
                        </div>
                    )}
                </div>

                {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
            </div>
        </div>
    );
}
