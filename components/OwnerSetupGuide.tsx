
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, CopyIcon, TrashIcon, InfoIcon, CheckIcon } from './icons';

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

// --- Helper Components (Defined OUTSIDE the main component to prevent re-render/scope issues) ---

function StatusRow({ label, value }: { label: string, value?: string }) {
    // Determine status based on the returned string
    const isOk = value && (value.includes('Present') || value.includes('Valid'));
    const isWarning = value && value.includes('Single Line');
    
    let statusColor = 'text-red-500';
    if (isOk) statusColor = 'text-green-400';
    if (isWarning) statusColor = 'text-amber-400';

    return (
        <div className="grid grid-cols-[1fr_2fr] gap-2 items-center border-b border-slate-700 pb-2 last:border-0">
            <span className="text-slate-400">{label}:</span>
            <span className={`font-bold font-mono text-xs ${statusColor}`}>
                {value || 'Unknown'}
            </span>
        </div>
    );
}

function FirebaseSetup({ uiLanguage }: { uiLanguage: Language }) {
    const [copied, setCopied] = useState(false);

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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-2 mt-4 border-t border-slate-700 pt-4">
            <h5 className="font-bold text-slate-200">Missing Firebase Client Config (Frontend)</h5>
            <div dir="ltr" className="relative p-3 bg-slate-900 rounded-md font-mono text-xs text-cyan-300 text-left border border-slate-700">
                <pre className="whitespace-pre-wrap opacity-50"><code>{firebaseClientEnvVars}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-2 right-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-2 transition-all border border-slate-600"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
                    {copied ? (uiLanguage === 'ar' ? 'تم النسخ' : 'Copied') : (uiLanguage === 'ar' ? 'نسخ' : 'Copy')}
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
    
    // Auto-check on mount if config seems missing
    useEffect(() => {
        if (!isApiConfigured || !isFirebaseConfigured) {
            checkServerConfig();
        }
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
        <div className="p-5 bg-slate-800/95 border border-amber-500/50 rounded-xl text-slate-300 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8 animate-fade-in-down">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className="bg-amber-900/30 p-2 rounded-lg border border-amber-500/30">
                        <WarningIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-400 text-lg">{t('appOwnerNoticeTitle', uiLanguage)}</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                            {uiLanguage === 'ar' 
                                ? 'رسالة للمطور: هذا القسم يظهر لك فقط لمساعدتك في حل مشاكل الإعداد.'
                                : 'Dev Message: This section is visible only to you to help debug setup issues.'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handlePermanentDismiss}
                    className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 px-3 py-1.5 rounded-lg transition-colors border border-red-500/30 flex items-center gap-1"
                    title="Don't show again"
                >
                    <TrashIcon className="w-3 h-3" />
                    {uiLanguage === 'ar' ? 'إخفاء نهائي' : 'Dismiss'}
                </button>
            </div>
            
            <div className="mt-4 border-t border-slate-700 pt-4 space-y-6 text-sm">
                
                {/* Diagnostics Panel */}
                <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2 text-base">
                            <InfoIcon className="w-5 h-5" />
                            {uiLanguage === 'ar' ? 'حالة الخادم (Server Config)' : 'Server Configuration Status'}
                        </h4>
                        <button 
                            onClick={checkServerConfig} 
                            disabled={checking}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {checking ? <span className="animate-pulse">...</span> : <span>{uiLanguage === 'ar' ? 'تحديث الحالة' : 'Refresh'}</span>}
                        </button>
                    </div>

                    {serverStatus && !serverStatus.error && serverStatus.details ? (
                        <div className="p-4 bg-black/40 rounded-lg border border-slate-600/50 space-y-2">
                            <StatusRow label="Gemini API Key" value={serverStatus.details.gemini} />
                            <StatusRow label="Firebase Project" value={serverStatus.details.firebaseProject} />
                            <StatusRow label="Firebase Email" value={serverStatus.details.firebaseEmail} />
                            <StatusRow label="Private Key" value={serverStatus.details.firebaseKey} />
                            
                            {/* Specific Help Message for Newline Issues */}
                            {serverStatus.details.firebaseKey?.includes('Single Line') && (
                                <div className="mt-3 p-2 bg-amber-900/30 border border-amber-500/50 text-amber-200 rounded text-xs leading-relaxed">
                                    <strong>Note:</strong> Your Private Key is detected as a "Single Line". This is common with Vercel.
                                    Our backend code automatically fixes this by replacing <code>\n</code> with real newlines, so it <em>should</em> work. 
                                    If you still get authentication errors, try pasting the key in Vercel wrapped in double quotes <code>"..."</code>.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-black/20 rounded-lg border border-slate-700 text-center text-slate-500 italic">
                            {checking ? 'Checking connection...' : (serverStatus?.error || 'Click Refresh to check status')}
                        </div>
                    )}
                </div>

                {/* Frontend Config Missing Warning */}
                {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
            </div>
        </div>
    );
}
