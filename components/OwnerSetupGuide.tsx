
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, CopyIcon, TrashIcon, InfoIcon, CheckIcon, ChevronDownIcon } from './icons';

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
    let icon = <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />;
    
    if (isOk) {
        statusColor = 'text-green-400';
        icon = <CheckIcon className="w-4 h-4 text-green-500" />;
    }
    else if (isError) {
        statusColor = 'text-red-500';
        icon = <WarningIcon className="w-4 h-4 text-red-500" />;
    }

    return (
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 last:border-0">
            <span className="text-slate-400 text-xs font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`font-mono text-[10px] sm:text-xs ${statusColor}`}>
                    {value || 'Unknown'}
                </span>
                {icon}
            </div>
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
        <div className="space-y-4 mt-2 animate-fade-in-down">
            <div dir="ltr" className="relative p-4 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 text-left border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)] group hover:border-cyan-500/50 transition-all">
                <pre className="whitespace-pre-wrap opacity-80 overflow-x-auto"><code>{firebaseClientEnvVars}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-cyan-600 flex items-center gap-2 transition-all border border-slate-600 hover:border-cyan-400 shadow-lg group-hover:opacity-100"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-white" /> : <CopyIcon className="w-3 h-3" />}
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
    const [expandServerDetails, setExpandServerDetails] = useState(false);
    
    // Auto-check on mount
    useEffect(() => {
        checkServerConfig();
    }, []);

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

    // Loading State to prevent flash of "Error"
    if (checking && !serverStatus) {
        return (
             <div className="p-6 border border-slate-700 rounded-xl bg-slate-800/80 animate-pulse mb-8 shadow-xl">
                 <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                 </div>
                 <div className="space-y-3">
                     <div className="h-4 bg-slate-700 rounded w-full"></div>
                     <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                 </div>
             </div>
        );
    }

    const keyStatus = serverStatus?.details?.firebaseKey || '';
    const isAutoFixed = keyStatus.includes('Auto-Fixed') || keyStatus.includes('Auto-fixing') || keyStatus.includes('Auto-corrected');

    // Logic to determine if Server is fully ready
    const isServerReady = 
        serverStatus?.details?.gemini?.includes('Present') &&
        serverStatus?.details?.firebaseProject?.includes('Present') &&
        serverStatus?.details?.firebaseEmail?.includes('Present') &&
        (serverStatus?.details?.firebaseKey?.includes('Valid') || isAutoFixed);

    const isFullyConfigured = isServerReady && isFirebaseConfigured;

    // Dynamic Styling based on state
    let containerStyle = "bg-slate-800/95 border-amber-500/50 shadow-amber-900/20";
    let headerIcon = <WarningIcon className="w-6 h-6 text-amber-400" />;
    let headerTitleColor = "text-amber-400";
    let headerBg = "bg-amber-900/30 border-amber-500/30";
    let titleText = uiLanguage === 'ar' ? 'إجراء مطلوب: إعدادات الخادم' : 'Action Required: Server Setup';
    let descriptionText = uiLanguage === 'ar' ? 'رسالة للمطور: يرجى إصلاح أخطاء الخادم أدناه.' : 'Dev Message: Please fix the server configuration errors below.';

    if (isFullyConfigured) {
        // SUCCESS STATE
        return (
             <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-200 text-center mb-8 flex items-center justify-between animate-fade-in-down">
                 <span className="flex items-center gap-2 font-bold text-sm">
                     <CheckIcon className="w-5 h-5 text-green-400" /> 
                     {uiLanguage === 'ar' ? 'اكتملت الإعدادات! الخادم والواجهة يعملان.' : 'Setup Complete! Server & Client are operational.'}
                 </span>
                 <button onClick={handlePermanentDismiss} className="text-xs bg-green-900/50 hover:bg-green-800 px-3 py-1 rounded border border-green-500/30 transition-colors">{uiLanguage === 'ar' ? 'إخفاء' : 'Dismiss'}</button>
             </div>
        );
    } else if (isServerReady && !isFirebaseConfigured) {
        // INTERMEDIATE STATE: SERVER READY, FRONTEND MISSING
        // We use a Teal/Blue theme here to indicate "Good progress, but one more step"
        containerStyle = "bg-slate-800/95 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.15)]";
        headerIcon = <CheckIcon className="w-6 h-6 text-teal-400" />;
        headerTitleColor = "text-teal-400";
        headerBg = "bg-teal-900/30 border-teal-500/30";
        titleText = uiLanguage === 'ar' ? 'اكتمل إعداد الخادم!' : 'Almost Done! Server Ready';
        descriptionText = uiLanguage === 'ar' 
            ? 'الخادم جاهز. الخطوة التالية: إعداد الواجهة الأمامية (Frontend).' 
            : 'Server-side is ready. Next step: Configure Frontend variables.';
    }

    return (
        <div className={`p-5 border rounded-xl text-slate-300 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8 animate-fade-in-down transition-all duration-500 ${containerStyle}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${headerBg} transition-colors duration-500`}>
                        {headerIcon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${headerTitleColor} transition-colors duration-500`}>
                            {titleText}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                            {descriptionText}
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
            
            <div className="mt-4 border-t border-slate-700 pt-4 space-y-4 text-sm">
                
                {/* Diagnostics Panel (Collapsible if valid) */}
                <div className={`rounded-lg border relative overflow-hidden transition-all duration-300 ${isServerReady ? 'bg-green-950/20 border-green-500/20' : 'bg-black/20 border-slate-700'}`}>
                    <div 
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setExpandServerDetails(!expandServerDetails)}
                    >
                        <h4 className={`font-bold flex items-center gap-2 text-sm ${isServerReady ? 'text-green-400' : 'text-slate-300'}`}>
                            {isServerReady ? <CheckIcon className="w-4 h-4" /> : <InfoIcon className="w-4 h-4" />}
                            {uiLanguage === 'ar' ? 'حالة الخادم (Server Config)' : 'Server Status'}
                        </h4>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); checkServerConfig(); }}
                                disabled={checking}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold transition-colors border border-slate-600"
                            >
                                {checking ? '...' : (uiLanguage === 'ar' ? 'تحديث' : 'Check')}
                            </button>
                            <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${expandServerDetails || !isServerReady ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {(expandServerDetails || !isServerReady) && (
                        <div className="p-4 border-t border-slate-700/50 bg-black/20 animate-fade-in">
                            {serverStatus && !serverStatus.error && serverStatus.details ? (
                                <div className="space-y-2">
                                    <StatusRow label="Gemini API Key" value={serverStatus.details.gemini} />
                                    <StatusRow label="Firebase Project" value={serverStatus.details.firebaseProject} />
                                    <StatusRow label="Firebase Email" value={serverStatus.details.firebaseEmail} />
                                    <StatusRow label="Private Key" value={serverStatus.details.firebaseKey} />
                                    
                                    {isAutoFixed && (
                                        <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 text-green-300 rounded text-[10px] leading-relaxed flex gap-2 items-start">
                                            <CheckIcon className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-400" />
                                            <div>
                                                <strong>Good news:</strong> Your Private Key format was corrected automatically.
                                                <div className="opacity-70 mt-0.5">{uiLanguage === 'ar' ? 'تم إصلاح تنسيق المفتاح تلقائياً. يمكنك المتابعة.' : 'System auto-fixed the key format. You are good to go.'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 italic text-xs py-2">
                                    {checking ? 'Checking connection...' : (serverStatus?.error || 'Click Check to verify server')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Frontend Config Missing Warning - Highlights when it's the next step */}
                {!isFirebaseConfigured && (
                    <div className={`space-y-3 pt-2 transition-all duration-500 ${isServerReady ? 'opacity-100 scale-100' : 'opacity-70 blur-[1px]'}`}>
                        <div className="flex items-center gap-2 text-cyan-400">
                            <div className="bg-cyan-900/30 p-1.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                                <InfoIcon className="w-4 h-4" />
                            </div>
                            <h5 className="font-bold text-sm uppercase tracking-wide">ACTION REQUIRED: CONFIGURE FRONTEND</h5>
                        </div>
                        
                        <p className="text-xs text-slate-400 leading-relaxed ml-1">
                            {uiLanguage === 'ar' 
                                ? 'ممتاز! الخادم يعمل. الآن انسخ إعدادات Firebase الخاصة بتطبيق الويب وأضفها كمتغيرات بيئة في Vercel.'
                                : 'Great! Server is ready. Now copy your Firebase Web App config and add them as Environment Variables in Vercel.'}
                        </p>

                        <FirebaseSetup uiLanguage={uiLanguage} />
                    </div>
                )}
            </div>
        </div>
    );
}
    
