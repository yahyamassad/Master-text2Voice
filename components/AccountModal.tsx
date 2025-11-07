import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { t, Language } from '../i18n/translations';
import { TrashIcon, CheckIcon } from './icons';

interface AccountModalProps {
    onClose: () => void;
    uiLanguage: Language;
    user: User | null;
    onSignOut: () => void;
    onClearHistory: () => void;
    onDeleteAccount: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ onClose, uiLanguage, user, onSignOut, onClearHistory, onDeleteAccount }) => {
    if (!user) return null;

    const [secretKeyInput, setSecretKeyInput] = useState('');
    const [isDevMode, setIsDevMode] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [uidCopied, setUidCopied] = useState(false);

    useEffect(() => {
        // Check if dev mode is active from sessionStorage
        const key = sessionStorage.getItem('owner_secret_key');
        setIsDevMode(!!key);

        // Check if the current user is the owner by comparing UIDs
        if (user && process.env.VITE_OWNER_UID) {
            setIsOwner(user.uid === process.env.VITE_OWNER_UID);
        }
    }, [user]);

    const handleActivateDevMode = () => {
        if (secretKeyInput.trim()) {
            sessionStorage.setItem('owner_secret_key', secretKeyInput.trim());
            setIsDevMode(true);
            alert(t('keySaved', uiLanguage));
            setSecretKeyInput('');
        }
    };

    const handleDeactivateDevMode = () => {
        sessionStorage.removeItem('owner_secret_key');
        setIsDevMode(false);
        alert(t('keyRemoved', uiLanguage));
    };
    
    const handleCopyUid = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.uid);
        setUidCopied(true);
        setTimeout(() => setUidCopied(false), 2000);
    };

    const creationDate = user.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
    
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
                    {/* User Info */}
                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                        <img src={user.photoURL || undefined} alt={user.displayName || 'User'} className="w-16 h-16 rounded-full border-2 border-cyan-500" />
                        <div>
                            <p className="text-lg font-bold text-white">{user.displayName}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <p className="text-xs text-slate-500 mt-1">{t('joinedDate', uiLanguage)}: {creationDate}</p>
                        </div>
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
                    
                    {/* Developer Powers Section */}
                    {isOwner && (
                        <div className="border-t-2 border-cyan-500/30 pt-4">
                            <h4 className="text-md font-bold text-cyan-400">{t('developerPowers', uiLanguage)}</h4>
                            <div className={`mt-3 p-3 rounded-lg text-sm ${isDevMode ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                                {isDevMode ? t('devModeActive', uiLanguage) : t('devModeInactive', uiLanguage)}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{t('devModeInfo', uiLanguage)}</p>
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="password"
                                    value={secretKeyInput}
                                    onChange={(e) => setSecretKeyInput(e.target.value)}
                                    placeholder={t('enterSecretKey', uiLanguage)}
                                    className="flex-grow p-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
                                />
                                {isDevMode ? (
                                    <button onClick={handleDeactivateDevMode} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm transition-colors">
                                        {t('deactivate', uiLanguage)}
                                    </button>
                                ) : (
                                    <button onClick={handleActivateDevMode} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm transition-colors">
                                        {t('activate', uiLanguage)}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
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
                        <span className="font-mono bg-slate-700 p-1 rounded cursor-pointer truncate" onClick={handleCopyUid} title={t('copyIdTooltip', uiLanguage)}>
                            {user.uid}
                        </span>
                        {uidCopied && <CheckIcon className="inline-block ml-1 h-4 w-4 text-green-400" />}
                        {!process.env.VITE_OWNER_UID && <p className="mt-1">{t('ownerUidInfo', uiLanguage)}</p>}
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