import React, { useState } from 'react';
import { t, Language } from '../i18n/translations';

// Props for the modal
interface AudioStudioModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

// --- Reusable UI Components for the Modal ---

const DigitalReadout: React.FC<{ value: number | string }> = ({ value }) => (
    <div className="bg-slate-900/70 text-cyan-400 font-mono text-sm px-3 py-1 rounded-md min-w-[50px] text-center">
        {value}
    </div>
);

const LargeSlider: React.FC<{ label: string, value: number, onChange: (val: number) => void }> = ({ label, value, onChange }) => (
    <div className="flex-1">
        <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-semibold text-slate-300">{label}</span>
            <DigitalReadout value={value} />
        </div>
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
    </div>
);


const EffectSlider: React.FC<{ label: string, value: number, onChange: (val: number) => void }> = ({ label, value, onChange }) => (
    <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-300">{label}</span>
            <span className="font-mono text-cyan-400">{value}</span>
        </div>
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
    </div>
);

const SmallToggleSwitch: React.FC<{ label: string, checked: boolean, onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        <div 
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full p-0.5 border-2 border-transparent transition-colors duration-200 ease-in-out ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </div>
    </label>
);


const Knob: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const angle = (value / 100) * 270 - 135;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20 bg-slate-900/50 rounded-full border-2 border-slate-700 flex items-center justify-center">
                <div
                    className="absolute h-1/2 w-0.5 bg-cyan-400 top-0 left-1/2 -translate-x-1/2 origin-bottom"
                    style={{ transform: `rotate(${angle}deg)` }}
                />
                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full z-10 border-2 border-slate-900" />
            </div>
            <span className="text-xs font-semibold text-slate-300">{label}</span>
            <DigitalReadout value={value} />
        </div>
    );
};

const EqSlider: React.FC<{ value: number, onChange: (val: number) => void }> = ({ value, onChange }) => (
    <div className="relative h-28 w-8 flex justify-center">
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="eq-slider accent-cyan-400"
        />
    </div>
);


// --- Main Modal Component ---

const AudioStudioModal: React.FC<AudioStudioModalProps> = ({ onClose, uiLanguage }) => {
    // Local state for UI controls
    const [reverb, setReverb] = useState(38);
    const [delay, setDelay] = useState(21);
    const [chorus, setChorus] = useState(58);
    const [isHdAudio, setIsHdAudio] = useState(true);
    const [mainVolume, setMainVolume] = useState(80);
    const [stereoWidth, setStereoWidth] = useState(45);
    const [limiter, setLimiter] = useState(95);
    const [compressor, setCompressor] = useState(16);
    const [eqBands, setEqBands] = useState([75, 40, 85, 30, 70]);

    const handleEqChange = (index: number, value: number) => {
        const newBands = [...eqBands];
        newBands[index] = value;
        setEqBands(newBands);
    };

    return (
        <>
            <style>{`
                .eq-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    writing-mode: vertical-lr;
                    direction: rtl;
                    width: 8px;
                    height: 100%;
                    background: #1e293b;
                    border-radius: 9999px;
                    cursor: pointer;
                }
                .eq-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    background: #ffffff;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 4px solid #0891b2;
                }
                .eq-slider::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    background: #ffffff;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 4px solid #0891b2;
                }
            `}</style>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in-down" onClick={onClose}>
                <div
                    className="bg-slate-800 border-2 border-cyan-500/30 w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col glow-container"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                        <h3 className="text-lg font-bold text-cyan-400">{t('audioEnhancementStudio', uiLanguage)}</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto p-5 space-y-5">
                        {/* Preview Notice */}
                        <div className="p-3 bg-cyan-900/50 border border-cyan-700 rounded-lg text-center">
                            <h4 className="font-semibold text-cyan-300 text-sm">{t('audioStudioPreview', uiLanguage)}</h4>
                            <p className="text-xs text-cyan-400">{t('previewNotice', uiLanguage)}</p>
                        </div>
                        
                        {/* Top Section: Main Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center p-4 bg-slate-900/50 rounded-lg">
                            <LargeSlider label={t('mainVolume', uiLanguage)} value={mainVolume} onChange={setMainVolume} />
                            <div className="flex items-center justify-around gap-4">
                                <Knob label={t('stereoWidth', uiLanguage)} value={stereoWidth} />
                                <div className="w-px h-16 bg-slate-700"></div>
                                <div className="flex flex-col items-center gap-3">
                                    <SmallToggleSwitch label={t('hdAudio', uiLanguage)} checked={isHdAudio} onChange={setIsHdAudio} />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Effects, EQ, Dynamics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Effects Column */}
                            <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-lg">
                                <h4 className="text-base font-semibold text-slate-200 text-center mb-2">{t('effects', uiLanguage)}</h4>
                                <EffectSlider label={t('reverb', uiLanguage)} value={reverb} onChange={setReverb} />
                                <EffectSlider label={t('delay', uiLanguage)} value={delay} onChange={setDelay} />
                                <EffectSlider label={t('chorus', uiLanguage)} value={chorus} onChange={setChorus} />
                            </div>

                            {/* EQ Column */}
                            <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-lg">
                                <h4 className="text-base font-semibold text-slate-200 text-center">{t('equalizer', uiLanguage)}</h4>
                                <div className="flex justify-around items-center flex-grow pt-2">
                                    {eqBands.map((band, index) => (
                                        <EqSlider key={index} value={band} onChange={(val) => handleEqChange(index, val)} />
                                    ))}
                                </div>
                            </div>
                            
                            {/* Dynamics Column */}
                             <div className="flex flex-col gap-4 p-4 bg-slate-900/50 rounded-lg justify-center">
                                 <h4 className="text-base font-semibold text-slate-200 text-center">{t('dynamics', uiLanguage)}</h4>
                                 <div className="flex justify-around items-center flex-grow pt-2">
                                    <Knob label={t('limiter', uiLanguage)} value={limiter} />
                                    <Knob label={t('compressor', uiLanguage)} value={compressor} />
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AudioStudioModal;