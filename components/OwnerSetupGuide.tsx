
import React, { useState, useEffect } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, CopyIcon, TrashIcon, InfoIcon, CheckIcon, ChevronDownIcon, GearIcon, ExternalLinkIcon, SparklesIcon, LockIcon, LoaderIcon } from './icons';

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
        ttsModel?: string;
        textModel?: string;
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

function ModelRow({ label, value }: { label: string, value?: string }) {
    const isDefault = value?.includes('Default');
    return (
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0">
            <span className="text-slate-300 text-sm font-bold flex items-center gap-2">
                <GearIcon className="w-3 h-3 text-slate-500" /> {label}
            </span>
            <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${isDefault ? 'text-slate-400' : 'text-cyan-400'}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}

function CouponGenerator({ uiLanguage }: { uiLanguage: Language }) {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateCoupon = async (type: 'gold' | 'trial') => {
        setLoading(type);
        setGeneratedCode(null);
        try {
            // NOTE: In production, we'd use a real auth token. Here we rely on the client-side secret being correct.
            // Ideally, we shouldn't send the secret, but for this lightweight admin panel it simplifies things.
            // The API will check against the env var.
            const secret = prompt("Confirm Admin Password to Generate:");
            if (!secret) { setLoading(null); return; }

            const res = await fetch('/api/generate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, adminSecret: secret })
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedCode(data.code);
            } else {
                alert("Failed: " + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert("Connection Failed");
        } finally {
            setLoading(null);
        }
    };

    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="rounded-xl border border-amber-500/30 bg-[#020617] p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <LockIcon className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-slate-200 text-sm">Coupon Generator (Single-Use)</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                    onClick={() => generateCoupon('trial')} 
                    disabled={!!loading}
                    className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                >
                    {loading === 'trial' ? <LoaderIcon className="w-5 h-5 mb-1" /> : <span className="text-xl">🥉</span>}
                    <span className="text-xs font-bold text-white mt-1">Trial (3 Days)</span>
                    <span className="text-[9px] text-slate-400">Individuals</span>
                </button>
                
                <button 
                    onClick={() => generateCoupon('gold')} 
                    disabled={!!loading}
                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-amber-900/40 to-slate-800 hover:from-amber-900/60 rounded-lg border border-amber-500/40 transition-colors"
                >
                    {loading === 'gold' ? <LoaderIcon className="w-5 h-5 mb-1" /> : <span className="text-xl">🥇</span>}
                    <span className="text-xs font-bold text-amber-400 mt-1">Gold (7 Days)</span>
                    <span className="text-[9px] text-slate-400">Organizations</span>
                </button>
            </div>

            {generatedCode && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-between animate-fade-in">
                    <div className="font-mono text-green-400 font-bold text-lg tracking-wider">
                        {generatedCode}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className="bg-green-800/50 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ... (Rest of the component remains the same, just adding CouponGenerator to the render) ...

// --- Main Component ---

export default function OwnerSetupGuide({ uiLanguage, isApiConfigured, isFirebaseConfigured }: OwnerSetupGuideProps) {
    const [isGuideOpen, setIsGuideOpen] = useState(true);
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [checking, setChecking] = useState(false);
    const [expandServerDetails, setExpandServerDetails] = useState(false);
    const [expandFrontendDebug, setExpandFrontendDebug] = useState(false);
    const [expandQuotas, setExpandQuotas] = useState(false);
    const [expandCosts, setExpandCosts] = useState(false);
    
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

    if (!isGuideOpen) return null;

    // Loading State
    if (checking && !serverStatus) {
        return (
             <div className="p-6 border border-slate-700 rounded-xl bg-slate-900 shadow-xl">
                 <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-slate-800 rounded w-1/3 animate-pulse"></div>
                    <div className="h-6 bg-slate-800 rounded w-16 animate-pulse"></div>
                 </div>
             </div>
        );
    }

    const keyStatus = serverStatus?.details?.firebaseKey || '';
    const isAutoFixed = keyStatus.includes('Auto-Fixed') || keyStatus.includes('Auto-fixing') || keyStatus.includes('Auto-corrected');
    const isAzureReady = serverStatus?.details?.azureKey?.includes('Present') && serverStatus?.details?.azureRegion?.includes('Present');
    const isServerReady = 
        serverStatus?.details?.gemini?.includes('Present') &&
        serverStatus?.details?.firebaseProject?.includes('Present') &&
        serverStatus?.details?.firebaseEmail?.includes('Present') &&
        (serverStatus?.details?.firebaseKey?.includes('Valid') || isAutoFixed) &&
        isAzureReady;

    const isFullyConfigured = isServerReady && isFirebaseConfigured;

    let containerStyle = "bg-[#0f172a] border-amber-500/50 shadow-2xl ring-1 ring-amber-900/50";
    let headerIcon = <WarningIcon className="w-6 h-6 text-amber-400" />;
    let headerTitleColor = "text-amber-400";
    let titleText = uiLanguage === 'ar' ? 'إجراء مطلوب: إعدادات الخادم' : 'Action Required: Server Setup';

    if (isFullyConfigured) {
        containerStyle = "bg-[#0f172a] border-teal-500/50 shadow-2xl ring-1 ring-teal-900/50";
        headerIcon = <CheckIcon className="w-6 h-6 text-teal-400" />;
        headerTitleColor = "text-teal-400";
        titleText = uiLanguage === 'ar' ? 'لوحة المالك (Owner Panel)' : 'Owner Panel';
    }

    return (
        <div className={`p-6 border rounded-2xl text-slate-100 mb-8 transition-all duration-300 relative z-50 ${containerStyle}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border bg-slate-900/50 shrink-0`}>
                        {headerIcon}
                    </div>
                    <div>
                        <h3 className={`font-black text-xl ${headerTitleColor} tracking-wide`}>
                            {titleText}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed font-medium">
                            {isFullyConfigured 
                                ? (uiLanguage === 'ar' ? 'إدارة القسائم وفحص الخادم.' : 'Manage coupons and check server health.')
                                : (uiLanguage === 'ar' ? 'يرجى إكمال الإعدادات لتفعيل كل الميزات.' : 'Please complete setup to enable all features.')}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handlePermanentDismiss}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg transition-colors border border-slate-600 flex items-center gap-2 font-bold shadow-md"
                >
                    <TrashIcon className="w-4 h-4" />
                    {uiLanguage === 'ar' ? 'إخفاء' : 'Close'}</button>
            </div>
            
            <div className="mt-4 border-t border-slate-800 pt-5 space-y-6 text-sm">
                
                {/* Coupon Generator - Only show if Configured */}
                {isFullyConfigured && <CouponGenerator uiLanguage={uiLanguage} />}

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
                                    
                                    <div className="my-2 border-t border-slate-800 pt-2"></div>
                                    <ModelRow label="Active TTS Model" value={serverStatus.details.ttsModel} />
                                    <ModelRow label="Active Text Model" value={serverStatus.details.textModel} />
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 italic text-xs py-2">
                                    {checking ? 'Checking connection...' : (serverStatus?.error || 'Click Check to verify server')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
