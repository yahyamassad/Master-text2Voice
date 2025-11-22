
import React, { useEffect, useState } from 'react';
import { t, Language } from '../i18n/translations';
import { StarIcon, LoaderIcon } from './icons';

interface TestimonialsModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

interface FeedbackItem {
    id: string;
    name: string;
    comment: string;
    rating: number;
}

const TestimonialsModal: React.FC<TestimonialsModalProps> = ({ onClose, uiLanguage }) => {
    const [testimonials, setTestimonials] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/feedback')
            .then(res => res.ok ? res.json() : { feedbacks: [] })
            .then(data => {
                // Filter only 4 and 5 star ratings
                const highRated = (data.feedbacks || []).filter((f: any) => f.rating >= 4);
                setTestimonials(highRated.slice(0, 10)); // Show top 10
            })
            .catch(() => setTestimonials([]))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-cyan-400">
                        {uiLanguage === 'ar' ? 'ماذا يقول المستخدمون' : 'What Users Say'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label={t('closeButton', uiLanguage)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><LoaderIcon /></div>
                    ) : testimonials.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">
                            {uiLanguage === 'ar' ? 'كن أول من يشاركنا رأيه!' : 'Be the first to share your feedback!'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {testimonials.map((item) => (
                                <div key={item.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-white">{item.name || 'Anonymous'}</span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon key={i} className={i < item.rating ? 'text-yellow-400 w-4 h-4' : 'text-slate-700 w-4 h-4'} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-300 text-sm italic">"{item.comment}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 text-center text-xs text-slate-500">
                    {uiLanguage === 'ar' ? 'يتم عرض التقييمات العالية فقط هنا.' : 'Only top ratings are displayed here.'}
                </div>
            </div>
        </div>
    );
};

export default TestimonialsModal;
