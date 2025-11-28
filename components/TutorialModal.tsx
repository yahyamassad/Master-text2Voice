
import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';
import { VideoCameraIcon, SawtliLogoIcon, ChevronDownIcon, SpeakerIcon, SoundEnhanceIcon, DownloadIcon, TranslateIcon } from './icons';

interface TutorialModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, uiLanguage }) => {
    const isAr = uiLanguage === 'ar';
    const [activeStep, setActiveStep] = useState<number | null>(null);

    const toggleStep = (index: number) => {
        setActiveStep(activeStep === index ? null : index);
    };

    const steps = [
        {
            title: isAr ? '1. كتابة النص والترجمة (Your Canvas)' : '1. Your Canvas & Translation',
            icon: <TranslateIcon className="w-6 h-6 text-cyan-400" />,
            content: isAr 
                ? 'كل مشروع صوتي يبدأ من هنا. اكتب مباشرة، استخدم الإملاء الصوتي، أو الصق نصوصاً جاهزة. للوصول للعالمية، استخدم "الترجمة الذكية" لأكثر من 13 لغة مع إمكانية المقارنة بين النصين.'
                : 'Every project starts here. Type directly, use voice dictation, or paste text. For global reach, use "Smart Translation" for over 13 languages with side-by-side comparison.'
        },
        {
            title: isAr ? '2. هندسة الصوت والمشاعر (Voice Engineering)' : '2. Voice Engineering',
            icon: <SpeakerIcon className="w-6 h-6 text-amber-400" />,
            content: isAr
                ? 'هنا تبدأ الجودة. اختر من أصوات Gemini HD. تحكم بـ "المشاعر" (سعيد، حزين، رسمي). فعل "تعدد المتحدثين" (Multi-Speaker) لإنشاء حوارات واقعية (مثلاً: "يزن: مرحباً...").'
                : 'Quality starts here. Choose Gemini HD voices. Control "Emotions" (Happy, Sad, Formal). Enable "Multi-Speaker" for realistic dialogues (e.g., "John: Hello...").'
        },
        {
            title: isAr ? '3. التوليد والمعاينة (Generate & Preview)' : '3. Generate & Preview',
            icon: <SawtliLogoIcon className="w-6 h-6" />,
            content: isAr
                ? 'اضغط "استمع" وسيقوم النظام بتوليد الصوت في ثوانٍ. يتميز بنظام "الكاش الذكي" حيث أن إعادة التشغيل لا تستهلك رصيدك إذا لم يتغير النص.'
                : 'Click "Listen" and the system generates audio in seconds. Features "Smart Cache" so replaying doesn\'t consume quota if text hasn\'t changed.'
        },
        {
            title: isAr ? '4. استوديو الصوت الاحترافي (Audio Studio)' : '4. Pro Audio Studio',
            icon: <SoundEnhanceIcon className="w-6 h-6 text-purple-400" />,
            content: isAr
                ? 'منطقة الإبداع. أضف خلفية موسيقية، وسيقوم نظام "Auto Ducking" بخفض الموسيقى تلقائياً عند الكلام. استخدم EQ والمؤثرات الصوتية للحصول على جودة سينمائية.'
                : 'The creative zone. Add background music, and "Auto Ducking" will lower it automatically when speech starts. Use EQ and effects for cinematic quality.'
        },
        {
            title: isAr ? '5. التصدير (Export)' : '5. Export',
            icon: <DownloadIcon className="w-6 h-6 text-green-400" />,
            content: isAr
                ? 'اختر الصيغة (MP3 للنشر، WAV للجودة). حدد خيار الدمج (Full Mix أو Voice Only). تحكم في الطول (Trim to Voice لقص الموسيقى مع الصوت تلقائياً).'
                : 'Choose format (MP3 for web, WAV for quality). Select mix mode (Full Mix or Voice Only). Control length (Trim to Voice to auto-cut music).'
        }
    ];

    const handleDownloadPdf = () => {
        // Assumes you placed 'sawtli_guide.pdf' in the public folder
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
                                {isAr ? 'دليل مستخدم صوتلي' : 'Sawtli User Guide'}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {isAr ? 'منصتك المتكاملة لإنتاج محتوى صوتي' : 'Your complete platform for audio production'}
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
                            {isAr ? 'اصنع صوتاً احترافياً في دقائق' : 'Create Professional Voiceovers in Minutes'}
                        </h2>
                        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed text-lg">
                            {isAr 
                                ? 'هذا الدليل يساعدك على البدء بسرعة وتحويل نصوصك إلى تسجيالت احترافية باستخدام أحدث تقنيات الذكاء الاصطناعي.' 
                                : 'This guide helps you get started quickly and turn your text into professional recordings using the latest AI technology.'}
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
                                    className={`overflow-hidden transition-all duration-300 ${activeStep === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className={`p-4 pt-0 text-slate-300 leading-relaxed text-sm sm:text-base border-t border-slate-700/50 mt-2 mx-4 ${isAr ? 'text-right' : 'text-left'}`}>
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
                            <h4 className="font-bold text-blue-200 mb-1">{isAr ? 'نصيحة للمحترفين' : 'Pro Tip'}</h4>
                            <p className="text-sm text-blue-100/80 leading-relaxed">
                                {isAr 
                                    ? 'استخدم متصفح Microsoft Edge للحصول على مصادر صوت مجانية عالية الجودة تدعمها المنصة بشكل طبيعي.'
                                    : 'Use Microsoft Edge browser for access to high-quality free voice sources supported natively by the platform.'}
                            </p>
                        </div>
                    </div>

                </div>
                
                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={handleDownloadPdf} 
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-600 flex items-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        {isAr ? 'تحميل الدليل (PDF)' : 'Download Guide (PDF)'}
                    </button>
                    
                    <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95">
                        {isAr ? 'ابدأ الآن' : 'Start Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
