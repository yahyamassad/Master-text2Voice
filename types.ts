
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

export const GEMINI_VOICES = ['Puck', 'Kore', 'Charon', 'Zephyr', 'Fenrir'];

// Defines the "Studio" voices (Microsoft Azure Neural)
export interface StandardVoice {
    name: string; // The API name (e.g., ar-SA-HamedNeural)
    label: string; // Display name
    lang: string;  // 'ar', 'en', 'fr', etc.
    gender: 'Female' | 'Male';
    type: 'Azure Neural'; // Simplified type
}

// Fallback Map Interface
export type FallbackMap = Record<string, { male: string; female: string }>;

// MICROSOFT AZURE VOICES LIST
export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    // ARABIC
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-JO-TaimNeural', label: 'Taim (Jordanian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-JO-SanaNeural', label: 'Sana (Jordanian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-AE-FatimaNeural', label: 'Fatima (UAE)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    // ENGLISH
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    // FRENCH
    { name: 'fr-FR-DeniseNeural', label: 'Denise (France)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (France)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
];

export type UserTier = 'visitor' | 'free' | 'gold' | 'platinum' | 'admin';

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

export interface MusicTrack {
    id: string;
    name: string;
    buffer: AudioBuffer;
    duration: number;
}

// --- STRICT LIMITS DEFINITION ---
export const PLAN_LIMITS = {
    visitor: {
        maxCharsPerRequest: 50, // STRICT LIMIT FOR VISITORS
        dailyLimit: 50,
        totalTrialLimit: 50, 
        trialDays: 1,
        maxDownloads: 0, 
        allowDownloads: false, // NO DOWNLOADS
        allowWav: false,
        allowGemini: true, // Allowed for demo
        allowStudio: false, // NO STUDIO
        allowMultiSpeaker: false,
        allowEffects: false,
    },
    free: {
        maxCharsPerRequest: 350,
        dailyLimit: 350,
        totalTrialLimit: 5000,
        trialDays: 14,
        maxDownloads: 3,
        allowDownloads: true,
        allowWav: false,
        allowGemini: true,
        allowStudio: false,
        allowMultiSpeaker: false,
        allowEffects: false,
    },
    gold: {
        maxCharsPerRequest: Infinity,
        dailyLimit: Infinity,
        totalTrialLimit: Infinity,
        trialDays: Infinity,
        maxDownloads: Infinity,
        allowDownloads: true,
        allowWav: true,
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true,
        allowEffects: true,
    },
    platinum: {
        maxCharsPerRequest: Infinity,
        dailyLimit: Infinity,
        totalTrialLimit: Infinity,
        trialDays: Infinity,
        maxDownloads: Infinity,
        allowDownloads: true,
        allowWav: true,
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true,
        allowEffects: true,
    },
    admin: {
        maxCharsPerRequest: Infinity,
        dailyLimit: Infinity,
        totalTrialLimit: Infinity,
        trialDays: Infinity,
        maxDownloads: Infinity,
        allowDownloads: true,
        allowWav: true,
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true,
        allowEffects: true,
    }
};
