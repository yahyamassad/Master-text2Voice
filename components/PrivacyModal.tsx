
import React from 'react';
import { t, Language } from '../i18n/translations';
import { LockIcon } from './icons';

interface PrivacyModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose, uiLanguage }) => {
    const isAr = uiLanguage === 'ar';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <LockIcon className="text-cyan-400 w-6 h-6" />
                        {isAr ? 'الخصوصية وشروط الاستخدام' : 'Privacy & Terms'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className={`overflow-y-auto pr-2 space-y-6 text-slate-300 leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                    
                    <section>
                        <h4 className="text-cyan-400 font-bold mb-2">{isAr ? '1. مقدمة' : '1. Introduction'}</h4>
                        <p className="text-sm opacity-80">
                            {isAr 
                                ? 'مرحباً بك في Sawtli. نحن نأخذ خصوصيتك على محمل الجد. تشرح هذه الوثيقة كيفية تعاملنا مع بياناتك عند استخدامك لمنصتنا الصوتية المعتمدة على الذكاء الاصطناعي.'
                                : 'Welcome to Sawtli. We take your privacy seriously. This document explains how we handle your data when you use our AI-powered audio platform.'}
                        </p>
                    </section>

                    <section>
                        <h4 className="text-cyan-400 font-bold mb-2">{isAr ? '2. البيانات التي نجمعها' : '2. Data We Collect'}</h4>
                        <ul className="list-disc list-inside text-sm opacity-80 space-y-1">
                            <li>{isAr ? 'معلومات الحساب (الاسم، البريد الإلكتروني) عبر Google Firebase.' : 'Account information (Name, Email) via Google Firebase.'}</li>
                            <li>{isAr ? 'النصوص التي تدخلها للمعالجة والترجمة.' : 'Text inputs provided for processing and translation.'}</li>
                            <li>{isAr ? 'سجل الاستخدام (عدد الأحرف المستهلكة) لأغراض حساب الحصص.' : 'Usage logs (character count) for quota tracking.'}</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-cyan-400 font-bold mb-2">{isAr ? '3. معالجة الذكاء الاصطناعي' : '3. AI Processing'}</h4>
                        <p className="text-sm opacity-80">
                            {isAr 
                                ? 'نحن نستخدم واجهة برمجة تطبيقات Google Gemini لمعالجة النصوص وتوليد الصوت. يتم إرسال بياناتك النصية بأمان إلى خوادم Google للمعالجة فقط ولا يتم تخزينها من قبلنا لأغراض تدريب النماذج.'
                                : 'We use Google Gemini API for text processing and speech generation. Your text data is securely transmitted to Google servers for processing only and is not stored by us for model training purposes.'}
                        </p>
                    </section>

                    <section>
                        <h4 className="text-cyan-400 font-bold mb-2">{isAr ? '4. أمن المعلومات' : '4. Security'}</h4>
                        <p className="text-sm opacity-80">
                            {isAr 
                                ? 'نحن نطبق معايير أمان عالية. جميع الاتصالات مشفرة باستخدام SSL. يتم إدارة المصادقة بواسطة بنية تحتية آمنة من Google.'
                                : 'We implement high security standards. All communications are SSL encrypted. Authentication is managed by secure Google infrastructure.'}
                        </p>
                    </section>

                    <section>
                        <h4 className="text-cyan-400 font-bold mb-2">{isAr ? '5. حقوق المستخدم' : '5. User Rights'}</h4>
                        <p className="text-sm opacity-80">
                            {isAr 
                                ? 'لديك الحق الكامل في حذف حسابك وجميع بياناتك المسجلة (السجلات) في أي وقت من خلال لوحة إعدادات الحساب.'
                                : 'You have the full right to delete your account and all recorded data (history) at any time via the Account Settings panel.'}
                        </p>
                    </section>

                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors text-sm border border-slate-600">
                        {isAr ? 'فهمت ذلك' : 'I Understand'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;
