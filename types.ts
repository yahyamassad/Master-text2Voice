

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
