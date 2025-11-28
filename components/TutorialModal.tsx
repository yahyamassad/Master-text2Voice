
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
            title: isAr ? '1. النص والترجمة' : '1. Your Text & Translation',
            icon: <TranslateIcon className="w-6 h-6 text-cyan-400" />,
            content: isAr 
                ? 'البداية من هنا. اكتب نصك مباشرة، أو استخدم الميكروفون للإملاء الصوتي. هل تريد استهداف جمهور عالمي؟ استخدم ميزة الترجمة الفورية لأكثر من 13 لغة، وقم بالتبديل بين اللغات بلمسة زر.'
                : 'Start here. Type your text directly, or use the microphone for voice typing. Want to reach a global audience? Use the instant translation feature for over 13 languages, and swap languages with a single click.'
        },
        {
            title: isAr ? '2. هندسة الصوت والمشاعر' : '2. Voice Engineering',
            icon: <SpeakerIcon className="w-6 h-6 text-amber-400" />,
            content: isAr
                ? 'اختر "شخصية" وليس مجرد صوت. توفر لك أصوات Gemini HD تحكماً دقيقاً: اختر "سعيد" لإعلان حيوي، أو "رسمي" للأخبار. يمكنك أيضاً تفعيل "تعدد المتحدثين" لإنشاء حوارات واقعية بين شخصيتين (مثلاً: "يزن: مرحباً... لانا: أهلاً").'
                : 'Choose a "persona", not just a voice. Gemini HD voices offer precise control: select "Happy" for lively ads, or "Formal" for news. You can also enable "Multi-Speaker" to create realistic dialogues between two characters.'
        },
        {
            title: isAr ? '3. التوليد والمعاينة' : '3. Generate & Listen',
            icon: <SawtliLogoIcon className="w-6 h-6" />,
            content: isAr
                ? 'في ثوانٍ، يتحول نصك إلى كلام نابض بالحياة. استمع للنتيجة فوراً. إذا لم تعجبك النبرة، غير الإعدادات وأعد التوليد. نظامنا الذكي يحفظ محاولاتك السابقة في "السجلات" للعودة إليها في أي وقت.'
                : 'In seconds, your text transforms into lifelike speech. Listen instantly. If you don\'t like the tone, tweak the settings and regenerate. Our smart system saves your previous attempts in "History" for easy access.'
        },
        {
            title: isAr ? '4. استوديو الصوت الاحترافي' : '4. Pro Audio Studio',
            icon: <SoundEnhanceIcon className="w-6 h-6 text-purple-400" />,
            content: isAr
                ? 'هنا السحر الحقيقي. انتقل للاستوديو لدمج صوتك مع خلفية موسيقية. استخدم "Auto Ducking" لخفض الموسيقى تلقائياً عند الكلام. حسّن الصوت باستخدام EQ وضاغط الصوت (Compressor) للحصول على جودة بث احترافية.'
                : 'Here is the real magic. Enter the Studio to mix your voice with background music. Use "Auto Ducking" to automatically lower music when speech starts. Enhance audio with EQ and Compressor for broadcast-quality results.'
        },
        {
            title: isAr ? '5. التصدير والنشر' : '5. Export & Publish',
            icon: <DownloadIcon className="w-6 h-6 text-green-400" />,
            content: isAr
                ? 'النتيجة النهائية بين يديك. حمل الملف بصيغة MP3 للمشاركة السريعة، أو WAV للجودة الفائقة. يمكنك اختيار تحميل "الصوت فقط" أو "المكس الكامل" مع الموسيقى والمؤثرات.'
                : 'The final result is in your hands. Download as MP3 for quick sharing, or WAV for lossless quality. You can choose to export "Voice Only" or the "Full Mix" with music and effects.'
        }
    ];

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
                                {isAr ? 'دليل استخدام صوتلي' : 'Sawtli User Guide'}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {isAr ? 'أبعد من مجرد تحويل نص إلى كلام' : 'Beyond Text-to-Speech'}
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
                                ? 'حول نصوصك إلى تجارب صوتية تنبض بالحياة باستخدام أحدث تقنيات الذكاء الاصطناعي من Gemini ومحطة عمل صوتية متكاملة.' 
                                : 'Transform your text into lifelike audio experiences using the latest Gemini AI technology and a fully integrated audio workstation.'}
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
                                    ? 'استخدم متصفح Microsoft Edge للحصول على أفضل تجربة وأكثر من 60 صوتاً مجانياً إضافياً يدعمها صوتلي بشكل طبيعي.'
                                    : 'Use Microsoft Edge browser for the best experience and access to over 60 additional free natural voices natively supported by Sawtli.'}
                            </p>
                        </div>
                    </div>

                </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 text-center">
                    <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95">
                        {isAr ? 'ابدأ الإبداع الآن' : 'Start Creating Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
    
