
import { FallbackMap } from '../types';

/**
 * Maps languages to the best available Azure fallback voice.
 * This ensures that if Gemini fails, we switch to a voice that speaks the correct language.
 */
export const FALLBACK_VOICES_BY_LANG: FallbackMap = {
    'ar': { male: 'ar-SA-HamedNeural', female: 'ar-EG-SalmaNeural' }, // Default Arabic
    'ar-SA': { male: 'ar-SA-HamedNeural', female: 'ar-SA-ZariyahNeural' },
    'ar-EG': { male: 'ar-EG-ShakirNeural', female: 'ar-EG-SalmaNeural' },
    'ar-JO': { male: 'ar-JO-TaimNeural', female: 'ar-JO-SanaNeural' },
    'en': { male: 'en-US-AndrewNeural', female: 'en-US-AvaNeural' },
    'en-US': { male: 'en-US-AndrewNeural', female: 'en-US-AvaNeural' },
    'en-GB': { male: 'en-GB-RyanNeural', female: 'en-GB-SoniaNeural' },
    'fr': { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural' },
    'es': { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural' },
    'de': { male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural' },
    'it': { male: 'it-IT-DiegoNeural', female: 'it-IT-ElsaNeural' },
    'pt': { male: 'pt-BR-AntonioNeural', female: 'pt-BR-FranciscaNeural' },
    'ja': { male: 'ja-JP-KeitaNeural', female: 'ja-JP-NanamiNeural' },
    'ko': { male: 'ko-KR-InJoonNeural', female: 'ko-KR-SunHiNeural' },
    'zh': { male: 'zh-CN-YunxiNeural', female: 'zh-CN-XiaoxiaoNeural' },
    'tr': { male: 'tr-TR-AhmetNeural', female: 'tr-TR-EmelNeural' },
    'ru': { male: 'ru-RU-DmitryNeural', female: 'ru-RU-SvetlanaNeural' },
    'hi': { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural' }
};

/**
 * Determines the best fallback voice based on the original Gemini voice and the target language.
 */
export function getFallbackVoice(geminiVoiceName: string, langCode: string): string {
    const isFemale = ['Kore', 'Zephyr'].includes(geminiVoiceName);
    
    // Normalize lang code to first 2 chars if not found (e.g. 'ar-QA' -> 'ar')
    let map = FALLBACK_VOICES_BY_LANG[langCode];
    if (!map) {
        map = FALLBACK_VOICES_BY_LANG[langCode.split('-')[0]] || FALLBACK_VOICES_BY_LANG['en'];
    }

    return isFemale ? map.female : map.male;
}
