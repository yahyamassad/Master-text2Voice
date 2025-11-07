import React, { useState, useEffect, useCallback } from 'react';
import { getFirebase } from '../firebaseConfig';
import { t, Language } from '../i18n/translations';
import { StarIcon, LoaderIcon, CopyIcon, ExternalLinkIcon, ChevronDownIcon } from './icons';
// MODERNIZATION: Switched to Firebase v9 modular imports for better performance and to fix runtime loading errors.
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';


interface FeedbackProps {
    language: Language;
}

interface FeedbackItem {
    id: string;
    name: string;
    comment: string;
    rating: number;
    // STABILITY FIX: Use v9 modular Timestamp type.
    createdAt: Timestamp; 
}

const formatTimestamp = (timestamp: Timestamp | null, lang: string): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
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


const Feedback: React.FC<FeedbackProps> = ({ language }) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [varsCopyButtonText, setVarsCopyButtonText] = useState(t('firebaseSetupCopyButton', language));
    const [rulesCopyButtonText, setRulesCopyButtonText] = useState(t('firebaseSetupCopyButton', language));

    // Call getFirebase() once at the top of the component to get the instance and status.
    const { db, isFirebaseConfigured } = getFirebase();

    useEffect(() => {
        // Use the db and isFirebaseConfigured variables from the call above.
        if (!isFirebaseConfigured || !db) {
            setIsLoading(false);
            return;
        }
        
        // Use v9 modular functions for Firestore
        const feedbackCollectionRef = collection(db, 'feedback');
        const q = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));

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
    }, [language, db, isFirebaseConfigured]); // Add db and isFirebaseConfigured to dependency array.

    useEffect(() => {
      setVarsCopyButtonText(t('firebaseSetupCopyButton', language));
      setRulesCopyButtonText(t('firebaseSetupCopyButton', language));
    }, [language]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // The `db` instance is already available from the getFirebase() call.
        if (!comment.trim() || rating === 0 || !db) return;
        
        setIsSubmitting(true);
        setSubmitStatus(null);
        
        try {
            // Use v9 modular functions for Firestore
            const feedbackCollectionRef = collection(db, 'feedback');
            await addDoc(feedbackCollectionRef, {
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
    
    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback/{feedbackId} {
      allow read, create: if true;
      allow update, delete: if false;
    }
  }
}`;

    const handleCopy = (textToCopy: string, buttonType: 'vars' | 'rules') => {
        navigator.clipboard.writeText(textToCopy);
        if(buttonType === 'vars') {
            setVarsCopyButtonText(t('firebaseSetupCopiedButton', language));
            setTimeout(() => setVarsCopyButtonText(t('firebaseSetupCopyButton', language)), 2000);
        } else if (buttonType === 'rules') {
            setRulesCopyButtonText(t('firebaseSetupCopiedButton', language));
            setTimeout(() => setRulesCopyButtonText(t('firebaseSetupCopyButton', language)), 2000);
        }
    };

    // Use the `isFirebaseConfigured` variable from the top-level call.
    if (!isFirebaseConfigured) {
        return (
            <div className="p-4 sm:p-6 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-cyan-400">{t('feedbackConfigNeededTitle', language)}</h3>
                    <p className="mt-2 text-slate-400">{t('feedbackConfigNeededBody', language)}</p>
                </div>
                <div className="mt-4 border-t border-slate-600 pt-4">
                     <button 
                        onClick={() => setIsGuideOpen(!isGuideOpen)} 
                        className="w-full flex justify-between items-center text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                    >
                        <span className="font-bold">{t('firebaseSetupGuideTitle', language)}</span>
                        <ChevronDownIcon className={`transform transition-transform duration-300 ${isGuideOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isGuideOpen && (
                        <div className="mt-4 space-y-4 animate-fade-in text-sm">
                            {/* Step 1 */}
                            <div className="p-3 bg-slate-900/50 rounded-md">
                                <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep1Title', language)}</h4>
                                <p className="mt-1 text-slate-400">{t('firebaseSetupStep1Body', language)}</p>
                                <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1 bg-cyan-600 text-white rounded-md text-xs hover:bg-cyan-500 transition-colors">
                                    {t('firebaseSetupStep1Button', language)} <ExternalLinkIcon />
                                </a>
                            </div>
                            {/* Step 2 */}
                             <div className="p-3 bg-slate-900/50 rounded-md">
                                <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep2Title', language)}</h4>
                                <p className="mt-1 text-slate-400">{t('firebaseSetupStep2Body', language)}</p>
                            </div>
                            {/* Step 3 */}
                            <div className="p-3 bg-slate-900/50 rounded-md">
                                <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep3Title', language)}</h4>
                                <p className="mt-1 text-slate-400">{t('firebaseSetupStep3Body', language)}</p>
                                <div dir="ltr" className="relative my-3 p-3 bg-slate-900 rounded-md font-mono text-cyan-300 text-left">
                                    <pre className="whitespace-pre-wrap"><code>{firebaseEnvVars.join('\n')}</code></pre>
                                    <button onClick={() => handleCopy(firebaseEnvVars.join('\n'), 'vars')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                                        <CopyIcon /> {varsCopyButtonText}
                                    </button>
                                </div>
                            </div>
                             {/* Step 4 */}
                            <div className="p-3 bg-slate-900/50 rounded-md">
                                <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep4Title', language)}</h4>
                                <p className="mt-1 text-slate-400">{t('firebaseSetupStep4Body', language)}</p>
                                <div dir="ltr" className="relative my-3 p-3 bg-slate-900 rounded-md font-mono text-xs text-yellow-300 text-left">
                                    <pre className="whitespace-pre-wrap"><code>{firestoreRules}</code></pre>
                                    <button onClick={() => handleCopy(firestoreRules, 'rules')} className="absolute top-2 right-2 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 flex items-center gap-1">
                                      <CopyIcon /> {rulesCopyButtonText}
                                    </button>
                                </div>
                            </div>
                            {/* Step 5 */}
                             <div className="p-3 bg-slate-900/50 rounded-md">
                                <h4 className="font-bold text-cyan-400">{t('firebaseSetupStep5Title', language)}</h4>
                                <p className="mt-1 text-slate-400">{t('firebaseSetupStep5Body', language)}</p>
                            </div>
                        </div>
                    )}
                </div>
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

export default Feedback;