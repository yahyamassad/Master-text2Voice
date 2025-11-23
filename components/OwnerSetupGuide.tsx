
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

// --- Helper Components ---

function StatusRow({ label, value }: { label: string, value?: string }) {
    const val = value || '';
    
    // Determine status. We treat "Auto-Fixed" and "Auto-fixing" as completely valid (Green).
    const isOk = val.includes('Present') || val.includes('Valid') || val.includes('Auto-Fixed') || val.includes('Auto-fixing') || val.includes('Auto-corrected');
    // Only warn if explicit invalid or missing
    const isError = val.includes('Missing') || val.includes('Invalid');
    
    let statusColor = 'text-amber-400'; // Default to warning color for unknown states
    if (isOk) statusColor = 'text-green-400';
    else if (isError) statusColor = 'text-red-500';

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
        <div className="space-y-4 mt-4 border-t border-slate-700 pt-4 animate-fade-in-down">
            <div className="flex items-center gap-2 text-cyan-400">
                <div className="bg-cyan-900/30 p-1.5 rounded-full animate-pulse">
                    <InfoIcon className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-lg">Action Required: Configure Frontend</h5>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed">
                {uiLanguage === 'ar' 
                    ? 'ممتاز! الخادم يعمل. الآن انسخ إعدادات Firebase الخاصة بتطبيق الويب وأضفها كمتغيرات بيئة في Vercel.'
                    : 'Great! Server is ready. Now copy your Firebase Web App config and add them as Environment Variables in Vercel.'}
            </p>

            <div dir="ltr" className="relative p-4 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 text-left border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <pre className="whitespace-pre-wrap opacity-80"><code>{firebaseClientEnvVars}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-3 right-3 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-cyan-600 flex items-center gap-2 transition-all border border-slate-600 hover:border-cyan-400 shadow-lg"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-white" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? (uiLanguage === 'ar' ? 'تم النسخ' : 'Copied') : (uiLanguage === 'ar' ? 'نسخ الكل' : 'Copy All')}
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

    const keyStatus = serverStatus?.details?.firebaseKey || '';
    // Robust check for any form of auto-fixing string to ensure the message appears
    const isAutoFixed = keyStatus.includes('Auto-Fixed') || keyStatus.includes('Auto-fixing') || keyStatus.includes('Auto-corrected');

    // Logic to determine if Server is fully ready
    const isServerReady = 
        serverStatus?.details?.gemini?.includes('Present') &&
        serverStatus?.details?.firebaseProject?.includes('Present') &&
        serverStatus?.details?.firebaseEmail?.includes('Present') &&
        (serverStatus?.details?.firebaseKey?.includes('Valid') || isAutoFixed);

    const isFullyConfigured = isServerReady && isFirebaseConfigured;

    // Dynamic Styling based on state
    const containerStyle = isServerReady 
        ? "bg-slate-800/95 border-blue-500/50 shadow-blue-900/20" 
        : "bg-slate-800/95 border-amber-500/50 shadow-amber-900/20";
    
    const headerIcon = isServerReady 
        ? <CheckIcon className="w-6 h-6 text-green-400" /> 
        : <WarningIcon className="w-6 h-6 text-amber-400" />;
        
    const headerBg = isServerReady ? "bg-green-900/30 border-green-500/30" : "bg-amber-900/30 border-amber-500/30";
    const headerTitleColor = isServerReady ? "text-green-400" : "text-amber-400";

    // If fully configured, we might want to auto-hide or show a success banner
    if (isFullyConfigured) {
        return (
             <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-200 text-center mb-8 flex items-center justify-between">
                 <span className="flex items-center gap-2 font-bold">
                     <CheckIcon className="w-5 h-5" /> 
                     {uiLanguage === 'ar' ? 'تم الانتهاء من جميع الإعدادات بنجاح!' : 'All Systems Operational! Setup Complete.'}
                 </span>
                 <button onClick={handlePermanentDismiss} className="text-xs underline hover:text-white">{uiLanguage === 'ar' ? 'إخفاء' : 'Hide'}</button>
             </div>
        );
    }

    return (
        <div className={`p-5 border rounded-xl text-slate-300 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8 animate-fade-in-down ${containerStyle}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${headerBg}`}>
                        {headerIcon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${headerTitleColor}`}>
                            {isServerReady 
                                ? (uiLanguage === 'ar' ? 'اكتمل إعداد الخادم!' : 'Server Config Complete!')
                                : t('appOwnerNoticeTitle', uiLanguage)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                            {isServerReady 
                                ? (uiLanguage === 'ar' ? 'الخادم جاهز. الخطوة التالية: إعداد الواجهة الأمامية (Frontend).' : 'Server-side is ready. Next step: Configure Frontend variables.')
                                : (uiLanguage === 'ar' ? 'رسالة للمطور: الرجاء إصلاح أخطاء الخادم أدناه.' : 'Dev Message: Please fix the server configuration errors below.')}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handlePermanentDismiss}
                    className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg transition-colors border border-slate-600 flex items-center gap-1"
                    title="Don't show again"
                >
                    <TrashIcon className="w-3 h-3" />
                    {uiLanguage === 'ar' ? 'إخفاء' : 'Dismiss'}
                </button>
            </div>
            
            <div className="mt-4 border-t border-slate-700 pt-4 space-y-6 text-sm">
                
                {/* Diagnostics Panel */}
                <div className={`rounded-lg relative overflow-hidden transition-all ${isServerReady ? 'bg-green-900/10 border border-green-500/20 opacity-80 hover:opacity-100' : 'bg-blue-900/10 border border-blue-500/30'}`}>
                    <div className="p-3 flex justify-between items-center bg-black/20 border-b border-white/5">
                        <h4 className={`font-bold flex items-center gap-2 text-base ${isServerReady ? 'text-green-400' : 'text-blue-400'}`}>
                            <InfoIcon className="w-5 h-5" />
                            {uiLanguage === 'ar' ? 'حالة الخادم (Server Config)' : 'Server Status'}
                        </h4>
                        <button 
                            onClick={checkServerConfig} 
                            disabled={checking}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-md font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {checking ? <span className="animate-pulse">...</span> : <span>{uiLanguage === 'ar' ? 'تحديث' : 'Check'}</span>}
                        </button>
                    </div>

                    {serverStatus && !serverStatus.error && serverStatus.details ? (
                        <div className="p-4 space-y-2">
                            <StatusRow label="Gemini API Key" value={serverStatus.details.gemini} />
                            <StatusRow label="Firebase Project" value={serverStatus.details.firebaseProject} />
                            <StatusRow label="Firebase Email" value={serverStatus.details.firebaseEmail} />
                            <StatusRow label="Private Key" value={serverStatus.details.firebaseKey} />
                            
                            {/* Specific Success Message for Auto-Fixed keys */}
                            {isAutoFixed && (
                                <div className="mt-3 p-2 bg-green-900/30 border border-green-500/50 text-green-200 rounded text-xs leading-relaxed flex gap-2 items-start animate-fade-in">
                                    <CheckIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                                    <div>
                                        <strong>Good news:</strong> Your Private Key format was corrected automatically. 
                                        <br/>
                                        {uiLanguage === 'ar' ? 'تم إصلاح تنسيق المفتاح تلقائياً. يمكنك المتابعة.' : 'The key format was fixed automatically. You are good to go.'}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-slate-500 italic">
                            {checking ? 'Checking connection...' : (serverStatus?.error || 'Click Check to verify server')}
                        </div>
                    )}
                </div>

                {/* Frontend Config Missing Warning - Shows ONLY if not configured */}
                {!isFirebaseConfigured && <FirebaseSetup uiLanguage={uiLanguage} />}
            </div>
        </div>
    );
}
