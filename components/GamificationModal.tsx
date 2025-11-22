
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { ShareIcon, StarIcon, UserIcon, CheckIcon } from './icons';
import { UserStats } from '../types';

interface GamificationModalProps {
    onClose: () => void;
    uiLanguage: Language;
    userStats: UserStats;
    onBoost: (type: 'share' | 'rate' | 'invite') => void;
}

const GamificationModal: React.FC<GamificationModalProps> = ({ onClose, uiLanguage, userStats, onBoost }) => {
    const [justClaimed, setJustClaimed] = useState<string | null>(null);

    const handleAction = (type: 'share' | 'rate' | 'invite') => {
        onBoost(type);
        setJustClaimed(type);
        setTimeout(() => setJustClaimed(null), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-amber-500/50 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                        {t('boostQuota', uiLanguage)} 🚀
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Share Quest */}
                    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${userStats.hasShared ? 'bg-slate-900/50 border-slate-700 opacity-70' : 'bg-slate-700 border-slate-600 hover:border-cyan-400'}`}>
                        <div className="p-3 bg-slate-800 rounded-full text-cyan-400">
                            <ShareIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-white">{t('questShareApp', uiLanguage)}</h4>
                            <p className="text-xs text-slate-400">{t('questShareAppDesc', uiLanguage)}</p>
                        </div>
                        {userStats.hasShared ? (
                            <div className="text-green-400 font-bold text-xs flex flex-col items-center">
                                <CheckIcon className="w-5 h-5 mb-1" />
                                {t('completed', uiLanguage)}
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleAction('share')}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded shadow-lg"
                            >
                                {justClaimed === 'share' ? t('bonusAdded', uiLanguage) : t('claimReward', uiLanguage)}
                            </button>
                        )}
                    </div>

                    {/* Rate Quest */}
                    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${userStats.hasRated ? 'bg-slate-900/50 border-slate-700 opacity-70' : 'bg-slate-700 border-slate-600 hover:border-amber-400'}`}>
                        <div className="p-3 bg-slate-800 rounded-full text-amber-400">
                            <StarIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-white">{t('questRateApp', uiLanguage)}</h4>
                            <p className="text-xs text-slate-400">{t('questRateAppDesc', uiLanguage)}</p>
                        </div>
                        {userStats.hasRated ? (
                            <div className="text-green-400 font-bold text-xs flex flex-col items-center">
                                <CheckIcon className="w-5 h-5 mb-1" />
                                {t('completed', uiLanguage)}
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleAction('rate')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded shadow-lg"
                            >
                                {justClaimed === 'rate' ? t('bonusAdded', uiLanguage) : t('claimReward', uiLanguage)}
                            </button>
                        )}
                    </div>

                    {/* Invite Quest (Mock) */}
                    <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/30 flex items-center gap-4 opacity-60">
                        <div className="p-3 bg-slate-800 rounded-full text-purple-400">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-slate-300">{t('questInviteFriend', uiLanguage)}</h4>
                            <p className="text-xs text-slate-500">{t('questInviteFriendDesc', uiLanguage)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                    <div className="inline-block bg-slate-900 px-4 py-1 rounded-full text-xs font-mono text-amber-400 border border-amber-500/20">
                        {t('trialUsageLabel', uiLanguage)}: {userStats.totalCharsUsed} / {5000 + userStats.bonusChars}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamificationModal;
