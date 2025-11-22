
import React, { useState, useRef } from 'react';
import { t, Language } from '../i18n/translations';
import { LoaderIcon, CheckIcon, WarningIcon } from './icons';
import { User } from 'firebase/auth';

interface ReportModalProps {
    onClose: () => void;
    uiLanguage: Language;
    user: User | null;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, uiLanguage, user }) => {
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Map issue types keys to translation keys
    const issueTypes = [
        'issueOriginalAudio',
        'issueTranslatedAudio',
        'issueTranslation',
        'issueGeminiVoices',
        'issueSystemVoices',
        'issueVoicePreview',
        'issuePauses',
        'issueSpeed',
        'issueMultiSpeaker',
        'issueInterfaceLanguage',
        'issueSpeechSettings',
        'issueHistory',
        'issueShareLink',
        'issueDownload',
        'issueAudioStudio',
        'issueComments',
        'issueOther'
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                setSubmitStatus({ type: 'error', message: t('errorFileTooLarge', uiLanguage) });
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshot(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueType || !description.trim()) return;

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const reportData = {
                issueType,
                description: description.trim(),
                screenshot,
                userUid: user?.uid || 'anonymous',
                userAgent: navigator.userAgent,
                url: window.location.href,
            };

            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }

            setSubmitStatus({ type: 'success', message: t('reportSuccess', uiLanguage) });
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Report submission error:", error);
            setSubmitStatus({ type: 'error', message: t('reportError', uiLanguage) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('reportProblem', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {t('issueType', uiLanguage)}
                        </label>
                        <div className="relative">
                            <select
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                                className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg appearance-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200"
                                required
                            >
                                <option value="" disabled className="bg-slate-800 text-slate-400">{t('selectIssueType', uiLanguage)}</option>
                                {issueTypes.map((type) => (
                                    <option key={type} value={type} className="bg-slate-800 text-white hover:bg-slate-700">
                                        {t(type as any, uiLanguage)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {t('issueDescription', uiLanguage)}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('describeIssue', uiLanguage)}
                            className="w-full h-32 p-3 bg-slate-900/50 border border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 placeholder-slate-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {t('screenshotOptional', uiLanguage)}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
                            >
                                {t('chooseFile', uiLanguage)}
                            </button>
                            <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                {screenshot ? t('fileSelected', uiLanguage) : t('noFileChosen', uiLanguage)}
                            </span>
                        </div>
                        {screenshot && (
                             <div className="mt-2 relative w-20 h-20 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                                 <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                                 <button 
                                    type="button"
                                    onClick={() => { setScreenshot(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"
                                 >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                 </button>
                             </div>
                        )}
                    </div>

                    {submitStatus && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${submitStatus.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            {submitStatus.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <WarningIcon className="w-5 h-5" />}
                            <span>{submitStatus.message}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isSubmitting && <LoaderIcon />}
                        <span>{t('sendReport', uiLanguage)}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
