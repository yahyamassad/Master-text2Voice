


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

// Defines the reliable "Standard" voices from AWS Polly
// This replaces the unreliable window.speechSynthesis voices
export interface StandardVoice {
    name: string;
    label: string; // Display name
    lang: string;  // 'ar', 'en', 'fr', etc.
    gender: 'Female' | 'Male';
}

export const AWS_STANDARD_VOICES: StandardVoice[] = [
    // Arabic
    { name: 'Zeina', label: 'Zeina (Arabic)', lang: 'ar', gender: 'Female' },
    { name: 'Maged', label: 'Maged (Arabic)', lang: 'ar', gender: 'Male' },
    
    // English (US)
    { name: 'Joanna', label: 'Joanna (US English)', lang: 'en', gender: 'Female' },
    { name: 'Joey', label: 'Joey (US English)', lang: 'en', gender: 'Male' },
    { name: 'Matthew', label: 'Matthew (US English)', lang: 'en', gender: 'Male' },
    { name: 'Ivy', label: 'Ivy (US Child)', lang: 'en', gender: 'Female' },
    { name: 'Salli', label: 'Salli (US English)', lang: 'en', gender: 'Female' },
    { name: 'Kimberly', label: 'Kimberly (US English)', lang: 'en', gender: 'Female' },
    { name: 'Justin', label: 'Justin (US Child)', lang: 'en', gender: 'Male' },
    { name: 'Kendra', label: 'Kendra (US English)', lang: 'en', gender: 'Female' },

    // English (British)
    { name: 'Brian', label: 'Brian (British)', lang: 'en', gender: 'Male' },
    { name: 'Amy', label: 'Amy (British)', lang: 'en', gender: 'Female' },
    { name: 'Emma', label: 'Emma (British)', lang: 'en', gender: 'Female' },

    // French
    { name: 'Celine', label: 'Celine (French)', lang: 'fr', gender: 'Female' },
    { name: 'Mathieu', label: 'Mathieu (French)', lang: 'fr', gender: 'Male' },
    { name: 'Lea', label: 'Léa (French)', lang: 'fr', gender: 'Female' },
    
    // Spanish
    { name: 'Conchita', label: 'Conchita (Spanish)', lang: 'es', gender: 'Female' },
    { name: 'Enrique', label: 'Enrique (Spanish)', lang: 'es', gender: 'Male' },
    { name: 'Lucia', label: 'Lucia (Spanish)', lang: 'es', gender: 'Female' },
    
    // Portuguese
    { name: 'Camila', label: 'Camila (Brazilian)', lang: 'pt', gender: 'Female' },
    { name: 'Ricardo', label: 'Ricardo (Brazilian)', lang: 'pt', gender: 'Male' },
    { name: 'Vitoria', label: 'Vitória (Brazilian)', lang: 'pt', gender: 'Female' },
    
    // German
    { name: 'Marlene', label: 'Marlene (German)', lang: 'de', gender: 'Female' },
    { name: 'Hans', label: 'Hans (German)', lang: 'de', gender: 'Male' },
    { name: 'Vicki', label: 'Vicki (German)', lang: 'de', gender: 'Female' },

    // Italian
    { name: 'Carla', label: 'Carla (Italian)', lang: 'it', gender: 'Female' },
    { name: 'Giorgio', label: 'Giorgio (Italian)', lang: 'it', gender: 'Male' },
    { name: 'Bianca', label: 'Bianca (Italian)', lang: 'it', gender: 'Female' },

    // Russian
    { name: 'Tatyana', label: 'Tatyana (Russian)', lang: 'ru', gender: 'Female' },
    { name: 'Maxim', label: 'Maxim (Russian)', lang: 'ru', gender: 'Male' },

    // Turkish
    { name: 'Filiz', label: 'Filiz (Turkish)', lang: 'tr', gender: 'Female' },
];

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
