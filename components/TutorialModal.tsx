
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
            title: isAr ? '1️⃣ كتابة النص والترجمة – Your Canvas' : '1. Text & Translation – Your Canvas',
            icon: <TranslateIcon className="w-6 h-6 text-cyan-400" />,
            content: (
                <div className="space-y-2">
                    <p className="font-bold mb-1">{isAr ? 'كل مشروع صوتي يبدأ من هنا:' : 'Every project starts here:'}</p>
                    <ul className="space-y-1">
                        <li className="font-semibold text-cyan-300">{isAr ? '✔ طرق إدخال النص:' : '✔ Input Methods:'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{isAr ? 'كتابة مباشرة داخل مربع النص' : 'Type directly into the text box'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{isAr ? 'الإملاء الصوتي عبر المايكروفون' : 'Voice dictation via microphone'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{isAr ? 'لصق نصوص جاهزة من مصادر خارجية' : 'Paste text from external sources'}</li>
                    </ul>
                    <ul className="space-y-1 mt-2">
                        <li className="font-semibold text-cyan-300">{isAr ? '✔ الترجمة الذكية:' : '✔ Smart Translation:'}</li>
                        <li className="text-slate-300">{isAr ? 'اختر اللغة الهدف من بين 13 لغة مدعومة، واضغط “ترجمة”. يمكنك الاستماع للنص الأصلي والمترجم للمقارنة.' : 'Select target language from 13+ supported languages and click "Translate". You can listen to both for comparison.'}</li>
                    </ul>
                </div>
            )
        },
        {
            title: isAr ? '2️⃣ اختيار الصوت وتخصيص المشاعر – Voice Engineering' : '2. Voice Selection & Engineering',
            icon: <SpeakerIcon className="w-6 h-6 text-amber-400" />,
            content: (
                <div className="space-y-3">
                    <p className="font-bold mb-1">{isAr ? 'هنا تبدأ الجودة:' : 'Where quality begins:'}</p>
                    <div>
                        <span className="font-semibold text-amber-300">{isAr ? '✔ اختر الصوت المناسب:' : '✔ Select Voice:'} </span>
                        <span className="text-slate-300">{isAr ? 'عدة أصوات عالية الدقة مدعومة بتقنية Gemini HD.' : 'High-fidelity voices powered by Gemini HD.'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-amber-300">{isAr ? '✔ التحكم بالمشاعر (Emotional Tone):' : '✔ Emotional Tone:'} </span>
                        <span className="text-slate-300">{isAr ? 'سعيد • حزين • رسمي • افتراضي' : 'Happy • Sad • Formal • Default'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <p className="font-semibold text-amber-300 mb-1">{isAr ? '✔ تعدد المتحدثين – Multi-Speaker' : '✔ Multi-Speaker'}</p>
                        <p className="text-xs text-slate-400 mb-2">{isAr ? 'اكتب الحوار بهذا الشكل:' : 'Write dialogue like this:'}</p>
                        <code className="block bg-black/30 p-2 rounded text-xs font-mono text-green-300 mb-2 whitespace-pre-wrap">
                            {isAr ? 'يزن: مرحباً...\nلانا: أهلاً بك...' : 'John: Hello...\nJane: Hi there...'}
                        </code>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {isAr 
                                ? 'يمكنك تعديل الأسماء وفق اختيارك، المهم أن تتوافق مع الإعدادات متبوعة بـ (:). للتحكم بالتوقف، اترك سطراً فارغاً. أضف مؤثرات مثل [ضحكة]، [سعلة].'
                                : 'Ensure names match settings followed by a colon (:). Use empty lines for pauses. Add effects like [laugh], [cough].'}
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: isAr ? '3️⃣ التوليد والمعاينة – Generate & Preview' : '3. Generate & Preview',
            icon: <SawtliLogoIcon className="w-6 h-6" />,
            content: (
                <div className="space-y-2">
                    <p className="text-slate-300">{isAr ? 'اضغط “استمع للنص” لبدء التوليد.' : 'Click "Listen" to start generation.'}</p>
                    <ul className="space-y-1">
                        <li className="font-semibold text-blue-300">{isAr ? '✔ مميزات مهمة:' : '✔ Key Features:'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{isAr ? 'توليد سريع وجودة صوت ثابتة' : 'Fast generation & consistent quality'}</li>
                        <li className="list-disc list-inside pl-4 text-slate-300">{isAr ? '“نظام الكاش”: إعادة التشغيل لا تستهلك الرصيد إن لم يتغير النص' : '"Smart Cache": Replay doesn\'t consume quota if text hasn\'t changed'}</li>
                    </ul>
                </div>
            )
        },
        {
            title: isAr ? '4️⃣ استوديو الصوت الاحترافي – Audio Studio 🎛️' : '4. Pro Audio Studio 🎛️',
            icon: <SoundEnhanceIcon className="w-6 h-6 text-purple-400" />,
            content: (
                <div className="space-y-3">
                    <p className="font-bold mb-1">{isAr ? 'منطقة الإبداع الحقيقي.' : 'The zone of true creativity.'}</p>
                    <ul className="space-y-1">
                        <li className="font-semibold text-purple-300">{isAr ? '✔ المكسر – Mixer' : '✔ Mixer'}</li>
                        <li className="text-xs text-slate-300 leading-relaxed ml-2">
                            {isAr ? 'إضافة موسيقى • إضافة ملف صوتي • تسجيل مايك • التحكم بالارتفاع • موازنة الخلفية' : 'Add music • Add voice file • Record mic • Volume control • Background balance'}
                        </li>
                        <li className="text-xs text-slate-400 italic ml-2">{isAr ? '(الصوت المولد من النص يظهر هنا تلقائياً)' : '(Generated TTS audio appears here automatically)'}</li>
                    </ul>
                    <div>
                        <span className="font-semibold text-purple-300">{isAr ? '✔ الخفوت التلقائي – Auto Ducking: ' : '✔ Auto Ducking: '}</span>
                        <span className="text-slate-300 text-xs">{isAr ? 'انخفاض موسيقى تلقائي عند الكلام (مثل الراديو).' : 'Music lowers automatically when speech starts.'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-purple-300">{isAr ? '✔ المؤثرات – Effects: ' : '✔ Effects: '}</span>
                        <span className="text-slate-300 text-xs">EQ-5 Band • Compressor • Reverb</span>
                    </div>
                    <div>
                        <span className="font-semibold text-purple-300">{isAr ? '✔ الإعدادات الجاهزة – Presets: ' : '✔ Presets: '}</span>
                        <span className="text-slate-300 text-xs">{isAr ? 'بودكاست – سينما – يوتيوب – إعلان' : 'Podcast – Cinema – YouTube – Ad'}</span>
                    </div>
                </div>
            )
        },
        {
            title: isAr ? '5️⃣ التصدير – Export' : '5. Export',
            icon: <DownloadIcon className="w-6 h-6 text-green-400" />,
            content: (
                <div className="space-y-2">
                    <p className="font-bold mb-1">{isAr ? 'اختر طريقة إخراج المشروع:' : 'Choose your output:'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="font-semibold text-green-300 block mb-1">{isAr ? '✔ الصيغ:' : '✔ Formats:'}</span>
                            <div className="text-slate-300">MP3 <span className="opacity-50">({isAr ? 'للنشر' : 'Web'})</span></div>
                            <div className="text-slate-300">WAV <span className="opacity-50">({isAr ? 'استوديو' : 'Studio'})</span></div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="font-semibold text-green-300 block mb-1">{isAr ? '✔ الدمج:' : '✔ Mix:'}</span>
                            <div className="text-slate-300">Full Mix</div>
                            <div className="text-slate-300">Voice Only</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="font-semibold text-green-300 block mb-1">{isAr ? '✔ الطول:' : '✔ Length:'}</span>
                            <div className="text-slate-300">Trim to Voice</div>
                            <div className="text-slate-300">Full Length</div>
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
                                {isAr ? 'دليل مستخدم صوتلي' : 'Sawtli User Guide'}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {isAr ? 'منصتك المتكاملة لإنتاج محتوى صوتي طبيعي' : 'Your complete platform for natural AI voice production'}
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
                            SAWTLI
                        </h2>
                        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed text-lg">
                            {isAr 
                                ? 'مرحباً بك في صوتلي — منصتك المتكاملة لإنتاج محتوى صوتي طبيعي باستخدام أحدث تقنيات الذكاء الاصطناعي. هذا الدليل يساعدك على البدء بسرعة وتحويل نصوصك إلى تسجيلات احترافية خلال دقائق.' 
                                : 'Welcome to Sawtli — Your all-in-one platform for producing natural voiceovers using the latest AI technologies. This guide helps you get started quickly and turn your scripts into professional recordings in minutes.'}
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
                            <h4 className="font-bold text-blue-200 mb-1">{isAr ? '💡 نصائح احترافية' : '💡 Pro Tips'}</h4>
                            <ul className="text-sm text-blue-100/80 leading-relaxed list-disc list-inside">
                                <li>{isAr ? 'متصفح Microsoft Edge يوفر مصادر صوت مجانية عالية الجودة.' : 'Microsoft Edge provides free high-quality voice sources.'}</li>
                                <li>{isAr ? 'السجلات تحفظ كل أعمالك تلقائيًا.' : 'History automatically saves all your work.'}</li>
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
                        {isAr ? 'تحميل الدليل (PDF)' : 'Download Guide (PDF)'}
                    </button>
                    
                    <div className="text-center text-[10px] text-slate-500 font-mono sm:ml-auto">
                        {isAr ? 'صوتلي © 2025 — صوتك، ذكاؤنا.' : 'Sawtli © 2025 — Your Voice, Our Intelligence.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
