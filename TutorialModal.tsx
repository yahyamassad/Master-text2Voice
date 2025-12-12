
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { VideoCameraIcon, SawtliLogoIcon, ChevronDownIcon, SpeakerIcon, SoundEnhanceIcon, DownloadIcon, TranslateIcon } from './icons';

interface TutorialModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, uiLanguage }) => {
    const [activeStep, setActiveStep] = useState<number | null>(null);

    const toggleStep = (index: number) => {
        setActiveStep(activeStep === index ? null : index);
    };

    const steps = [
        {
            title: t('tutStep1Title', uiLanguage),
            icon: <TranslateIcon className="w-6 h-6 text-cyan-400" />,
            content: (
                <div className="space-y-2">
                    <p className="font-bold mb-1">{t('tutStep1Intro', uiLanguage)}</p>
                    <ul className="space-y-1">
                        <li className="font-semibold text-cyan-300">{t('tutStep1Input', uiLanguage)}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{t('tutStep1List1', uiLanguage)}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{t('tutStep1List2', uiLanguage)}</li>
                    </ul>
                    <ul className="space-y-1 mt-2">
                        <li className="font-semibold text-cyan-300">{t('tutStep1TransTitle', uiLanguage)}</li>
                        <li className="text-slate-300">{t('tutStep1TransText', uiLanguage)}</li>
                    </ul>
                </div>
            )
        },
        {
            title: t('tutStep2Title', uiLanguage),
            icon: <SpeakerIcon className="w-6 h-6 text-amber-400" />,
            content: (
                <div className="space-y-3">
                    <p className="font-bold mb-1">{t('tutStep2Intro', uiLanguage)}</p>
                    <div>
                        <span className="font-semibold text-amber-300">{t('tutStep2Voice', uiLanguage)} </span>
                        <span className="text-slate-300">{uiLanguage === 'ar' ? 'أصوات Gemini HD عالية الدقة.' : 'High-fidelity Gemini HD voices.'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-amber-300">{t('tutStep2Tone', uiLanguage)} </span>
                        <span className="text-slate-300">{uiLanguage === 'ar' ? 'سعيد • حزين • رسمي • افتراضي' : 'Happy • Sad • Formal • Default'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <p className="font-semibold text-amber-300 mb-1">{t('tutStep2MultiTitle', uiLanguage)}</p>
                        <p className="text-xs text-slate-400 mb-2">{t('tutStep2MultiDesc', uiLanguage)}</p>
                        <code className="block bg-black/30 p-2 rounded text-xs font-mono text-green-300 mb-2 whitespace-pre-wrap">
                            {uiLanguage === 'ar' ? 'يزن: مرحباً...\nلانا: أهلاً بك...' : 'John: Hello...\nJane: Hi there...'}
                        </code>
                    </div>
                </div>
            )
        },
        {
            title: t('tutStep3Title', uiLanguage),
            icon: <SawtliLogoIcon className="w-6 h-6" />,
            content: (
                <div className="space-y-2">
                    <p className="text-slate-300">{t('tutStep3Text', uiLanguage)}</p>
                    <ul className="space-y-1">
                        <li className="list-disc list-inside pl-4 text-slate-300">{uiLanguage === 'ar' ? 'توليد سريع وجودة صوت ثابتة' : 'Fast generation & consistent quality'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{uiLanguage === 'ar' ? 'نظام الكاش يحافظ على الرصيد' : 'Smart Cache saves your quota'}</li>
                    </ul>
                </div>
            )
        },
        {
            title: t('tutStep4Title', uiLanguage),
            icon: <SoundEnhanceIcon className="w-6 h-6 text-purple-400" />,
            content: (
                <div className="space-y-3">
                    <p className="font-bold mb-1">{uiLanguage === 'ar' ? 'منطقة الإبداع الحقيقي.' : 'The zone of true creativity.'}</p>
                    <ul className="space-y-1">
                        <li className="font-semibold text-purple-300">{t('tutStep4Mixer', uiLanguage)}</li>
                        <li className="text-xs text-slate-300 leading-relaxed ml-2">
                            {uiLanguage === 'ar' ? 'إضافة موسيقى • تسجيل مايك • موازنة الخلفية' : 'Add music • Record mic • Background balance'}
                        </li>
                    </ul>
                    <div>
                        <span className="font-semibold text-purple-300">{t('tutStep4Ducking', uiLanguage)} </span>
                    </div>
                    <div>
                        <span className="font-semibold text-purple-300">{t('tutStep4Effects', uiLanguage)} </span>
                        <span className="text-slate-300 text-xs">EQ-5 Band • Compressor • Reverb</span>
                    </div>
                    <div>
                        <span className="font-semibold text-purple-300">{t('tutStep4Presets', uiLanguage)} </span>
                    </div>
                </div>
            )
        },
        {
            title: t('tutStep5Title', uiLanguage),
            icon: <DownloadIcon className="w-6 h-6 text-green-400" />,
            content: (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="font-semibold text-green-300 block mb-1">{t('tutStep5Formats', uiLanguage)}</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="font-semibold text-green-300 block mb-1">Full Mix / Voice Only</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const handleDownloadPdf = () => {
        const link = document.createElement('a');
        link.href = '/sawtli_guide.pdf';
        link.download = 'Sawtli_User_Guide.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-slate-800/50 p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/20">
                            <VideoCameraIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-wide">
                                {t('tutorialTitle', uiLanguage)}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {uiLanguage === 'ar' ? 'منصتك المتكاملة لإنتاج محتوى صوتي طبيعي' : 'Your complete platform for natural AI voice production'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {/* Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Intro Section */}
                    <div className="text-center space-y-4 py-4">
                        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            {t('tutorialIntroTitle', uiLanguage)}
                        </h2>
                        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed text-lg">
                            {t('tutorialIntroText', uiLanguage)}
                        </p>
                    </div>

                    {/* Steps Accordion */}
                    <div className="space-y-3 max-w-3xl mx-auto">
                        {steps.map((step, index) => (
                            <div 
                                key={index} 
                                className={`border rounded-xl transition-all duration-300 overflow-hidden ${activeStep === index ? 'bg-slate-800/80 border-cyan-500/50 shadow-lg' : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'}`}
                            >
                                <button 
                                    onClick={() => toggleStep(index)}
                                    className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${activeStep === index ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'}`}>
                                            {step.icon}
                                        </div>
                                        <span className={`text-lg font-bold ${activeStep === index ? 'text-white' : 'text-slate-300'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${activeStep === index ? 'rotate-180 text-cyan-400' : ''}`} />
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ${activeStep === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className={`p-4 pt-0 text-slate-300 leading-relaxed text-sm sm:text-base border-t border-slate-700/50 mt-2 mx-4 ${uiLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {step.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-5 flex items-start gap-4 max-w-3xl mx-auto">
                        <div className="bg-blue-500/20 p-2 rounded-full shrink-0">
                            <SawtliLogoIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-200 mb-1">{t('tutorialProTips', uiLanguage)}</h4>
                            <ul className="text-sm text-blue-100/80 leading-relaxed list-disc list-inside">
                                <li>{uiLanguage === 'ar' ? 'متصفح Microsoft Edge يوفر مصادر صوت مجانية عالية الجودة.' : 'Microsoft Edge provides free high-quality voice sources.'}</li>
                                <li>{t('tutorialTip1', uiLanguage)}</li>
                            </ul>
                        </div>
                    </div>

                </div>
                
                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={handleDownloadPdf} 
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-600 flex items-center gap-2 group"
                    >
                        <DownloadIcon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                        {t('downloadGuide', uiLanguage)}
                    </button>
                    
                    <div className="text-center text-[10px] text-slate-500 font-mono sm:ml-auto">
                        {t('footerText', uiLanguage)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
