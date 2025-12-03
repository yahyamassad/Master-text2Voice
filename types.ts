
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

// Defines the "Studio" voices (Google Cloud TTS - WaveNet/Standard/Neural2)
export interface StandardVoice {
    name: string; // The API name (e.g., ar-XA-Wavenet-A)
    label: string; // Display name
    lang: string;  // 'ar', 'en', 'fr', etc.
    gender: 'Female' | 'Male';
    type: 'WaveNet' | 'Standard' | 'Neural2';
}

// SAFE LIST: All voices here are either Standard ($4/M) or WaveNet/Neural2 ($16/M).
// NO 'Studio' ($160/M) voices are included to prevent billing spikes.
export const GOOGLE_STUDIO_VOICES: StandardVoice[] = [
    // --- ARABIC (The Core) ---
    // WaveNet: $16.00 / 1M chars (1M Free/Mo)
    // Standard: $4.00 / 1M chars (4M Free/Mo)
    { name: 'ar-XA-Wavenet-A', label: 'Fatima (WaveNet)', lang: 'ar', gender: 'Female', type: 'WaveNet' },
    { name: 'ar-XA-Wavenet-B', label: 'Ahmed (WaveNet)', lang: 'ar', gender: 'Male', type: 'WaveNet' },
    { name: 'ar-XA-Wavenet-C', label: 'Omar (WaveNet)', lang: 'ar', gender: 'Male', type: 'WaveNet' },
    { name: 'ar-XA-Wavenet-D', label: 'Layla (WaveNet)', lang: 'ar', gender: 'Female', type: 'WaveNet' },
    { name: 'ar-XA-Standard-A', label: 'Salma (Standard)', lang: 'ar', gender: 'Female', type: 'Standard' },
    { name: 'ar-XA-Standard-B', label: 'Karim (Standard)', lang: 'ar', gender: 'Male', type: 'Standard' },
    { name: 'ar-XA-Standard-C', label: 'Tarek (Standard)', lang: 'ar', gender: 'Male', type: 'Standard' },
    { name: 'ar-XA-Standard-D', label: 'Mona (Standard)', lang: 'ar', gender: 'Female', type: 'Standard' },

    // --- ENGLISH (US) ---
    // Neural2: $16.00 / 1M chars (High Quality, Low Cost)
    { name: 'en-US-Neural2-J', label: 'Journey (US Male)', lang: 'en', gender: 'Male', type: 'Neural2' },
    { name: 'en-US-Neural2-F', label: 'Journey (US Female)', lang: 'en', gender: 'Female', type: 'Neural2' },
    // Replaced Expensive Studio Voices with Neural2 (Same Quality feel, 10x cheaper)
    { name: 'en-US-Neural2-C', label: 'Emma (US Neural2)', lang: 'en', gender: 'Female', type: 'Neural2' },
    { name: 'en-US-Neural2-D', label: 'Logan (US Neural2)', lang: 'en', gender: 'Male', type: 'Neural2' },
    { name: 'en-US-Wavenet-D', label: 'David (US News)', lang: 'en', gender: 'Male', type: 'WaveNet' },
    { name: 'en-US-Wavenet-F', label: 'Sarah (US News)', lang: 'en', gender: 'Female', type: 'WaveNet' },

    // --- ENGLISH (UK) ---
    { name: 'en-GB-Neural2-B', label: 'Arthur (UK Male)', lang: 'en', gender: 'Male', type: 'Neural2' },
    { name: 'en-GB-Neural2-C', label: 'Olivia (UK Female)', lang: 'en', gender: 'Female', type: 'Neural2' },
    { name: 'en-GB-Wavenet-B', label: 'George (UK News)', lang: 'en', gender: 'Male', type: 'WaveNet' },
    { name: 'en-GB-Wavenet-C', label: 'Charlotte (UK News)', lang: 'en', gender: 'Female', type: 'WaveNet' },

    // --- ENGLISH (Australia) ---
    { name: 'en-AU-Neural2-A', label: 'Harper (AU Female)', lang: 'en', gender: 'Female', type: 'Neural2' },
    { name: 'en-AU-Neural2-B', label: 'Liam (AU Male)', lang: 'en', gender: 'Male', type: 'Neural2' },

    // --- ENGLISH (India) ---
    { name: 'en-IN-Neural2-A', label: 'Priya (IN Female)', lang: 'en', gender: 'Female', type: 'Neural2' },
    { name: 'en-IN-Neural2-B', label: 'Arjun (IN Male)', lang: 'en', gender: 'Male', type: 'Neural2' },

    // --- FRENCH (France) ---
    { name: 'fr-FR-Neural2-A', label: 'Marie (FR Female)', lang: 'fr', gender: 'Female', type: 'Neural2' },
    { name: 'fr-FR-Neural2-B', label: 'Pierre (FR Male)', lang: 'fr', gender: 'Male', type: 'Neural2' },
    { name: 'fr-FR-Wavenet-C', label: 'Sophie (FR WaveNet)', lang: 'fr', gender: 'Female', type: 'WaveNet' },
    { name: 'fr-FR-Wavenet-D', label: 'Jean (FR WaveNet)', lang: 'fr', gender: 'Male', type: 'WaveNet' },

    // --- FRENCH (Canada) ---
    { name: 'fr-CA-Neural2-A', label: 'Amelie (CA Female)', lang: 'fr', gender: 'Female', type: 'Neural2' },
    { name: 'fr-CA-Neural2-B', label: 'Antoine (CA Male)', lang: 'fr', gender: 'Male', type: 'Neural2' },

    // --- SPANISH (Spain) ---
    { name: 'es-ES-Neural2-A', label: 'Lucia (ES Female)', lang: 'es', gender: 'Female', type: 'Neural2' },
    { name: 'es-ES-Neural2-B', label: 'Mateo (ES Male)', lang: 'es', gender: 'Male', type: 'Neural2' },

    // --- SPANISH (US/LatAm) ---
    { name: 'es-US-Neural2-A', label: 'Sofia (LatAm Female)', lang: 'es', gender: 'Female', type: 'Neural2' },
    { name: 'es-US-Neural2-B', label: 'Diego (LatAm Male)', lang: 'es', gender: 'Male', type: 'Neural2' },
    
    // --- GERMAN ---
    { name: 'de-DE-Neural2-C', label: 'Hanna (DE Female)', lang: 'de', gender: 'Female', type: 'Neural2' },
    { name: 'de-DE-Neural2-B', label: 'Klaus (DE Male)', lang: 'de', gender: 'Male', type: 'Neural2' },

    // --- ITALIAN ---
    { name: 'it-IT-Neural2-A', label: 'Giulia (IT Female)', lang: 'it', gender: 'Female', type: 'Neural2' },
    { name: 'it-IT-Neural2-C', label: 'Marco (IT Male)', lang: 'it', gender: 'Male', type: 'Neural2' },

    // --- PORTUGUESE (Brazil) ---
    { name: 'pt-BR-Neural2-A', label: 'Maria (BR Female)', lang: 'pt', gender: 'Female', type: 'Neural2' },
    { name: 'pt-BR-Neural2-B', label: 'Joao (BR Male)', lang: 'pt', gender: 'Male', type: 'Neural2' },

    // --- PORTUGUESE (Portugal) ---
    { name: 'pt-PT-Wavenet-A', label: 'Ines (PT Female)', lang: 'pt', gender: 'Female', type: 'WaveNet' },
    { name: 'pt-PT-Wavenet-B', label: 'Duarte (PT Male)', lang: 'pt', gender: 'Male', type: 'WaveNet' },

    // --- JAPANESE ---
    { name: 'ja-JP-Neural2-B', label: 'Akari (JP Female)', lang: 'ja', gender: 'Female', type: 'Neural2' },
    { name: 'ja-JP-Neural2-C', label: 'Ken (JP Male)', lang: 'ja', gender: 'Male', type: 'Neural2' },

    // --- KOREAN ---
    { name: 'ko-KR-Neural2-A', label: 'Ji-Min (KR Female)', lang: 'ko', gender: 'Female', type: 'Neural2' },
    { name: 'ko-KR-Neural2-C', label: 'Min-Ho (KR Male)', lang: 'ko', gender: 'Male', type: 'Neural2' },

    // --- CHINESE (Mandarin) ---
    { name: 'cmn-CN-Wavenet-A', label: 'Xiaoyan (CN Female)', lang: 'zh', gender: 'Female', type: 'WaveNet' },
    { name: 'cmn-CN-Wavenet-C', label: 'Chang (CN Male)', lang: 'zh', gender: 'Male', type: 'WaveNet' },

    // --- TURKISH ---
    { name: 'tr-TR-Wavenet-A', label: 'Elif (TR Female)', lang: 'tr', gender: 'Female', type: 'WaveNet' },
    { name: 'tr-TR-Wavenet-B', label: 'Emre (TR Male)', lang: 'tr', gender: 'Male', type: 'WaveNet' },

    // --- RUSSIAN ---
    { name: 'ru-RU-Wavenet-A', label: 'Svetlana (RU Female)', lang: 'ru', gender: 'Female', type: 'WaveNet' },
    { name: 'ru-RU-Wavenet-D', label: 'Dmitry (RU Male)', lang: 'ru', gender: 'Male', type: 'WaveNet' },

    // --- HINDI ---
    { name: 'hi-IN-Neural2-A', label: 'Anjali (IN Female)', lang: 'hi', gender: 'Female', type: 'Neural2' },
    { name: 'hi-IN-Neural2-B', label: 'Rohan (IN Male)', lang: 'hi', gender: 'Male', type: 'Neural2' },
];

// Alias for backward compatibility in components
export const AWS_STANDARD_VOICES = GOOGLE_STUDIO_VOICES;

export type UserTier = 'visitor' | 'free' | 'gold' | 'platinum' | 'admin';

// --- USER STATS FOR GAMIFICATION ---
export interface UserStats {
    trialStartDate: number; // Timestamp
    totalCharsUsed: number;
    dailyCharsUsed: number;
    lastUsageDate: string; // ISO Date String YYYY-MM-DD to reset daily limit
    hasRated: boolean;
    hasShared: boolean;
    invitedCount: number;
    bonusChars: number; // Extra chars earned via gamification
}

// --- AUDIO DSP TYPES ---

export interface AudioSettings {
    volume: number;      // 0-100 (Master Gain)
    speed: number;       // 0.5-2.0 (Playback Rate)
    pitch: number;       // -12 to +12 (Not fully implemented in WebAudio without artifacts, usually stays 0)
    eqBands: number[];   // 5 bands [60Hz, 250Hz, 1kHz, 4kHz, 12kHz] values in dB (-12 to +12)
    reverb: number;      // 0-100 (Wet/Dry mix)
    compression: number; // 0-100 (Threshold/Ratio map)
    stereoWidth: number; // 0-100 (Stereo Panner or M/S processing)
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

// --- STRATEGY: SMART TRIAL (14 Days / 5000 Chars / 350 Daily) ---

export const PLAN_LIMITS = {
    visitor: {
        maxCharsPerRequest: 100, // "The Sip"
        dailyLimit: 100,
        totalTrialLimit: 100, 
        trialDays: 1,
        maxDownloads: 0, 
        allowDownloads: false,
        allowWav: false,
        allowGemini: true, // Allowed but capped at 50 chars effectively by logic
        allowStudio: false, // LOCKED: No Studio for visitors
        allowMultiSpeaker: false,
        allowEffects: false,
    },
    free: {
        maxCharsPerRequest: 350, // Daily Cap acting as Request Cap
        dailyLimit: 350,         // "The Diet"
        totalTrialLimit: 5000,   // "The 14-Day Ration"
        trialDays: 14,
        maxDownloads: 3,         // 3 Tickets logic applied to downloads
        allowDownloads: true,    // MP3 Only
        allowWav: false,
        allowGemini: true,       // The main hook
        allowStudio: false,      // LOCKED: Upsell for Gold/Platinum
        allowMultiSpeaker: false,
        allowEffects: false,     // Upsell
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
