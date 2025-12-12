
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language } from '../i18n/translations';
import { SawtliLogoIcon, PlayCircleIcon, PauseIcon, DownloadIcon, LoaderIcon, LockIcon, CheckIcon, TrashIcon, SoundEnhanceIcon, ChevronDownIcon, MicrophoneIcon } from './icons';
import { AudioSettings, AudioPresetName, UserTier, MusicTrack, GEMINI_VOICES } from '../types';
import { AUDIO_PRESETS, processAudio, createMp3Blob, createWavBlob, rawPcmToAudioBuffer, decodeAudioData, blobToBase64, base64ToArrayBuffer } from '../utils/audioUtils';

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
    const knobRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number | null>(null);
    const startValueRef = useRef<number>(value);

    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270); 

    const handleMouseDown = (e: React.MouseEvent) => {
        if (onClickCapture) onClickCapture(e);
        e.preventDefault(); 
        startYRef.current = e.clientY;
        startValueRef.current = value;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ns-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (startYRef.current === null) return;
        e.preventDefault();
        const deltaY = startYRef.current - e.clientY;
        const range = max - min;
        const sensitivity = 200; 
        const deltaValue = (deltaY / sensitivity) * range;
        let newValue = startValueRef.current + deltaValue;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };

    const handleMouseUp = () => {
        startYRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'unset';
    };

    const handleWheel = (e: React.WheelEvent) => {
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
    const isRed = color === 'red';

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
    } else if (isRed) {
        borderColor = 'border-red-900/50 group-hover:border-red-500/50';
        tickColor = 'bg-red-400 shadow-[0_0_8px_#f87171]';
        textColor = 'text-red-300';
    }

    const sizeClasses = size === 'sm' ? 'w-10 h-10' : (size === 'md' ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16');
    const innerSizeClasses = size === 'sm' ? 'w-6 h-6' : (size === 'md' ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10');

    return (
        <div className="flex flex-col items-center group cursor-pointer" onWheel={handleWheel} title="Drag up/down or Scroll">
             <div 
                ref={knobRef}
                onMouseDown={handleMouseDown}
                className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-slate-800 to-black shadow-lg border-2 ${borderColor} flex items-center justify-center mb-2 cursor-ns-resize transition-all active:scale-95`}
             >
                 <div className="absolute w-full h-full rounded-full pointer-events-none" style={{ transform: `rotate(${rotation}deg)` }}>
                     <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 sm:w-1.5 sm:h-2.5 rounded-full ${tickColor}`}></div>
                 </div>
                 <div className={`${innerSizeClasses} rounded-full bg-[#0f172a] border border-slate-700 flex items-center justify-center shadow-inner`}>
                     <span className={`text-[8px] sm:text-[10px] sm:text-xs font-mono font-bold select-none pointer-events-none ${textColor}`}>{Math.round(value * 10) / 10}{displaySuffix}</span>
                 </div>
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors text-center leading-tight select-none">{label}</span>
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
                        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
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
        <span className={`${labelSize} font-bold text-slate-400 group-hover:text-slate-200 uppercase tracking-wider mt-1 text-center leading-tight select-none`}>{label}</span>
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
        <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase select-none">{label}</span>
        <span className={`text-[8px] sm:text-[10px] font-mono font-bold ${value !== 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{value > 0 ? `+${value}` : value}dB</span>
    </div>
);

// Helper for Impulse Response
function createImpulseResponse(ctx: BaseAudioContext, duration: number, decay: number, reverse: boolean): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        const amount = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        left[i] = amount;
        right[i] = amount;
    }
    return impulse;
}

export const AudioStudioModal: React.FC<AudioStudioModalProps> = ({ isOpen = true, onClose, uiLanguage, voice, sourceAudioPCM, allowDownloads = false, onUpgrade, userTier = 'visitor' }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'mic' | 'upload'>('ai');
    const [presetName, setPresetName] = useState<AudioPresetName>('Default');
    const [settings, setSettings] = useState<AudioSettings>(AUDIO_PRESETS[0].settings);
    
    const [voiceVolume, setVoiceVolume] = useState(80);
    const [musicVolume, setMusicVolume] = useState(40);
    const [voiceDelay, setVoiceDelay] = useState(0); 
    const [isVoiceMuted, setIsVoiceMuted] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [autoDucking, setAutoDucking] = useState(false);
    const [duckingActive, setDuckingActive] = useState(false); 
    const [echo, setEcho] = useState(0); 
    const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
    const [exportSource, setExportSource] = useState<'mix' | 'voice'>('mix');
    const [trimToVoice, setTrimToVoice] = useState(true); 
    const [micAudioBuffer, setMicAudioBuffer] = useState<AudioBuffer | null>(null);
    const [musicLibrary, setMusicLibrary] = useState<MusicTrack[]>([]);
    const [activeMusicId, setActiveMusicId] = useState<string | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null); 
    const [fileName, setFileName] = useState<string>(''); 
    
    const activeMusicTrack = musicLibrary.find(t => t.id === activeMusicId) || null;
    const musicBuffer = activeMusicTrack?.buffer || null;
    const musicFileName = activeMusicTrack?.name || null;

    const [projectName, setProjectName] = useState<string>('New Project'); // Project Name (Master)
    const [fileDuration, setFileDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [voiceAnalyserNode, setVoiceAnalyserNode] = useState<AnalyserNode | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);
    
    // Refs for Real-Time DSP Control
    const audioContextRef = useRef<AudioContext | null>(null);
    const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const voiceGainRef = useRef<GainNode | null>(null);
    const musicGainRef = useRef<GainNode | null>(null);
    const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
    const reverbGainRef = useRef<GainNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const echoGainRef = useRef<GainNode | null>(null);
    const pannerNodeRef = useRef<StereoPannerNode | null>(null);
    const voiceAnalyserRef = useRef<AnalyserNode | null>(null);

    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const playAnimationFrameRef = useRef<number>(0);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const libraryMenuRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // STATE REFS FOR ANIMATION LOOP
    const musicVolumeRef = useRef(musicVolume);
    const voiceVolumeRef = useRef(voiceVolume);
    const isMusicMutedRef = useRef(isMusicMuted);
    const isVoiceMutedRef = useRef(isVoiceMuted);
    const autoDuckingRef = useRef(autoDucking);
    const voiceDelayRef = useRef(voiceDelay);
    const settingsRef = useRef(settings);
    const echoRef = useRef(echo);
    
    // Auto Ducking Hold Ref
    const lastSpeechTimeRef = useRef<number>(0);

    const isPaidUser = userTier !== 'visitor' && userTier !== 'free';
    const canUploadVoice = userTier === 'gold' || userTier === 'professional' || userTier === 'admin' || userTier === 'basic' || userTier === 'creator';
    const canUseMic = isPaidUser; 

    // --- RE-SYNC SETTINGS TO AUDIO GRAPH ---
    useEffect(() => { musicVolumeRef.current = musicVolume; }, [musicVolume]);
    useEffect(() => { voiceVolumeRef.current = voiceVolume; }, [voiceVolume]);
    useEffect(() => { isMusicMutedRef.current = isMusicMuted; }, [isMusicMuted]);
    useEffect(() => { isVoiceMutedRef.current = isVoiceMuted; }, [isVoiceMuted]);
    useEffect(() => { autoDuckingRef.current = autoDucking; }, [autoDucking]);
    useEffect(() => { voiceDelayRef.current = voiceDelay; }, [voiceDelay]);
    useEffect(() => { settingsRef.current = settings; }, [settings]);
    useEffect(() => { echoRef.current = echo; }, [echo]);

    // Live Parameter Updates
    useEffect(() => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const now = ctx.currentTime;
        const rampTime = 0.1; // Smooth transition for general sliders

        // Voice Volume
        if (voiceGainRef.current) {
            const targetVol = isVoiceMuted ? 0 : (voiceVolume / 100);
            voiceGainRef.current.gain.setTargetAtTime(targetVol, now, rampTime);
        }
        
        // Speed
        if (voiceSourceRef.current) {
            voiceSourceRef.current.playbackRate.setValueAtTime(settings.speed, now);
        }

        // EQ
        if (eqFiltersRef.current.length > 0) {
            eqFiltersRef.current.forEach((filter, i) => {
                if (filter) filter.gain.setTargetAtTime(settings.eqBands[i] || 0, now, rampTime);
            });
        }

        // Reverb Mix
        if (reverbGainRef.current && dryGainRef.current) {
            const mix = settings.reverb / 100;
            reverbGainRef.current.gain.setTargetAtTime(mix, now, rampTime);
            dryGainRef.current.gain.setTargetAtTime(1 - (mix * 0.5), now, rampTime);
        }

        // Echo Gain
        if (echoGainRef.current) {
            echoGainRef.current.gain.setTargetAtTime(echo / 100, now, rampTime);
        }

        // Compressor
        if (compressorRef.current) {
            const compAmount = settings.compression / 100;
            compressorRef.current.threshold.setTargetAtTime(-10 - (compAmount * 40), now, rampTime);
            compressorRef.current.ratio.setTargetAtTime(1 + (compAmount * 11), now, rampTime);
        }

        // Pan
        if (pannerNodeRef.current) {
            const panVal = Math.max(-1, Math.min(1, settings.stereoWidth / 100));
            pannerNodeRef.current.pan.setTargetAtTime(panVal, now, rampTime);
        }

    }, [settings, voiceVolume, isVoiceMuted, echo, isPlaying]); 

    // --- HOT SWAP MUSIC BUFFER ---
    useEffect(() => {
        if (isPlaying && musicBuffer && audioContextRef.current) {
            // Stop old
            try { musicSourceRef.current?.stop(); } catch(e){}
            
            // Create new
            const ctx = audioContextRef.current;
            const newSource = ctx.createBufferSource();
            newSource.buffer = musicBuffer;
            newSource.loop = true;
            
            // Connect to EXISTING gain node to keep volume/ducking settings
            if (musicGainRef.current) {
                newSource.connect(musicGainRef.current);
                
                // Sync start time
                const offset = playbackOffsetRef.current;
                // Music loops, so modulo duration
                const startOffset = offset % musicBuffer.duration;
                
                newSource.start(0, startOffset);
                musicSourceRef.current = newSource;
            }
        } else if (isPlaying && !musicBuffer) {
             try { musicSourceRef.current?.stop(); } catch(e){}
             musicSourceRef.current = null;
        }
    }, [musicBuffer]); // Dependency on the buffer object

    useEffect(() => {
        let total = 0;
        const currentSpeed = settings.speed || 1.0;
        // NOTE: voiceBuffer.duration includes the 4.0s physical padding.
        const voiceEnd = voiceBuffer ? voiceDelay + (voiceBuffer.duration / currentSpeed) : 0;
        const musicEnd = musicBuffer ? musicBuffer.duration : 0;

        if (trimToVoice && voiceBuffer) {
            // VISUAL FIX: Matches the new tight export logic. 
            // voiceEnd already includes the 4s padding which contains the fade out.
            // No extra padding added here.
            total = voiceEnd; 
        } else {
            total = Math.max(voiceEnd, musicEnd);
        }
        setFileDuration(Math.max(1, total));
    }, [voiceBuffer, musicBuffer, voiceDelay, trimToVoice, settings.speed]);

    const handleRestrictedAction = (e: React.MouseEvent) => {
        if (!isPaidUser) {
            e.preventDefault();
            e.stopPropagation();
            if (onUpgrade) onUpgrade();
        }
    };

    // --- INIT & CLEANUP ---
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            setInputDevices(audioInputs);
        });
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setShowExportMenu(false);
            if (libraryMenuRef.current && !libraryMenuRef.current.contains(event.target as Node)) setIsLibraryOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('mousedown', handleClickOutside);
            stopPlayback();
            stopRecording();
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
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

    // --- LOAD AUDIO LOGIC ---
    useEffect(() => {
        if (activeTab === 'ai' && sourceAudioPCM) {
            const loadAudio = async () => {
                const ctx = getAudioContext();
                try {
                    let buf;
                    try {
                        const bufferCopy = sourceAudioPCM.slice(0).buffer;
                        buf = await ctx.decodeAudioData(bufferCopy);
                    } catch(e) {
                        buf = rawPcmToAudioBuffer(sourceAudioPCM);
                    }
                    setVoiceBuffer(buf);
                    // Don't set filename here to sourceAudioPCM if we already have a project name logic
                    // But if it's a fresh load from main app, we can use a default
                    if (projectName === 'New Project') {
                        setProjectName(`Project ${new Date().toLocaleDateString()}`);
                    }
                } catch (e) {
                    console.error("Failed to load audio", e);
                }
            };
            loadAudio();
        }
    }, [activeTab, sourceAudioPCM, voice]);

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    const stopPlayback = useCallback(() => { 
        if (playAnimationFrameRef.current) cancelAnimationFrame(playAnimationFrameRef.current); 
        
        if (voiceSourceRef.current) try { voiceSourceRef.current.stop(); voiceSourceRef.current.disconnect(); } catch(e){} 
        if (musicSourceRef.current) try { musicSourceRef.current.stop(); musicSourceRef.current.disconnect(); } catch(e){} 
        
        voiceSourceRef.current = null; 
        musicSourceRef.current = null; 
        setAnalyserNode(null); 
        setVoiceAnalyserNode(null);
        voiceAnalyserRef.current = null;
        setIsPlaying(false); 
        setDuckingActive(false); 
        setIsProcessing(false); 
    }, [isRecording]);

    const handlePlayPause = async () => {
        if (isPlaying) {
            if (audioContextRef.current) {
                const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
                playbackOffsetRef.current += elapsed * settings.speed; 
            }
            stopPlayback();
        } else {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();

            // --- BUILD GRAPH ---
            // Voice Path
            let voiceOut: AudioNode | null = null;
            if (voiceBuffer) {
                const source = ctx.createBufferSource();
                source.buffer = voiceBuffer;
                source.playbackRate.value = settings.speed;
                voiceSourceRef.current = source;
                
                const vGain = ctx.createGain();
                vGain.gain.value = isVoiceMuted ? 0 : (voiceVolume / 100);
                voiceGainRef.current = vGain;

                // Voice Analyser for Ducking - Using Ref for immediate access in loop
                const vAnalyser = ctx.createAnalyser();
                vAnalyser.fftSize = 256; 
                setVoiceAnalyserNode(vAnalyser);
                voiceAnalyserRef.current = vAnalyser; // CRITICAL FIX: Save to Ref

                // Chain
                let head: AudioNode = source;
                
                // EQ
                const frequencies = [60, 250, 1000, 4000, 12000];
                eqFiltersRef.current = frequencies.map((freq, i) => {
                    const filter = ctx.createBiquadFilter();
                    filter.type = i === 0 ? 'lowshelf' : (i === 4 ? 'highshelf' : 'peaking');
                    filter.frequency.value = freq;
                    filter.gain.value = settings.eqBands[i] || 0;
                    return filter;
                });
                eqFiltersRef.current.forEach(f => { head.connect(f); head = f; });

                // Compressor
                const comp = ctx.createDynamicsCompressor();
                comp.threshold.value = -10 - (settings.compression / 100 * 40);
                comp.ratio.value = 1 + (settings.compression / 100 * 11);
                head.connect(comp);
                head = comp;
                compressorRef.current = comp;

                // Split for Parallel Effects
                const dryNode = head; 
                
                // Reverb
                const rev = ctx.createConvolver();
                const revDuration = 2.0; 
                rev.buffer = createImpulseResponse(ctx, revDuration, 2.0, false);
                const revGain = ctx.createGain();
                const dryGain = ctx.createGain();
                revGain.gain.value = settings.reverb / 100;
                dryGain.gain.value = 1 - (settings.reverb / 200);
                
                reverbGainRef.current = revGain;
                dryGainRef.current = dryGain;
                
                dryNode.connect(dryGain);
                dryNode.connect(rev); rev.connect(revGain);
                
                const reverbMerge = ctx.createGain();
                dryGain.connect(reverbMerge);
                revGain.connect(reverbMerge);
                head = reverbMerge;

                // Echo
                const delay = ctx.createDelay();
                delay.delayTime.value = 0.4;
                const feedback = ctx.createGain();
                feedback.gain.value = 0.3;
                const eGain = ctx.createGain();
                eGain.gain.value = echo / 100;
                echoGainRef.current = eGain;

                head.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(eGain);
                
                const echoMerge = ctx.createGain();
                head.connect(echoMerge);
                eGain.connect(echoMerge);
                head = echoMerge;

                // Panner
                const panner = ctx.createStereoPanner();
                panner.pan.value = Math.max(-1, Math.min(1, settings.stereoWidth / 100));
                pannerNodeRef.current = panner;
                head.connect(panner);
                head = panner;

                head.connect(vGain);
                // Also connect to analyser for ducking
                source.connect(vAnalyser);
                
                voiceOut = vGain;
            }

            // Music Path
            let musicOut: AudioNode | null = null;
            if (musicBuffer) {
                const source = ctx.createBufferSource();
                source.buffer = musicBuffer;
                source.loop = true;
                musicSourceRef.current = source;
                
                const mGain = ctx.createGain();
                // Initial volume
                mGain.gain.value = isMusicMutedRef.current ? 0 : (musicVolumeRef.current / 100);
                musicGainRef.current = mGain;
                
                source.connect(mGain);
                musicOut = mGain;
            }

            // Master Mix
            const masterGain = ctx.createGain();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            setAnalyserNode(analyser);

            if (voiceOut) voiceOut.connect(masterGain);
            if (musicOut) musicOut.connect(masterGain);
            
            masterGain.connect(analyser);
            analyser.connect(ctx.destination);

            // Start Time
            const startTime = ctx.currentTime;
            playbackStartTimeRef.current = startTime;
            
            const delayTime = voiceDelay;
            const currentOffset = playbackOffsetRef.current;
            
            if (voiceSourceRef.current) {
                if (currentOffset < delayTime) {
                    voiceSourceRef.current.start(startTime + (delayTime - currentOffset));
                } else {
                    voiceSourceRef.current.start(startTime, currentOffset - delayTime); 
                }
            }
            if (musicSourceRef.current) {
                musicSourceRef.current.start(startTime, currentOffset % musicBuffer!.duration);
            }

            setIsPlaying(true);

            // Animation Loop (Updates UI & DUCKING & VOLUME)
            const updateUI = () => {
                if (!isPlaying && ctx.state !== 'running') return;
                const now = ctx.currentTime;
                const totalTime = playbackOffsetRef.current + ((now - startTime) * settingsRef.current.speed);
                setCurrentTime(totalTime);

                const currentMusicGain = musicGainRef.current;
                const isMusicMuted = isMusicMutedRef.current;
                const duckingOn = autoDuckingRef.current;
                const manualVol = musicVolumeRef.current / 100;
                
                // CRITICAL FIX: Use Ref instead of state variable for analyser access in loop
                const duckingAnalyser = voiceAnalyserRef.current;

                // --- REAL-TIME AUTO DUCKING & VOLUME LOGIC ---
                // We handle ALL volume logic here to prevent fighting between loop and useEffect
                if (currentMusicGain) {
                    let targetVol = isMusicMuted ? 0 : manualVol;

                    if (duckingOn && duckingAnalyser && !isMusicMuted) {
                        const data = new Uint8Array(duckingAnalyser.frequencyBinCount);
                        duckingAnalyser.getByteTimeDomainData(data);
                        
                        let sum = 0;
                        for(let i = 0; i < data.length; i++) {
                            const val = (data[i] - 128) / 128;
                            sum += val * val;
                        }
                        const rms = Math.sqrt(sum / data.length);
                        
                        // Threshold Tuning: 0.005 is very sensitive
                        const threshold = 0.005;
                        const isTalking = rms > threshold;
                        
                        if (isTalking) {
                            lastSpeechTimeRef.current = now; // Update timestamp of last speech
                            targetVol = manualVol * 0.2; // Duck to 20%
                            setDuckingActive(true);
                            // FAST ATTACK: 0.05s - Instant drop for live preview snappy feel
                            currentMusicGain.gain.setTargetAtTime(targetVol, now, 0.05);
                        } else {
                            // HOLD TIME: 1.2s - The Sweet Spot for poetry bridging
                            // Wait 1.2s to ensure the sentence is truly done, then release.
                            if (now - lastSpeechTimeRef.current > 1.2) {
                                setDuckingActive(false);
                                // RELEASE: 1.0s - Smoother return
                                currentMusicGain.gain.setTargetAtTime(targetVol, now, 1.0);
                            }
                        }
                    } else {
                        // Ducking OFF: Enforce manual volume
                        setDuckingActive(false);
                        
                        // SMOOTHER TRANSITION FOR MANUAL/MUTE CHANGES
                        // Increased from 0.05s to 0.5s for fade effect if muted, 0.3s for slider
                        const ramp = isMusicMuted ? 0.5 : 0.3;
                        currentMusicGain.gain.setTargetAtTime(targetVol, now, ramp);
                    }
                }

                if (voiceBuffer && totalTime >= fileDuration) {
                    handleSeek({ target: { value: 0 } } as any); 
                    stopPlayback();
                    return;
                }
                playAnimationFrameRef.current = requestAnimationFrame(updateUI);
            };
            playAnimationFrameRef.current = requestAnimationFrame(updateUI);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        playbackOffsetRef.current = time;
        if (isPlaying) {
            stopPlayback();
            setTimeout(() => handlePlayPause(), 10);
        }
    };

    const handleVoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const ctx = getAudioContext();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            setVoiceBuffer(audioBuffer);
            
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            setFileName(cleanName);
            // Default project name if empty
            if (projectName === 'New Project') {
                setProjectName(cleanName);
            }
            // CRITICAL FIX: Set active tab to upload so button lights up
            setActiveTab('upload');
            
            stopPlayback();
            setCurrentTime(0);
            playbackOffsetRef.current = 0;
        } catch (err) {
            console.error("Error decoding voice file", err);
            alert("Could not decode audio file.");
        }
    };

    const handleMusicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // NO NEED TO STOP PLAYBACK HERE ANYMORE
        // We let the useEffect hot-swap logic handle it

        try {
            const arrayBuffer = await file.arrayBuffer();
            const ctx = getAudioContext();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            
            const newTrack: MusicTrack = {
                id: Date.now().toString(),
                name: file.name,
                buffer: audioBuffer,
                duration: audioBuffer.duration
            };
            
            setMusicLibrary(prev => [...prev, newTrack]);
            setActiveMusicId(newTrack.id);
            // Don't auto-play if paused, but update buffer logic will handle hot swap if playing
        } catch (err) {
            console.error("Error decoding music file", err);
            alert("Could not decode music file.");
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices) return;
        
        // BUG FIX: Prevent accidental voice overwrite. Check if voice buffer exists.
        if (voiceBuffer) {
            const confirmReplace = window.confirm(uiLanguage === 'ar' ? 'هل تريد استبدال المقطع الصوتي الحالي بتسجيل جديد؟' : 'Replace current voice track with new recording?');
            if (!confirmReplace) return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedDeviceId } });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recordingChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const ctx = getAudioContext();
                const audioBuf = await ctx.decodeAudioData(arrayBuffer);
                setMicAudioBuffer(audioBuf);
                
                // Only replace voice buffer if user is still on Mic tab
                if (activeTab === 'mic') {
                    setVoiceBuffer(audioBuf);
                    setFileName("New Recording");
                    if (projectName === 'New Project') {
                        setProjectName("Recording Session");
                    }
                }
            };
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
            const ctx = getAudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            source.connect(analyser);
            setAnalyserNode(analyser);
        } catch (e) {
            console.error(e);
            alert("Microphone access denied or error.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            clearInterval(timerIntervalRef.current);
            setIsRecording(false);
            setAnalyserNode(null);
        }
    };

    const removeTrackFromLibrary = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMusicLibrary(prev => prev.filter(t => t.id !== id));
        if (activeMusicId === id) setActiveMusicId(null);
    };

    const handleRemoveVoice = () => {
        if (!voiceBuffer) return;
        const confirmDelete = window.confirm(uiLanguage === 'ar' 
            ? 'هل أنت متأكد من حذف المقطع الصوتي من المشروع؟ هذا لن يحذف الملف الأصلي من جهازك.' 
            : 'Remove voice track from this project? This will not delete the original file from your device.');
        
        if (confirmDelete) {
            setVoiceBuffer(null);
            setFileName('');
            stopPlayback();
        }
    };

    const onMusicUploadClick = () => { if (!isPaidUser) { if (onUpgrade) onUpgrade(); return; } musicInputRef.current?.click(); };
    const onReplaceVoiceClick = (e: React.MouseEvent) => { if (!canUploadVoice) { e.preventDefault(); e.stopPropagation(); if (onUpgrade) onUpgrade(); return; } if (fileInputRef.current) fileInputRef.current.click(); };
    
    const handleTabSwitch = (tab: 'ai' | 'mic' | 'upload') => { 
        if (activeTab === tab) return; 
        if (tab === 'mic' && !canUseMic) { if (onUpgrade) onUpgrade(); return; } 
        if (tab === 'upload' && !canUploadVoice) { if (onUpgrade) onUpgrade(); return; } 
        
        stopPlayback(); 
        setActiveTab(tab); 
    };

    const performDownload = async () => {
        setIsProcessing(true);
        try {
            const renderedBuffer = await processAudio(
                voiceBuffer,
                settings,
                activeMusicTrack?.buffer || null,
                musicVolume,
                autoDucking,
                voiceVolume,
                trimToVoice,
                voiceDelay,
                echo
            );
            let blob;
            if (exportFormat === 'wav') {
                blob = createWavBlob(renderedBuffer, 2, renderedBuffer.sampleRate);
            } else {
                blob = await createMp3Blob(renderedBuffer, 2, renderedBuffer.sampleRate, 192);
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sawtli_studio_mix.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
            alert("Export failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportClick = () => { setShowExportMenu(false); if (!allowDownloads) { if (onUpgrade) onUpgrade(); return; } performDownload(); };

    // --- SAVE PROJECT (OPTIMIZED MP3) ---
    // Helper to perform the actual download
    const triggerSaveDownload = async (name: string) => {
        setIsProcessing(true);
        try {
            // 1. Serialize Voice Buffer (AS MP3 320KBPS)
            let voiceBase64 = null;
            if (voiceBuffer) {
                const mp3Blob = await createMp3Blob(voiceBuffer, voiceBuffer.numberOfChannels, voiceBuffer.sampleRate, 320);
                voiceBase64 = await blobToBase64(mp3Blob);
            }

            // 2. Serialize Active Music (AS MP3 320KBPS)
            let musicBase64 = null;
            if (activeMusicTrack && activeMusicTrack.buffer) {
                const mp3Blob = await createMp3Blob(activeMusicTrack.buffer, activeMusicTrack.buffer.numberOfChannels, activeMusicTrack.buffer.sampleRate, 320);
                musicBase64 = await blobToBase64(mp3Blob);
            }

            // 3. Construct Project Object
            const projectData = {
                version: 1,
                date: Date.now(),
                name: name,
                voiceBase64,
                musicBase64,
                musicName: activeMusicTrack?.name || '',
                presetName: presetName, // Ensure preset name is saved
                settings: settings, 
                mixer: {
                    voiceVolume, musicVolume, voiceDelay, isVoiceMuted, isMusicMuted, 
                    autoDucking, trimToVoice, echo
                }
            };

            const jsonString = JSON.stringify(projectData);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Clean filename
            const cleanName = name.replace(/[^a-z0-9_\u0600-\u06FF\s-]/gi, '_').trim();
            const fileNameWithExt = `${cleanName}.saw`; // Changed from .sawtli

            // --- MODERN SAVE: File System Access API ---
            // If browser supports it, show a real "Save As" dialog
            // @ts-ignore
            if (window.showSaveFilePicker) {
                try {
                    // @ts-ignore
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileNameWithExt,
                        types: [{
                            description: 'Sawtli Project File',
                            accept: { 'application/json': ['.saw'] },
                        }],
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return; // Success, exit
                } catch (err: any) {
                    // Fail silently if user canceled picker
                    if (err.name === 'AbortError') return;
                    console.warn("File System Access API failed, falling back to download", err);
                }
            }

            // --- FALLBACK: Standard Download ---
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileNameWithExt;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Notify user where it went since we couldn't show a dialog
            alert(uiLanguage === 'ar' 
                ? `تم حفظ المشروع في مجلد "التنزيلات" باسم ${fileNameWithExt}` 
                : `Project saved to your Downloads folder as ${fileNameWithExt}`);

        } catch (e) {
            console.error("Save failed:", e);
            alert(uiLanguage === 'ar' ? "فشل حفظ المشروع" : "Failed to save project");
        } finally {
            setIsProcessing(false);
        }
    };

    // "SAVE": Updates current project (Quick Save)
    const handleSaveProject = () => {
        if (!voiceBuffer) return;
        triggerSaveDownload(projectName);
    };

    // --- LOAD PROJECT ---
    const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        // --- RESTRICTION FOR FREE/VISITOR USERS ---
        if (userTier === 'free' || userTier === 'visitor') {
            e.preventDefault();
            // Clear input so change event can fire again if they upgrade and try again
            if (e.target) e.target.value = '';
            if (onUpgrade) onUpgrade();
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        
        reader.onload = async (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                const ctx = getAudioContext();

                // 1. Restore Mixer State
                if (json.mixer) {
                    setVoiceVolume(json.mixer.voiceVolume ?? 80);
                    setMusicVolume(json.mixer.musicVolume ?? 40);
                    setVoiceDelay(json.mixer.voiceDelay ?? 0);
                    setIsVoiceMuted(json.mixer.isVoiceMuted ?? false);
                    setIsMusicMuted(json.mixer.isMusicMuted ?? false);
                    setAutoDucking(json.mixer.autoDucking ?? false);
                    setTrimToVoice(json.mixer.trimToVoice ?? true);
                    setEcho(json.mixer.echo ?? 0);
                }

                // 2. Restore DSP Settings & Preset Visuals
                if (json.settings) {
                    setSettings(json.settings);
                }
                
                // VISUAL FIX: Explicitly set preset name to light up the button
                if (json.presetName) {
                    setPresetName(json.presetName);
                } else {
                    setPresetName('Default');
                }

                // 3. Restore Name
                if (json.name) {
                    setProjectName(json.name);
                    // Don't overwrite filename visual if possible, or set it to project name
                    setFileName(json.name); 
                }

                // 4. Restore Voice Audio
                if (json.voiceBase64) {
                    const arrayBuffer = base64ToArrayBuffer(json.voiceBase64);
                    // decodeAudioData needs a copy or it detaches
                    const audioBuf = await ctx.decodeAudioData(arrayBuffer);
                    setVoiceBuffer(audioBuf);
                    
                    // Update active tab logic if needed
                    setActiveTab('upload'); 
                }

                // 5. Restore Music
                if (json.musicBase64) {
                    const arrayBuffer = base64ToArrayBuffer(json.musicBase64);
                    const audioBuf = await ctx.decodeAudioData(arrayBuffer);
                    
                    const restoredTrack: MusicTrack = {
                        id: Date.now().toString(),
                        name: json.musicName || 'Restored Music',
                        buffer: audioBuf,
                        duration: audioBuf.duration
                    };
                    setMusicLibrary([restoredTrack]);
                    setActiveMusicId(restoredTrack.id);
                }

                alert(uiLanguage === 'ar' ? "تم استعادة المشروع بنجاح!" : "Project restored successfully!");

            } catch (err) {
                console.error("Load failed:", err);
                alert(uiLanguage === 'ar' ? "فشل فتح ملف المشروع. تأكد من الصيغة." : "Failed to load project file. Check format.");
            } finally {
                setIsProcessing(false);
                // Clear input so same file can be selected again
                if (projectInputRef.current) projectInputRef.current.value = '';
            }
        };
        
        reader.readAsText(file);
    };

    function updateSetting<K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) {
        setSettings(prev => ({ ...prev, [key]: value }));
        // Don't reset preset name, allow "modified" state implicitly or handle UI elsewhere
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col animate-fade-in-down h-[100dvh]">
            <div className="bg-[#0f172a] border-b border-slate-800 shrink-0 w-full" dir="ltr">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between select-none">
                    <div className="flex items-center">
                        <SawtliLogoIcon className="h-16 sm:h-20 w-auto" />
                    </div>
                    
                    <div className="flex items-center gap-6">
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
                            <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[300px]">
                                {voiceBuffer ? (
                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2">
                                        <input 
                                            type="text" 
                                            value={projectName} 
                                            onChange={(e) => setProjectName(e.target.value)} 
                                            className="bg-transparent border-none focus:ring-0 text-slate-300 text-[10px] sm:text-xs font-bold w-full outline-none py-1"
                                            placeholder="Project Name"
                                        />
                                        <button onClick={handleRemoveVoice} className="text-slate-500 hover:text-red-500 transition-colors ml-2" title="Remove Voice"><TrashIcon className="w-3 h-3" /></button>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider ml-auto">No Voice Track</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* REDESIGNED COMPACT CONTROL DECK */}
                    <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700 shadow-xl relative z-40" dir="ltr">
                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            
                            {/* Left Group: Input Sources */}
                            <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                                <button onClick={onReplaceVoiceClick} className={`h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'upload' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} ${!canUploadVoice ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <span>{t('studioInputFile', uiLanguage)}</span>
                                    {!canUploadVoice && <LockIcon className="w-3 h-3 absolute top-1 right-1 text-slate-500" />}
                                </button>
                                <button 
                                    onClick={() => handleTabSwitch('mic')} 
                                    className={`h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'mic' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} ${!canUseMic ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <MicrophoneIcon className="w-4 h-4"/> <span>{t('studioInputMic', uiLanguage)}</span>
                                    {!canUseMic && <LockIcon className="w-3 h-3 absolute top-1 right-1 text-slate-500" />}
                                </button>
                                <button onClick={() => handleTabSwitch('ai')} className={`h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'ai' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    <span>{t('studioInputAi', uiLanguage)}</span>
                                </button>
                            </div>
                            
                            {/* Center: Playback (Hero Button) */}
                            <div className="flex-shrink-0 flex flex-col justify-center items-center gap-2">
                                 {activeTab === 'mic' && isRecording ? (
                                     <button onClick={stopRecording} className="w-20 h-14 rounded-xl flex items-center justify-center border-2 border-red-500 bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse hover:scale-105 transition-transform">
                                         <div className="w-6 h-6 rounded-sm bg-red-500"></div>
                                     </button>
                                 ) : activeTab === 'mic' ? (
                                     <button onClick={startRecording} className="w-20 h-14 rounded-xl flex items-center justify-center bg-red-600 text-white shadow-lg hover:bg-red-500 hover:scale-105 transition-all">
                                         <div className="w-6 h-6 rounded-full bg-white"></div>
                                     </button>
                                 ) : (
                                     <button onClick={handlePlayPause} className={`w-20 h-14 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-400' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
                                         {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayCircleIcon className="w-10 h-10" />}
                                     </button>
                                 )}
                            </div>

                            {/* Right Group: Project Management */}
                            <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                                <button onClick={handleSaveProject} className="h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                                    <span>{t('studioSave', uiLanguage)}</span>
                                </button>
                                
                                <button 
                                    onClick={() => projectInputRef.current?.click()} 
                                    className={`h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${userTier === 'free' || userTier === 'visitor' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    <span>{t('studioOpen', uiLanguage)}</span>
                                    {(userTier === 'free' || userTier === 'visitor') && <LockIcon className="w-3 h-3 absolute top-1 right-1 text-slate-500" />}
                                </button>
                                <input ref={projectInputRef} type="file" accept=".saw,.json" className="hidden" onChange={handleLoadProject} />

                                <div className="relative" ref={exportMenuRef}>
                                    <button onClick={() => setShowExportMenu(!showExportMenu)} className="w-full h-12 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50 transition-colors">
                                        {isProcessing ? <LoaderIcon className="w-4 h-4"/> : <DownloadIcon className="w-4 h-4"/>}
                                        <span>{t('studioExportBtn', uiLanguage)}</span>
                                    </button>
                                    
                                    {showExportMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 animate-fade-in z-50">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-2">{t('studioExportSettings', uiLanguage)}</h4>
                                            
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t('studioSource', uiLanguage)}</label>
                                                    <div className="flex bg-slate-900 rounded p-1">
                                                        <button onClick={() => setExportSource('mix')} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${exportSource === 'mix' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t('studioFullMix', uiLanguage)}</button>
                                                        <button onClick={() => setExportSource('voice')} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${exportSource === 'voice' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t('studioVoiceOnly', uiLanguage)}</button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t('studioDuration', uiLanguage)}</label>
                                                    <div className="flex bg-slate-900 rounded p-1">
                                                        <button onClick={() => setTrimToVoice(true)} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${trimToVoice ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t('studioTrimVoice', uiLanguage)}</button>
                                                        <button onClick={() => setTrimToVoice(false)} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${!trimToVoice ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t('studioFullLength', uiLanguage)}</button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">{t('studioFormat', uiLanguage)}</label>
                                                    <div className="flex bg-slate-900 rounded p-1">
                                                        <button onClick={() => setExportFormat('mp3')} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${exportFormat === 'mp3' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>MP3</button>
                                                        <button onClick={() => setExportFormat('wav')} className={`flex-1 text-[10px] py-1 rounded font-bold transition-colors ${exportFormat === 'wav' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>WAV</button>
                                                    </div>
                                                </div>

                                                <button onClick={handleExportClick} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-lg mt-2 transition-colors flex items-center justify-center gap-2">
                                                    <DownloadIcon className="w-4 h-4"/> {t('studioDownload', uiLanguage)}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" dir="ltr">
                        {/* --- LEFT: MIXER STRIPS (35%) --- */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Voice Strip */}
                            <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg p-1 relative overflow-hidden group">
                                <div className="bg-slate-900/50 p-2 rounded-t-lg flex justify-between items-center border-b border-slate-800">
                                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">{t('studioVoice', uiLanguage)}</h4>
                                    <div className="flex gap-2">
                                        <div className={`w-2 h-2 rounded-full ${voiceBuffer ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-slate-700'}`}></div>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-end h-48 relative">
                                    {/* Mute Overlay */}
                                    {isVoiceMuted && <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 pointer-events-none flex items-center justify-center"><span className="text-red-500 font-black text-2xl rotate-[-15deg] border-4 border-red-500 p-2 rounded opacity-50">MUTED</span></div>}
                                    
                                    <Fader label="LEVEL" value={voiceVolume} onChange={setVoiceVolume} color="cyan" muted={isVoiceMuted} onMuteToggle={() => setIsVoiceMuted(!isVoiceMuted)} />
                                    
                                    <div className="flex flex-col gap-4 pb-2 items-center">
                                        <Knob label={t('studioPan', uiLanguage)} value={settings.stereoWidth} min={-100} max={100} onChange={(v) => updateSetting('stereoWidth', v)} size="md" displaySuffix="%" />
                                        <Knob label={t('studioDelay', uiLanguage)} value={voiceDelay} min={0} max={5} onChange={setVoiceDelay} color="purple" size="md" displaySuffix="s" />
                                    </div>
                                </div>
                                <div className="bg-slate-900/30 p-2 text-center text-[10px] text-slate-500 font-mono border-t border-slate-800 truncate px-4">
                                    {fileName || 'No Source'}
                                </div>
                            </div>

                            {/* Music Strip */}
                            <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg p-1 relative overflow-hidden group">
                                <div className="bg-slate-900/50 p-2 rounded-t-lg flex justify-between items-center border-b border-slate-800">
                                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">{t('studioMusic', uiLanguage)}</h4>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setAutoDucking(!autoDucking)} 
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${autoDucking ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-800 text-slate-500'}`}
                                            title="Auto-lower music when voice speaks"
                                        >
                                            {t('studioDucking', uiLanguage)}
                                        </button>
                                        <div className={`w-2 h-2 rounded-full transition-colors ${duckingActive ? 'bg-red-500 animate-pulse' : (activeMusicTrack ? 'bg-green-500' : 'bg-slate-700')}`}></div>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-end h-48 relative">
                                    {isMusicMuted && <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 pointer-events-none flex items-center justify-center"><span className="text-red-500 font-black text-2xl rotate-[-15deg] border-4 border-red-500 p-2 rounded opacity-50">MUTED</span></div>}
                                    
                                    <Fader label="LEVEL" value={musicVolume} onChange={setMusicVolume} color="amber" muted={isMusicMuted} onMuteToggle={() => setIsMusicMuted(!isMusicMuted)} />
                                    
                                    <div className="flex flex-col justify-end gap-2 w-full ml-4 h-full pb-2">
                                        {/* Music Selector Button */}
                                        <div className="relative w-full h-full" ref={libraryMenuRef}>
                                            <button 
                                                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                                                className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors group/btn"
                                            >
                                                {musicFileName ? (
                                                    <>
                                                        <span className="text-xs text-amber-400 font-bold line-clamp-2 px-2 text-center">{musicFileName}</span>
                                                        <span className="text-[9px] text-slate-500">Click to Change</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover/btn:bg-slate-700 transition-colors">
                                                            <div className="text-2xl text-slate-600 group-hover/btn:text-amber-400">+</div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold">{t('studioSelectTrack', uiLanguage)}</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Music Library Dropdown */}
                                            {isLibraryOpen && (
                                                <div className="absolute top-0 left-0 w-64 h-64 -translate-y-[105%] bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 flex flex-col animate-fade-in">
                                                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
                                                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Music Library</h5>
                                                        <button onClick={onMusicUploadClick} className={`text-[10px] bg-amber-700 hover:bg-amber-600 text-white px-2 py-1 rounded transition-colors ${!isPaidUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                            {t('studioAddMusic', uiLanguage)}
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                                        {musicLibrary.length === 0 ? (
                                                            <div className="text-center py-8 text-slate-500 text-xs italic">{t('studioNoTracks', uiLanguage)}</div>
                                                        ) : (
                                                            musicLibrary.map(track => (
                                                                <div 
                                                                    key={track.id} 
                                                                    onClick={() => { setActiveMusicId(track.id); setIsLibraryOpen(false); }}
                                                                    className={`p-2 rounded mb-1 flex justify-between items-center cursor-pointer group/track transition-colors ${activeMusicId === track.id ? 'bg-amber-900/30 border border-amber-500/30' : 'hover:bg-slate-700 border border-transparent'}`}
                                                                >
                                                                    <span className={`text-xs truncate max-w-[140px] font-medium ${activeMusicId === track.id ? 'text-amber-400' : 'text-slate-300'}`}>{track.name}</span>
                                                                    <button onClick={(e) => removeTrackFromLibrary(e, track.id)} className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover/track:opacity-100 transition-opacity">
                                                                        <TrashIcon className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicFileChange} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT: DSP RACK (65%) --- */}
                        <div className="lg:col-span-8 bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl p-1 flex flex-col h-full">
                            <div className="bg-slate-900/50 p-2 rounded-t-lg flex justify-between items-center border-b border-slate-800 mb-2">
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <SoundEnhanceIcon className="w-4 h-4 text-purple-400" />
                                    DSP Rack (Effects)
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">{t('studioPresets', uiLanguage)}:</span>
                                    <div className="flex gap-1">
                                        {AUDIO_PRESETS.map(preset => (
                                            <button 
                                                key={preset.name}
                                                onClick={() => { setSettings(preset.settings); setPresetName(preset.name); }}
                                                className={`text-[9px] px-2 py-1 rounded transition-colors border ${presetName === preset.name ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                            >
                                                {preset.label[uiLanguage as any] || preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 flex-grow">
                                {/* EQ Section */}
                                <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50">
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-center">{t('studioEq', uiLanguage)}</h5>
                                    <div className="flex justify-between h-40 px-2">
                                        <EqSlider label="60Hz" value={settings.eqBands[0]} onChange={(v) => { const n = [...settings.eqBands]; n[0] = v; updateSetting('eqBands', n); }} />
                                        <EqSlider label="250Hz" value={settings.eqBands[1]} onChange={(v) => { const n = [...settings.eqBands]; n[1] = v; updateSetting('eqBands', n); }} />
                                        <EqSlider label="1KHz" value={settings.eqBands[2]} onChange={(v) => { const n = [...settings.eqBands]; n[2] = v; updateSetting('eqBands', n); }} />
                                        <EqSlider label="4KHz" value={settings.eqBands[3]} onChange={(v) => { const n = [...settings.eqBands]; n[3] = v; updateSetting('eqBands', n); }} />
                                        <EqSlider label="12KHz" value={settings.eqBands[4]} onChange={(v) => { const n = [...settings.eqBands]; n[4] = v; updateSetting('eqBands', n); }} />
                                    </div>
                                </div>

                                {/* Dynamics & Space */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50 flex flex-col items-center justify-between">
                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('studioDynamics', uiLanguage)}</h5>
                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <Knob label={t('studioSpeed', uiLanguage)} value={settings.speed} min={0.5} max={2.0} onChange={(v) => updateSetting('speed', v)} size="sm" displaySuffix="x" />
                                            <Knob label={t('studioCompressor', uiLanguage)} value={settings.compression} onChange={(v) => updateSetting('compression', v)} color="red" size="sm" displaySuffix="%" />
                                        </div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-slate-700/50 flex flex-col items-center justify-between">
                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('studioAmbience', uiLanguage)}</h5>
                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <Knob label={t('studioReverb', uiLanguage)} value={settings.reverb} onChange={(v) => updateSetting('reverb', v)} color="purple" size="sm" displaySuffix="%" />
                                            <Knob label={t('studioEcho', uiLanguage)} value={echo} onChange={setEcho} color="green" size="sm" displaySuffix="%" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioStudioModal;
