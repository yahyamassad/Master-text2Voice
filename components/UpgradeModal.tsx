
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { CheckIcon, LockIcon, SparklesIcon, UserIcon, LoaderIcon, StarIcon, CheckIcon as CheckCircle } from './icons';
import { UserTier } from '../types';

interface UpgradeModalProps {
    onClose: () => void;
    uiLanguage: Language;
    currentTier: UserTier;
    onUpgrade: (tier: 'gold' | 'platinum') => Promise<boolean>; 
    onSignIn: () => void;
}

const FeatureRow = ({ label, included, highlight = false }: { label: string, included: boolean, highlight?: boolean }) => (
    <div className={`flex items-center gap-2 text-xs ${included ? (highlight ? 'text-green-300 font-bold' : 'text-slate-300') : 'text-slate-600 opacity-60'}`}>
        {included ? <CheckIcon className={`w-4 h-4 ${highlight ? 'text-green-400' : 'text-cyan-500'}`} /> : <div className="w-4 h-4 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div></div>}
        <span>{label}</span>
    </div>
);

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, uiLanguage, currentTier, onUpgrade, onSignIn }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [processing, setProcessing] = useState<string | null>(null);

    // Hardcoded logic for "Waitlist" simulation since we don't have stripe yet
    const handleSelectPlan = async (planKey: string) => {
        setProcessing(planKey);
        // Simulate API call
        setTimeout(() => {
            alert(uiLanguage === 'ar' ? `تم اختيار خطة ${planKey}. سيتم توجيهك للدفع قريباً.` : `Selected ${planKey}. Redirecting to payment soon.`);
            setProcessing(null);
        }, 1000);
    };

    const isAr = uiLanguage === 'ar';

    // Pricing Logic
    const getPrice = (base: number) => {
        if (billingCycle === 'yearly') {
            // 20% Discount
            const discounted = base * 0.8;
            return `$${discounted.toFixed(2)}`;
        }
        return `$${base}`;
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-2 sm:p-4 animate-fade-in-down overflow-y-auto">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[98vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header & Toggle */}
                <div className="p-6 bg-slate-900/80 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 backdrop-blur-md sticky top-0 z-50">
                    <div className="text-center md:text-left md:rtl:text-right">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2 justify-center md:justify-start">
                            <SparklesIcon className="w-6 h-6 text-amber-400" />
                            {t('earlyAccess', uiLanguage)}
                        </h2>
                        <p className="text-sm text-slate-400">{uiLanguage === 'ar' ? 'استثمر في صوتك. اختر الخطة المناسبة.' : 'Invest in your voice. Choose your plan.'}</p>
                    </div>

                    <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('monthly', uiLanguage)}
                        </button>
                        <button 
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('yearly', uiLanguage)}
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">-20%</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 md:static text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                    
                    {/* 1. THE ONE DOLLAR TICKET (Hero Section) */}
                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)] group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-amber-900/80 opacity-60"></div>
                        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-left md:rtl:text-right">
                                <div className="inline-block px-3 py-1 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-full mb-3 shadow-lg transform group-hover:scale-105 transition-transform">
                                    {uiLanguage === 'ar' ? 'عرض خاص' : 'SPECIAL OFFER'}
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('planOneDollar', uiLanguage)} 🎟️</h3>
                                <p className="text-slate-200 text-sm sm:text-base max-w-xl leading-relaxed">
                                    {uiLanguage === 'ar' 
                                        ? 'تذكرة دخول لمتحف صوتلي. جرب كل الميزات الاحترافية لمدة 3 أيام مقابل دولار واحد فقط. بدون التزام.'
                                        : 'Your ticket to the Sawtli Museum. Experience full pro features for 3 days for just $1. No commitment.'}
                                </p>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 shrink-0 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <span className="text-4xl font-black text-amber-400">$1</span>
                                <span className="text-xs text-slate-300 uppercase tracking-widest">{t('oneTime', uiLanguage)}</span>
                            </div>

                            <div className="w-full md:w-auto">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm text-slate-200">
                                    <FeatureRow label={`10,000 ${t('featChars', uiLanguage)}`} included={true} highlight />
                                    <FeatureRow label={t('featWav', uiLanguage)} included={true} highlight />
                                    <FeatureRow label={`3 ${t('featDays', uiLanguage)}`} included={true} />
                                    <FeatureRow label={t('featMultiSpeaker2', uiLanguage)} included={true} />
                                    <FeatureRow label={t('featStudioFull', uiLanguage)} included={true} />
                                    <FeatureRow label={t('featTashkeel', uiLanguage)} included={true} />
                                </div>
                                <button 
                                    onClick={() => handleSelectPlan('onedollar')}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-xl shadow-xl transition-all transform active:scale-95 text-lg"
                                >
                                    {processing === 'onedollar' ? <LoaderIcon className="mx-auto" /> : (uiLanguage === 'ar' ? 'احصل على التذكرة الآن' : 'Get The Ticket Now')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. SUBSCRIPTION GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* BASIC */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex flex-col hover:bg-slate-800 transition-colors">
                            <h4 className="text-lg font-bold text-slate-300 mb-1">{t('planBasic', uiLanguage)}</h4>
                            <div className="text-2xl font-bold text-white mb-4">{getPrice(12.99)} <span className="text-xs text-slate-500 font-normal">{billingCycle === 'yearly' ? t('perYear', uiLanguage) : t('perMonth', uiLanguage)}</span></div>
                            
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-center">
                                    <span className="block text-xl font-bold text-cyan-400">75,000</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{t('featChars', uiLanguage)}</span>
                                </div>
                                <FeatureRow label={t('featureGeminiVoices', uiLanguage)} included={true} />
                                <FeatureRow label={t('featTashkeel', uiLanguage)} included={true} />
                                <FeatureRow label={t('featMusicUpload', uiLanguage)} included={true} />
                                <FeatureRow label={t('featWav', uiLanguage)} included={false} />
                                <FeatureRow label={t('featMultiSpeaker2', uiLanguage)} included={false} />
                                <FeatureRow label={t('featEffects', uiLanguage)} included={false} />
                            </div>
                            <button onClick={() => handleSelectPlan('basic')} className="w-full py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors">{t('joinWaitlist', uiLanguage)}</button>
                        </div>

                        {/* CREATOR */}
                        <div className="bg-slate-800/80 border border-slate-600 rounded-2xl p-5 flex flex-col hover:border-cyan-500/50 transition-colors">
                            <h4 className="text-lg font-bold text-cyan-200 mb-1">{t('planCreator', uiLanguage)}</h4>
                            <div className="text-2xl font-bold text-white mb-4">{getPrice(24.99)} <span className="text-xs text-slate-500 font-normal">{billingCycle === 'yearly' ? t('perYear', uiLanguage) : t('perMonth', uiLanguage)}</span></div>
                            
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-center">
                                    <span className="block text-xl font-bold text-cyan-400">150,000</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{t('featChars', uiLanguage)}</span>
                                </div>
                                <FeatureRow label={t('featureGeminiVoices', uiLanguage)} included={true} />
                                <FeatureRow label={t('featTashkeel', uiLanguage)} included={true} />
                                <FeatureRow label={t('featStudioFull', uiLanguage)} included={true} />
                                <FeatureRow label={t('featMultiSpeaker2', uiLanguage)} included={true} highlight />
                                <FeatureRow label={t('featWav', uiLanguage)} included={false} />
                            </div>
                            <button onClick={() => handleSelectPlan('creator')} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">{t('joinWaitlist', uiLanguage)}</button>
                        </div>

                        {/* GOLD (Recommended) */}
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 flex flex-col relative transform scale-105 shadow-xl z-10">
                            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                            <div className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">{t('comingSoon', uiLanguage)}</div>
                            
                            <h4 className="text-xl font-black text-amber-400 mb-1 flex items-center gap-2">{t('planGold', uiLanguage)} <StarIcon className="w-4 h-4"/></h4>
                            <div className="text-3xl font-bold text-white mb-4">{getPrice(49.99)} <span className="text-xs text-slate-500 font-normal">{billingCycle === 'yearly' ? t('perYear', uiLanguage) : t('perMonth', uiLanguage)}</span></div>
                            
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="p-2 bg-slate-900/80 rounded border border-amber-500/30 text-center">
                                    <span className="block text-2xl font-black text-amber-400">300,000</span>
                                    <span className="text-[10px] text-slate-400 uppercase">{t('featChars', uiLanguage)}</span>
                                </div>
                                <FeatureRow label={t('featWav', uiLanguage)} included={true} highlight />
                                <FeatureRow label={t('featMultiSpeaker3', uiLanguage)} included={true} highlight />
                                <FeatureRow label={t('featStudioFull', uiLanguage)} included={true} />
                                <FeatureRow label={t('featMicUpload', uiLanguage)} included={true} />
                                <FeatureRow label={t('featHistoryLong', uiLanguage)} included={true} />
                            </div>
                            <button onClick={() => handleSelectPlan('gold')} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-colors">{t('joinWaitlist', uiLanguage)}</button>
                        </div>

                        {/* PROFESSIONAL */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex flex-col hover:border-purple-500/50 transition-colors">
                            <h4 className="text-lg font-bold text-purple-300 mb-1">{t('planPro', uiLanguage)}</h4>
                            <div className="text-2xl font-bold text-white mb-4">{getPrice(99.99)} <span className="text-xs text-slate-500 font-normal">{billingCycle === 'yearly' ? t('perYear', uiLanguage) : t('perMonth', uiLanguage)}</span></div>
                            
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-center">
                                    <span className="block text-xl font-bold text-purple-400">750,000</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{t('featChars', uiLanguage)}</span>
                                </div>
                                <FeatureRow label={t('featMultiSpeaker4', uiLanguage)} included={true} highlight />
                                <FeatureRow label={t('featWav', uiLanguage)} included={true} />
                                <FeatureRow label={t('featStudioFull', uiLanguage)} included={true} />
                                <FeatureRow label={t('featHistoryLong', uiLanguage)} included={true} />
                                <FeatureRow label="Priority Support" included={true} />
                            </div>
                            <button onClick={() => handleSelectPlan('professional')} className="w-full py-2 bg-slate-700 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 font-bold rounded-lg transition-colors">{t('joinWaitlist', uiLanguage)}</button>
                        </div>

                    </div>

                    {/* Free Tier Mention */}
                    <div className="text-center pt-6 border-t border-slate-800">
                        <p className="text-slate-500 text-sm">
                            {uiLanguage === 'ar' ? 'هل تبحث عن تجربة مجانية؟' : 'Looking for a free trial?'} 
                            <span className="text-slate-300 font-bold ml-1">
                                {t('planFree', uiLanguage)}: 5,000 {t('featChars', uiLanguage)} / {t('monthly', uiLanguage)}
                            </span>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
