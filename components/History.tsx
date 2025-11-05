import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { t, Language, translationLanguages } from '../i18n/translations';

interface HistoryProps {
    items: HistoryItem[];
    language: Language;
    onClose: () => void;
    onClear: () => void;
    onLoad: (item: HistoryItem) => void;
}

const formatTimestamp = (timestamp: number, lang: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    try {
        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
        if (seconds < 60) return rtf.format(-seconds, 'second');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return rtf.format(-minutes, 'minute');
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return rtf.format(-hours, 'hour');
        const days = Math.floor(hours / 24);
        if (days < 30) return rtf.format(-days, 'day');
        const months = Math.floor(days / 30);
        if (months < 12) return rtf.format(-months, 'month');
        const years = Math.floor(days / 365);
        return rtf.format(-years, 'year');
    } catch (e) {
        return date.toLocaleDateString(lang);
    }
};

const findLanguageName = (code: string): string => {
    return translationLanguages.find(lang => lang.code === code)?.name || code;
}

export const History: React.FC<HistoryProps> = ({ items, language, onClose, onClear, onLoad }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return items;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return items.filter(item =>
            item.sourceText.toLowerCase().includes(lowercasedFilter) ||
            item.translatedText.toLowerCase().includes(lowercasedFilter)
        );
    }, [items, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-down p-4">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('historyTitle', language)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close history">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                        type="text"
                        placeholder={t('historySearch', language)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow w-full p-2 bg-slate-900/50 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-slate-500"
                    />
                    <button 
                        onClick={onClear} 
                        disabled={items.length === 0}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                        {t('historyClear', language)}
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {filteredItems.length > 0 ? (
                        <div className="space-y-3">
                            {filteredItems.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => onLoad(item)}
                                    className="w-full text-left p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 transition-colors"
                                >
                                    <div className="flex justify-between items-center text-xs text-cyan-400 mb-2">
                                        <span>{t('historyItemFrom', language)}: <strong>{findLanguageName(item.sourceLang)}</strong> {t('historyItemTo', language)}: <strong>{findLanguageName(item.targetLang)}</strong></span>
                                        <span className="text-slate-500">{formatTimestamp(item.timestamp, language)}</span>
                                    </div>
                                    <p className="text-slate-300 truncate mb-1">{item.sourceText}</p>
                                    <p className="text-slate-400 truncate font-light">{item.translatedText}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                           <p>{t('historyEmpty', language)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
