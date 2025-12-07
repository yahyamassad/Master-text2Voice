import React, { useState, useEffect } from 'react';
// Fix: Import User type from firebase compat namespace
import firebase from 'firebase/compat/app';
import { t, Language } from '../i18n/translations';
import { TrashIcon, CheckIcon, SparklesIcon, LockIcon, InfoIcon, LoaderIcon } from './icons';
import { UserTier, UserStats } from '../types';

type User = firebase.User;

interface AccountModalProps {
    onClose: () => void;
    uiLanguage: Language;
    user: User | null;
    onSignOut: () => void;
    onClearHistory: () => void;
    onDeleteAccount: () => void;
    currentTier: UserTier;
    userStats: UserStats;
    limits: any;
    onUpgrade: () => void;
    onSetDevMode: (enabled: boolean) => void;
    onOpenOwnerGuide: () => void;
}

const QuotaProgressBar: React.FC<{ label: string, used: number, total: number, color?: string }> = ({ label, used, total, color = 'cyan' }) => {
    const percent = total === Infinity ? 0 : Math.min(100, (used / total) * 100);
    const displayTotal = total === Infinity ? '∞' : total;
    
    let barColor = `bg-${color}-500`;
    if (percent > 90) barColor = 'bg-red-500';
    else if (percent > 75) barColor = 'bg-amber-500';

    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-semibold">{label}</span>
                <span className="text-slate-300 font-mono">{used} / {displayTotal}</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

const AccountModal: React.FC<AccountModalProps> = ({ onClose, uiLanguage, user, onSignOut, onClearHistory, onDeleteAccount, currentTier, userStats, limits, onUpgrade, onSetDevMode, onOpenOwnerGuide }) => {
    // Safety check: if user is null (logged out while modal open), close or return null
    if (!user) return null;

    const [secretKeyInput, setSecretKeyInput] = useState('');
    const [isDevMode, setIsDevMode] = useState(false);
    const [uidCopied, setUidCopied] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Check if dev mode is active from sessionStorage (handled in parent, but sync here)
        const key = sessionStorage.getItem('sawtli_dev_mode');
        setIsDevMode(key === 'true');
    }, [user]);

    const handleRedeemCode = async () => {
        if (!secretKeyInput.trim()) return;
        
        setIsVerifying(true);
        try {
            const res = await fetch('/api/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: secretKeyInput })
            });
            
            if (!res.ok) throw new Error('Verification request failed');

            const data = await res.json();
            
            if (data.valid) {
                onSetDevMode(true);
                setIsDevMode(true);
                alert(t('keySaved', uiLanguage));
                setSecretKeyInput('');
            } else {
                alert("Invalid Coupon Code");
            }
        } catch (e) {
            console.error(e);
            alert("Verification connection error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDeactivateDevMode = () => {
        onSetDevMode(false);
        setIsDevMode(false);
        alert(t('keyRemoved', uiLanguage));
    };
    
    const handleCopyUid = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.uid);
        setUidCopied(true);
        setTimeout(() => setUidCopied(false), 2000);
    };

    // Safe date formatting to prevent crashes
    const getCreationDate = () => {
        try {
            if (user?.metadata?.creationTime) {
                return new Date(user.metadata.creationTime).toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' });
            }
        } catch (e) {
            console.error("Date error", e);
        }
        return 'N/A';
    };

    const creationDate = getCreationDate();
    
    // Safe limits access
    const safeTotalLimit = (limits?.totalTrialLimit || 0) + (userStats?.bonusChars || 0);
    const safeDailyLimit = limits?.dailyLimit || 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('manageAccount', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 space-y-6">
                    {/* User Info & Tier */}
                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg relative overflow-hidden">
                         {currentTier === 'gold' && <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-bl">GOLD</div>}
                         {currentTier === 'professional' && <div className="absolute top-0 right-0 bg-cyan-400 text-black text-xs font-bold px-2 py-1 rounded-bl">PROFESSIONAL</div>}
                         {currentTier === 'admin' && <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl">ADMIN</div>}
                        <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-16 h-16 rounded-full border-2 border-cyan-500" />
                        <div>
                            <p className="text-lg font-bold text-white flex items-center gap-2">{user.displayName || 'User'}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <p className="text-xs text-slate-500 mt-1">{t('joinedDate', uiLanguage)}: {creationDate}</p>
                        </div>
                    </div>
                    
                    {/* Subscription & Quotas */}
                    <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                         <div className="flex justify-between items-center mb-4">
                             <span className="text-slate-400 text-sm">Current Plan</span>
                             <span className={`font-bold ${currentTier === 'gold' ? 'text-amber-400' : (currentTier === 'professional' ? 'text-cyan-400' : (currentTier === 'admin' ? 'text-red-500' : 'text-white'))}`}>
                                 {currentTier ? currentTier.toUpperCase() : 'FREE'}
                             </span>
                         </div>

                         {/* Usage Stats for Free/Visitor */}
                         {(currentTier === 'free' || currentTier === 'visitor') && (
                             <div className="mb-4 pt-2 border-t border-slate-800">
                                 <QuotaProgressBar label={t('dailyUsageLabel', uiLanguage)} used={userStats?.dailyCharsUsed || 0} total={safeDailyLimit} color="cyan" />
                                 <QuotaProgressBar label={t('trialUsageLabel', uiLanguage)} used={userStats?.totalCharsUsed || 0} total={safeTotalLimit} color="amber" />
                             </div>
                         )}

                         {(currentTier === 'free' || currentTier === 'visitor') && (
                             <button onClick={onUpgrade} className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-lg text-sm hover:from-amber-500 hover:to-orange-500 flex items-center justify-center gap-2">
                                 <SparklesIcon className="w-4 h-4" /> {uiLanguage === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
                             </button>
                         )}
                         {currentTier === 'admin' && (
                             <div className="text-center text-xs text-red-400 mt-2 font-mono">
                                 {uiLanguage === 'ar' ? 'صلاحيات المطور مفعلة' : 'Developer Powers Active'}
                             </div>
                         )}
                    </div>
                    
                    {/* Data Management */}
                    <div>
                        <h4 className="text-md font-bold text-slate-300 border-b border-slate-700 pb-2 mb-3">{t('dataManagement', uiLanguage)}</h4>
                        <div className="flex items-center justify-between">
                             <div>
                                <p className="font-semibold text-slate-200">{t('clearCloudHistory', uiLanguage)}</p>
                                <p className="text-xs text-slate-400 max-w-md">{t('clearCloudHistoryInfo', uiLanguage)}</p>
                            </div>
                            <button onClick={onClearHistory} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 text-sm transition-colors flex-shrink-0">
                                <TrashIcon className="w-4 h-4" /> {t('historyClear', uiLanguage)}
                            </button>
                        </div>
                    </div>
                    
                    {/* "Redeem Code" Section - Stealth Developer Entry */}
                    <div className="border-t-2 border-slate-700/50 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <SparklesIcon className="text-slate-500 w-4 h-4" />
                            <h4 className="text-sm font-bold text-slate-400">{uiLanguage === 'ar' ? 'هل لديك قسيمة؟' : 'Have a Code?'}</h4>
                        </div>
                        
                        {isDevMode && (
                            <div className="mb-3 p-2 bg-green-900/30 border border-green-500/30 rounded text-xs text-green-400 text-center">
                                {uiLanguage === 'ar' ? 'تم تفعيل وضع المطور' : 'Developer Mode Active'}
                            </div>
                        )}

                        {!isDevMode ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={secretKeyInput}
                                    onChange={(e) => setSecretKeyInput(e.target.value)}
                                    placeholder="Enter code..."
                                    className="flex-grow p-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 placeholder-slate-600 text-sm"
                                    disabled={isVerifying}
                                />
                                <button 
                                    onClick={handleRedeemCode} 
                                    disabled={isVerifying}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm transition-colors flex items-center justify-center min-w-[80px]"
                                >
                                    {isVerifying ? <LoaderIcon className="w-4 h-4" /> : (uiLanguage === 'ar' ? 'تفعيل' : 'Redeem')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button onClick={onOpenOwnerGuide} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-600 flex items-center justify-center gap-2 transition-colors">
                                    <InfoIcon className="w-4 h-4" />
                                    {uiLanguage === 'ar' ? 'عرض دليل المالك' : 'Show Owner Guide'}
                                </button>
                                <button onClick={handleDeactivateDevMode} className="w-full px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-md text-sm transition-colors border border-red-800">
                                    {uiLanguage === 'ar' ? 'إلغاء وضع المطور' : 'Deactivate Dev Mode'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Danger Zone */}
                    <div className="border-t-2 border-red-500/30 pt-4">
                        <h4 className="text-md font-bold text-red-400">{t('dangerZone', uiLanguage)}</h4>
                         <div className="flex items-center justify-between mt-3">
                             <div>
                                <p className="font-semibold text-red-300">{t('deleteAccount', uiLanguage)}</p>
                                <p className="text-xs text-slate-400 max-w-md">{t('deleteAccountInfo', uiLanguage)}</p>
                            </div>
                            <button onClick={onDeleteAccount} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 text-sm transition-colors flex-shrink-0">
                                <TrashIcon className="w-4 h-4" /> {t('deleteConfirmation', uiLanguage)}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-700 pt-4 flex justify-between items-center gap-4">
                     <div className="text-xs text-slate-500 overflow-hidden">
                        <span className="font-semibold">{t('yourUserId', uiLanguage)}: </span>
                        <span className="font-mono bg-slate-700 p-1 rounded cursor-pointer truncate select-all" onClick={handleCopyUid} title={t('copyIdTooltip', uiLanguage)}>
                            {user.uid}
                        </span>
                        {uidCopied && <CheckIcon className="inline-block ml-1 h-4 w-4 text-green-400" />}
                    </div>
                    <button onClick={onSignOut} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-semibold transition-colors flex-shrink-0">
                        {t('signOut', uiLanguage)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountModal;