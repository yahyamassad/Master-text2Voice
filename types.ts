
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
    // --- ARABIC (SAUDI) ---
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi Male)', lang: 'ar-SA', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi Female)', lang: 'ar-SA', gender: 'Female', type: 'Azure Neural' },
    
    // --- ARABIC (EGYPT) ---
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian Female)', lang: 'ar-EG', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian Male)', lang: 'ar-EG', gender: 'Male', type: 'Azure Neural' },
    
    // --- ARABIC (UAE) ---
    { name: 'ar-AE-FatimaNeural', label: 'Fatima (UAE Female)', lang: 'ar-AE', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE Male)', lang: 'ar-AE', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (KUWAIT) ---
    { name: 'ar-KW-NouraNeural', label: 'Noura (Kuwaiti Female)', lang: 'ar-KW', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-KW-FahedNeural', label: 'Fahed (Kuwaiti Male)', lang: 'ar-KW', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (JORDAN) ---
    { name: 'ar-JO-SanaNeural', label: 'Sana (Jordanian Female)', lang: 'ar-JO', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-JO-TaimNeural', label: 'Taim (Jordanian Male)', lang: 'ar-JO', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (MOROCCO) ---
    { name: 'ar-MA-MounaNeural', label: 'Mouna (Moroccan Female)', lang: 'ar-MA', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-MA-JamalNeural', label: 'Jamal (Moroccan Male)', lang: 'ar-MA', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (ALGERIA) ---
    { name: 'ar-DZ-AminaNeural', label: 'Amina (Algerian Female)', lang: 'ar-DZ', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-DZ-IsmaelNeural', label: 'Ismael (Algerian Male)', lang: 'ar-DZ', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (IRAQ) ---
    { name: 'ar-IQ-RanaNeural', label: 'Rana (Iraqi Female)', lang: 'ar-IQ', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-IQ-BasselNeural', label: 'Bassel (Iraqi Male)', lang: 'ar-IQ', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (LEBANON) ---
    { name: 'ar-LB-LayalNeural', label: 'Layal (Lebanese Female)', lang: 'ar-LB', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LB-RamiNeural', label: 'Rami (Lebanese Male)', lang: 'ar-LB', gender: 'Male', type: 'Azure Neural' },

    // --- ARABIC (QATAR) ---
    { name: 'ar-QA-AmalNeural', label: 'Amal (Qatari Female)', lang: 'ar-QA', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-QA-MoazNeural', label: 'Moaz (Qatari Male)', lang: 'ar-QA', gender: 'Male', type: 'Azure Neural' },

    // --- FRENCH ---
    { name: 'fr-FR-DeniseNeural', label: 'Denise (French Female)', lang: 'fr-FR', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (French Male)', lang: 'fr-FR', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-FR-EloiseNeural', label: 'Eloise (French Female)', lang: 'fr-FR', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-RemyNeural', label: 'Remy (French Male)', lang: 'fr-FR', gender: 'Male', type: 'Azure Neural' },

    // --- ENGLISH ---
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en-US', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en-US', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-US-EmmaNeural', label: 'Emma (US Female)', lang: 'en-US', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-BrianNeural', label: 'Brian (US Male)', lang: 'en-US', gender: 'Male', type: 'Azure Neural' },

    // --- SPANISH ---
    { name: 'es-ES-ElviraNeural', label: 'Elvira (Spanish Female)', lang: 'es-ES', gender: 'Female', type: 'Azure Neural' },
    { name: 'es-ES-AlvaroNeural', label: 'Alvaro (Spanish Male)', lang: 'es-ES', gender: 'Male', type: 'Azure Neural' },

    // --- PORTUGUESE ---
    { name: 'pt-BR-FranciscaNeural', label: 'Francisca (Brazilian Female)', lang: 'pt-BR', gender: 'Female', type: 'Azure Neural' },
    { name: 'pt-BR-AntonioNeural', label: 'Antonio (Brazilian Male)', lang: 'pt-BR', gender: 'Male', type: 'Azure Neural' },
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

// --- FIX: Added FallbackMap interface ---
/**
 * Maps languages to the best available Azure fallback voice.
 */
export interface FallbackMap {
    [langCode: string]: {
        male: string;
        female: string;
    };
}

// --- FIX: Added VoiceStyle interface ---
/**
 * Defines a specific vocal performance style.
 */
export interface VoiceStyle {
    id: string;
    categoryKey: string;
    labelKey: string;
    prompt: string;
    recommendedSpeed?: number;
}
