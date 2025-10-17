import React, { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConfigured } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { t, Language } from '../i18n/translations';
import { StarIcon, LoaderIcon } from './icons';

interface FeedbackProps {
    language: Language;
}

interface FeedbackItem {
    id: string;
    name: string;
    comment: string;
    rating: number;
    createdAt: any; 
}

const formatTimestamp = (timestamp: any, lang: string): string => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    try {
        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
        let interval = seconds / 31536000;
        if (interval > 1) return rtf.format(-Math.floor(interval), 'year');
        interval = seconds / 2592000;
        if (interval > 1) return rtf.format(-Math.floor(interval), 'month');
        interval = seconds / 86400;
        if (interval > 1) return rtf.format(-Math.floor(interval), 'day');
        interval = seconds / 3600;
        if (interval > 1) return rtf.format(-Math.floor(interval), 'hour');
        interval = seconds / 60;
        if (interval > 1) return rtf.format(-Math.floor(interval), 'minute');
        return rtf.format(-Math.floor(seconds), 'second');
    } catch (e) {
        // Fallback for older browsers or environments
        return date.toLocaleDateString(lang);
    }
};


export const Feedback: React.FC<FeedbackProps> = ({ language }) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const feedbackData: FeedbackItem[] = [];
            querySnapshot.forEach((doc) => {
                feedbackData.push({ id: doc.id, ...doc.data() } as FeedbackItem);
            });
            setFeedbacks(feedbackData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching feedback:", err);
            setError(t('feedbackError', language));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [language]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || rating === 0) return;
        
        setIsSubmitting(true);
        setSubmitStatus(null);
        
        try {
            await addDoc(collection(db, 'feedback'), {
                name: name.trim() || 'Anonymous',
                comment: comment.trim(),
                rating: rating,
                createdAt: serverTimestamp()
            });
            setName('');
            setComment('');
            setRating(0);
            setSubmitStatus({ type: 'success', message: t('feedbackSuccess', language) });
        } catch (err) {
            console.error("Error submitting feedback:", err);
            setSubmitStatus({ type: 'error', message: t('feedbackError', language) });
        } finally {
            setIsSubmitting(false);
             setTimeout(() => setSubmitStatus(null), 4000);
        }
    };

    const firebaseEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_MEASUREMENT_ID',
    ];

    if (!isFirebaseConfigured) {
        return (
            <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300">
                <h3 className="text-lg font-bold text-center">{t('feedbackConfigNeededTitle', language)}</h3>
                <p className="mt-2 text-center text-yellow-400">{t('feedbackConfigNeededBody_part1', language)}</p>
                <div className="my-4 p-3 bg-slate-900 rounded-md text-sm font-mono text-cyan-300 ltr:text-left rtl:text-right">
                    {firebaseEnvVars.map(v => <div key={v}>{v}</div>)}
                </div>
                <p className="text-center text-yellow-400">
                    {t('feedbackConfigNeededBody_part2', language)}
                    {' '}
                    <a 
                        href="https://firebase.google.com/docs/web/setup#add-sdk-and-initialize" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-cyan-400"
                    >
                        {t('feedbackConfigNeededLink', language)}
                    </a>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">{t('feedbackTitle', language)}</h2>
                <p className="text-slate-400 mt-1">{t('feedbackSubtitle', language)}</p>
            </div>

            {/* Feedback Form */}
            <div className="bg-slate-700/50 p-6 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('yourName', language)}
                            className="w-full p-3 bg-slate-900/50 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-slate-500"
                            disabled={isSubmitting}
                        />
                         <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300">
                            <span className="font-bold">{t('yourRating', language)}</span>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none"
                                        aria-label={`Rate ${star} stars`}
                                        disabled={isSubmitting}
                                    >
                                        <StarIcon className={`cursor-pointer transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-500'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t('yourComment', language)}
                        required
                        className="w-full h-24 p-3 bg-slate-900/50 border-2 border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-slate-500"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !comment.trim() || rating === 0}
                        className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform active:scale-95"
                    >
                        {isSubmitting ? <LoaderIcon /> : null}
                        <span>{isSubmitting ? t('submittingFeedback', language) : t('submitFeedback', language)}</span>
                    </button>
                    {submitStatus && (
                        <div className={`mt-3 text-center p-2 rounded-lg text-sm ${submitStatus.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {submitStatus.message}
                        </div>
                    )}
                </form>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <LoaderIcon />
                    </div>
                ) : error ? (
                     <div className="text-center p-4 bg-red-500/20 text-red-300 rounded-lg">{error}</div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">{t('noFeedbackYet', language)}</div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {feedbacks.map(item => (
                            <div key={item.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-cyan-400">{item.name}</p>
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className={i < item.rating ? 'text-yellow-400' : 'text-slate-600'} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-300 my-2">{item.comment}</p>
                                <p className="text-xs text-slate-500 text-right">{formatTimestamp(item.createdAt, language)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
