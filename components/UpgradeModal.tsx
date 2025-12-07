
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { CheckIcon, LockIcon, SparklesIcon, LoaderIcon, StarIcon } from './icons';
import { UserTier } from '../types';

interface UpgradeModalProps {
    onClose: () => void;
    uiLanguage: Language;
    currentTier: UserTier;
    onUpgrade: (tier: 'gold' | 'platinum') => Promise<boolean>; 
    onSignIn: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, uiLanguage, currentTier, onUpgrade, onSignIn }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [processing, setProcessing] = useState<string | null>(null);

    const isAr = uiLanguage === 'ar';

    const handleSelectPlan = async (planKey: string) => {
        // Special case: If Visitor selects Free plan -> Sign In/Register
        if (planKey === 'free' && currentTier === 'visitor') {
            onSignIn();
            return;
        }

        setProcessing(planKey);
        setTimeout(() => {
            alert(uiLanguage === 'ar' ? `تم اختيار خطة ${planKey}. سيتم توجيهك للدفع قريباً.` : `Selected ${planKey}. Redirecting to payment soon.`);
            setProcessing(null);
        }, 1000);
    };

    // --- DATA ---
    const plans = [
        { key: 'free', name: t('planFree', uiLanguage), color: 'slate', priceMo: '$0', priceYr: '$0' },
        { key: 'onedollar', name: t('planOneDollar', uiLanguage), color: 'amber', priceMo: '$1', priceYr: 'X' },
        { key: 'basic', name: t('planBasic', uiLanguage), color: 'cyan', priceMo: '$12.99', priceYr: '$10.39' },
        { key: 'creator', name: t('planCreator', uiLanguage), color: 'blue', priceMo: '$24.99', priceYr: '$19.99' },
        { key: 'gold', name: t('planGold', uiLanguage), color: 'yellow', priceMo: '$49.99', priceYr: '$39.99' },
        { key: 'pro', name: t('planPro', uiLanguage), color: 'purple', priceMo: '$99.99', priceYr: '$79.99' },
    ];

    const rows = [
        { label: t('tblMonthly', uiLanguage), keys: ['$0', '$1', '$12.99', '$24.99', '$49.99', '$99.99'], type: 'price' },
        { label: t('tblYearly', uiLanguage), keys: ['$0', 'X', '$10.39', '$19.99', '$39.99', '$79.99'], type: 'price' },
        { label: t('tblChars', uiLanguage), keys: [t('valFreeChars', uiLanguage), t('val10k', uiLanguage), t('val75k', uiLanguage), t('val150k', uiLanguage), t('val300k', uiLanguage), t('val750k', uiLanguage)] },
        { label: t('tblVoices', uiLanguage), keys: ['2', '6', '50', '50', '50', '50'] },
        { label: t('tblTrans', uiLanguage), keys: [true, true, true, true, true, true] },
        { label: t('tblTashkeel', uiLanguage), keys: [false, true, true, true, true, true] },
        { label: t('tblMp3', uiLanguage), keys: [t('val5Min', uiLanguage), t('val10Min', uiLanguage), true, true, true, true] },
        { label: t('tblWav', uiLanguage), keys: [false, t('val10Min', uiLanguage), false, false, true, true] },
        { label: t('tblMulti', uiLanguage), keys: [false, t('val2Speakers', uiLanguage), false, t('val2Speakers', uiLanguage), t('val3Speakers', uiLanguage), t('val4Speakers', uiLanguage)] },
        { label: t('tblEmotions', uiLanguage), keys: [false, true, true, true, true, true] },
        { label: t('tblEffects', uiLanguage), keys: [false, true, false, true, true, true] },
        { label: t('tblPauses', uiLanguage), keys: [false, true, true, true, true, true] },
        { label: t('tblMixer', uiLanguage), keys: [false, true, false, true, true, true] },
        { label: t('tblPresets', uiLanguage), keys: [true, true, true, true, true, true] },
        { label: t('tblDucking', uiLanguage), keys: [true, true, t('valManual', uiLanguage), t('valAuto', uiLanguage), t('valAuto', uiLanguage), t('valAuto', uiLanguage)] },
        { label: t('tblAddMusic', uiLanguage), keys: [true, true, true, true, true, true] },
        { label: t('tblUpload', uiLanguage), keys: [false, true, true, true, true, true] },
        { label: t('tblMic', uiLanguage), keys: [false, true, false, true, true, true] },
        { label: t('tblHistory', uiLanguage), keys: [false, true, t('val30Days', uiLanguage), t('val90Days', uiLanguage), t('val180Days', uiLanguage), t('val365Days', uiLanguage)] },
    ];

    const getCellContent = (value: string | boolean) => {
        if (value === true) return <CheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto" />;
        if (value === false) return <div className="text-xl sm:text-2xl text-red-500 font-bold mx-auto">✕</div>;
        if (value === 'X') return <div className="text-xl sm:text-2xl text-red-500 font-bold mx-auto">✕</div>;
        return <span className="text-[10px] sm:text-xs font-bold text-slate-200 text-center block">{value}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-2 sm:p-4 animate-fade-in-down overflow-hidden">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col max-h-[98vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header & Toggle */}
                <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 backdrop-blur-md z-20">
                    <div className="text-center sm:text-left">
                        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                            <SparklesIcon className="w-6 h-6 text-amber-400" />
                            {t('earlyAccess', uiLanguage)}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-400">{uiLanguage === 'ar' ? 'قارن الخطط واختر الأنسب لك.' : 'Compare plans and choose the best fit.'}</p>
                    </div>

                    <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('monthly', uiLanguage)}
                        </button>
                        <button 
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('yearly', uiLanguage)}
                            <span className="bg-white/20 text-white text-[9px] px-1 rounded font-bold">-20%</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="absolute top-3 right-3 sm:static text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* THE MATRIX TABLE */}
                <div className="overflow-x-auto flex-grow bg-[#0f172a] custom-scrollbar relative">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-lg">
                            <tr>
                                <th className="p-2 text-xs font-bold text-slate-400 border-b border-slate-700 bg-[#0f172a] min-w-[120px] sticky left-0 z-20">
                                    {uiLanguage === 'ar' ? 'الميزة' : 'Feature'}
                                </th>
                                {plans.map((plan) => (
                                    <th key={plan.key} className={`p-2 text-center border-b border-slate-700 relative min-w-[90px] ${plan.key === 'onedollar' ? 'bg-amber-900/10 border-amber-500/30' : ''} ${plan.key === 'gold' ? 'bg-yellow-900/10' : ''}`}>
                                        {plan.key === 'onedollar' && <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>}
                                        {plan.key === 'gold' && <div className="absolute top-0 inset-x-0 h-1 bg-yellow-500"></div>}
                                        <div className={`text-xs sm:text-sm font-black uppercase tracking-wider text-${plan.color}-400 mb-1`}>{plan.name}</div>
                                        <div className="text-[10px] sm:text-xs text-slate-500 font-mono">
                                            {plan.key === 'onedollar' ? '$1' : (billingCycle === 'yearly' ? plan.priceYr : plan.priceMo)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {rows.map((row, idx) => {
                                // Skip pricing rows in body
                                if (row.type === 'price') return null;
                                
                                return (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-2 text-[10px] sm:text-xs font-bold text-slate-300 border-r border-slate-800 bg-[#0f172a] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                            {row.label}
                                        </td>
                                        {row.keys.map((val, i) => (
                                            <td key={i} className={`p-1 text-center border-r border-slate-800/50 ${plans[i].key === 'onedollar' ? 'bg-amber-900/5' : ''}`}>
                                                {getCellContent(val as string|boolean)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                            
                            {/* CTA Row */}
                            <tr>
                                <td className="p-2 bg-[#0f172a] sticky left-0 z-10 border-t border-slate-700"></td>
                                {plans.map((plan) => (
                                    <td key={plan.key} className="p-2 text-center border-t border-slate-700">
                                        <button 
                                            onClick={() => handleSelectPlan(plan.key)}
                                            disabled={plan.key === 'free' && currentTier !== 'visitor'}
                                            className={`w-full py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all transform active:scale-95 shadow-lg
                                                ${plan.key === 'free' ? 
                                                    (currentTier === 'visitor' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500 cursor-default') : 
                                                  plan.key === 'onedollar' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:brightness-110' :
                                                  plan.key === 'gold' ? 'bg-yellow-600 hover:bg-yellow-500 text-white' :
                                                  plan.key === 'pro' ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                                                  'bg-slate-700 hover:bg-slate-600 text-white'
                                                }`}
                                        >
                                            {processing === plan.key ? <LoaderIcon className="mx-auto w-3 h-3"/> : 
                                                (plan.key === 'free' ? 
                                                    (currentTier === 'visitor' ? (uiLanguage==='ar'?'سجل مجاناً':'Register Free') : (uiLanguage==='ar'?'الخطة الحالية':'Current')) 
                                                : t('joinWaitlist', uiLanguage))}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
