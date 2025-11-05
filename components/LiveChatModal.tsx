
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { t, Language } from '../i18n/translations';
import { LoaderIcon, MicrophoneIcon, SawtliLogoIcon, StopIcon } from './icons';

interface LiveChatModalProps {
    onClose: () => void;
    uiLanguage: Language;
}

interface Transcript {
    id: number;
    speaker: 'user' | 'ai';
    text: string;
}

type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const LiveChatModal: React.FC<LiveChatModalProps> = ({ onClose, uiLanguage }) => {
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextAudioStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    
    // State for live transcription rendering
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    // Refs to hold the full transcription text within callbacks to avoid stale state
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');


    const createBlob = (data: Float32Array): GenaiBlob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const handleEndSession = useCallback(async () => {
        // Stop microphone processing
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach(track => track.stop());
            microphoneStreamRef.current = null;
        }

        // Close audio contexts
        if (inputAudioContextRef.current?.state === 'running') {
            await inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current?.state === 'running') {
            await outputAudioContextRef.current.close();
        }
        
        // Stop any playing audio
        audioSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore */ }
        });
        audioSourcesRef.current.clear();

        // Close the session
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
        setStatus('idle');
    }, []);

    const handleStartSession = useCallback(async () => {
        if (!geminiApiKey) {
            setError('Gemini API Key is not configured for the client.');
            setStatus('error');
            return;
        }

        setStatus('connecting');
        setError(null);
        setTranscripts([]);
        setCurrentInput('');
        setCurrentOutput('');
        currentInputRef.current = '';
        currentOutputRef.current = '';


        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;

                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcriptions
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             setCurrentInput(prev => prev + text);
                             currentInputRef.current += text;
                        }
                        if (message.serverContent?.outputTranscription) {
                             if (status !== 'speaking') setStatus('speaking');
                             const text = message.serverContent.outputTranscription.text;
                             setCurrentOutput(prev => prev + text);
                             currentOutputRef.current += text;
                        }
                         if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputRef.current.trim();
                            const fullOutput = currentOutputRef.current.trim();

                            if(fullInput){
                                setTranscripts(prev => [...prev, { id: Date.now(), speaker: 'user', text: fullInput }]);
                            }
                            if(fullOutput){
                                 setTranscripts(prev => [...prev, { id: Date.now()+1, speaker: 'ai', text: fullOutput }]);
                            }
                            setCurrentInput('');
                            setCurrentOutput('');
                            currentInputRef.current = '';
                            currentOutputRef.current = '';
                            setStatus('listening');
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputCtx.currentTime);

                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });
                            
                            source.start(nextAudioStartTimeRef.current);
                            nextAudioStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(source => {
                                try { source.stop(); } catch(e) {}
                                audioSourcesRef.current.delete(source);
                            });
                            nextAudioStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError(t('errorLiveChat', uiLanguage));
                        setStatus('error');
                        handleEndSession();
                    },
                    onclose: (e: CloseEvent) => {
                        // The session is closed, no need to call handleEndSession again unless there are resources to clean.
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are Sawtli, a friendly and helpful AI assistant. Keep your responses concise and conversational.',
                },
            });
            await sessionPromiseRef.current; // Wait for session to be established
        } catch (err: any) {
            console.error('Failed to start session:', err);
            setError(err.message.includes('not-allowed') ? t('errorMicPermission', uiLanguage) : t('errorLiveChat', uiLanguage));
            setStatus('error');
        }
    }, [uiLanguage, handleEndSession, geminiApiKey, status]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            handleEndSession();
        };
    }, [handleEndSession]);

     useEffect(() => {
        // Scroll to bottom of transcript
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcripts, currentInput, currentOutput]);

    const renderStatus = () => {
        switch (status) {
            case 'connecting':
                return <div className="flex items-center gap-2"><LoaderIcon /> {t('statusConnecting', uiLanguage)}</div>;
            case 'listening':
                return <div className="flex items-center gap-2 text-cyan-400"><MicrophoneIcon className="w-6 h-6 animate-pulse"/> {t('statusListening', uiLanguage)}</div>;
            case 'speaking':
                return <div className="flex items-center gap-2 text-indigo-400"><SawtliLogoIcon className="w-8 h-8"/> {t('statusSpeaking', uiLanguage)}</div>;
             case 'error':
                return <div className="text-red-400">{error}</div>;
            default:
                return null;
        }
    };
    
    const renderContent = () => {
        if (!geminiApiKey) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h3 className="text-xl font-bold text-cyan-400">{t('liveChatConfigNeededTitle', uiLanguage)}</h3>
                    <p className="mt-2 text-slate-400 max-w-md">{t('liveChatConfigNeededBody', uiLanguage)}</p>
                    <div dir="ltr" className="mt-4 my-3 p-3 bg-slate-900 rounded-md font-mono text-cyan-300 text-left">
                        <code>VITE_GEMINI_API_KEY</code>
                    </div>
                </div>
            );
        }

        if (status === 'idle' || status === 'error') {
             return (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <SawtliLogoIcon className="w-24 h-24 text-cyan-400 opacity-50" />
                    <p className="mt-4 text-slate-400 max-w-sm">{t('liveChatWelcome', uiLanguage)}</p>
                    {error && <p className="mt-4 p-3 bg-red-500/20 text-red-300 rounded-lg">{error}</p>}
                    <button onClick={handleStartSession} className="mt-8 h-12 px-8 flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-full transition-transform active:scale-95 shadow-lg shadow-cyan-500/20 text-lg">
                        <MicrophoneIcon className="w-6 h-6" />
                        <span>{t('startConversation', uiLanguage)}</span>
                    </button>
                </div>
             );
        }

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div ref={transcriptContainerRef} className="flex-grow overflow-y-auto pr-4 space-y-4">
                   {transcripts.map(t => (
                        <div key={t.id} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl ${t.speaker === 'user' ? 'bg-cyan-800 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                                <p className="text-white">{t.text}</p>
                            </div>
                        </div>
                   ))}
                   {currentInput && (
                        <div className="flex justify-end">
                            <div className="max-w-[80%] p-3 rounded-2xl bg-cyan-800 rounded-br-none opacity-60">
                                <p className="text-white">{currentInput}</p>
                            </div>
                        </div>
                   )}
                    {currentOutput && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] p-3 rounded-2xl bg-slate-700 rounded-bl-none opacity-60">
                                <p className="text-white">{currentOutput}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 pt-4 flex flex-col items-center justify-center gap-4">
                    <div className="h-8 text-slate-400 font-medium">{renderStatus()}</div>
                     <button onClick={handleEndSession} className="h-12 px-8 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-transform active:scale-95 shadow-lg shadow-red-500/20 text-lg">
                        <StopIcon />
                        <span>{t('endConversation', uiLanguage)}</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-cyan-400">{t('liveChatTitle', uiLanguage)}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default LiveChatModal;
