import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { t, Language } from '../i18n/translations';
import { StarIcon, LoaderIcon, CopyIcon, ExternalLinkIcon, ChevronDownIcon } from './icons';

interface FeedbackProps {
    language: Language;
}

interface FeedbackItem {
    id: string;
    name: string;
    comment: string;
    rating: number;
    createdAt: number | null; // Represents milliseconds from epoch
}

const formatTimestamp = (timestamp: number | null, lang: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
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
        return date.toLocaleDateString(lang);
    }
};

const Feedback: React.FC<FeedbackProps> = ({ language }) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFeedbackConfigured, setIsFeedbackConfigured] = useState(true); // Assume configured until checked

    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchFeedbacks = useCallback(() => {
        setIsLoading(true);
        fetch('/api/feedback')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.configured === false) {
                    setIsFeedbackConfigured(false);
                } else {
                    setIsFeedbackConfigured(true);
                    setFeedbacks(data.feedbacks || []);
                }
            })
            .catch(err => {
                console.error("Error fetching feedback:", err);
                setError(t('feedbackError', language));
                setIsFeedbackConfigured(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [language]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || rating === 0) return;
        
        setIsSubmitting(true);
        setSubmitStatus(null);
        
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), comment: comment.trim(), rating }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server responded with an error');
            }

            // After successful submission, fetch the latest feedbacks to get the server-confirmed list
            fetchFeedbacks();

            setName('');
            setComment('');
            setRating(0);
            setSubmitStatus({ type: 'success', message: t('feedbackSuccess', language) });

        } catch (err: any) {
            console.error("Error submitting feedback:", err);
            setSubmitStatus({ type: 'error', message: err.message || t('feedbackError', language) });
        } finally {
            setIsSubmitting(false);
             setTimeout(() => setSubmitStatus(null), 4000);
        }
    };
    
    // The setup guide has been moved to a global, non-intrusive component.
    // This component will now just show a disabled state.
    if (!isFeedbackConfigured) {
        return null; // Don't render the feedback section at all if not configured.
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
                                    <p className="font-bold text-cyan-400">{item.name || 'Anonymous'}</p>
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

export default Feedback;
