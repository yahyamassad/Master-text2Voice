
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
    name: string; // The API name
    label: string; // Display name
    lang: string;  // 'ar', 'en', 'fr', etc.
    gender: 'Female' | 'Male';
    type: 'Azure Neural'; 
}

// Fallback Map Interface
export type FallbackMap = Record<string, { male: string; female: string }>;

// Voice Style / Persona Interface
export interface VoiceStyle {
    id: string;
    categoryKey: string; // e.g., 'catLiterature'
    labelKey: string;    // e.g., 'styleEpicPoet'
    prompt: string;      // The instruction sent to Gemini
    recommendedSpeed?: number;
}

// EXPANDED MICROSOFT AZURE VOICES LIST (PRO VOICES)
export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
    // --- ARABIC (All Dialects) ---
    { name: 'ar-SA-HamedNeural', label: 'Hamed (Saudi)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-SA-ZariyahNeural', label: 'Zariyah (Saudi)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-SalmaNeural', label: 'Salma (Egyptian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-EG-ShakirNeural', label: 'Shakir (Egyptian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-JO-TaimNeural', label: 'Taim (Jordanian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-JO-SanaNeural', label: 'Sana (Jordanian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-AE-HamdanNeural', label: 'Hamdan (UAE)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-AE-FatimaNeural', label: 'Fatima (UAE)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-KW-FahedNeural', label: 'Fahed (Kuwaiti)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-KW-NouraNeural', label: 'Noura (Kuwaiti)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-QA-AmalNeural', label: 'Amal (Qatari)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    // Fix: Updated label to Muath to avoid confusion with Moza (female)
    { name: 'ar-QA-MoazNeural', label: 'Muath (Qatari - مُعاذ)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-BH-AliNeural', label: 'Ali (Bahraini)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-BH-LailaNeural', label: 'Laila (Bahraini)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-OM-AbdullahNeural', label: 'Abdullah (Omani)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-OM-AyshaNeural', label: 'Aysha (Omani)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-SY-AmanyNeural', label: 'Amany (Syrian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-SY-LaithNeural', label: 'Laith (Syrian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-MA-JamalNeural', label: 'Jamal (Moroccan)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-MA-MounaNeural', label: 'Mouna (Moroccan)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-DZ-IsmaelNeural', label: 'Ismael (Algerian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-DZ-AminaNeural', label: 'Amina (Algerian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-TN-HediNeural', label: 'Hedi (Tunisian)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-TN-ReemNeural', label: 'Reem (Tunisian)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-YE-MaryamNeural', label: 'Maryam (Yemeni)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-YE-SalehNeural', label: 'Saleh (Yemeni)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'ar-LB-LaylaNeural', label: 'Layla (Lebanese)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LB-RamiNeural', label: 'Rami (Lebanese)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    
    // --- ENGLISH ---
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-GB-SoniaNeural', label: 'Sonia (UK Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-GB-RyanNeural', label: 'Ryan (UK Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
    
    // --- FRENCH ---
    { name: 'fr-FR-DeniseNeural', label: 'Denise (France)', lang: 'fr', gender: 'Female', type: 'Azure Neural' },
    { name: 'fr-FR-HenriNeural', label: 'Henri (France)', lang: 'fr', gender: 'Male', type: 'Azure Neural' },
    
    // --- SPANISH ---
    { name: 'es-ES-ElviraNeural', label: 'Elvira (Spain)', lang: 'es', gender: 'Female', type: 'Azure Neural' },
    { name: 'es-ES-AlvaroNeural', label: 'Alvaro (Spain)', lang: 'es', gender: 'Male', type: 'Azure Neural' },
    
    // --- PORTUGUESE ---
    { name: 'pt-BR-FranciscaNeural', label: 'Francisca (Brazil)', lang: 'pt', gender: 'Female', type: 'Azure Neural' },
    { name: 'pt-BR-AntonioNeural', label: 'Antonio (Brazil)', lang: 'pt', gender: 'Male', type: 'Azure Neural' },
    
    // --- GERMAN ---
    { name: 'de-DE-KatjaNeural', label: 'Katja (Germany)', lang: 'de', gender: 'Female', type: 'Azure Neural' },
    { name: 'de-DE-ConradNeural', label: 'Conrad (Germany)', lang: 'de', gender: 'Male', type: 'Azure Neural' },
    
    // --- ITALIAN ---
    { name: 'it-IT-ElsaNeural', label: 'Elsa (Italy)', lang: 'it', gender: 'Female', type: 'Azure Neural' },
    { name: 'it-IT-DiegoNeural', label: 'Diego (Italy)', lang: 'it', gender: 'Male', type: 'Azure Neural' },
    
    // --- RUSSIAN ---
    { name: 'ru-RU-SvetlanaNeural', label: 'Svetlana (Russia)', lang: 'ru', gender: 'Female', type: 'Azure Neural' },
    { name: 'ru-RU-DmitryNeural', label: 'Dmitry (Russia)', lang: 'ru', gender: 'Male', type: 'Azure Neural' },
    
    // --- TURKISH ---
    { name: 'tr-TR-EmelNeural', label: 'Emel (Turkey)', lang: 'tr', gender: 'Female', type: 'Azure Neural' },
    { name: 'tr-TR-AhmetNeural', label: 'Ahmet (Turkey)', lang: 'tr', gender: 'Male', type: 'Azure Neural' },
    
    // --- HINDI ---
    { name: 'hi-IN-SwaraNeural', label: 'Swara (India)', lang: 'hi', gender: 'Female', type: 'Azure Neural' },
    { name: 'hi-IN-MadhurNeural', label: 'Madhur (India)', lang: 'hi', gender: 'Male', type: 'Azure Neural' },
    
    // --- CHINESE ---
    { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao (China)', lang: 'zh', gender: 'Female', type: 'Azure Neural' },
    { name: 'zh-CN-YunxiNeural', label: 'Yunxi (China)', lang: 'zh', gender: 'Male', type: 'Azure Neural' },
    
    // --- JAPANESE ---
    { name: 'ja-JP-NanamiNeural', label: 'Nanami (Japan)', lang: 'ja', gender: 'Female', type: 'Azure Neural' },
    { name: 'ja-JP-KeitaNeural', label: 'Keita (Japan)', lang: 'ja', gender: 'Male', type: 'Azure Neural' },
    
    // --- KOREAN ---
    { name: 'ko-KR-SunHiNeural', label: 'SunHi (Korea)', lang: 'ko', gender: 'Female', type: 'Azure Neural' },
    { name: 'ko-KR-InJoonNeural', label: 'InJoon (Korea)', lang: 'ko', gender: 'Male', type: 'Azure Neural' },
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

export interface MusicTrack {
    id: string;
    name: string;
    buffer: AudioBuffer;
    duration: number;
}

// --- STRICT LIMITS DEFINITION BASED ON PROVIDED TABLE ---
export const PLAN_LIMITS = {
    visitor: { // Treated as unregistered FREE
        dailyLimit: 350, // Updated to 350 as requested
        totalTrialLimit: 5000,
        trialDays: 30,
        allowDownloads: true, // MP3
        allowWav: false,
        allowGemini: false, // BLOCKED
        allowStudio: false,
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false,
        allowUpload: false, // Voice file
        maxAzureVoices: 2, // New Limit
    },
    free: { // Matches "مشترك مجاني"
        dailyLimit: 200,
        totalTrialLimit: 5000, 
        trialDays: 30,
        allowDownloads: true, // MP3 5 mins
        allowWav: false,
        allowGemini: false, // BLOCKED
        allowStudio: false, // Presets & Ducking only
        allowMultiSpeaker: false,
        allowEffects: false,
        allowTashkeel: false,
        allowMic: false,
        allowMusicUpload: false,
        allowUpload: false,
        maxAzureVoices: 4, // New Limit
    },
    onedollar: { // "تجربة مرة واحدة"
        dailyLimit: Infinity, // No daily limit, only total
        totalTrialLimit: 10000, 
        trialDays: 3, 
        allowDownloads: true, // 10 mins
        allowWav: true, 
        allowGemini: true, // 6 Voices (Actually full access for student plan per instructions except upload)
        allowStudio: true, // Full mixer
        allowMultiSpeaker: true, // 2 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
        allowUpload: false, // EXPLICITLY DISABLED: No external voice file
        maxAzureVoices: 50,
    },
    basic: { // "Basic"
        dailyLimit: Infinity,
        totalTrialLimit: 75000, 
        trialDays: 30,
        allowDownloads: true,
        allowWav: false, // X in table
        allowGemini: true, // 50 Voices
        allowStudio: false, // Mixer X
        allowMultiSpeaker: false, // X
        allowEffects: false, // X
        allowTashkeel: true,
        allowMic: false, // X
        allowMusicUpload: true, // Music file check is Green in Basic
        allowUpload: true,
        maxAzureVoices: 50,
    },
    creator: { // "Creator"
        dailyLimit: Infinity,
        totalTrialLimit: 150000, 
        trialDays: 30,
        allowDownloads: true,
        allowWav: false, // X in table
        allowGemini: true, // 50 Voices
        allowStudio: true, // Mixer Check
        allowMultiSpeaker: true, // 2 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
        allowUpload: true,
        maxAzureVoices: 50,
    },
    gold: { // "Gold"
        dailyLimit: Infinity,
        totalTrialLimit: 300000, 
        trialDays: 30,
        allowDownloads: true,
        allowWav: true, // Check
        allowGemini: true, // 50 Voices
        allowStudio: true,
        allowMultiSpeaker: true, // 3 Voices
        allowEffects: true,
        allowTashkeel: true,
        allowMic: true,
        allowMusicUpload: true,
        allowUpload: true,
        maxAzureVoices: 50,
    },
    professional: { // "Professional"
        dailyLimit: Infinity,
        totalTrialLimit: 750000, 
        trialDays: 30, // Monthly
        allowDownloads: true,
        allowWav: true,
        allowGemini: true, // 50 Voices
        allowStudio: true,
        allowMultiSpeaker: true, // 4 Voices
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
