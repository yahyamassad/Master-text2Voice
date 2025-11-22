
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t, Language } from '../i18n/translations';
import { WarningIcon, PlayCircleIcon, PauseIcon, DownloadIcon, LoaderIcon, SawtliLogoIcon, TrashIcon, StopIcon, MicrophoneIcon, LockIcon } from './icons';
import { AudioSettings, AudioPresetName } from '../types';
import { AUDIO_PRESETS, processAudio, createMp3Blob } from '../utils/audioUtils';

interface AudioStudioModalProps {
    onClose: () => void;
    uiLanguage: Language;
    voice: string;
    sourceAudioPCM?: Uint8Array | null;
    allowDownloads?: boolean;
    onUpgrade?: () => void;
}

// --- VISUALIZER COMPONENT ---
const AudioVisualizer: React.FC<{ analyser: AnalyserNode | null, isPlaying: boolean }> = ({ analyser, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyser) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.fftSize = 2048; 
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isPlaying && !analyser) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const width = canvas.width;
            const height = canvas.height;
            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height;

                // Cyan gradient
                const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#22d3ee');
                gradient.addColorStop(1, '#0891b2');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        if (isPlaying) {
            draw();
        } else {
             if (animationRef.current) cancelAnimationFrame(animationRef.current);
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             // Draw idle line
             ctx.beginPath();
             ctx.moveTo(0, canvas.height / 2);
             ctx.lineTo(canvas.width, canvas.height / 2);
             ctx.strokeStyle = '#334155';
             ctx.lineWidth = 1;
             ctx.stroke();
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, isPlaying]);

    return (
        <canvas 
            ref={canvasRef} 
            width={1000} 
            height={160} 
            className="w-full h-full rounded bg-black/50"
        />
    );
};


// --- CONTROL COMPONENTS ---

const Knob: React.FC<{ label: string, value: number, min?: number, max?: number, onChange: (val: number) => void, color?: string }> = ({ label, value, min = 0, max = 100, onChange, color = 'cyan' }) => {
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270); 

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1; 
        const step = (max - min) / 50; 
        let newValue = value + (delta * step);
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };
    
    const isPurple = color === 'purple';

    return (
        <div className="flex flex-col items-center group" onWheel={handleWheel}>
             <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-800 to-black shadow-lg border-2 ${isPurple ? 'border-purple-900/50 group-hover:border-purple-500/50' : 'border-cyan-900/50 group-hover:border-cyan-500/50'} flex items-center justify-center mb-2 cursor-ns-resize transition-all`}>
                 <div 
                    className="absolute w-full h-full rounded-full pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                 >
                     <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-2.5 sm:w-2 sm:h-3 rounded-full ${isPurple ? 'bg-purple-400 shadow-[0_0_8px_#a855f7]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'}`}></div>
                 </div>
                 
                 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0f172a] border border-slate-700 flex items-center justify-center shadow-inner">
                     <span className={`text-sm sm:text-lg font-mono font-bold select-none pointer-events-none ${isPurple ? 'text-purple-300' : 'text-cyan-300'}`}>{Math.round(value)}</span>
                 </div>
             </div>
             <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
        </div>
    );
};

const Fader: React.FC<{ label: string, value: number, min?: number, max?: number, step?: number, onChange: (val: number) => void, height?: string, color?: string, labelSize?: string }> = ({ label, value, min=0, max=100, step=1, onChange, height="h-32", color='cyan', labelSize='text-xs sm:text-sm' }) => {
    const isCyan = color === 'cyan';
    return (
    <div className="flex flex-col items-center w-12 sm:w-16 group h-full justify-end">
        <div className={`relative w-3 sm:w-4 bg-black rounded-full border border-slate-800 ${height} mb-2 shadow-inner`}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title={`${label}: ${value}`}
                {...({ orient: "vertical" } as any)}
                style={{ WebkitAppearance: 'slider-vertical' } as any}
            />
            <div 
                className={`absolute bottom-0 left-0 w-full rounded-full pointer-events-none ${isCyan ? 'bg-cyan-500/20' : 'bg-slate-500/20'}`}
                style={{ height: `${((value - min) / (max - min)) * 100}%` }}
            ></div>
            <div 
                className="absolute left-1/2 -translate-x-1/2 w-6 sm:w-8 h-4 sm:h-5 bg-gradient-to-b from-slate-600 to-slate-900 rounded shadow-lg border-t border-slate-500 border-b-2 border-black pointer-events-none flex items-center justify-center"
                style={{ bottom: `calc(${((value - min) / (max - min)) * 100}% - 10px)` }}
            >
                 <div className="w-full h-px bg-black opacity-50"></div>
                 <div className={`w-3 sm:w-5 h-1 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-slate-300'}`}></div>
            </div>
        </div>
        <div className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 min-w-[2rem] text-center">
             <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-100">{Math.round(value)}</span>
        </div>
        <span className={`${labelSize} font-bold text-slate-500 uppercase tracking-wider mt-1`}>{label}</span>
    </div>
)};

const EqSlider: React.FC<{ value: number, label: string, onChange: (val: number) => void }> = ({ value, label, onChange }) => (
    <div className="flex flex-col items-center h-full group w-full">
         <div className="relative flex-grow w-full max-w-[30px] sm:max-w-[40px] flex justify-center bg-black/50 rounded-md mb-2 border border-slate-800 min-h-[80px]">
             <div className="absolute top-1/2 left-0 w-full h-px bg-slate-700"></div>
            <input
                type="range"
                min="-12"
                max="12"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                style={{ WebkitAppearance: 'slider-vertical' } as any}
            />
            <div className={`absolute w-1.5 rounded-full transition-all duration-75 ${value === 0 ? 'bg-slate-700 h-0.5 top-1/2' : 'bg-cyan-600/50 left-1/2 -translate-x-1/2'}`}
                 style={ value !== 0 ? { 
                     bottom: value > 0 ? '50%' : `calc(50% - ${Math.abs(value)/24 * 100}%)`, 
                     height: `${Math.abs(value)/24 * 100}%`
                 } : {}}
            ></div>
            <div 
                className="absolute left-1/2 -translate-x-1/2 w-6 sm:w-8 h-3 sm:h-4 bg-[#334155] rounded shadow-md border border-slate-600 pointer-events-none flex items-center justify-center"
                style={{ bottom: `calc(${((value + 12) / 24) * 100}% - 8px)` }}
            >
                <div className={`w-3 sm:w-4 h-1 rounded-sm ${value > 0 ? 'bg-cyan-400' : (value < 0 ? 'bg-amber-500' : 'bg-slate-400')}`}></div>
            </div>
        </div>
        <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className={`text-[8px] sm:text-[10px] font-mono font-bold ${value !== 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{value > 0 ? `+${value}` : value}dB</span>
    </div>
);

// --- MAIN COMPONENT ---

export const AudioStudioModal: React.FC<AudioStudioModalProps> = ({ onClose, uiLanguage, voice, sourceAudioPCM, allowDownloads = false, onUpgrade }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'mic' | 'upload'>('ai');
    const [presetName, setPresetName] = useState<AudioPresetName>('Default');
    const [settings, setSettings] = useState<AudioSettings>(AUDIO_PRESETS[0].settings);
    const [monitorVolume, setMonitorVolume] = useState(80); 
    
    const [fileName, setFileName] = useState<string>('Gemini AI Audio');
    const [fileDuration, setFileDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
    
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [micAudioBuffer, setMicAudioBuffer] = useState<AudioBuffer | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null); 
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const playAnimationFrameRef = useRef<number>(0);
    
    // Ref to track if stop was manual (user clicked pause) or automatic (end of file)
    const isManualStopRef = useRef(false);
    
    // RACE CONDITION PREVENTION: Track the ID of the current processing request
    const processingRequestRef = useRef(0);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'ai' && sourceAudioPCM) {
            // Approximation: 16-bit (2 bytes), 24000Hz mono => 48000 bytes/sec
            setFileDuration(sourceAudioPCM.length / 48000);
            setFileName(`Gemini ${voice} Session`);
        }
    }, [activeTab, sourceAudioPCM, voice]);

    const stopPlayback = useCallback(() => {
        isManualStopRef.current = true; // Mark as manual stop
        
        // Cancel any ongoing animation frame immediately
        if (playAnimationFrameRef.current) {
            cancelAnimationFrame(playAnimationFrameRef.current);
            playAnimationFrameRef.current = 0;
        }

        if (sourceNodeRef.current) {
            try { 
                sourceNodeRef.current.stop();
                sourceNodeRef.current.disconnect(); // IMPORTANT: Disconnect to prevent ghost audio
            } catch (e) {}
            sourceNodeRef.current = null;
        }
        
        setAnalyserNode(null);
        setIsPlaying(false);
    }, []);

    const applyPreset = (name: AudioPresetName) => {
        // Stop playback immediately when switching presets to prevent layering
        stopPlayback();
        
        const preset = AUDIO_PRESETS.find(p => p.name === name);
        if (preset) {
            setPresetName(name);
            setSettings({ ...preset.settings });
            setProcessedBuffer(null); 
        }
    };

    const updateSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
        stopPlayback(); // Stop playback on setting change
        setSettings(prev => ({ ...prev, [key]: value }));
        setPresetName('Default');
        setProcessedBuffer(null);
    };

    const handleEqChange = (index: number, value: number) => {
        // For EQ we might not want to stop completely, but for safety let's stop to avoid glitches
        // Or debounce it. For now, stopping is safer.
        stopPlayback();
        const newBands = [...settings.eqBands];
        newBands[index] = value;
        updateSetting('eqBands', newBands);
    };

    const getAudioContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    const confirmAction = (message: string) => {
        // If there is audio loaded, ask for confirmation before replacing
        if ((activeTab === 'ai' && sourceAudioPCM) || (micAudioBuffer) || (processedBuffer)) {
            return window.confirm(message);
        }
        return true;
    };

    const startRecording = async () => {
        if (!confirmAction(uiLanguage === 'ar' ? 'هل أنت متأكد؟ سيتم استبدال التسجيل الحالي.' : 'Are you sure? This will replace the current recording.')) {
            return;
        }

        try {
            // Clean up previous audio
            stopPlayback();
            setMicAudioBuffer(null);
            setProcessedBuffer(null);

            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            recordingChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordingChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
                setMicAudioBuffer(decodedBuffer);
                setProcessedBuffer(null); 
                setFileDuration(decodedBuffer.duration);
                setFileName(`Recording_${new Date().toLocaleTimeString()}`);
                playbackOffsetRef.current = 0;
                setCurrentTime(0);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) {
            console.error("Mic Error", err);
            alert("Microphone access failed.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const hasAudioSource = activeTab === 'ai' ? !!sourceAudioPCM : !!micAudioBuffer;

    const onUploadClick = () => {
        if (!confirmAction(uiLanguage === 'ar' ? 'هل أنت متأكد؟ سيتم استبدال الملف الحالي.' : 'Are you sure? This will replace the current file.')) {
            return;
        }
        
        // Trigger hidden file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
            fileInputRef.current.click();
        }
    };

    const handleTabSwitch = (tab: 'ai' | 'mic' | 'upload') => {
        if (activeTab === tab && tab !== 'upload') return;
        
        if (tab === 'upload') {
             onUploadClick();
             // Don't switch tab yet, waiting for file selection
             return;
        }

        if (!confirmAction(uiLanguage === 'ar' ? 'هل أنت متأكد من تغيير المصدر؟ سيتم فقدان العمل الحالي.' : 'Are you sure you want to switch sources? Current work will be lost.')) {
            return;
        }

        stopPlayback();
        stopRecording();
        setProcessedBuffer(null);
        setMicAudioBuffer(null);
        playbackOffsetRef.current = 0;
        setCurrentTime(0);
        setFileDuration(0);
        
        if (tab === 'ai' && sourceAudioPCM) {
             setFileName(`Gemini ${voice} Session`);
             setFileDuration(sourceAudioPCM.length / 48000);
        } else {
             setFileName('No File Loaded');
        }
        setActiveTab(tab);
    };

    const processUploadedFile = async (file: File) => {
        if(!file) return;
        try {
             stopPlayback();
             setIsProcessing(true);
             const arrayBuffer = await file.arrayBuffer();
             const ctx = getAudioContext();
             const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
             
             setMicAudioBuffer(decodedBuffer);
             setProcessedBuffer(null);
             setFileName(file.name);
             setFileDuration(decodedBuffer.duration);
             playbackOffsetRef.current = 0;
             setCurrentTime(0);
             
             // Switch tab AFTER successful load
             setActiveTab('upload'); 
        } catch (error) {
            console.error("File load failed", error);
            alert("Failed to load file.");
        } finally {
             setIsProcessing(false);
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processUploadedFile(e.target.files[0]);
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getActiveSource = () => {
        if (activeTab === 'ai') return sourceAudioPCM;
        return micAudioBuffer; 
    };

    const handleNaturalFinish = () => {
         playbackOffsetRef.current = 0;
         setCurrentTime(0);
         setIsPlaying(false);
         if (playAnimationFrameRef.current) cancelAnimationFrame(playAnimationFrameRef.current);
         sourceNodeRef.current = null; 
    };

    const handlePlayPause = async () => {
        // Generate a new request ID for this play attempt
        const requestId = ++processingRequestRef.current;

        if (isPlaying) {
            const ctx = getAudioContext();
            if (ctx) {
                const elapsed = ctx.currentTime - playbackStartTimeRef.current;
                playbackOffsetRef.current = playbackOffsetRef.current + elapsed;
                if (playbackOffsetRef.current > fileDuration) playbackOffsetRef.current = fileDuration;
            }
            stopPlayback();
            return;
        }

        const source = getActiveSource();
        if (!source) return;

        // If we reached the end, restart from 0
        if (playbackOffsetRef.current >= fileDuration - 0.1) {
            playbackOffsetRef.current = 0;
        }

        try {
            setIsProcessing(true);
            const ctx = getAudioContext();
            let buffer = processedBuffer;
            
            if (!buffer) {
                buffer = await processAudio(source, settings);
                
                // CHECK ID: If user clicked play/preset again while processing, abort this one
                if (requestId !== processingRequestRef.current) {
                    return; 
                }

                setProcessedBuffer(buffer);
                setFileDuration(buffer.duration); 
            }
            setIsProcessing(false);
            
            // Explicitly stop previous if existing (double safety)
            if (sourceNodeRef.current) {
                try { sourceNodeRef.current.disconnect(); } catch(e){}
            }

            isManualStopRef.current = false; // Reset manual stop flag

            const sourceNode = ctx.createBufferSource();
            sourceNode.buffer = buffer;
            
            const gainNode = ctx.createGain();
            gainNode.gain.value = monitorVolume / 100;
            
            const analyser = ctx.createAnalyser();
            analyser.smoothingTimeConstant = 0.8;
            
            sourceNode.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(ctx.destination);
            
            sourceNode.onended = () => {
                // Only treat as "Finished" if it wasn't stopped manually.
                if (!isManualStopRef.current) {
                     handleNaturalFinish();
                }
            };
            
            sourceNodeRef.current = sourceNode;
            gainNodeRef.current = gainNode;
            setAnalyserNode(analyser);
            
            playbackStartTimeRef.current = ctx.currentTime;
            sourceNode.start(0, playbackOffsetRef.current);
            setIsPlaying(true);

            const updateUI = () => {
                if (ctx.state === 'running' && !isManualStopRef.current) {
                    const currentSegmentTime = ctx.currentTime - playbackStartTimeRef.current;
                    const actualTime = playbackOffsetRef.current + currentSegmentTime;
                    
                    // Check if we've exceeded duration (safety fallback if onended misses)
                    if (actualTime >= buffer!.duration) {
                        // Stop immediately visually
                        setCurrentTime(buffer!.duration);
                        // Force stop to ensure everything cleans up, even if onended missed
                        stopPlayback();
                        // Reset to start
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
            console.error("Playback failed", e);
            setIsProcessing(false);
            setIsPlaying(false);
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

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = monitorVolume / 100;
        }
    }, [monitorVolume]);

    const handleDownload = async () => {
        // Security Check: If downloads not allowed, block action
        if (!allowDownloads) {
            if (onUpgrade) onUpgrade();
            return;
        }

        const source = getActiveSource();
        if (!source) return;
        try {
            setIsProcessing(true);
            let buffer = processedBuffer || await processAudio(source, settings);
            const blob = await createMp3Blob(buffer, 1, buffer.sampleRate);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sawtli_master.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsProcessing(false);
        } catch (e) {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopPlayback();
            stopRecording();
        }
    }, [stopPlayback]);

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col animate-fade-in-down h-[100dvh]">
            {/* HEADER - Constrained & Aligned - Forced LTR to keep Logo Left */}
            <div className="bg-[#0f172a] border-b border-slate-800 shrink-0 w-full" dir="ltr">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between select-none">
                     {/* Left: Logo Area */}
                    <div className="flex items-center">
                        <SawtliLogoIcon className="h-16 sm:h-20 w-auto" />
                    </div>

                    {/* Right: Title & Close */}
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl sm:text-3xl font-thin tracking-[0.2em] text-slate-200 uppercase hidden sm:block border-r border-slate-700 pr-6 mr-2">
                            Audio Studio
                        </h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full border border-transparent hover:border-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide w-full">
                <div className="max-w-7xl mx-auto space-y-6 pb-10">

                    {/* VISUALIZER AREA */}
                    <div className="bg-[#020617] rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl">
                        <div className="h-32 sm:h-40 relative w-full">
                             {isRecording ? (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="animate-pulse text-red-500 font-mono text-xl font-bold tracking-widest">RECORDING {formatTime(recordingTime)}</div>
                                 </div>
                             ) : (
                                 <AudioVisualizer analyser={analyserNode} isPlaying={isPlaying} />
                             )}
                        </div>
                        
                        {/* SCRUBBER */}
                        <div className="bg-[#0f172a] px-4 py-2 flex items-center gap-4 text-[10px] sm:text-xs font-mono text-cyan-400 border-t border-slate-800" dir="ltr">
                            <span className="w-16 text-right">{formatTime(currentTime)} / {formatTime(fileDuration)}</span>
                            <div className="flex-1 relative h-6 flex items-center group cursor-pointer">
                                <div className="absolute inset-0 bg-slate-800 h-1 rounded-full my-auto"></div>
                                <div className="absolute left-0 bg-cyan-500 h-1 rounded-full my-auto pointer-events-none" style={{ width: `${(currentTime / (fileDuration || 1)) * 100}%` }}></div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={fileDuration || 1} 
                                    step="0.01" 
                                    value={currentTime} 
                                    onChange={handleSeek} 
                                    disabled={!hasAudioSource}
                                    className="w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute h-3 w-3 bg-white rounded-full shadow pointer-events-none" style={{ left: `calc(${((currentTime / (fileDuration || 1)) * 100)}% - 6px)` }}></div>
                            </div>
                            <span className="text-slate-400 truncate max-w-[120px] text-right" title={fileName}>{fileName}</span>
                            {hasAudioSource && <PlayCircleIcon className="w-4 h-4 text-slate-600" />}
                        </div>
                    </div>

                    {/* CONTROL DECK - Unified Layout */}
                    <div className="bg-[#1e293b] p-3 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden" dir="ltr">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900/80 pointer-events-none"></div>
                        
                        <div className="flex flex-col md:flex-row items-stretch gap-4 relative z-10">
                            {/* LEFT: Source Controls */}
                            <div className="flex-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 flex items-center gap-1">
                                {['upload', 'mic', 'ai'].map((tab) => (
                                    <button 
                                        key={tab}
                                        onClick={() => handleTabSwitch(tab as any)} 
                                        className={`flex-1 h-16 rounded-lg text-xs sm:text-sm font-extrabold transition-all uppercase tracking-wider flex flex-col items-center justify-center gap-1
                                            ${activeTab === tab 
                                                ? (tab === 'upload' ? 'bg-amber-700 text-white border border-amber-500/50 shadow-lg' : tab === 'mic' ? 'bg-red-700 text-white border border-red-500/50 shadow-lg' : 'bg-cyan-700 text-white border border-cyan-500/50 shadow-lg') 
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                            }`}
                                    >
                                        {tab === 'upload' ? 'FILE' : tab === 'mic' ? 'MIC' : 'GEMINI'}
                                    </button>
                                ))}
                            </div>

                            {/* CENTER: Transport */}
                            <div className="flex-shrink-0 flex justify-center items-center">
                                 <button 
                                    onClick={handlePlayPause} 
                                    disabled={!hasAudioSource}
                                    className={`w-20 h-full min-h-[4rem] rounded-xl flex items-center justify-center border-2 transition-all active:scale-95 shadow-xl
                                        ${isPlaying 
                                            ? 'bg-slate-800 border-cyan-500/50 text-cyan-400 hover:bg-slate-750 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                                            : 'bg-gradient-to-b from-cyan-500 to-cyan-600 border-cyan-400 text-white hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                                        }`}
                                 >
                                    {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayCircleIcon className="w-10 h-10 ml-1"/>}
                                 </button>
                            </div>

                            {/* RIGHT: Actions */}
                            <div className="flex-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
                                <button 
                                    onClick={activeTab === 'mic' ? (isRecording ? stopRecording : startRecording) : onUploadClick}
                                    className={`flex-1 h-16 rounded-lg flex flex-col items-center justify-center transition-all group border
                                        ${activeTab === 'mic' 
                                            ? (isRecording ? 'bg-red-900/80 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400')
                                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    {activeTab === 'mic' ? (
                                        <>
                                            <div className={`w-3 h-3 rounded-full mb-1 ${isRecording ? 'bg-white rounded-sm' : 'bg-red-500'}`}></div>
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">{isRecording ? 'STOP' : 'RECORD'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="group-hover:rotate-180 transition-transform duration-500 text-lg mb-0.5">↻</div>
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">{uiLanguage === 'ar' ? 'استبدال' : 'Replace'}</span>
                                        </>
                                    )}
                                </button>

                                <button 
                                    onClick={handleDownload} 
                                    disabled={!hasAudioSource || isProcessing}
                                    className={`flex-1 h-16 rounded-lg flex flex-col items-center justify-center border transition-all shadow-lg ${!allowDownloads ? 'bg-slate-800 border-slate-600 text-amber-500 hover:bg-slate-700 hover:border-amber-400' : 'bg-slate-800 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:grayscale'}`}
                                >
                                    {!allowDownloads ? (
                                        <>
                                            <LockIcon className="w-5 h-5 mb-1 text-amber-500"/>
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-500">{uiLanguage === 'ar' ? 'مغلق' : 'Locked'}</span>
                                        </>
                                    ) : (
                                        <>
                                            {isProcessing ? <LoaderIcon className="w-5 h-5 mb-1"/> : <DownloadIcon className="w-5 h-5 mb-1" />}
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">{uiLanguage === 'ar' ? 'تصدير' : 'Export'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                    </div>

                    {/* MIDDLE RACK: Presets | Volume | EQ */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                        
                        {/* PRESETS (Left) */}
                        <div className="xl:col-span-4 bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col min-h-[16rem]">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-3 bg-cyan-500 rounded-sm"></div> Presets Bank</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
                                {AUDIO_PRESETS.map(p => (
                                    <button key={p.name} onClick={() => applyPreset(p.name)} className={`py-2.5 px-2 text-[10px] sm:text-xs font-extrabold rounded border transition-all relative overflow-hidden uppercase tracking-wide ${presetName === p.name ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                                        {p.name === 'Default' ? 'RESET' : (p.label[uiLanguage === 'ar' ? 'ar' : 'en'] || p.name)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* VOLUME CONTROL (Center - Updated Style) */}
                        <div className="xl:col-span-2 bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center min-h-[16rem]">
                             <div className="w-full flex items-center justify-center mb-4 border-b border-slate-700 pb-2 relative">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-3 bg-cyan-500 rounded-sm"></div> MIXER
                                </div>
                             </div>
                             <div className="flex gap-4 h-full items-center justify-center pb-2 flex-grow">
                                <Fader label="Master" value={settings.volume} onChange={(v) => updateSetting('volume', v)} height="h-32" labelSize="text-xs sm:text-sm" />
                                <Fader label="Monitor" value={monitorVolume} onChange={setMonitorVolume} color="slate" height="h-32" labelSize="text-xs sm:text-sm" />
                             </div>
                        </div>

                        {/* EQ (Right) */}
                        <div className="xl:col-span-6 bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl relative flex flex-col min-h-[16rem]">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-3 bg-cyan-500 rounded-sm"></div> Band EQ-5</div>
                                <div className="text-[9px] font-mono text-slate-500">12dB RANGE</div>
                            </div>
                            <div className="flex justify-between px-2 flex-1 items-center">
                                <EqSlider value={settings.eqBands[0]} label="60Hz" onChange={(v) => handleEqChange(0, v)} />
                                <EqSlider value={settings.eqBands[1]} label="250Hz" onChange={(v) => handleEqChange(1, v)} />
                                <EqSlider value={settings.eqBands[2]} label="1kHz" onChange={(v) => handleEqChange(2, v)} />
                                <EqSlider value={settings.eqBands[3]} label="4kHz" onChange={(v) => handleEqChange(3, v)} />
                                <EqSlider value={settings.eqBands[4]} label="12kHz" onChange={(v) => handleEqChange(4, v)} />
                            </div>
                        </div>
                    </div>

                    {/* FX KNOBS ROW (Bottom) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Dynamics */}
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 w-full text-center border-b border-slate-700 pb-1">Dynamics</div>
                            <Knob label="COMPRESSOR" value={settings.compression} onChange={(v) => updateSetting('compression', v)} color="purple" />
                        </div>

                        {/* Ambience */}
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 w-full text-center border-b border-slate-700 pb-1">Ambience</div>
                            <Knob label="REVERB" value={settings.reverb} onChange={(v) => updateSetting('reverb', v)} />
                        </div>
                        
                        {/* Time Stretch */}
                        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700 shadow-xl flex flex-col items-center justify-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 w-full text-center border-b border-slate-700 pb-1">Time Stretch</div>
                            <Knob label="SPEED" value={settings.speed * 50} min={25} max={100} onChange={(v) => updateSetting('speed', v/50)} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
