
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { CheckIcon, SparklesIcon, LoaderIcon, StarIcon, SoundEnhanceIcon, VideoCameraIcon, UserIcon } from './icons';
import { UserTier } from '../types';

interface UpgradeModalProps {
    onClose: () => void;
    uiLanguage: Language;
    currentTier: UserTier;
    onUpgrade: (tier: 'gold' | 'platinum') => Promise<boolean>; 
    onSignIn: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, uiLanguage, currentTier, onUpgrade, onSignIn }) => {
    const [processing, setProcessing] = useState<string | null>(null);
    const isAr = uiLanguage === 'ar';

    const handleJoinWaitlist = async (tier: 'gold' | 'platinum', label: string) => {
        setProcessing(label);
        await onUpgrade(tier);
        setProcessing(null);
    };

    // --- CARDS CONFIGURATION ---
    const cards = [
        {
            id: 'starter',
            title: isAr ? 'البداية' : 'Visitor',
            subtitle: isAr ? 'اكتشف إمكانيات صوتلي' : 'Discover the power of Sawtli',
            icon: <UserIcon className="w-8 h-8 text-slate-300" />,
            color: 'slate',
            gradient: 'from-slate-800 to-slate-900',
            border: 'border-slate-700',
            buttonText: isAr ? 'الخطة الحالية' : 'Current Plan',
            isCurrent: true,
            features: [
                isAr ? 'وصول محدود لأصوات Azure' : 'Limited access to Azure voices',
                isAr ? 'رصيد يومي (زائر)' : 'Daily character limit',
                isAr ? 'تصدير بصيغة MP3' : 'MP3 Export',
                isAr ? 'الإعدادات الصوتية الأساسية' : 'Basic Audio Settings'
            ]
        },
        {
            id: 'friend',
            title: isAr ? 'صديق صوتلي' : 'Sawtli Friend',
            subtitle: isAr ? 'للتجربة المريحة مع الأصدقاء' : 'Casual usage for friends',
            icon: <VideoCameraIcon className="w-8 h-8 text-amber-400" />,
            color: 'amber',
            gradient: 'from-amber-900/40 to-slate-900',
            border: 'border-amber-500/50',
            buttonText: isAr ? 'تفعيل القسيمة' : 'Redeem Coupon',
            isCurrent: false,
            tierKey: 'gold', // We map UI button to existing flow, actual activation is via coupon
            badge: isAr ? 'محبوب' : 'Popular',
            features: [
                isAr ? 'رصيد 10,000 حرف' : '10,000 Characters Limit',
                isAr ? 'فتح جميع أصوات Gemini Ultra' : 'Unlock ALL Gemini Ultra Voices',
                isAr ? 'استوديو الصوت الكامل (Mixer)' : 'Full Audio Studio (Mixer)',
                isAr ? 'تعدد المتحدثين (2)' : 'Multi-Speaker (2)',
                isAr ? 'تصدير WAV (جودة عالية)' : 'WAV High Quality Export'
            ]
        },
        {
            id: 'beta',
            title: isAr ? 'تجربة النخبة' : 'Elite Beta',
            subtitle: isAr ? 'للمحترفين وصناع المحتوى الجادين' : 'For Pros & Serious Creators',
            icon: <SoundEnhanceIcon className="w-8 h-8 text-purple-400" />,
            color: 'purple',
            gradient: 'from-purple-900/40 to-slate-900',
            border: 'border-purple-500/50',
            buttonText: isAr ? 'انضم للنخبة' : 'Join Elite',
            isCurrent: false,
            tierKey: 'platinum',
            badge: isAr ? 'قوة مضاعفة' : 'Power User',
            features: [
                isAr ? 'رصيد 50,000 حرف' : '50,000 Characters Limit',
                isAr ? 'كل ميزات الصديق +' : 'All Friend Features +',
                isAr ? 'تعدد المتحدثين (3)' : 'Multi-Speaker (3)',
                isAr ? 'دعم فني مباشر' : 'Priority Support',
                isAr ? 'فترة صلاحية أطول' : 'Extended Duration'
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 animate-fade-in-down backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-6xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header Section */}
                <div className="text-center mb-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-xl">
                        {isAr ? 'مستقبل الصوت يبدأ هنا' : 'The Future of Audio Starts Here'}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
                        {isAr 
                            ? 'نحن نبني مجتمعاً من المبدعین. الخطط الحالية مخصصة للتجربة والاستخدام العادل.' 
                            : 'We are building a community of creators. Current plans are designed for fair trial usage.'}
                    </p>
                    
                    <button onClick={onClose} className="absolute top-0 right-0 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full border border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto px-2 pb-4 custom-scrollbar">
                    {cards.map((card) => (
                        <div 
                            key={card.id} 
                            className={`relative rounded-3xl p-1 bg-gradient-to-b ${card.gradient} transition-transform duration-300 hover:-translate-y-2 group`}
                        >
                            {/* Glow Effect */}
                            <div className={`absolute inset-0 bg-${card.color}-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`}></div>

                            {/* Card Content */}
                            <div className={`relative h-full bg-[#0f172a] rounded-[22px] border ${card.border} p-6 flex flex-col`}>
                                
                                {card.badge && (
                                    <div className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-${card.color}-900/50 text-${card.color}-300 border border-${card.color}-500/30`}>
                                        {card.badge}
                                    </div>
                                )}

                                <div className={`w-14 h-14 rounded-2xl bg-${card.color}-900/30 flex items-center justify-center mb-6 border border-${card.color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    {card.icon}
                                </div>

                                <h3 className={`text-2xl font-bold text-white mb-1 group-hover:text-${card.color}-400 transition-colors`}>{card.title}</h3>
                                <p className="text-sm text-slate-400 font-medium mb-6 min-h-[40px]">{card.subtitle}</p>

                                <div className="space-y-4 mb-8 flex-grow">
                                    {card.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className={`w-5 h-5 rounded-full bg-${card.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                                <CheckIcon className={`w-3 h-3 text-${card.color}-400`} />
                                            </div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => !card.isCurrent && card.tierKey ? handleJoinWaitlist(card.tierKey as any, card.id) : onClose()}
                                    disabled={card.isCurrent}
                                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2
                                        ${card.isCurrent 
                                            ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700' 
                                            : `bg-gradient-to-r from-${card.color}-600 to-${card.color}-500 hover:from-${card.color}-500 hover:to-${card.color}-400 text-white shadow-${card.color}-500/20 hover:shadow-${card.color}-500/40 active:scale-95`
                                        }`}
                                >
                                    {processing === card.id ? <LoaderIcon className="w-4 h-4"/> : (
                                        <>
                                            {!card.isCurrent && <SparklesIcon className="w-4 h-4" />}
                                            {card.buttonText}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
                        {isAr 
                            ? 'نحن نلتزم بتقديم تجربة عادلة وممتعة. إذا كان لديك كود تفعيل (قسيمة)، يمكنك استخدامه في صفحة الحساب لترقية خطتك فوراً.'
                            : 'We are committed to providing a fair and enjoyable experience. If you have a coupon code, use it in the Account page to upgrade instantly.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
