import React from 'react';
import { User } from 'firebase/auth';
import { t, Language } from '../i18n/translations';
import { TrashIcon } from './icons';

interface AccountModalProps {
    onClose: () => void;
    uiLanguage: Language;
    user: User | null;
    dailyUsage: { used: number; limit: number } | null;
    onSignOut: () => void;
    onClearHistory: () => void;
    onDeleteAccount: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ onClose, uiLanguage, user, dailyUsage, onSignOut, onClearHistory, onDeleteAccount }) => {
    if (!user) return null;

    const creationDate = user.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString(uiLanguage, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
    
    const usagePercent = dailyUsage ? (dailyUsage.used / dailyUsage.limit) * 100 : 0;

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

                    {/* Usage Stats */}
                    {dailyUsage && (
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">{t('dailyUsageLabel', uiLanguage)}</label>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${usagePercent}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400 text-right mt-1">{dailyUsage.used.toLocaleString()} / {dailyUsage.limit.toLocaleString()}</p>
                        </div>
                    )}
                    
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

                <div className="mt-6 border-t border-slate-700 pt-4">
                    <button onClick={onSignOut} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors">
                        {t('signOut', uiLanguage)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountModal;
