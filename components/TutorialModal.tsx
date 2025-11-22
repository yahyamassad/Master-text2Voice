
import React from 'react';
import { t, Language } from '../i18n/translations';
import { VideoCameraIcon } from './icons';

interface TutorialModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, uiLanguage }) => {
    const isRtl = uiLanguage === 'ar';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <VideoCameraIcon className="w-6 h-6 text-cyan-400" />
                        <h3 className="text-xl font-semibold text-white">
                            {uiLanguage === 'ar' ? 'دليل الاستخدام' : 'How to use Sawtli'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label={t('closeButton', uiLanguage)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* Video Placeholder */}
                    <div className="aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-500 border border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                        <VideoCameraIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium z-10">Video Coming Soon</p>
                        {/* In future: <iframe src="..." className="absolute inset-0 w-full h-full" ... /> */}
                    </div>

                    {/* Text Guide */}
                    <div className={`space-y-4 text-slate-300 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <div>
                            <h4 className="text-cyan-400 font-bold mb-1">1. {uiLanguage === 'ar' ? 'اختر اللغة والنص' : 'Select Language & Text'}</h4>
                            <p className="text-sm">{uiLanguage === 'ar' 
                                ? 'اكتب النص في المربع، أو استخدم الميكروفون للإملاء الصوتي. اختر لغتك المفضلة.' 
                                : 'Type your text in the box, or use the microphone for voice typing. Select your preferred language.'}</p>
                        </div>
                        <div>
                            <h4 className="text-cyan-400 font-bold mb-1">2. {uiLanguage === 'ar' ? 'اختر الصوت المثالي' : 'Choose the Perfect Voice'}</h4>
                            <p className="text-sm">{uiLanguage === 'ar' 
                                ? 'اضغط على "إعدادات النطق" لاختيار أصوات Gemini عالية الجودة. يمكنك تعديل السرعة والنبرة العاطفية.' 
                                : 'Click "Speech Settings" to choose high-quality Gemini voices. You can adjust speed and emotional tone.'}</p>
                        </div>
                        <div>
                            <h4 className="text-cyan-400 font-bold mb-1">3. {uiLanguage === 'ar' ? 'استمع وحمل' : 'Listen & Download'}</h4>
                            <p className="text-sm">{uiLanguage === 'ar' 
                                ? 'اضغط "استمع" لتوليد الصوت. بمجرد أن يعجبك، اضغط "تحميل" لحفظه كملف MP3.' 
                                : 'Click "Listen" to generate audio. Once you like it, click "Download" to save as MP3.'}</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full transition-colors">
                        {uiLanguage === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
