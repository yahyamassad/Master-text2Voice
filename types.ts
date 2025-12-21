
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

export type FallbackMap = Record<string, { male: string; female: string }>;

export interface VoiceStyle {
    id: string;
    categoryKey: string; 
    labelKey: string;    
    prompt: string;      
    recommendedSpeed?: number;
}

// NEW: Dialect Interface
export interface Dialect {
    id: string;
    labelKey: string;
    instruction: string;
}

export const ARABIC_DIALECTS: Dialect[] = [
    { id: 'modern_standard', labelKey: 'dialectStandard', instruction: 'Speak in clear Modern Standard Arabic (Fusha) with perfect grammar.' },
    { id: 'white_dialect', labelKey: 'dialectWhite', instruction: 'Speak in a "White Dialect" (Ammiya Bayda), clear and understood by all Arabs, neutral and professional.' },
    { id: 'khaleeji', labelKey: 'dialectKhaleeji', instruction: 'Speak with a rich Gulf (Khaleeji) accent, using the distinct intonations of Saudi Arabia, UAE, or Kuwait.' },
    { id: 'levantine', labelKey: 'dialectLevantine', instruction: 'Speak with a warm Levantine (Shami) accent, reflecting the soft and melodic tones of Syria, Lebanon, or Jordan.' },
    { id: 'egyptian', labelKey: 'dialectEgyptian', instruction: 'Speak with a vibrant and fast-paced Egyptian (Cairene) accent, full of character and unique expressions.' },
    { id: 'maghrebi', labelKey: 'dialectMaghrebi', instruction: 'Speak with an authentic Maghrebi accent (Morocco, Algeria, or Tunisia), preserving its unique rhythm.' },
    { id: 'iraqi', labelKey: 'dialectIraqi', instruction: 'Speak with a deep and poetic Iraqi accent, emphasizing the emotional weight and distinct pronunciation.' }
];

export const MICROSOFT_AZURE_VOICES: StandardVoice[] = [
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
    { name: 'ar-QA-MoazNeural', label: 'Muath (Qatari)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
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
    { name: 'ar-LB-LaylaNeural', label: 'Layla (Lebanese)', lang: 'ar', gender: 'Female', type: 'Azure Neural' },
    { name: 'ar-LB-RamiNeural', label: 'Rami (Lebanese)', lang: 'ar', gender: 'Male', type: 'Azure Neural' },
    { name: 'en-US-AvaNeural', label: 'Ava (US Female)', lang: 'en', gender: 'Female', type: 'Azure Neural' },
    { name: 'en-US-AndrewNeural', label: 'Andrew (US Male)', lang: 'en', gender: 'Male', type: 'Azure Neural' },
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

export const PLAN_LIMITS = {
    visitor: { dailyLimit: 350, totalTrialLimit: 5000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: false, allowStudio: false, allowMultiSpeaker: false, allowEffects: false, allowTashkeel: false, allowMic: false, allowMusicUpload: false, allowUpload: false, maxAzureVoices: 2 },
    free: { dailyLimit: 200, totalTrialLimit: 5000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: false, allowStudio: false, allowMultiSpeaker: false, allowEffects: false, allowTashkeel: false, allowMic: false, allowMusicUpload: false, allowUpload: false, maxAzureVoices: 4 },
    onedollar: { dailyLimit: Infinity, totalTrialLimit: 10000, trialDays: 3, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: false, maxAzureVoices: 50 },
    basic: { dailyLimit: Infinity, totalTrialLimit: 75000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: true, allowStudio: false, allowMultiSpeaker: false, allowEffects: false, allowTashkeel: true, allowMic: false, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 },
    creator: { dailyLimit: Infinity, totalTrialLimit: 150000, trialDays: 30, allowDownloads: true, allowWav: false, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 },
    gold: { dailyLimit: Infinity, totalTrialLimit: 50000, trialDays: 30, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 },
    professional: { dailyLimit: Infinity, totalTrialLimit: 750000, trialDays: 30, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 },
    admin: { dailyLimit: Infinity, totalTrialLimit: Infinity, trialDays: Infinity, allowDownloads: true, allowWav: true, allowGemini: true, allowStudio: true, allowMultiSpeaker: true, allowEffects: true, allowTashkeel: true, allowMic: true, allowMusicUpload: true, allowUpload: true, maxAzureVoices: 50 }
};
