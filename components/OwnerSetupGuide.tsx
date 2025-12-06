

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
        azureKey?: string;
        azureRegion?: string;
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
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0">
            <span className="text-slate-200 text-sm font-bold">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${statusColor}`}>
                    {value || 'Unknown'}
                </span>
                {icon}
            </div>
        </div>
    );
}

function EnvVarCheckRow({ name, value }: { name: string, value: string | undefined }) {
    let status = 'Missing';
    let color = 'text-red-500';
    let detail = '';

    // Check the passed value directly
    if (value && typeof value === 'string') {
        if (value.trim() === '') {
            status = 'Empty';
            color = 'text-amber-500';
        } else if (value.startsWith('"') || value.endsWith('"')) {
            status = 'Invalid Format (Quotes?)';
            color = 'text-red-400';
            detail = 'Remove quotes in Vercel';
        } else {
            status = 'Present';
            color = 'text-green-400';
            // Show first 4 chars for verification
            detail = value.length > 4 ? `${value.substring(0, 4)}...` : value;
        }
    }

    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0 bg-slate-900 px-2">
            <span className="text-xs font-mono text-slate-300 font-bold">{name}</span>
            <div className="text-right">
                <span className={`text-xs font-black uppercase tracking-wider ${color}`}>{status}</span>
                {detail && <div className="text-[10px] text-slate-500 font-mono">{detail}</div>}
            </div>
        </div>
    );
}

function FirebaseSetup({ uiLanguage, projectId }: { uiLanguage: Language, projectId?: string }) {
    const [copied, setCopied] = useState(false);

    const pId = projectId || 'your-project-id';

    const firebaseClientEnvVars = [
      'VITE_FIREBASE_API_KEY="your-api-key"',
      `VITE_FIREBASE_AUTH_DOMAIN="${pId}.firebaseapp.com"`,
      `VITE_FIREBASE_PROJECT_ID="${pId}"`,
      `VITE_FIREBASE_STORAGE_BUCKET="${pId}.appspot.com"`,
      'VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"',
      'VITE_FIREBASE_APP_ID="your-app-id"',
    ].join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(firebaseClientEnvVars);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4 mt-3">
            <div dir="ltr" className="relative p-5 bg-[#0b1120] rounded-xl font-mono text-sm text-cyan-300 text-left border border-slate-800 shadow-inner group">
                <pre className="whitespace-pre-wrap overflow-x-auto font-bold leading-relaxed"><code>{firebaseClientEnvVars}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-3 right-3 px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all border border-slate-600 hover:border-cyan-400 shadow-lg"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-white" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? (uiLanguage === 'ar' ? 'تم النسخ' : 'Copied') : (uiLanguage === 'ar' ? 'نسخ' : 'Copy')}
                </button>
            </div>
        </div>
    );
}

function FirestoreRulesSetup({ uiLanguage }: { uiLanguage: Language }) {
    const [copied, setCopied] = useState(false);

    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User Data & History
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /history/{historyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Waitlist (Authenticated users can add themselves)
    match /waitlist/{userId} {
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Feedback (Public read/write for now)
    match /feedback/{document=**} {
      allow read, write: if true;
    }
    
    // Reports (Public write)
    match /reports/{document=**} {
      allow create: if true;
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(rules);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-2 mt-4">
            <h4 className="text-sm font-bold text-slate-200">
                {uiLanguage === 'ar' ? 'قواعد الأمان (Firestore Rules)' : 'Required Firestore Rules'}
            </h4>
            <p className="text-xs text-slate-400 mb-2">
                {uiLanguage === 'ar' 
                    ? 'انسخ هذا الكود وضعه في تبويب "Rules" في قاعدة بيانات Firestore لتفعيل التسجيل والقوائم.' 
                    : 'Copy this code into the "Rules" tab of your Firestore Database to enable waitlist and feedback.'}
            </p>
            <div dir="ltr" className="relative p-4 bg-[#0b1120] rounded-xl font-mono text-xs text-green-300 text-left border border-slate-800 shadow-inner">
                <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed"><code>{rules}</code></pre>
                <button 
                    onClick={handleCopy} 
                    className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-cyan-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all border border-slate-600 hover:border-cyan-400 shadow-lg"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-white" /> : <CopyIcon className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
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
    const [expandFrontendDebug, setExpandFrontendDebug] = useState(false);
    
    // Auto-check on mount
    useEffect(() => {
        checkServerConfig();
    }, []);

    const handlePermanentDismiss = () => {
        setIsGuideOpen(false);
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

    // Helper to safely access env vars without crashing if env is undefined
    const getSafeEnv = (key: string) => {
        try {
            // @ts-ignore
            // CRITICAL FIX: Use optional chaining for safety in all environments
            return (import.meta && (import.meta as any).env && (import.meta as any).env[key]) || undefined;
        } catch (e) {
            return undefined;
        }
    };

    if (!isGuideOpen) return null;

    // Loading State
    if (checking && !serverStatus) {
        return (
             <div className="p-6 border border-slate-700 rounded-xl bg-slate-900 shadow-xl">
                 <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-slate-800 rounded w-1/3 animate-pulse"></div>
                    <div className="h-6 bg-slate-800 rounded w-16 animate-pulse"></div>
                 </div>
                 <div className="space-y-3">
                     <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                     <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                 </div>
             </div>
        );
    }

    const keyStatus = serverStatus?.details?.firebaseKey || '';
    const isAutoFixed = keyStatus.includes('Auto-Fixed') || keyStatus.includes('Auto-fixing') || keyStatus.includes('Auto-corrected');

    // Azure Check
    const azureStatus = serverStatus?.details?.azureKey || '';
    const azureRegionStatus = serverStatus?.details?.azureRegion || '';
    const isAzureReady = azureStatus.includes('Present') && azureRegionStatus.includes('Present');

    const isServerReady = 
        serverStatus?.details?.gemini?.includes('Present') &&
        serverStatus?.details?.firebaseProject?.includes('Present') &&
        serverStatus?.details?.firebaseEmail?.includes('Present') &&
        (serverStatus?.details?.firebaseKey?.includes('Valid') || isAutoFixed) &&
        isAzureReady;

    const isFullyConfigured = isServerReady && isFirebaseConfigured;

    const projectStatus = serverStatus?.details?.firebaseProject || '';
    const projectMatch = projectStatus.match(/\(([^)]+)\)/);
    const detectedProjectId = projectMatch ? projectMatch[1] : undefined;

    // Styles - SOLID BACKGROUNDS (No Blur)
    let containerStyle = "bg-[#0f172a] border-amber-500/50 shadow-2xl ring-1 ring-amber-900/50";
    let headerIcon = <WarningIcon className="w-6 h-6 text-amber-400" />;
    let headerTitleColor = "text-amber-400";
    let headerBg = "bg-amber-950/30 border-amber-500/30";
    let titleText = uiLanguage === 'ar' ? 'إجراء مطلوب: إعدادات الخادم' : 'Action Required: Server Setup';
    let descriptionText = uiLanguage === 'ar' ? 'رسالة للمطور: يرجى إصلاح أخطاء الخادم أدناه.' : 'Dev Message: Please fix the server configuration errors below.';

    if (isFullyConfigured) {
        // Even if fully configured, we show the Rules helper if triggered by setup param or just to be helpful in dev mode,
        // but typically this component disappears. However, to help the user fix the waitlist bug, we'll show the rules section
        // if this component is visible.
    } else if (isServerReady && !isFirebaseConfigured) {
        containerStyle = "bg-[#0f172a] border-teal-500/50 shadow-2xl ring-1 ring-teal-900/50";
        headerIcon = <CheckIcon className="w-6 h-6 text-teal-400" />;
        headerTitleColor = "text-teal-400";
        headerBg = "bg-teal-950/30 border-teal-500/30";
        titleText = uiLanguage === 'ar' ? 'الخادم جاهز! ولكن...' : 'Server Ready! But...';
        descriptionText = uiLanguage === 'ar' 
            ? 'الخادم يعمل بنجاح. ولكن التطبيق لا يزال ينتظر إعدادات الواجهة الأمامية.' 
            : 'Server-side is operational. The frontend app is still waiting for configuration.';
    }

    return (
        <div className={`p-6 border rounded-2xl text-slate-100 mb-8 transition-all duration-300 relative z-50 ${containerStyle}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${headerBg} shrink-0`}>
                        {headerIcon}
                    </div>
                    <div>
                        <h3 className={`font-black text-xl ${headerTitleColor} tracking-wide`}>
                            {titleText}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed font-medium">
                            {descriptionText}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handlePermanentDismiss}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 font-bold shadow-md"
                    title="Dismiss"
                >
                    <TrashIcon className="w-4 h-4" />
                    {uiLanguage === 'ar' ? 'إخفاء' : 'Dismiss'}</button>
            </div>
            
            <div className="mt-4 border-t border-slate-800 pt-5 space-y-6 text-sm">
                
                {/* Diagnostics Panel */}
                <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${isServerReady ? 'bg-[#020617] border-green-900/50' : 'bg-[#020617] border-slate-700'}`}>
                    <div 
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors"
                        onClick={() => setExpandServerDetails(!expandServerDetails)}
                    >
                        <h4 className={`font-bold flex items-center gap-2 text-sm ${isServerReady ? 'text-green-400' : 'text-slate-200'}`}>
                            {isServerReady ? <CheckIcon className="w-5 h-5" /> : <InfoIcon className="w-5 h-5" />}
                            {uiLanguage === 'ar' ? 'حالة الخادم (Server Config)' : 'Server Status'}
                        </h4>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); checkServerConfig(); }}
                                disabled={checking}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors border border-slate-600 shadow-sm"
                            >
                                {checking ? '...' : (uiLanguage === 'ar' ? 'تحديث' : 'Check')}
                            </button>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${expandServerDetails || !isServerReady ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {(expandServerDetails || !isServerReady) && (
                        <div className="p-5 border-t border-slate-800 bg-slate-950">
                            {serverStatus && !serverStatus.error && serverStatus.details ? (
                                <div className="space-y-3">
                                    <StatusRow label="Gemini API Key" value={serverStatus.details.gemini} />
                                    <StatusRow label="Firebase Project" value={serverStatus.details.firebaseProject} />
                                    <StatusRow label="Firebase Email" value={serverStatus.details.firebaseEmail} />
                                    <StatusRow label="Private Key" value={serverStatus.details.firebaseKey} />
                                    <StatusRow label="Azure Speech Key" value={serverStatus.details.azureKey} />
                                    <StatusRow label="Azure Region" value={serverStatus.details.azureRegion} />
                                    
                                    {!isAzureReady && (
                                        <div className="mt-4 p-3 bg-red-950/20 border border-red-500/20 text-red-300 rounded-lg text-xs leading-relaxed flex gap-3 items-start font-medium">
                                            <WarningIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                                            <div>
                                                <strong className="text-red-200 block mb-1">Microsoft Azure Missing:</strong> 
                                                You need to add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to Vercel.
                                                <div className="opacity-80 mt-1">{uiLanguage === 'ar' ? 'أضف متغيرات AZURE_SPEECH_KEY و AZURE_SPEECH_REGION في إعدادات Vercel.' : 'Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION variables in Vercel settings.'}</div>
                                            </div>
                                        </div>
                                    )}

                                    {isAutoFixed && (
                                        <div className="mt-4 p-3 bg-green-950/20 border border-green-500/20 text-green-300 rounded-lg text-xs leading-relaxed flex gap-3 items-start font-medium">
                                            <CheckIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                                            <div>
                                                <strong className="text-green-200 block mb-1">Good news:</strong> 
                                                Your Private Key format was corrected automatically.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 italic text-xs py-2">
                                    {checking ? 'Checking connection...' : (serverStatus?.error || 'Click Check to verify server')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rules Setup - Important for fixing "Permission Denied" errors */}
                <FirestoreRulesSetup uiLanguage={uiLanguage} />

                {/* Frontend Config Missing Warning */}
                {!isFirebaseConfigured && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <div className="bg-cyan-950 p-2 rounded-full border border-cyan-500/30">
                                <InfoIcon className="w-5 h-5" />
                            </div>
                            <h5 className="font-black text-base uppercase tracking-wide text-cyan-300 shadow-black drop-shadow-md">
                                {uiLanguage === 'ar' ? 'إجراء مطلوب: إعداد الواجهة الأمامية' : 'ACTION REQUIRED: CONFIGURE FRONTEND'}
                            </h5>
                        </div>
                        
                        <p className="text-sm text-slate-300 leading-relaxed ml-1 font-medium">
                            {uiLanguage === 'ar' 
                                ? 'انسخ إعدادات Firebase أدناه وأضفها لمتغيرات البيئة في Vercel (Environment Variables).'
                                : 'Copy the Firebase config below and add them as Environment Variables in Vercel Dashboard.'}
                        </p>

                        <FirebaseSetup uiLanguage={uiLanguage} projectId={detectedProjectId} />
                        
                        {/* Debugging Tool for Frontend Variables */}
                        <div className="mt-6 rounded-xl border border-red-900/50 bg-[#0f172a] overflow-hidden">
                             <div 
                                className="p-3 px-4 flex justify-between items-center cursor-pointer hover:bg-red-900/20 transition-colors"
                                onClick={() => setExpandFrontendDebug(!expandFrontendDebug)}
                            >
                                <div className="flex items-center gap-3">
                                    <WarningIcon className="w-5 h-5 text-red-400" />
                                    <span className="text-sm font-bold text-red-200">{uiLanguage === 'ar' ? 'تشخيص الأخطاء (Frontend Debug)' : 'Frontend Diagnostics'}</span>
                                </div>
                                <ChevronDownIcon className={`w-4 h-4 text-red-400 transition-transform ${expandFrontendDebug ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {expandFrontendDebug && (
                                <div dir="ltr" className="p-4 border-t border-red-900/50 bg-[#020617] text-xs space-y-1">
                                    <p className="text-slate-400 mb-3 text-[11px] italic">
                                        Checking what the browser sees (import.meta.env)...
                                    </p>
                                    <EnvVarCheckRow name="VITE_FIREBASE_API_KEY" value={getSafeEnv('VITE_FIREBASE_API_KEY')} />
                                    <EnvVarCheckRow name="VITE_FIREBASE_PROJECT_ID" value={getSafeEnv('VITE_FIREBASE_PROJECT_ID')} />
                                    <EnvVarCheckRow name="VITE_FIREBASE_AUTH_DOMAIN" value={getSafeEnv('VITE_FIREBASE_AUTH_DOMAIN')} />
                                    <EnvVarCheckRow name="VITE_FIREBASE_STORAGE_BUCKET" value={getSafeEnv('VITE_FIREBASE_STORAGE_BUCKET')} />
                                    <EnvVarCheckRow name="VITE_FIREBASE_MESSAGING_SENDER_ID" value={getSafeEnv('VITE_FIREBASE_MESSAGING_SENDER_ID')} />
                                    <EnvVarCheckRow name="VITE_FIREBASE_APP_ID" value={getSafeEnv('VITE_FIREBASE_APP_ID')} />
                                    
                                    <div className="mt-4 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-3 font-medium">
                                        <strong className="text-red-400">Missing?</strong> You need to Redeploy in Vercel.<br/>
                                        <strong className="text-red-400">Invalid Format?</strong> Check for extra quotes in Vercel values.<br/>
                                        <strong className="text-green-400">Present but Red?</strong> Your Firebase Config values might be incorrect (e.g. wrong API Key), causing initialization to crash.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-start gap-3 text-sm text-blue-100 shadow-inner">
                            <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1 text-blue-300">{uiLanguage === 'ar' ? 'أضفت المتغيرات وما زالت الرسالة تظهر؟' : 'Added variables but still see this?'}</p>
                                <p className="opacity-90 leading-relaxed font-medium">
                                    {uiLanguage === 'ar' 
                                        ? 'متغيرات Vercel لا تعمل فوراً. يجب عليك الذهاب إلى صفحة "Deployments" في Vercel وإعادة نشر آخر نسخة (Redeploy) ليتم "خبز" المتغيرات داخل التطبيق.'
                                        : 'Vercel variables are baked in at build time. You MUST go to your Vercel "Deployments" page and trigger a **Redeploy** for the changes to take effect.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 6: Authorized Domains (Custom) */}
                {isServerReady && isFirebaseConfigured && (
                    <div className="rounded-xl border border-slate-700 bg-[#020617] p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <InfoIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-200 mb-1">{uiLanguage === 'ar' ? 'الدخول لا يعمل على الدومين الخاص؟' : 'Login failing on Custom Domain?'}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {uiLanguage === 'ar'
                                        ? 'للسماح بتسجيل الدخول عبر Google من `sawtli.com`، اذهب إلى Firebase Console > Authentication > Settings > Authorized Domains وأضف "sawtli.com" و "www.sawtli.com".'
                                        : 'To allow Google Sign-In from `sawtli.com`, go to Firebase Console > Authentication > Settings > Authorized Domains and add BOTH "sawtli.com" and "www.sawtli.com".'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
