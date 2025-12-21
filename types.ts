
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

export interface StandardVoice {
    name: string; 
    label: string; 
    lang: string;  
    gender: 'Female' | 'Male';
    type: 'Azure Neural'; 
}

export interface Dialect {
    id: string;
    labelKey: string;
    instruction: string;
}

export const ARABIC_DIALECTS: Dialect[] = [
    { id: 'modern_standard', labelKey: 'dialectStandard', instruction: 'Speak in clear Modern Standard Arabic (Fusha) with perfect grammar.' },
    { id: 'white_dialect', labelKey: 'dialectWhite', instruction: 'Speak in a "White Dialect" (Ammiya Bayda), neutral and understood by all Arabs.' },
    { id: 'khaleeji', labelKey: 'dialectKhaleeji', instruction: 'Speak with a Gulf (Khaleeji) accent, emphasizing Saudi/UAE intonations.' },
    { id: 'levantine', labelKey: 'dialectLevantine', instruction: 'Speak with a melodic Levantine (Shami) accent.' },
    { id: 'egyptian', labelKey: 'dialectEgyptian', instruction: 'Speak with a vibrant and fast-paced Egyptian (Cairene) accent.' },
    { id: 'maghrebi', labelKey: 'dialectMaghrebi', instruction: 'Speak with an authentic Maghrebi accent.' },
    { id: 'iraqi', labelKey: 'dialectIraqi', instruction: 'Speak with a deep and poetic Iraqi accent.' }
];

export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    // Arabic
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    // French (New)
    { name: 'fr-FR-DeniseNeural', label: 'Denise (French)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (French)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
    { name: 'fr-CA-SylvieNeural', label: 'Sylvie (Canada)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    // English
    { name: 'en-US-AvaNeural', label: 'Ava (US)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
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

export const PLAN_LIMITS = {
    visitor: { dailyLimit: 350, totalTrialLimit: 5000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: true, allowStudio: true, allowMultiSpeaker: false, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 },
    admin: { dailyLimit: Infinity, totalTrialLimit: Infinity, trialDays: Infinity, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 }
};

// --- Fix: Added missing exported members to resolve module errors in audio and voice services ---

export type AudioPresetName = 'Default' | 'YouTube' | 'Podcast' | 'SocialMedia' | 'Cinema' | 'Telephone' | 'Gaming' | 'ASMR';

export interface AudioPreset {
    name: AudioPresetName;
    label: Record<string, string>;
    settings: AudioSettings;
}

export interface MusicTrack {
    id: string;
    name: string;
    buffer: AudioBuffer | null;
    duration: number;
}

export interface FallbackMap {
    [key: string]: { male: string, female: string };
}

export interface VoiceStyle {
    id: string;
    categoryKey: string;
    labelKey: string;
    prompt: string;
    recommendedSpeed: number;
}
