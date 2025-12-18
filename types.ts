
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

export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    // --- ARABIC (FULL DIALECTS) ---
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi Male)', lang: 'ar-SA', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi Female)', lang: 'ar-SA', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian Female)', lang: 'ar-EG', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian Male)', lang: 'ar-EG', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-AE-FatimaNeural', label: 'Fatima (UAE Female)', lang: 'ar-AE', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE Male)', lang: 'ar-AE', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-KW-NouraNeural', label: 'Noura (Kuwaiti Female)', lang: 'ar-KW', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-KW-FahedNeural', label: 'Fahed (Kuwaiti Male)', lang: 'ar-KW', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-LB-LayalNeural', label: 'Layal (Lebanese Female)', lang: 'ar-LB', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LB-RamiNeural', label: 'Rami (Lebanese Male)', lang: 'ar-LB', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-MA-MounaNeural', label: 'Mouna (Moroccan Female)', lang: 'ar-MA', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-MA-JamalNeural', label: 'Jamal (Moroccan Male)', lang: 'ar-MA', gender: 'Male', type: 'Azure Neural' },

    // --- FRENCH (REQUESTED) ---
    { name: 'fr-FR-DeniseNeural', label: 'Denise (French Female)', lang: 'fr-FR', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (French Male)', lang: 'fr-FR', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-FR-EloiseNeural', label: 'Eloise (French Female)', lang: 'fr-FR', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-RemyNeural', label: 'Remy (French Male)', lang: 'fr-FR', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-CA-SylvieNeural', label: 'Sylvie (Canada Female)', lang: 'fr-CA', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-CA-JeanNeural', label: 'Jean (Canada Male)', lang: 'fr-CA', gender: 'Male', type: 'Azure Neural' },

    // --- ENGLISH ---
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en-US', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en-US', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-GB-SoniaNeural', label: 'Sonia (UK Female)', lang: 'en-GB', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-GB-RyanNeural', label: 'Ryan (UK Male)', lang: 'en-GB', gender: 'Male', type: 'Azure Neural' },
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
    visitor: { dailyLimit: 100, totalTrialLimit: 1000, trialDays: 7, allowDownloads: false, allowWav: false, allowGemini: false, allowStudio: false, allowMultiSpeaker: false, allowEffects: false, allowTashkeel: false, allowMic: false, allowMusicUpload: false, allowUpload: false, maxAzureVoices: 5, },
    free: { dailyLimit: 150, totalTrialLimit: 2000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: false, allowStudio: false, allowMultiSpeaker: false, allowEffects: false, allowTashkeel: false, allowMic: false, allowMusicUpload: false, allowUpload: false, maxAzureVoices: 10, },
    onedollar: { dailyLimit: Infinity, totalTrialLimit: 15000, trialDays: 7, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: false, maxAzureVoices: 100, },
    gold: { dailyLimit: Infinity, totalTrialLimit: 50000, trialDays: 30, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 100, },
    professional: { dailyLimit: Infinity, totalTrialLimit: 750000, trialDays: 30, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 100, },
    admin: { dailyLimit: Infinity, totalTrialLimit: Infinity, trialDays: Infinity, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 100, }
};

export interface FallbackMap {
    [langCode: string]: {
        male: string;
        female: string;
    };
}

export interface VoiceStyle {
    id: string;
    categoryKey: string;
    labelKey: string;
    prompt: string;
    recommendedSpeed?: number;
}
