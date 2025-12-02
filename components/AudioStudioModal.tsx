

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language } from '../i18n/translations';
import { SawtliLogoIcon, PlayCircleIcon, PauseIcon, DownloadIcon, LoaderIcon, LockIcon, CheckIcon, TrashIcon, SoundEnhanceIcon, ChevronDownIcon } from './icons';
import { AudioSettings, AudioPresetName, UserTier, MusicTrack } from '../types';
import { AUDIO_PRESETS, processAudio, createMp3Blob, createWavBlob, rawPcmToAudioBuffer, decodeAudioData } from '../utils/audioUtils';

interface AudioStudioModalProps {
    isOpen?: boolean;
    onClose: () => void;
    uiLanguage: Language;
    voice: string;
    sourceAudioPCM?: Uint8Array | null;
    allowDownloads?: boolean;
    allowStudio?: boolean; 
    userTier?: UserTier; 
    onUpgrade?: () => void;
}

const AudioVisualizer: React.FC<{ analyser: AnalyserNode | null, isPlaying: boolean }> = ({ analyser, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!analyser) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        analyser.fftSize = 2048; 
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const width = canvas.width;
            const height = canvas.height;
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height;
                const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#22d3ee');
                gradient.addColorStop(1, '#0891b2');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        if (isPlaying || analyser) {
             draw();
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, isPlaying]);

    return (
        <canvas ref={canvasRef} width={1000} height={160} className="w-full h-full rounded bg-black/50" />
    );
};

const Knob: React.FC<{ 
    label: string, 
    value: number, 
    min?: number, 
    max?: number, 
    onChange: (val: number) => void, 
    color?: string,
    onClickCapture?: (e: React.MouseEvent) => void,
    displaySuffix?: string,
    size?: 'sm' | 'md' | 'lg'
}> = ({ label, value, min = 0, max = 100, onChange, color = 'cyan', onClickCapture, displaySuffix = '', size = 'lg' }) => {
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270); 

    const handleWheel = (e: React.WheelEvent) => {
        if (onClickCapture) {
            // If strictly capture needed, return. But usually we want knobs to work.
            // onClickCapture(e as any);
        }
        e.stopPropagation();
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1; 
        const range = max - min;
        const step = range / 50; 
        let newValue = value + (delta * step);
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };
    
    const isPurple = color === 'purple';
    const isGreen = color === 'green';

    let borderColor = 'border-cyan-900/50 group-hover:border-cyan-500/50';
    let tickColor = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
    let textColor = 'text-cyan-300';

    if (isPurple) {
        borderColor = 'border-purple-900/50 group-hover:border-purple-500/50';
        tickColor = 'bg-purple-400 shadow-[0_0_8px_#a855f7]';
        textColor = 'text-purple-300';
    } else if (isGreen) {
        borderColor = 'border-green-900/50 group-hover:border-green-500/50';
        tickColor = 'bg-green-400 shadow-[0_0_8px_#4ade80]';
        textColor = 'text-green-300';
    }

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : (size === 'md' ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16');
    const innerSizeClasses = size === 'sm' ? 'w-6 h-6' : (size === 'md' ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10');

    return (
        <div className="flex flex-col items-center group cursor-pointer" onWheel={handleWheel} onClick={onClickCapture} title="Scroll to adjust">
             <div className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-slate-800 to-black shadow-lg border-2 ${borderColor} flex items-center justify-center mb-2 cursor-ns-resize transition-all`}>
                 <div className="absolute w-full h-full rounded-full pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
                     <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 sm:w-1.5 sm:h-2.5 rounded-full ${tickColor}`}></div>
                 </div>
                 <div className={`${innerSizeClasses} rounded-full bg-[#0f172a] border border-slate-700 flex items-center justify-center shadow-inner`}>
                     <span className={`text-[8px] sm:text-[10px] sm:text-xs font-mono font-bold select-none pointer-events-none ${textColor}`}>{Math.round(value * 10) / 10}{displaySuffix}</span>
                 </div>
             </div>
             <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors text-center leading-tight">{label}</span>
        </div>
    );
};

const Fader: React.FC<{ 
    label: string, 
    value: number, 
    min?: number, 
    max?: number, 
    step?: number, 
    onChange: (val: number) => void, 
    height?: string, 
    color?: string, 
    labelSize?: string, 
    disabled?: boolean,
    muted?: boolean,
    onMuteToggle?: () => void,
    onClickCapture?: (e: React.MouseEvent) => void
}> = ({ label, value, min=0, max=100, step=1, onChange, height="h-32", color='cyan', labelSize='text-xs sm:text-sm', disabled, muted, onMuteToggle, onClickCapture }) => {
    const isCyan = color === 'cyan';
    const isAmber = color === 'amber';
    
    let barColor = 'bg-slate-300';
    if(isCyan) barColor = 'bg-cyan-400';
    if(isAmber) barColor = 'bg-amber-400';
    if(muted) barColor = 'bg-red-900';

    let glowColor = 'bg-slate-500/20';
    if(isCyan) glowColor = 'bg-cyan-500/20';
    if(isAmber) glowColor = 'bg-amber-500/20';
    
    return (
    <div className={`flex flex-col items-center w-12 sm:w-16 group h-full justify-end ${disabled ? 'opacity-50 grayscale' : ''}`} onClickCapture={onClickCapture}>
        {/* Mute Toggle */}
        {onMuteToggle && (
             <button 
                onClick={(e) => { e.stopPropagation(); if(onMuteToggle) onMuteToggle(); }}
                className={`mb-2 w-5 h-5 rounded border flex items-center justify-center transition-colors ${muted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'}`}
                title="Mute"
             >
                {muted ? (
                    <div className="relative w-3 h-3">
                        <div className="absolute inset-0 border-l-2 border-red-500 rotate-45 left-1.5"></div>
                         <div className="absolute inset-0 border-l-2 border-red-500 -rotate-45 left-1.5"></div>
                    </div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
                    </svg>
                )}
             </button>
        )}

        <div className={`relative w-4 sm:w-5 bg-black rounded-full border border-slate-800 ${height} mb-2 shadow-inner`}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={`${label}: ${value}`}
                disabled={disabled}
                {...({ orient: "vertical" } as any)}
                style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
            />
            <div className={`absolute bottom-0 left-0 w-full rounded-full pointer-events-none ${glowColor}`} style={{ height: `${((value - min) / (max - min)) * 100}%` }}></div>
            <div 
                className="absolute left-1/2 -translate-x-1/2 w-8 sm:w-10 h-4 sm:h-5 bg-gradient-to-b from-slate-600 to-slate-900 rounded shadow-lg border-t border-slate-500 border-b-2 border-black pointer-events-none flex items-center justify-center"
                style={{ bottom: `calc(${((value - min) / (max - min)) * 100}% - 10px)` }}
            >
                 <div className="w-full h-px bg-black opacity-50"></div>
                 <div className={`w-3 sm:w-5 h-1 rounded-full ${barColor}`}></div>
            </div>
        </div>
        <div className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 min-w-[2rem] text-center">
             <span className={`text-[10px] sm:text-xs font-mono font-bold ${muted ? 'text-red-500' : 'text-cyan-100'}`}>{muted ? 'OFF' : Math.round(value)}</span>
        </div>
        <span className={`${labelSize} font-bold text-slate-500 uppercase tracking-wider mt-1 text-center leading-tight`}>{label}</span>
    </div>
)};

const EqSlider: React.FC<{ value: number, label: string, onChange: (val: number) => void, onClickCapture?: (e: React.MouseEvent) => void }> = ({ value, label, onChange, onClickCapture }) => (
    <div className="flex flex-col items-center h-full group w-full" onClickCapture={onClickCapture}>
         <div className="relative flex-grow w-full max-w-[30px] sm:max-w-[40px] flex justify-center bg-black/50 rounded-md mb-2 border border-slate-800 min-h-[120px]">
             <div className="absolute top-1/2 left-0 w-full h-px bg-slate-700"></div>
            <input type="range" min="-12" max="12" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any} />
            <div className={`absolute w-1.5 rounded-full transition-all duration-75 ${value === 0 ? 'bg-slate-700 h-0.5 top-1/2' : 'bg-cyan-600/50 left-1/2 -translate-x-1/2'}`} style={ value !== 0 ? { bottom: value > 0 ? '50%' : `calc(50% - ${Math.abs(value)/24 * 100}%)`, height: `${Math.abs(value)/24 * 100}%` } : {}}></div>
            <div className="absolute left-1/2 -translate-x-1/2 w-6 sm:w-8 h-3 sm:h-4 bg-[#334155] rounded shadow-md border border-slate-600 pointer-events-none flex items-center justify-center" style={{ bottom: `calc(${((value + 12) / 24) * 100}% - 8px)` }}>
                <div className={`w-3 sm:w-4 h-1 rounded-sm ${value > 0 ? 'bg-cyan-400' : (value < 0 ? 'bg-amber-500' : 'bg-slate-400')}`}></div>
            </div>
        </div>
        <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className={`text-[8px] sm:text-[10px] font-mono font-bold ${value !== 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{value > 0 ? `+${value}` : value}dB</span>
    </div>
);

export const AudioStudioModal: React.FC<AudioStudioModalProps> = ({ isOpen = true, onClose, uiLanguage, voice, sourceAudioPCM, allowDownloads = false, onUpgrade, userTier = 'visitor' }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'mic' | 'upload'>('ai');
    const [presetName, setPresetName] = useState<AudioPresetName>('Default');
    const [settings, setSettings] = useState<AudioSettings>(AUDIO_PRESETS[0].settings);
    
    // Volume & Mute Controls
    const [voiceVolume, setVoiceVolume] = useState(80);
    const [musicVolume, setMusicVolume] = useState(40);
    const [voiceDelay, setVoiceDelay] = useState(0); 
    const [isVoiceMuted, setIsVoiceMuted] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [autoDucking, setAutoDucking] = useState(false);
    const [duckingActive, setDuckingActive] = useState(false); 
    
    // Export Settings
    const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
    const [exportSource, setExportSource] = useState<'mix' | 'voice'>('mix');
    const [trimToVoice, setTrimToVoice] = useState(true); 
    
    // Buffers & Library
    const [micAudioBuffer, setMicAudioBuffer] = useState<AudioBuffer | null>(null);
    const [musicLibrary, setMusicLibrary] = useState<MusicTrack[]>([]);
    const [activeMusicId, setActiveMusicId] = useState<string | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null); 
    
    // Active Music Track Helpers
    const activeMusicTrack = musicLibrary.find(t => t.id === activeMusicId) || null;
    const musicBuffer = activeMusicTrack?.buffer || null;
    const musicFileName = activeMusicTrack?.name || null;
    const musicDuration = activeMusicTrack?.duration || 0;

    // File Meta
    const [fileName, setFileName] = useState<string>('Gemini AI Audio');
    const [fileDuration, setFileDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    // Processing / Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    
    // Hardware
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    
    // Menu
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);
    
    // REFS FOR REAL-TIME LOOP ACCESS
    const musicVolumeRef = useRef(musicVolume);
    const voiceVolumeRef = useRef(voiceVolume);
    const isMusicMutedRef = useRef(isMusicMuted);
    const isVoiceMutedRef = useRef(isVoiceMuted);
    const autoDuckingRef = useRef(autoDucking);
    const voiceDelayRef = useRef(voiceDelay);
    const trimToVoiceRef = useRef(trimToVoice);
    const settingsRef = useRef(settings);
    
    // Playback Request ID to prevent race conditions (Double Audio)
    const playRequestIdRef = useRef<number>(0);
    const libraryMenuRef = useRef<HTMLDivElement>(null);
    
    // Sync Refs with State
    useEffect(() => { musicVolumeRef.current = musicVolume; }, [musicVolume]);
    useEffect(() => { voiceVolumeRef.current = voiceVolume; }, [voiceVolume]);
    useEffect(() => { isMusicMutedRef.current = isMusicMuted; }, [isMusicMuted]);
    useEffect(() => { isVoiceMutedRef.current = isVoiceMuted; }, [isVoiceMuted]);
    useEffect(() => { autoDuckingRef.current = autoDucking; }, [autoDucking]);
    useEffect(() => { voiceDelayRef.current = voiceDelay; }, [voiceDelay]);
    useEffect(() => { trimToVoiceRef.current = trimToVoice; }, [trimToVoice]);
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    // Update total file duration
    useEffect(() => {
        let total = 0;
        const currentSpeed = settings.speed || 1.0;
        // CORRECTED: Calculate Voice End based on Delay + (Duration / Speed)
        const voiceEnd = voiceBuffer ? voiceDelay + (voiceBuffer.duration / currentSpeed) : 0;
        const musicEnd = musicBuffer ? musicBuffer.duration : 0;

        if (trimToVoice && voiceBuffer) {
            // Include tail buffer in the UI timeline. 
            // Matching utils/audioUtils.ts calculation: absoluteVoiceEnd + 6.0s padding
            total = voiceEnd + 6.0; 
        } else {
            total = Math.max(voiceEnd, musicEnd);
        }
        setFileDuration(Math.max(1, total));
    }, [voiceBuffer, musicBuffer, voiceDelay, trimToVoice, settings.speed]);

    // Real-time Audio Graph Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
    
    // Gain Nodes for Real-time Control
    const voiceGainRef = useRef<GainNode | null>(null);
    const musicGainRef = useRef<GainNode | null>(null);
    
    // DSP Nodes References (to update parameters in real-time)
    const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
    const reverbRef = useRef<ConvolverNode | null>(null);
    const reverbGainRef = useRef<GainNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const playAnimationFrameRef = useRef<number>(0);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    const duckingAnalyserRef = useRef<AnalyserNode | null>(null);

    const isPaidUser = userTier === 'gold' || userTier === 'platinum' || userTier === 'admin';

    const handleRestrictedAction = (e: React.MouseEvent) => {
        if (!isPaidUser) {
            e.preventDefault();
            e.stopPropagation();
            setShowUpgradeAlert(true);
        }
    };

    // --- INIT & CLEANUP ---
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            setInputDevices(audioInputs);
        });
        
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
            if (libraryMenuRef.current && !libraryMenuRef.current.contains(event.target as Node)) {
                setIsLibraryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('mousedown', handleClickOutside);
            stopPlayback();
            stopRecording();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
        } else {
            document.body.style.overflow = 'unset';
            stopPlayback(); 
            if (audioContextRef.current) audioContextRef.current.suspend();
        }
    }, [isOpen]);

    // --- LOAD AI AUDIO ---
    useEffect(() => {
        if (activeTab === 'ai' && sourceAudioPCM) {
            const buf = rawPcmToAudioBuffer(sourceAudioPCM);
            setVoiceBuffer(buf);
            setFileName(`Gemini ${voice} Session`);
        }
    }, [activeTab, sourceAudioPCM, voice]);

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    // --- UPDATE DSP NODES IN REAL-TIME ---
    useEffect(() => {
        // Update EQ
        if (eqFiltersRef.current.length > 0) {
            eqFiltersRef.current.forEach((filter, i) => {
                if (filter) {
                    filter.gain.setTargetAtTime(settings.eqBands[i] || 0, getAudioContext().currentTime, 0.1);
                }
            });
        }
        // Update Reverb Mix
        if (reverbGainRef.current && dryGainRef.current) {
            const mix = settings.reverb / 100;
            reverbGainRef.current.gain.setTargetAtTime(mix, getAudioContext().currentTime, 0.1);
            dryGainRef.current.gain.setTargetAtTime(1 - (mix * 0.5), getAudioContext().currentTime, 0.1);
        }
        // Update Compressor
        if (compressorRef.current) {
            const compAmount = settings.compression / 100;
            compressorRef.current.threshold.setTargetAtTime(-10 - (compAmount * 40), getAudioContext().currentTime, 0.1);
            compressorRef.current.ratio.setTargetAtTime(1 + (compAmount * 11), getAudioContext().currentTime, 0.1);
        }
        // Speed changes require restarting the source or using playbackRate
        if (voiceSourceRef.current) {
             voiceSourceRef.current.playbackRate.value = settings.speed;
        }
    }, [settings]);

    // --- PLAYBACK LOGIC (REAL-TIME MIXING) ---
    const stopPlayback = useCallback(() => {
        playRequestIdRef.current += 1; // Invalidate current loop

        if (playAnimationFrameRef.current) {
            cancelAnimationFrame(playAnimationFrameRef.current);
        }
        
        if (voiceSourceRef.current) {
            try { voiceSourceRef.current.stop(); voiceSourceRef.current.disconnect(); } catch(e){}
        }
        if (musicSourceRef.current) {
            try { musicSourceRef.current.stop(); musicSourceRef.current.disconnect(); } catch(e){}
        }
        
        voiceSourceRef.current = null;
        musicSourceRef.current = null;
        duckingAnalyserRef.current = null;
        
        // Clear DSP refs
        eqFiltersRef.current = [];
        reverbRef.current = null;
        reverbGainRef.current = null;
        dryGainRef.current = null;
        compressorRef.current = null;
        
        if (!isRecording) setAnalyserNode(null);
        setIsPlaying(false);
        setDuckingActive(false);
        setIsProcessing(false);
    }, [isRecording]);

    // IMPULSE RESPONSE GENERATOR (Client-side for Reverb)
    const getImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const n = i; 
            const e = Math.pow(1 - n / length, decay);
            const r = (Math.random() * 2 - 1) * e;
            left[i] = r;
            right[i] = r;
        }
        return impulse;
    }

    const handlePlayPause = async () => {
        if (isPlaying) {
            const ctx = getAudioContext();
            if (ctx) {
                const elapsed = ctx.currentTime - playbackStartTimeRef.current;
                playbackOffsetRef.current += elapsed; 
            }
            stopPlayback();
            return;
        }

        if (!voiceBuffer && !musicBuffer) return;
        
        const requestId = playRequestIdRef.current + 1;
        playRequestIdRef.current = requestId;

        // Calculate Limits - CORRECTED FORMULA
        const currentSpeed = settingsRef.current.speed || 1.0;
        const vDelay = voiceDelayRef.current;
        const voiceEnd = (voiceBuffer ? vDelay + (voiceBuffer.duration / currentSpeed) : 0);
        const musicEnd = musicBuffer ? musicBuffer.duration : 0;
        let primaryDuration = Math.max(voiceEnd, musicEnd);
        
        if (trimToVoice && voiceBuffer) {
            // Ensure visual playback follows the exact same 6s padding logic
            primaryDuration = voiceEnd + 6.0;
        }

        // Loop if at end
        if (playbackOffsetRef.current >= primaryDuration - 0.1) {
            playbackOffsetRef.current = 0;
        }

        try {
            // Don't show processing state for instant play, unless building complex graph takes long (it shouldn't)
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();
            
            const currentOffset = playbackOffsetRef.current;

            // --- VOICE GRAPH ---
            let vSource: AudioBufferSourceNode | null = null;
            let vGain: GainNode | null = null;
            let visualizerAnalyser: AnalyserNode | null = null;
            let duckingAnalyser: AnalyserNode | null = null;

            if (voiceBuffer) {
                vSource = ctx.createBufferSource();
                vSource.buffer = voiceBuffer;
                vSource.playbackRate.value = currentSpeed;
                
                vGain = ctx.createGain();
                vGain.gain.value = isVoiceMuted ? 0 : (voiceVolume / 100);
                
                // DSP Chain (Real-time)
                // 1. EQ
                const frequencies = [60, 250, 1000, 4000, 12000];
                const filters = frequencies.map((freq, i) => {
                    const f = ctx.createBiquadFilter();
                    f.type = i===0?'lowshelf':(i===4?'highshelf':'peaking');
                    f.frequency.value = freq;
                    f.gain.value = settingsRef.current.eqBands[i] || 0;
                    return f;
                });
                eqFiltersRef.current = filters;

                // 2. Compressor
                const comp = ctx.createDynamicsCompressor();
                const compAmount = settingsRef.current.compression / 100;
                comp.threshold.value = -10 - (compAmount * 40);
                comp.ratio.value = 1 + (compAmount * 11);
                compressorRef.current = comp;

                // 3. Reverb (Parallel)
                const revNode = ctx.createConvolver();
                const revDuration = 1.5 + (settingsRef.current.reverb / 100) * 2.0; 
                revNode.buffer = getImpulseResponse(ctx, revDuration, 2.0);
                reverbRef.current = revNode;

                const revGain = ctx.createGain();
                const dGain = ctx.createGain();
                const mix = settingsRef.current.reverb / 100;
                revGain.gain.value = mix;
                dGain.gain.value = 1 - (mix * 0.5);
                reverbGainRef.current = revGain;
                dryGainRef.current = dGain;

                // Connect Chain: Source -> Filters -> Compressor -> Split(Reverb, Dry) -> Merge -> Volume -> Out
                let node: AudioNode = vSource;
                filters.forEach(f => { node.connect(f); node = f; });
                node.connect(comp);
                
                comp.connect(revNode);
                revNode.connect(revGain);
                
                comp.connect(dGain);
                
                // Merge to VoiceGain
                revGain.connect(vGain);
                dGain.connect(vGain);

                // Analyzers
                visualizerAnalyser = ctx.createAnalyser();
                visualizerAnalyser.smoothingTimeConstant = 0.8;
                duckingAnalyser = ctx.createAnalyser();
                duckingAnalyser.fftSize = 512; 

                vGain.connect(visualizerAnalyser).connect(ctx.destination);
                vGain.connect(duckingAnalyser); 
                
                // --- SCHEDULING WITH DELAY ---
                
                if (currentOffset < vDelay) {
                    vSource.start(ctx.currentTime + (vDelay - currentOffset), 0);
                } else {
                    // Logic to handle skipping into the middle of the voice track accounting for speed
                    // offsetInVoice = (elapsedTimeSinceDelay) * speed
                    const timeIntoVoice = currentOffset - vDelay;
                    const offsetInSample = timeIntoVoice * currentSpeed;
                    
                    if (offsetInSample < voiceBuffer.duration) {
                        vSource.start(0, offsetInSample);
                    }
                }
            }
            
            // --- MUSIC GRAPH ---
            let mSource: AudioBufferSourceNode | null = null;
            let mGain: GainNode | null = null;

            if (musicBuffer) {
                mSource = ctx.createBufferSource();
                mSource.buffer = musicBuffer;
                mSource.loop = true; 
                
                mGain = ctx.createGain();
                mGain.gain.value = isMusicMuted ? 0 : (musicVolume / 100);
                
                if (!visualizerAnalyser) {
                     visualizerAnalyser = ctx.createAnalyser();
                     mSource.connect(mGain).connect(visualizerAnalyser).connect(ctx.destination);
                } else {
                     mSource.connect(mGain).connect(visualizerAnalyser); 
                }
                
                const musicOffset = currentOffset % musicBuffer.duration;
                mSource.start(0, musicOffset);
            }

            voiceSourceRef.current = vSource;
            voiceGainRef.current = vGain;
            musicSourceRef.current = mSource;
            musicGainRef.current = mGain;
            setAnalyserNode(visualizerAnalyser);
            duckingAnalyserRef.current = duckingAnalyser;
            
            playbackStartTimeRef.current = ctx.currentTime;
            setIsPlaying(true);

            // ANIMATION LOOP
            const updateUI = () => {
                if (playRequestIdRef.current !== requestId) return;

                if (ctx.state === 'running') {
                    const currentSegmentTime = ctx.currentTime - playbackStartTimeRef.current;
                    const actualTime = playbackOffsetRef.current + currentSegmentTime;
                    
                    // Duration Check (Real-time calculation to respect speed/delay changes)
                    const curSpeed = settingsRef.current.speed || 1.0;
                    const curDelay = voiceDelayRef.current;
                    const vEnd = (voiceBuffer) ? (curDelay + (voiceBuffer.duration / curSpeed)) : 0;
                    const mEnd = musicBuffer ? musicBuffer.duration : 0;
                    let liveTotalDur = Math.max(vEnd, mEnd);
                    
                    if (trimToVoiceRef.current && voiceBuffer) {
                        liveTotalDur = vEnd + 6.0; // Matching padding
                    }
                    
                    // --- REAL-TIME DUCKING ---
                    if (mGain) {
                        const currentMusicVol = isMusicMutedRef.current ? 0 : (musicVolumeRef.current / 100);
                        let targetMusicGain = currentMusicVol;
                        let isDucking = false;

                        if (autoDuckingRef.current && duckingAnalyser && !isMusicMutedRef.current && !isVoiceMutedRef.current) {
                            // Only duck if we are past the delay point (voice is hypothetically active)
                            if (actualTime >= curDelay) {
                                const dataArray = new Uint8Array(duckingAnalyser.frequencyBinCount);
                                duckingAnalyser.getByteTimeDomainData(dataArray);
                                
                                let sum = 0;
                                // Optimize loop
                                for(let i = 0; i < dataArray.length; i+=8) {
                                    const v = (dataArray[i] - 128) / 128;
                                    sum += v*v;
                                }
                                const rms = Math.sqrt(sum / (dataArray.length / 8));
                                // More sensitive threshold for live listening
                                const threshold = 0.01; 
                                
                                if (rms > threshold) {
                                    targetMusicGain = currentMusicVol * 0.15; 
                                    isDucking = true;
                                }
                            }
                        }
                        // Smooth transition - Slower release for better effect
                        const rampTime = isDucking ? 0.3 : 0.8;
                        mGain.gain.setTargetAtTime(targetMusicGain, ctx.currentTime, rampTime);
                        setDuckingActive(isDucking);
                    }
                    
                    // Update Voice Volume Live
                    if (vGain) {
                         const currentVoiceVol = isVoiceMutedRef.current ? 0 : (voiceVolumeRef.current / 100);
                         vGain.gain.setTargetAtTime(currentVoiceVol, ctx.currentTime, 0.1);
                    }

                    if (actualTime >= liveTotalDur) {
                        setCurrentTime(liveTotalDur);
                        stopPlayback();
                        // Reset to start for convenience
                        playbackOffsetRef.current = 0; 
                        setCurrentTime(0);
                    } else {
                        setCurrentTime(actualTime);
                        playAnimationFrameRef.current = requestAnimationFrame(updateUI);
                    }
                }
            };
            updateUI();

        } catch (e) {
            console.error("Playback error:", e);
            setIsProcessing(false);
        }
    };

    // --- MIC LOGIC ---
    const startRecording = async () => {
        try {
            stopPlayback();
            setMicAudioBuffer(null);
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();
            
            const constraints = {
                audio: {
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 1,
                    sampleRate: 48000
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            const micSource = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            micSource.connect(analyser);
            setAnalyserNode(analyser);
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            recordingChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };

            mediaRecorder.onstop = async () => {
                micSource.disconnect();
                analyser.disconnect();
                setAnalyserNode(null);

                const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const decoded = await ctx.decodeAudioData(arrayBuffer);
                
                // Boost mic
                const rawData = decoded.getChannelData(0);
                for (let i = 0; i < rawData.length; i++) {
                    rawData[i] = Math.max(-1, Math.min(1, rawData[i] * 4.0));
                }
                
                setMicAudioBuffer(decoded);
                setVoiceBuffer(decoded); 
                setFileName(`Recording_${new Date().toLocaleTimeString()}`);
                playbackOffsetRef.current = 0;
                setCurrentTime(0);
                
                if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
            
        } catch (err) {
            console.error("Mic Access Error:", err);
            alert("Failed to access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    // --- LIBRARY & FILES ---
    const onMusicUploadClick = () => { 
        if (!isPaidUser) {
            setShowUpgradeAlert(true);
            return;
        }
        musicInputRef.current?.click(); 
    };
    
    const handleMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
             const file = e.target.files[0];
             setIsProcessing(true);
             try {
                 const arrayBuffer = await file.arrayBuffer();
                 const ctx = getAudioContext();
                 const decoded = await ctx.decodeAudioData(arrayBuffer);
                 
                 const newTrack: MusicTrack = {
                     id: Date.now().toString(),
                     name: file.name,
                     buffer: decoded,
                     duration: decoded.duration
                 };
                 
                 setMusicLibrary(prev => [...prev, newTrack]);
                 setActiveMusicId(newTrack.id);
                 
             } catch (e) { console.error(e); alert("Music load failed"); }
             finally { setIsProcessing(false); }
        }
    };

    const removeTrackFromLibrary = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Are you sure you want to remove this track?")) {
            setMusicLibrary(prev => prev.filter(t => t.id !== id));
            if (activeMusicId === id) setActiveMusicId(null);
        }
    };

    const onReplaceVoiceClick = (e: React.MouseEvent) => { 
        handleRestrictedAction(e);
        if(isPaidUser && fileInputRef.current) {
            fileInputRef.current.click(); 
        }
    };
    
    const handleVoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
             const file = e.target.files[0];
             setIsProcessing(true);
             try {
                 const arrayBuffer = await file.arrayBuffer();
                 const ctx = getAudioContext();
                 const decoded = await ctx.decodeAudioData(arrayBuffer);
                 setMicAudioBuffer(decoded);
                 setVoiceBuffer(decoded);
                 setFileName(file.name);
                 setActiveTab('upload');
                 playbackOffsetRef.current = 0;
                 setCurrentTime(0);
             } catch (e) { console.error(e); alert("Voice load failed"); }
             finally { setIsProcessing(false); }
        }
    };

    const handleRemoveVoice = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(confirm("Are you sure you want to clear the voice audio?")) {
            stopPlayback();
            setVoiceBuffer(null);
            setMicAudioBuffer(null);
            setFileName('No Audio');
            playbackOffsetRef.current = 0;
            setCurrentTime(0);
        }
    };

    // --- EXPORT ---
    const handleExportClick = () => {
        setShowExportMenu(false);
        if (!allowDownloads) {
            if (onUpgrade) onUpgrade();
            return;
        }
        performDownload();
    };

    const performDownload = async () => {
        if (!voiceBuffer && !musicBuffer) return;
        
        try {
            setIsProcessing(true);
            const finalVoiceVolume = isVoiceMuted ? 0 : voiceVolume;
            const finalMusicVolume = (exportSource === 'voice' || isMusicMuted) ? 0 : musicVolume;

            const buffer = await processAudio(
                voiceBuffer, 
                settings, 
                musicBuffer, 
                finalMusicVolume, 
                autoDucking, 
                finalVoiceVolume,
                trimToVoice,
                voiceDelay
            );
            
            let blob;
            if (exportFormat === 'wav') {
                 blob = createWavBlob(buffer, 1, buffer.sampleRate);
            } else {
                 blob = await createMp3Blob(buffer, 1, buffer.sampleRate);
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const suffix = exportSource === 'voice' ? '_voice' : '_mix';
            a.download = `sawtli${suffix}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        playbackOffsetRef.current = time;
        if (isPlaying) {
            stopPlayback();
            setTimeout(() => handlePlayPause(), 50);
        }
    };

    const handleTabSwitch = (tab: 'ai' | 'mic' | 'upload') => {
        if (activeTab === tab) return;
        if ((tab === 'upload' || tab === 'mic') && !isPaidUser) {
            setShowUpgradeAlert(true);
            return;
        }

        stopPlayback();
        setActiveTab(tab);
        
        if (tab === 'ai') {
            if (sourceAudioPCM) {
                const buf = rawPcmToAudioBuffer(sourceAudioPCM);
                setVoiceBuffer(buf);
                setFileName(`Gemini ${voice} Session`);
            } else {
                setVoiceBuffer(null);
            }
        } else if (tab === 'mic') {
             setVoiceBuffer(micAudioBuffer);
             setFileName(micAudioBuffer ? "Recording" : "Ready to Record");
        } else {
             setVoiceBuffer(micAudioBuffer);
             setFileName("Uploaded File");
        }
        playbackOffsetRef.current = 0;
        setCurrentTime(0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col animate-fade-in-down h-[100dvh]">
            <div className="bg-[#0f172a] border-b border-slate-800 shrink-0 w-full" dir="ltr">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between select-none">
                    <div className="flex items-center">
                        <SawtliLogoIcon className="h-16 sm:h-20 w-auto" />
                    </div>
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl sm:text-3xl font-thin tracking-[0.2em] text-slate-200 uppercase hidden sm:block border-r border-slate-700 pr-6 mr-2">Audio Studio</h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide w-full">
                <div className="max-w-7xl mx-auto space-y-6 pb-10">

                    {/* Visualizer & Timeline */}
                    <div className="bg-[#020617] rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl group">
                        {showUpgradeAlert && (
                            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center animate-fade-in-down pointer-events-auto" onClick={(e) => {e.stopPropagation(); setShowUpgradeAlert(false);}}>
                                <div className="text-center bg-slate-900 border border-amber-500 p-6 rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <div className="text-2xl font-bold text-white mb-2">
                                        {uiLanguage === 'ar' ? 'ميزة مقفلة' : 'Locked Feature'}
                                    </div>
                                    <p className="text-slate-400 mb-4">
                                        {uiLanguage === 'ar' ? 'يتوفر استوديو الصوت الكامل للمشتركين فقط.' : 'Full Audio Studio access is available for subscribers only.'}
                                    </p>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onUpgrade) onUpgrade();
                                            setShowUpgradeAlert(false); 
                                        }}
                                        className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-full font-bold uppercase tracking-wide transition-colors"
                                    >
                                        {uiLanguage === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="h-32 sm:h-40 relative w-full">
                             <AudioVisualizer analyser={analyserNode} isPlaying={isPlaying || isRecording} />
                             {isRecording && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="animate-pulse text-red-500 font-mono text-xl font-bold tracking-widest bg-black/30 px-4 py-1 rounded">RECORDING {Math.floor(recordingTime/60)}:{String(recordingTime%60).padStart(2,'0')}</div></div>}
                        </div>
                        <div className="bg-[#0f172a] px-4 py-2 flex items-center gap-4 text-[10px] sm:text-xs font-mono text-cyan-400 border-t border-slate-800" dir="ltr">
                            <span className="w-16 text-right">{Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')} / {Math.floor(fileDuration/60)}:{String(Math.floor(fileDuration%60)).padStart(2,'0')}</span>
                            <div className="flex-1 relative h-6 flex items-center group cursor-pointer">
                                <div className="absolute inset-0 bg-slate-800 h-1 rounded-full my-auto"></div>
                                <div className="absolute left-0 bg-cyan-500 h-1 rounded-full my-auto pointer-events-none" style={{ width: `${(currentTime / (fileDuration || 1)) * 100}%` }}></div>
                                <input type="range" min="0" max={fileDuration || 1} step="0.01" value={currentTime} onChange={handleSeek} disabled={!voiceBuffer && !musicBuffer} className="w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="absolute h-3 w-3 bg-white rounded-full shadow pointer-events-none" style={{ left: `calc(${((currentTime / (fileDuration || 1)) * 100)}% - 6px)` }}></div>
                            </div>
                            <div className="flex items-center gap-2 max-w-[150px]">
                                <span className="text-slate-400 truncate" title={fileName}>{fileName}</span>
                                {voiceBuffer && (
                                    <button onClick={handleRemoveVoice} className="text-slate-500 hover:text-red-500 transition-colors" title="Remove Voice">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Control Deck */}
                    <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700 shadow-xl relative z-40" dir="ltr">
                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="flex-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 flex items-center gap-1">
                                <button onClick={onReplaceVoiceClick} className={`flex-1 h-16 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider flex flex-col items-center justify-center gap-1 relative ${activeTab === 'upload' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    <span>FILE</span>
                                    {!isPaidUser && <LockIcon className="w-3 h-3 absolute top-1 right-1 text-slate-500"/>}
                                </button>
                                <button onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) handleTabSwitch('mic'); }} className={`flex-1 h-16 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider flex flex-col items-center justify-center gap-1 relative ${activeTab === 'mic' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    <span>MIC</span>
                                    {!isPaidUser && <LockIcon className="w-3 h-3 absolute top-1 right-1 text-slate-500"/>}
                                </button>
                                <button onClick={() => handleTabSwitch('ai')} className={`flex-1 h-16 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider flex flex-col items-center justify-center gap-1 ${activeTab === 'ai' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>GEMINI</button>
                            </div>

                            <div className="flex-shrink-0 flex justify-center items-center">
                                 <button onClick={handlePlayPause} disabled={!voiceBuffer && !musicBuffer} className={`w-20 h-full min-h-[4rem] rounded-xl flex items-center justify-center border-2 transition-all active:scale-95 shadow-xl ${isPlaying ? 'bg-slate-800 border-cyan-500 text-cyan-400' : 'bg-cyan-600 border-cyan-400 text-white'}`}>
                                    {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayCircleIcon className="w-10 h-10 ml-1"/>}
                                 </button>
                            </div>

                            <div className="flex-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
                                <div className="flex-1 relative flex flex-col justify-center">
                                    {activeTab === 'mic' ? (
                                        <div className="w-full h-full flex flex-col">
                                            <button onClick={isRecording ? stopRecording : startRecording} className={`h-10 rounded-t-lg flex items-center justify-center border w-full ${isRecording ? 'bg-red-900/80 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white'}`}>
                                                <span className="font-bold text-xs">RECORD</span>
                                            </button>
                                            <select 
                                                value={selectedDeviceId} 
                                                onChange={(e) => setSelectedDeviceId(e.target.value)} 
                                                disabled={isRecording}
                                                className="h-6 bg-slate-950 text-slate-400 border border-slate-700 border-t-0 rounded-b-lg p-0 px-1 text-[9px] focus:outline-none w-full"
                                            >
                                                <option value="default">Default Mic</option>
                                                {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,4)}`}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs uppercase font-bold tracking-widest">
                                           {activeTab === 'upload' ? 'FILE MODE' : 'AI MODE'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 relative" ref={exportMenuRef}>
                                    <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!voiceBuffer && !musicBuffer} className="w-full h-16 rounded-lg flex flex-col items-center justify-center bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold uppercase">
                                        {isProcessing ? <LoaderIcon className="w-5 h-5 mb-1"/> : <DownloadIcon className="w-5 h-5 mb-1" />}
                                        <span>{uiLanguage === 'ar' ? 'تصدير' : 'Export'}</span>
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute top-full right-0 mt-2 w-72 bg-[#0f172a] border border-slate-600 rounded-xl shadow-2xl z-[100] p-4 flex flex-col gap-4">
                                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                                                <h4 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">EXPORT SETTINGS</h4>
                                            </div>
                                            
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Source</label>
                                                <div className="flex bg-slate-800 rounded p-1">
                                                    <button onClick={() => setExportSource('mix')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${exportSource === 'mix' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>FULL MIX</button>
                                                    <button onClick={() => setExportSource('voice')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${exportSource === 'voice' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>VOICE ONLY</button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Duration</label>
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => setTrimToVoice(true)} className={`flex items-center gap-2 p-2 rounded text-[10px] font-bold border transition-colors ${trimToVoice ? 'bg-slate-800 border-cyan-500 text-cyan-400' : 'bg-transparent border-slate-700 text-slate-500'}`}>
                                                        {trimToVoice && <CheckIcon className="w-3 h-3"/>}
                                                        End when Voice ends
                                                    </button>
                                                    <button onClick={() => setTrimToVoice(false)} className={`flex items-center gap-2 p-2 rounded text-[10px] font-bold border transition-colors ${!trimToVoice ? 'bg-slate-800 border-cyan-500 text-cyan-400' : 'bg-transparent border-slate-700 text-slate-500'}`}>
                                                        {!trimToVoice && <CheckIcon className="w-3 h-3"/>}
                                                        Keep Full Music Length
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Format</label>
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => setExportFormat('mp3')} className={`flex items-center justify-between p-2 rounded border transition-colors ${exportFormat === 'mp3' ? 'bg-slate-800 border-cyan-500' : 'bg-transparent border-slate-700'}`}>
                                                        <span className={`text-[10px] font-bold ${exportFormat === 'mp3' ? 'text-white' : 'text-slate-500'}`}>MP3 <span className="opacity-50">320kbps</span></span>
                                                        {exportFormat === 'mp3' && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                    </button>
                                                    <button onClick={() => setExportFormat('wav')} className={`flex items-center justify-between p-2 rounded border transition-colors ${exportFormat === 'wav' ? 'bg-slate-800 border-cyan-500' : 'bg-transparent border-slate-700'}`}>
                                                        <span className={`text-[10px] font-bold ${exportFormat === 'wav' ? 'text-white' : 'text-slate-500'}`}>WAV <span className="opacity-50">48khz 24-bit</span></span>
                                                        {exportFormat === 'wav' && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                    </button>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleExportClick} 
                                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg mt-2"
                                            >
                                                <DownloadIcon className="w-4 h-4" /> DOWNLOAD
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleVoiceFileChange} accept="audio/*" className="hidden" />
                        <input type="file" ref={musicInputRef} onChange={handleMusicFileChange} accept="audio/*" className="hidden" />
                    </div>

                    {/* Main Grid: EQ (LEFT) | Mixer (CENTER) | Presets (RIGHT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="ltr">
                        
                        {/* LEFT: BAND EQ-5 (4 Cols) */}
                        <div className="lg:col-span-4 bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col h-96 relative">
                            {!isPaidUser && <div className="absolute top-4 right-4 z-10 text-slate-600"><LockIcon className="w-4 h-4"/></div>}
                            <div className="w-full flex items-center mb-4 border-b border-slate-700 pb-2 shrink-0 gap-3">
                                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">BAND EQ-5</div>
                            </div>
                            <div className="flex justify-between px-1 gap-2 flex-1 items-end bg-black/20 rounded-xl p-3 border border-slate-800/50">
                                <EqSlider value={settings.eqBands[0]} label="60Hz" onChange={(v) => {const b=[...settings.eqBands]; b[0]=v; updateSetting('eqBands',b);}} onClickCapture={handleRestrictedAction} />
                                <EqSlider value={settings.eqBands[1]} label="250Hz" onChange={(v) => {const b=[...settings.eqBands]; b[1]=v; updateSetting('eqBands',b);}} onClickCapture={handleRestrictedAction} />
                                <EqSlider value={settings.eqBands[2]} label="1KHz" onChange={(v) => {const b=[...settings.eqBands]; b[2]=v; updateSetting('eqBands',b);}} onClickCapture={handleRestrictedAction} />
                                <EqSlider value={settings.eqBands[3]} label="4KHz" onChange={(v) => {const b=[...settings.eqBands]; b[3]=v; updateSetting('eqBands',b);}} onClickCapture={handleRestrictedAction} />
                                <EqSlider value={settings.eqBands[4]} label="12KHz" onChange={(v) => {const b=[...settings.eqBands]; b[4]=v; updateSetting('eqBands',b);}} onClickCapture={handleRestrictedAction} />
                            </div>
                        </div>

                        {/* CENTER: MIXER (4 Cols) */}
                        <div className="lg:col-span-4 bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col h-96 relative">
                             {!isPaidUser && <div className="absolute top-4 right-4 z-10 text-slate-600"><LockIcon className="w-4 h-4"/></div>}
                             
                             <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-2 shrink-0 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                                    <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">MIXER</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full max-w-[140px]">
                                    <button onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) onMusicUploadClick(); }} className="text-[9px] bg-slate-800 h-6 rounded text-amber-400 border border-slate-600 hover:border-amber-400 font-bold uppercase transition-colors flex items-center justify-center">ADD MUSIC</button>
                                    <div className="relative w-full h-6">
                                        <button onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) setAutoDucking(!autoDucking); }} className={`w-full h-full text-[9px] rounded border font-bold uppercase transition-all flex items-center justify-center ${autoDucking ? 'bg-amber-900/50 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 border-slate-600'}`}>DUCKING</button>
                                        {duckingActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>}
                                    </div>
                                </div>
                             </div>
                             
                             {/* Faders Container - Flex Grow to take available space */}
                             <div className="flex gap-4 items-end justify-center pb-2 flex-grow overflow-hidden relative">
                                <Fader 
                                    label="VOICE" 
                                    value={voiceVolume} 
                                    onChange={setVoiceVolume} 
                                    height="h-full max-h-48" 
                                    disabled={!voiceBuffer} 
                                    muted={isVoiceMuted}
                                    onMuteToggle={() => setIsVoiceMuted(!isVoiceMuted)}
                                    onClickCapture={handleRestrictedAction}
                                />
                                
                                {/* Voice Delay Knob - CENTERED */}
                                <div className="flex flex-col items-center justify-center pb-6 mx-2 h-full">
                                    <Knob 
                                        label="DELAY" 
                                        value={voiceDelay} 
                                        min={0} 
                                        max={10} 
                                        onChange={setVoiceDelay} 
                                        color="green" 
                                        onClickCapture={handleRestrictedAction}
                                        displaySuffix="s"
                                        size="md"
                                    />
                                </div>

                                <Fader 
                                    label="MUSIC" 
                                    value={musicVolume} 
                                    onChange={setMusicVolume} 
                                    color="amber" 
                                    height="h-full max-h-48" 
                                    disabled={!musicFileName && isPaidUser} 
                                    muted={isMusicMuted}
                                    onMuteToggle={() => setIsMusicMuted(!isMusicMuted)}
                                    onClickCapture={handleRestrictedAction}
                                />
                             </div>
                             
                             {/* Music Library - Push to bottom, Dropdown (DOWNWARDS) */}
                             <div className="mt-auto pt-2 w-full relative z-20" ref={libraryMenuRef}>
                                <button 
                                    onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) setIsLibraryOpen(!isLibraryOpen); }}
                                    className="w-full flex items-center justify-between text-[10px] bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors shadow-lg"
                                >
                                    <span className="truncate flex-1 text-left font-bold">{activeMusicTrack ? activeMusicTrack.name : 'Select Music Track...'}</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform ml-2 ${isLibraryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isLibraryOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-4 bg-[#0f172a] border border-slate-600 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1 animate-fade-in">
                                        {musicLibrary.length > 0 ? (
                                            musicLibrary.map(track => (
                                                <div 
                                                    key={track.id} 
                                                    onClick={() => { setActiveMusicId(track.id); setIsLibraryOpen(false); }} 
                                                    className={`flex items-center justify-between p-2 cursor-pointer rounded hover:bg-slate-800 transition-colors ${activeMusicId === track.id ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
                                                >
                                                    <span className="text-[10px] truncate max-w-[150px] font-bold">{track.name}</span>
                                                    <button onClick={(e) => removeTrackFromLibrary(e, track.id)} className="text-slate-600 hover:text-red-500 p-1"><TrashIcon className="w-3 h-3"/></button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-center text-slate-500 py-4 italic">No tracks loaded</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: PRESETS (4 Cols - 2x4 Grid) */}
                        <div className="lg:col-span-4 bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col h-96 relative">
                             {!isPaidUser && <div className="absolute top-4 right-4 z-10 text-slate-600"><LockIcon className="w-4 h-4"/></div>}
                             <div className="w-full flex items-center mb-4 border-b border-slate-700 pb-2 shrink-0 gap-3">
                                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">PRESETS</div>
                             </div>
                             <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto pr-1 custom-scrollbar content-start">
                                 <button 
                                    onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) { setPresetName('Default'); setSettings({...AUDIO_PRESETS[0].settings});} }} 
                                    className={`col-span-2 w-full px-2 py-4 rounded font-bold border transition-all text-center uppercase tracking-wide text-xs ${presetName==='Default' ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                >
                                    RESET DEFAULT
                                </button>
                                {AUDIO_PRESETS.slice(1).map(p => (
                                    <button 
                                        key={p.name} 
                                        onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) { setPresetName(p.name); setSettings({...p.settings});} }} 
                                        className={`w-full px-1 py-4 rounded font-bold border transition-all text-center truncate hover:scale-[1.02] active:scale-95 text-[10px] flex items-center justify-center ${presetName===p.name ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                        title={p.label[uiLanguage === 'ar' ? 'ar' : 'en']}
                                    >
                                        {p.label[uiLanguage === 'ar' ? 'ar' : 'en']}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Bottom Knobs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center relative">
                            {!isPaidUser && <div className="absolute top-2 right-2 z-10 text-slate-600"><LockIcon className="w-3 h-3"/></div>}
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Time Stretch</div>
                            <Knob label="SPEED" value={settings.speed * 50} min={25} max={100} onChange={(v) => updateSetting('speed', v/50)} onClickCapture={handleRestrictedAction} />
                        </div>
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center relative">
                            {!isPaidUser && <div className="absolute top-2 right-2 z-10 text-slate-600"><LockIcon className="w-3 h-3"/></div>}
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Ambience</div>
                            <Knob label="REVERB" value={settings.reverb} onChange={(v) => updateSetting('reverb', v)} onClickCapture={handleRestrictedAction} />
                        </div>
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center relative">
                            {!isPaidUser && <div className="absolute top-2 right-2 z-10 text-slate-600"><LockIcon className="w-3 h-3"/></div>}
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Dynamics</div>
                            <Knob label="COMPRESSOR" value={settings.compression} onChange={(v) => updateSetting('compression', v)} color="purple" onClickCapture={handleRestrictedAction} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    function updateSetting<K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) {
        setSettings(prev => ({ ...prev, [key]: value }));
        setPresetName('Default');
    }
};
