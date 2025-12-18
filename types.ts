
export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export interface SpeakerConfig {
    name: string;
    voice: string;
}

export interface MusicTrack {
    id: string;
    name: string;
    buffer: AudioBuffer;
    duration: number;
}

export const GEMINI_VOICES = ['Puck', 'Kore', 'Charon', 'Zephyr', 'Fenrir'];

export interface StandardVoice {
    name: string; 
    label: string; 
    lang: string;  
    gender: 'Female' | 'Male';
    type: 'Azure Neural' | 'ElevenLabs' | 'Gemini Ultra'; 
}

export type FallbackMap = Record<string, { male: string; female: string }>;

export interface VoiceStyle {
    id: string;
    categoryKey: string; 
    labelKey: string;    
    prompt: string;      
    recommendedSpeed?: number;
}

export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    // Advanced French Voices
    { name: 'fr-FR-DeniseNeural', label: 'Denise (France)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (France)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-FR-EloiseNeural', label: 'Eloise (France)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-JeromeNeural', label: 'Jerome (France)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
];

export type UserTier = 'visitor' | 'free' | 'onedollar' | 'basic' | 'creator' | 'gold' | 'professional' | 'admin';

export interface UserStats {
    trialStartDate: number;
    totalCharsUsed: number;
    dailyCharsUsed: number;
    lastUsageDate: string;
    hasRated: boolean;
    hasShared: boolean;
    invitedCount: number;
    bonusChars: number;
}

export interface AudioSettings {
    volume: number;
    speed: number;
    pitch: number;
    eqBands: number[];
    reverb: number;
    compression: number;
    stereoWidth: number;
}

export type AudioPresetName = 'Default' | 'YouTube' | 'Podcast' | 'SocialMedia' | 'Cinema' | 'Telephone' | 'Gaming' | 'ASMR';

export interface AudioPreset {
    name: AudioPresetName;
    label: Record<string, string>;
    settings: AudioSettings;
}

export const PLAN_LIMITS = {
    visitor: { 
        dailyLimit: 100,
        totalTrialLimit: 1000,
        trialDays: 7,
        allowDownloads: false, 
        allowWav: false,
        allowGemini: false, 
        allowStudio: false,
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false,
        allowUpload: false,
        maxAzureVoices: 2, 
    },
    free: { 
        dailyLimit: 150,
        totalTrialLimit: 2000,
        trialDays: 30,
        allowDownloads: true, 
        allowWav: false,
        allowGemini: false, 
        allowStudio: false, 
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false,
        allowUpload: false,
        maxAzureVoices: 3, 
    },
    onedollar: { 
        dailyLimit: Infinity, 
        totalTrialLimit: 15000, 
        trialDays: 7, 
        allowDownloads: true, 
        allowWav: true, 
        allowGemini: true, 
        allowStudio: true, 
        allowMultiSpeaker: true, 
        allowEffects: true, 
        allowTashkeel: true, 
        allowMic: true, 
        allowMusicUpload: true, 
        allowUpload: false, 
        maxAzureVoices: 50,
    },
    gold: { 
        dailyLimit: Infinity,
        totalTrialLimit: 50000, 
        trialDays: 30, 
        allowDownloads: true,
        allowWav: true, 
        allowGemini: true, 
        allowStudio: true,
        allowMultiSpeaker: true, 
        allowEffects: true, 
        allowTashkeel: true, 
        allowMic: true, 
        allowMusicUpload: true, 
        allowUpload: true,
        maxAzureVoices: 50,
    },
    professional: { 
        dailyLimit: Infinity,
        totalTrialLimit: 750000, 
        trialDays: 30, 
        allowDownloads: true,
        allowWav: true, 
        allowGemini: true, 
        allowStudio: true,
        allowMultiSpeaker: true, 
        allowEffects: true, 
        allowTashkeel: true, 
        allowMic: true, 
        allowMusicUpload: true, 
        allowUpload: true,
        maxAzureVoices: 50,
    },
    admin: {
        dailyLimit: Infinity,
        totalTrialLimit: Infinity,
        trialDays: Infinity,
        allowDownloads: true,
        allowWav: true, 
        allowGemini: true, 
        allowStudio: true,
        allowMultiSpeaker: true, 
        allowEffects: true, 
        allowTashkeel: true, 
        allowMic: true, 
        allowMusicUpload: true, 
        allowUpload: true,
        maxAzureVoices: 50,
    }
};
