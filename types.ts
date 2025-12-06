

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

// Defines the "Studio" voices (Now Microsoft Azure Neural)
export interface StandardVoice {
    name: string; // The API name (e.g., ar-SA-HamedNeural)
    label: string; // Display name
    lang: string;  // 'ar', 'en', 'fr', etc.
    gender: 'Female' | 'Male';
    type: 'Azure Neural'; // Simplified type
}

// MICROSOFT AZURE VOICES LIST
// Selected high-quality Neural voices with focus on Arabic dialects
export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    // ==========================================
    // ARABIC (The Ultimate Collection)
    // ==========================================
    
    // SAUDI ARABIA (The Standard)
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    
    // EGYPT
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },

    // LEVANT (Sham)
    { name: 'ar-JO-TaimNeural', label: 'Taim (Jordanian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-JO-SanaNeural', label: 'Sana (Jordanian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LB-RamiNeural', label: 'Rami (Lebanese)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-LB-LaylaNeural', label: 'Layla (Lebanese)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-SY-LaithNeural', label: 'Laith (Syrian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SY-AmanyNeural', label: 'Amany (Syrian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },

    // GULF (Khaliji)
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-AE-FatimaNeural', label: 'Fatima (UAE)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-KW-FahedNeural', label: 'Fahed (Kuwaiti)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-KW-NouraNeural', label: 'Noura (Kuwaiti)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-QA-AmalNeural', label: 'Amal (Qatari)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-QA-MoazNeural', label: 'Moaz (Qatari)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-BH-AliNeural', label: 'Ali (Bahraini)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-BH-LailaNeural', label: 'Laila (Bahraini)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-OM-AbdullahNeural', label: 'Abdullah (Omani)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-OM-AyshaNeural', label: 'Aysha (Omani)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },

    // NORTH AFRICA (Maghreb)
    { name: 'ar-DZ-IsmaelNeural', label: 'Ismael (Algerian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-DZ-AminaNeural', label: 'Amina (Algerian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-MA-JamalNeural', label: 'Jamal (Moroccan)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-MA-MounaNeural', label: 'Mouna (Moroccan)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-TN-HediNeural', label: 'Hedi (Tunisian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-TN-ReemNeural', label: 'Reem (Tunisian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LY-OmarNeural', label: 'Omar (Libyan)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-LY-ImanNeural', label: 'Iman (Libyan)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },

    // OTHERS
    { name: 'ar-IQ-BasselNeural', label: 'Bassel (Iraqi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-IQ-RanaNeural', label: 'Rana (Iraqi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-YE-SalehNeural', label: 'Saleh (Yemeni)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-YE-MaryamNeural', label: 'Maryam (Yemeni)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },

    // ==========================================
    // INTERNATIONAL (Translation Targets)
    // ==========================================

    // ENGLISH (US & UK)
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-US-EmmaNeural', label: 'Emma (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-BrianNeural', label: 'Brian (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-GB-SoniaNeural', label: 'Sonia (UK Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-GB-RyanNeural', label: 'Ryan (UK Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },

    // FRENCH (France & Canada)
    { name: 'fr-FR-DeniseNeural', label: 'Denise (France)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (France)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-FR-CelesteNeural', label: 'Celeste (France - Soft)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-JeromeNeural', label: 'Jerome (France - Deep)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-CA-SylvieNeural', label: 'Sylvie (Canada)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-CA-AntoineNeural', label: 'Antoine (Canada)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },

    // SPANISH
    { name: 'es-ES-ElviraNeural', label: 'Elvira (Spain)', lang: 'es', gender: 'Female', type: 'Azure Neural' },
    { name: 'es-ES-AlvaroNeural', label: 'Alvaro (Spain)', lang: 'es', gender: 'Male', type: 'Azure Neural' },
    { name: 'es-MX-DaliaNeural', label: 'Dalia (Mexico)', lang: 'es', gender: 'Female', type: 'Azure Neural' },
    { name: 'es-MX-JorgeNeural', label: 'Jorge (Mexico)', lang: 'es', gender: 'Male', type: 'Azure Neural' },

    // GERMAN
    { name: 'de-DE-KatjaNeural', label: 'Katja (German)', lang: 'de', gender: 'Female', type: 'Azure Neural' },
    { name: 'de-DE-ConradNeural', label: 'Conrad (German)', lang: 'de', gender: 'Male', type: 'Azure Neural' },

    // ITALIAN
    { name: 'it-IT-ElsaNeural', label: 'Elsa (Italian)', lang: 'it', gender: 'Female', type: 'Azure Neural' },
    { name: 'it-IT-DiegoNeural', label: 'Diego (Italian)', lang: 'it', gender: 'Male', type: 'Azure Neural' },

    // PORTUGUESE
    { name: 'pt-BR-FranciscaNeural', label: 'Francisca (Brazil)', lang: 'pt', gender: 'Female', type: 'Azure Neural' },
    { name: 'pt-BR-AntonioNeural', label: 'Antonio (Brazil)', lang: 'pt', gender: 'Male', type: 'Azure Neural' },
    { name: 'pt-PT-RaquelNeural', label: 'Raquel (Portugal)', lang: 'pt', gender: 'Female', type: 'Azure Neural' },

    // JAPANESE
    { name: 'ja-JP-NanamiNeural', label: 'Nanami (Japanese)', lang: 'ja', gender: 'Female', type: 'Azure Neural' },
    { name: 'ja-JP-KeitaNeural', label: 'Keita (Japanese)', lang: 'ja', gender: 'Male', type: 'Azure Neural' },

    // KOREAN
    { name: 'ko-KR-SunHiNeural', label: 'Sun-Hi (Korean)', lang: 'ko', gender: 'Female', type: 'Azure Neural' },
    { name: 'ko-KR-InJoonNeural', label: 'In-Joon (Korean)', lang: 'ko', gender: 'Male', type: 'Azure Neural' },

    // CHINESE
    { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao (Chinese)', lang: 'zh', gender: 'Female', type: 'Azure Neural' },
    { name: 'zh-CN-YunxiNeural', label: 'Yunxi (Chinese)', lang: 'zh', gender: 'Male', type: 'Azure Neural' },

    // TURKISH
    { name: 'tr-TR-EmelNeural', label: 'Emel (Turkish)', lang: 'tr', gender: 'Female', type: 'Azure Neural' },
    { name: 'tr-TR-AhmetNeural', label: 'Ahmet (Turkish)', lang: 'tr', gender: 'Male', type: 'Azure Neural' },

    // RUSSIAN
    { name: 'ru-RU-SvetlanaNeural', label: 'Svetlana (Russian)', lang: 'ru', gender: 'Female', type: 'Azure Neural' },
    { name: 'ru-RU-DmitryNeural', label: 'Dmitry (Russian)', lang: 'ru', gender: 'Male', type: 'Azure Neural' },

    // HINDI
    { name: 'hi-IN-SwaraNeural', label: 'Swara (Hindi)', lang: 'hi', gender: 'Female', type: 'Azure Neural' },
    { name: 'hi-IN-MadhurNeural', label: 'Madhur (Hindi)', lang: 'hi', gender: 'Male', type: 'Azure Neural' },

    // HEBREW
    { name: 'he-IL-HilaNeural', label: 'Hila (Hebrew)', lang: 'he', gender: 'Female', type: 'Azure Neural' },
    { name: 'he-IL-AvriNeural', label: 'Avri (Hebrew)', lang: 'he', gender: 'Male', type: 'Azure Neural' },

    // PERSIAN (Farsi)
    { name: 'fa-IR-DilaraNeural', label: 'Dilara (Persian)', lang: 'fa', gender: 'Female', type: 'Azure Neural' },
    { name: 'fa-IR-FaridNeural', label: 'Farid (Persian)', lang: 'fa', gender: 'Male', type: 'Azure Neural' },
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