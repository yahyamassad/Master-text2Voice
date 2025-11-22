
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { CheckIcon, LockIcon, SparklesIcon, UserIcon } from './icons';
import { UserTier } from '../types';

interface UpgradeModalProps {
    onClose: () => void;
    uiLanguage: Language;
    currentTier: UserTier;
    onUpgrade: (tier: 'gold' | 'platinum') => void; 
    onSignIn: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, uiLanguage, currentTier, onUpgrade, onSignIn }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                
                <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {t('earlyAccess', uiLanguage)} 🚀
                            </h2>
                            <p className="text-sm text-slate-400">Join the waitlist for premium features</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                        
                        {/* Free Card */}
                        <div className={`p-6 rounded-xl border flex flex-col ${currentTier === 'free' || currentTier === 'visitor' ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-80 hover:opacity-100 transition-opacity'}`}>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('planFree', uiLanguage)}</h3>
                                <div className="text-3xl font-bold text-white">{t('priceFree', uiLanguage)}</div>
                                <p className="text-xs text-slate-500 mt-2">Limited access for testing.</p>
                            </div>
                            <ul className="space-y-4 text-sm text-slate-400 flex-grow mb-8">
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-500"/> {t('featureCharsStandard', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-500"/> {t('featureSystemVoices', uiLanguage)}</li>
                                <li className="flex items-center gap-3 opacity-50"><LockIcon className="w-4 h-4 text-slate-600"/> {t('featureGeminiVoices', uiLanguage)}</li>
                                <li className="flex items-center gap-3 opacity-50"><LockIcon className="w-4 h-4 text-slate-600"/> {t('featureDownloadsStandard', uiLanguage)}</li>
                            </ul>
                             {currentTier === 'visitor' ? (
                                <button 
                                    onClick={onSignIn}
                                    className="w-full py-3 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 border border-slate-500 transition-colors flex items-center justify-center gap-2 mt-auto"
                                >
                                     <UserIcon className="w-4 h-4" />
                                     {t('loginToRegister', uiLanguage)}
                                </button>
                             ) : (
                                <button 
                                    disabled
                                    className="w-full py-3 rounded-lg bg-slate-800 text-slate-500 font-bold border border-slate-700 cursor-default mt-auto"
                                >
                                     Active
                                </button>
                             )}
                        </div>

                        {/* Gold Card (Teaser) */}
                        <div className="p-6 rounded-xl border bg-gradient-to-b from-slate-800 to-slate-900 border-amber-500/30 flex flex-col relative overflow-hidden group hover:border-amber-500 transition-colors shadow-xl transform hover:-translate-y-1">
                            <div className="absolute top-0 right-0 bg-amber-600/20 text-amber-400 border-l border-b border-amber-500/30 text-xs font-bold px-3 py-1 rounded-bl-lg">{t('comingSoon', uiLanguage)}</div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                                    {t('planGold', uiLanguage)} <SparklesIcon className="w-4 h-4"/>
                                </h3>
                                <div className="text-3xl font-bold text-slate-200 tracking-wide italic opacity-80">{t('priceGold', uiLanguage)}</div>
                                <p className="text-xs text-slate-500 mt-2">For creators & professionals.</p>
                            </div>
                            
                            <ul className="space-y-4 text-sm text-slate-200 flex-grow mb-8">
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-amber-500"/> {t('featureCharsExtended', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-amber-500"/> {t('featureGeminiVoices', uiLanguage)} (HD)</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-amber-500"/> {t('featureDownloadsHigh', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-amber-500"/> {t('featureEffectsPause', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-amber-500"/> {t('featureMultiSpeaker', uiLanguage)}</li>
                            </ul>
                            
                            <button 
                                onClick={() => onUpgrade('gold')}
                                className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg hover:shadow-amber-500/20 transition-all mt-auto uppercase tracking-wide"
                            >
                                {t('joinWaitlist', uiLanguage)}
                            </button>
                        </div>

                        {/* Platinum Card (Teaser) */}
                        <div className="p-6 rounded-xl border bg-slate-800 border-cyan-400/20 flex flex-col relative overflow-hidden hover:border-cyan-400 transition-colors opacity-90 hover:opacity-100">
                             <div className="absolute top-0 right-0 bg-cyan-900/20 text-cyan-400 border-l border-b border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-bl-lg">{t('comingSoon', uiLanguage)}</div>
                             <div className="mb-6">
                                <h3 className="text-lg font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                                    {t('planPlatinum', uiLanguage)}
                                </h3>
                                <div className="text-3xl font-bold text-slate-200 tracking-wide italic opacity-80">{t('pricePlatinum', uiLanguage)}</div>
                                <p className="text-xs text-slate-500 mt-2">Ultimate Audio Studio access.</p>
                            </div>
                            
                            <ul className="space-y-4 text-sm text-slate-200 flex-grow mb-8">
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-400"/> {t('featureCharsUnlimited', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-400"/> {t('featureAdvancedStudio', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-400"/> {t('featureCommercial', uiLanguage)}</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-cyan-400"/> {t('featurePriority', uiLanguage)}</li>
                                <li className="flex items-center gap-3 text-slate-400 italic">+ All Gold Features</li>
                            </ul>
                            
                            <button 
                                onClick={() => onUpgrade('platinum')}
                                className="w-full py-3 rounded-lg bg-slate-700 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 font-bold hover:text-cyan-300 transition-all mt-auto uppercase tracking-wide"
                            >
                                {t('joinWaitlist', uiLanguage)}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
