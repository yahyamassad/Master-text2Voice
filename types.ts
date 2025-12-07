
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

// Updated Tiers based on the new Plan Table
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

export interface MusicTrack {
    id: string;
    name: string;
    buffer: AudioBuffer;
    duration: number;
}

// --- STRICT LIMITS DEFINITION BASED ON PROVIDED TABLE ---
export const PLAN_LIMITS = {
    visitor: {
        dailyLimit: 50,
        totalTrialLimit: 50,
        trialDays: 1,
        allowDownloads: false,
        allowWav: false,
        allowGemini: true, // Demo
        allowStudio: false,
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false,
    },
    free: {
        dailyLimit: 200, // Small daily cap to force spread
        totalTrialLimit: 5000, // 5000 chars total/month as per table
        trialDays: 30,
        allowDownloads: true, // MP3 5 mins
        allowWav: false,
        allowGemini: true,
        allowStudio: false, // Presets & Ducking only
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false, // "Add Music File" is X in table
    },
    onedollar: {
        dailyLimit: 10000, 
        totalTrialLimit: 10000, // 10k chars total
        trialDays: 3, // 3 Days access
        allowDownloads: true, // 10 mins
        allowWav: true, // Included!
        allowGemini: true,
        allowStudio: true, // Mixer included
        allowMultiSpeaker: true, // 2 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
    },
    basic: {
        dailyLimit: Infinity,
        totalTrialLimit: 75000, // 75k chars
        trialDays: 30,
        allowDownloads: true,
        allowWav: false, // No WAV in Basic
        allowGemini: true,
        allowStudio: false, // Mixer X in table
        allowMultiSpeaker: false, // X in table
        allowEffects: false, // X in table
        allowTashkeel: true,
        allowMic: false, // X in table
        allowMusicUpload: true,
    },
    creator: {
        dailyLimit: Infinity,
        totalTrialLimit: 150000, // 150k chars
        trialDays: 30,
        allowDownloads: true,
        allowWav: false, // No WAV in Creator
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true, // 2 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
    },
    gold: {
        dailyLimit: Infinity,
        totalTrialLimit: 300000, // 300k chars
        trialDays: 30,
        allowDownloads: true,
        allowWav: true,
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true, // 3 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
    },
    professional: {
        dailyLimit: Infinity,
        totalTrialLimit: 750000, // 750k chars
        trialDays: 365, // Usually treated as monthly subscription renewal
        allowDownloads: true,
        allowWav: true,
        allowGemini: true,
        allowStudio: true,
        allowMultiSpeaker: true, // 4 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
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
    }
};
