
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language } from '../i18n/translations';
import { SawtliLogoIcon, PlayCircleIcon, PauseIcon, DownloadIcon, LoaderIcon, LockIcon, CheckIcon, TrashIcon } from './icons';
import { AudioSettings, AudioPresetName, UserTier } from '../types';
import { AUDIO_PRESETS, processAudio, createMp3Blob, createWavBlob, rawPcmToAudioBuffer } from '../utils/audioUtils';

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
    displaySuffix?: string
}> = ({ label, value, min = 0, max = 100, onChange, color = 'cyan', onClickCapture, displaySuffix = '' }) => {
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270); 

    const handleWheel = (e: React.WheelEvent) => {
        if (onClickCapture) {
            onClickCapture(e as any);
            return; 
        }
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1; 
        const step = (max - min) / 50; 
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

    return (
        <div className="flex flex-col items-center group cursor-pointer" onWheel={handleWheel} onClick={onClickCapture}>
             <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-800 to-black shadow-lg border-2 ${borderColor} flex items-center justify-center mb-2 cursor-ns-resize transition-all`}>
                 <div className="absolute w-full h-full rounded-full pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
                     <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-2.5 rounded-full ${tickColor}`}></div>
                 </div>
                 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0f172a] border border-slate-700 flex items-center justify-center shadow-inner">
                     <span className={`text-[10px] sm:text-xs font-mono font-bold select-none pointer-events-none ${textColor}`}>{Math.round(value * 10) / 10}{displaySuffix}</span>
                 </div>
             </div>
             <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
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

        <div className={`relative w-3 sm:w-4 bg-black rounded-full border border-slate-800 ${height} mb-2 shadow-inner`}>
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
                className="absolute left-1/2 -translate-x-1/2 w-6 sm:w-8 h-4 sm:h-5 bg-gradient-to-b from-slate-600 to-slate-900 rounded shadow-lg border-t border-slate-500 border-b-2 border-black pointer-events-none flex items-center justify-center"
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
    const [voiceDelay, setVoiceDelay] = useState(0); // NEW: Delay in seconds
    const [isVoiceMuted, setIsVoiceMuted] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [autoDucking, setAutoDucking] = useState(false);
    const [duckingActive, setDuckingActive] = useState(false); 
    
    // Export Settings
    const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
    const [exportSource, setExportSource] = useState<'mix' | 'voice'>('mix');
    const [trimToVoice, setTrimToVoice] = useState(true); 
    
    // Buffers
    const [micAudioBuffer, setMicAudioBuffer] = useState<AudioBuffer | null>(null);
    const [musicBuffer, setMusicBuffer] = useState<AudioBuffer | null>(null);
    const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null); 
    
    // File Meta
    const [fileName, setFileName] = useState<string>('Gemini AI Audio');
    const [musicFileName, setMusicFileName] = useState<string | null>(null);
    const [fileDuration, setFileDuration] = useState<number>(0);
    const [musicDuration, setMusicDuration] = useState<number>(0);
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
    
    // Sync Refs with State
    useEffect(() => { musicVolumeRef.current = musicVolume; }, [musicVolume]);
    useEffect(() => { voiceVolumeRef.current = voiceVolume; }, [voiceVolume]);
    useEffect(() => { isMusicMutedRef.current = isMusicMuted; }, [isMusicMuted]);
    useEffect(() => { isVoiceMutedRef.current = isVoiceMuted; }, [isVoiceMuted]);
    useEffect(() => { autoDuckingRef.current = autoDucking; }, [autoDucking]);
    useEffect(() => { voiceDelayRef.current = voiceDelay; }, [voiceDelay]);

    // Update total file duration when Delay changes
    useEffect(() => {
        let total = 0;
        if (voiceBuffer) {
            total = voiceBuffer.duration + voiceDelay;
        }
        if (musicBuffer) {
            // In playback, we usually scroll based on longest track or just logic
            // Here, let's say total is max of voice end and music end
            total = Math.max(total, musicBuffer.duration);
        }
        setFileDuration(total);
    }, [voiceBuffer, musicBuffer, voiceDelay]);

    // Real-time Audio Graph Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const voiceGainRef = useRef<GainNode | null>(null);
    const musicGainRef = useRef<GainNode | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const playAnimationFrameRef = useRef<number>(0);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    // Analyser for Auto Ducking logic
    const duckingAnalyserRef = useRef<AnalyserNode | null>(null);

    const isPaidUser = userTier === 'gold' || userTier === 'platinum' || userTier === 'admin';

    // --- LOCK HANDLER ---
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
        } else {
            document.body.style.overflow = 'unset';
            if (isPlaying) stopPlayback();
            if (isRecording) stopRecording();
        }
    }, [isOpen]);

    // --- LOAD AI AUDIO ---
    useEffect(() => {
        if (activeTab === 'ai' && sourceAudioPCM) {
            const buf = rawPcmToAudioBuffer(sourceAudioPCM);
            setVoiceBuffer(buf);
            // Duration updates via effect above
            setFileName(`Gemini ${voice} Session`);
        }
    }, [activeTab, sourceAudioPCM, voice]);

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    // --- PLAYBACK LOGIC (REAL-TIME MIXING) ---
    const stopPlayback = useCallback(() => {
        if (playAnimationFrameRef.current) {
            cancelAnimationFrame(playAnimationFrameRef.current);
        }
        
        try { if (voiceSourceRef.current) voiceSourceRef.current.stop(); } catch(e){}
        try { if (musicSourceRef.current) musicSourceRef.current.stop(); } catch(e){}
        
        voiceSourceRef.current = null;
        musicSourceRef.current = null;
        duckingAnalyserRef.current = null;
        
        if (!isRecording) setAnalyserNode(null);
        setIsPlaying(false);
        setDuckingActive(false);
    }, [isRecording]);

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
        
        const primaryDuration = Math.max(
            (voiceBuffer ? voiceBuffer.duration + voiceDelay : 0), 
            (musicBuffer ? musicBuffer.duration : 0)
        );

        if (playbackOffsetRef.current >= primaryDuration - 0.1) {
            playbackOffsetRef.current = 0;
        }

        try {
            setIsProcessing(true); 
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();
            
            // --- VOICE GRAPH ---
            let processedVoice: AudioBuffer | null = null;
            let vSource: AudioBufferSourceNode | null = null;
            let vGain: GainNode | null = null;
            let visualizerAnalyser: AnalyserNode | null = null;
            let duckingAnalyser: AnalyserNode | null = null;

            if (voiceBuffer) {
                // Apply DSP settings, pass 0 delay here since we schedule start
                processedVoice = await processAudio(voiceBuffer, settings, null, 0, false, 80, true, 0); 
                
                vSource = ctx.createBufferSource();
                vSource.buffer = processedVoice;
                
                vGain = ctx.createGain();
                vGain.gain.value = isVoiceMuted ? 0 : (voiceVolume / 100);
                
                visualizerAnalyser = ctx.createAnalyser();
                visualizerAnalyser.smoothingTimeConstant = 0.8;
                
                duckingAnalyser = ctx.createAnalyser();
                duckingAnalyser.fftSize = 512; // Faster response

                vSource.connect(vGain).connect(visualizerAnalyser).connect(ctx.destination);
                vSource.connect(duckingAnalyser); 
                
                // Logic for Delay + Seek:
                // We want to start the voice at `voiceDelay`.
                // However, `playbackOffsetRef.current` is the seek position (absolute timeline).
                // 1. If seek pos < delay: Schedule voice to start at `voiceDelay - seekPos` relative to now. Start buffer at 0.
                // 2. If seek pos >= delay: Start voice immediately. Start buffer at `seekPos - voiceDelay`.
                
                const seekPos = playbackOffsetRef.current;
                
                if (seekPos < voiceDelay) {
                    vSource.start(ctx.currentTime + (voiceDelay - seekPos), 0);
                } else {
                    vSource.start(0, seekPos - voiceDelay);
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
                
                if (!vSource && !visualizerAnalyser) {
                     visualizerAnalyser = ctx.createAnalyser();
                     mSource.connect(mGain).connect(visualizerAnalyser).connect(ctx.destination);
                } else {
                     mSource.connect(mGain).connect(ctx.destination);
                     if (visualizerAnalyser) {
                         // Connect Music to Visualizer too for Composite View
                         mGain.connect(visualizerAnalyser);
                     }
                }
                
                const musicOffset = playbackOffsetRef.current % musicBuffer.duration;
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
            setIsProcessing(false);

            // Animation Loop (The Engine)
            const updateUI = () => {
                if (ctx.state === 'running') {
                    const currentSegmentTime = ctx.currentTime - playbackStartTimeRef.current;
                    const actualTime = playbackOffsetRef.current + currentSegmentTime;
                    
                    const voiceEnd = (voiceBuffer && processedVoice) ? (voiceDelay + processedVoice.duration) : 0;
                    const musicEnd = musicBuffer ? musicBuffer.duration : 0;
                    const totalDur = Math.max(voiceEnd, musicEnd);
                    
                    // REAL-TIME MIXING LOGIC (Using Refs to bypass stale closures)
                    const currentMusicVol = isMusicMutedRef.current ? 0 : (musicVolumeRef.current / 100);
                    const currentVoiceVol = isVoiceMutedRef.current ? 0 : (voiceVolumeRef.current / 100);

                    // Update Voice Volume
                    if (vGain) {
                        vGain.gain.setTargetAtTime(currentVoiceVol, ctx.currentTime, 0.05);
                    }

                    // Update Music Volume + Ducking
                    if (mGain) {
                        let targetMusicGain = currentMusicVol;
                        let isDucking = false;

                        // Only check ducking if we are actually past the voice delay
                        if (autoDuckingRef.current && duckingAnalyser && !isMusicMutedRef.current && !isVoiceMutedRef.current) {
                            // Check if voice is actually playing currently (timeline > delay)
                            if (actualTime >= voiceDelayRef.current) {
                                const dataArray = new Uint8Array(duckingAnalyser.frequencyBinCount);
                                duckingAnalyser.getByteTimeDomainData(dataArray);
                                
                                let sum = 0;
                                // Analyze only a portion for speed
                                for(let i = 0; i < dataArray.length; i+=4) {
                                    const v = (dataArray[i] - 128) / 128;
                                    sum += v*v;
                                }
                                const rms = Math.sqrt(sum / (dataArray.length / 4));
                                const threshold = 0.01; 
                                
                                if (rms > threshold) {
                                    targetMusicGain = currentMusicVol * 0.15; // Duck to 15%
                                    isDucking = true;
                                }
                            }
                        }
                        
                        mGain.gain.setTargetAtTime(targetMusicGain, ctx.currentTime, isDucking ? 0.05 : 0.3);
                        setDuckingActive(isDucking);
                    }

                    if (actualTime >= totalDur) {
                        setCurrentTime(totalDur);
                        stopPlayback();
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
                
                // --- BOOST MIC VOLUME (SOFTWARE GAIN 4.0x) ---
                const rawData = decoded.getChannelData(0);
                for (let i = 0; i < rawData.length; i++) {
                    rawData[i] = Math.max(-1, Math.min(1, rawData[i] * 4.0));
                }
                
                setMicAudioBuffer(decoded);
                setVoiceBuffer(decoded); 
                // Don't reset delay here, keep user preference
                // setFileDuration calculated in Effect
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

    // --- FILE HANDLING ---
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
                 setMusicBuffer(decoded);
                 setMusicFileName(file.name);
                 setMusicDuration(decoded.duration);
             } catch (e) { console.error(e); alert("Music load failed"); }
             finally { setIsProcessing(false); }
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

    // --- NEW: REMOVE TRACK HANDLERS ---
    const handleRemoveMusic = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPaidUser) return;
        stopPlayback();
        setMusicBuffer(null);
        setMusicFileName(null);
        setMusicDuration(0);
    };

    const handleRemoveVoice = (e: React.MouseEvent) => {
        e.stopPropagation();
        stopPlayback();
        setVoiceBuffer(null);
        setMicAudioBuffer(null);
        setFileName('No Audio');
        playbackOffsetRef.current = 0;
        setCurrentTime(0);
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
            
            // Handle Mute state during export based on mode
            const finalVoiceVolume = isVoiceMuted ? 0 : voiceVolume;
            const finalMusicVolume = (exportSource === 'voice' || isMusicMuted) ? 0 : musicVolume;

            // Process with Mixing and Ducking
            // PASS voiceDelay here!
            const buffer = await processAudio(
                voiceBuffer, 
                settings, 
                musicBuffer, 
                finalMusicVolume, 
                autoDucking, 
                finalVoiceVolume,
                trimToVoice,
                voiceDelay // NEW Param
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
        
        // Block switch to Upload or Mic tab for non-paid
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
                                {/* Voice Trash Button */}
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
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[100] p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Export Settings</div>
                                            
                                            <div className="mb-4">
                                                <label className="text-xs font-bold text-slate-300 mb-1 block">SOURCE</label>
                                                <div className="flex bg-slate-900 rounded p-1">
                                                    <button 
                                                        onClick={() => setExportSource('mix')} 
                                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${exportSource === 'mix' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        FULL MIX
                                                    </button>
                                                    <button 
                                                        onClick={() => setExportSource('voice')} 
                                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${exportSource === 'voice' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        VOICE ONLY
                                                    </button>
                                                </div>
                                            </div>

                                            {exportSource === 'mix' && (
                                                <div className="mb-4">
                                                    <label className="text-xs font-bold text-slate-300 mb-1 block">DURATION</label>
                                                    <div className="space-y-1">
                                                        <button 
                                                            onClick={() => setTrimToVoice(true)}
                                                            className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-bold flex justify-between items-center ${trimToVoice ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                        >
                                                            <span>End when Voice ends</span>
                                                            {trimToVoice && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                        </button>
                                                        <button 
                                                            onClick={() => setTrimToVoice(false)}
                                                            className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-bold flex justify-between items-center ${!trimToVoice ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                        >
                                                            <span>Keep Full Music Length</span>
                                                            {!trimToVoice && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mb-4">
                                                <label className="text-xs font-bold text-slate-300 mb-1 block">FORMAT</label>
                                                <div className="space-y-1">
                                                    <button 
                                                        onClick={() => setExportFormat('mp3')}
                                                        className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex justify-between items-center ${exportFormat === 'mp3' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                    >
                                                        <span>MP3 <span className="opacity-50 ml-1">320kbps</span></span>
                                                        {exportFormat === 'mp3' && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                    </button>
                                                    <button 
                                                        onClick={() => setExportFormat('wav')}
                                                        className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex justify-between items-center ${exportFormat === 'wav' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:bg-slate-700/50'}`}
                                                    >
                                                        <span>WAV <span className="opacity-50 ml-1">48kHz 24-bit</span></span>
                                                        {exportFormat === 'wav' && <CheckIcon className="w-3 h-3 text-cyan-400"/>}
                                                    </button>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleExportClick} 
                                                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                                            >
                                                <DownloadIcon className="w-3 h-3" /> Download
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
                            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-2 shrink-0">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">BAND EQ-5</div>
                                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
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
                             <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-2 shrink-0">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">MIXER</div>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) onMusicUploadClick(); }} className="text-[9px] bg-slate-800 px-2 py-1 rounded text-amber-400 border border-slate-600 hover:border-amber-400 font-bold uppercase transition-colors">{musicFileName ? 'REPLACE' : 'ADD MUSIC'}</button>
                                    <div className="relative flex items-center">
                                        <button onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) setAutoDucking(!autoDucking); }} className={`text-[9px] px-2 py-1 rounded border font-bold uppercase transition-all ${autoDucking ? 'bg-amber-900/50 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-800 text-slate-500 border-slate-600'}`}>DUCKING</button>
                                        {duckingActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>}
                                    </div>
                                </div>
                             </div>
                             
                             {/* Music Info Display */}
                             <div className="w-full bg-black/30 rounded border border-slate-800/50 p-2 mb-4 text-[10px] font-mono flex justify-between items-center text-slate-400 min-h-[32px] shrink-0 gap-2">
                                 {musicFileName ? (
                                     <>
                                        <span className="truncate text-amber-500/80 max-w-[150px]" title={musicFileName}>♪ {musicFileName}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{Math.floor(musicDuration/60)}:{String(Math.floor(musicDuration%60)).padStart(2,'0')}</span>
                                            {/* Music Trash Button */}
                                            <button onClick={handleRemoveMusic} className="text-slate-600 hover:text-red-500 transition-colors" title="Remove Music">
                                                <TrashIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                     </>
                                 ) : (
                                     <span className="italic text-slate-600 text-center w-full">No music track loaded</span>
                                 )}
                             </div>

                             <div className="flex gap-8 h-full items-end justify-center pb-2 flex-grow overflow-hidden">
                                <Fader label="MONITOR" value={80} onChange={() => {}} height="h-full max-h-[180px]" disabled />
                                <Fader 
                                    label="MUSIC" 
                                    value={musicVolume} 
                                    onChange={setMusicVolume} 
                                    color="amber" 
                                    height="h-full max-h-[180px]" 
                                    disabled={!musicFileName && isPaidUser} 
                                    muted={isMusicMuted}
                                    onMuteToggle={() => setIsMusicMuted(!isMusicMuted)}
                                    onClickCapture={handleRestrictedAction}
                                />
                                <Fader 
                                    label="SOUND" 
                                    value={voiceVolume} 
                                    onChange={setVoiceVolume} 
                                    height="h-full max-h-[180px]" 
                                    disabled={!voiceBuffer} 
                                    muted={isVoiceMuted}
                                    onMuteToggle={() => setIsVoiceMuted(!isVoiceMuted)}
                                    onClickCapture={handleRestrictedAction}
                                />
                             </div>
                        </div>

                        {/* RIGHT: PRESETS (4 Cols - 2x4 Grid) */}
                        <div className="lg:col-span-4 bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col h-96 relative">
                             {!isPaidUser && <div className="absolute top-4 right-4 z-10 text-slate-600"><LockIcon className="w-4 h-4"/></div>}
                             <div className="w-full flex items-center justify-between mb-4 border-b border-slate-700 pb-2 shrink-0">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-left">PRESETS</div>
                                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                             </div>
                             <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto pr-1 custom-scrollbar content-start">
                                 <button 
                                    onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) {stopPlayback(); setPresetName('Default'); setSettings({...AUDIO_PRESETS[0].settings});} }} 
                                    className={`col-span-2 w-full px-2 py-4 rounded font-bold border transition-all text-center uppercase tracking-wide text-xs ${presetName==='Default' ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                >
                                    RESET DEFAULT
                                </button>
                                {AUDIO_PRESETS.slice(1).map(p => (
                                    <button 
                                        key={p.name} 
                                        onClick={(e) => { handleRestrictedAction(e); if(isPaidUser) {stopPlayback(); setPresetName(p.name); setSettings({...p.settings});} }} 
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
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
                        {/* New Voice Delay Knob */}
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center relative">
                            {!isPaidUser && <div className="absolute top-2 right-2 z-10 text-slate-600"><LockIcon className="w-3 h-3"/></div>}
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Voice Start</div>
                            <Knob 
                                label="DELAY (SEC)" 
                                value={voiceDelay} 
                                min={0} 
                                max={10} 
                                onChange={setVoiceDelay} 
                                color="green" 
                                onClickCapture={handleRestrictedAction}
                                displaySuffix="s"
                            />
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
