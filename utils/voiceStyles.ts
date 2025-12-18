
import { VoiceStyle } from "../types";

export const VOICE_STYLES: VoiceStyle[] = [
    // --- 0. Standard Emotions (Restored Classics) ---
    {
        id: 'Default',
        categoryKey: 'catStandard',
        labelKey: 'emotionDefault',
        prompt: 'Speak naturally, clearly, and with a balanced tone. Do not be monotone, but maintain a professional and engaging delivery suitable for general reading.',
        recommendedSpeed: 1.0
    },
    {
        id: 'happy',
        categoryKey: 'catStandard',
        labelKey: 'emotionHappy',
        prompt: 'Speak with a genuine smile audible in your voice. Your tone should be warm, optimistic, and welcoming. Use slightly upward inflection at the end of sentences to convey positivity.',
        recommendedSpeed: 1.05
    },
    {
        id: 'sad',
        categoryKey: 'catStandard',
        labelKey: 'emotionSad',
        prompt: 'Speak softly and slowly, with a heavy heart. Introduce slight pauses between phrases to convey sorrow and reflection. The tone should be empathetic and melancholic.',
        recommendedSpeed: 0.9
    },
    {
        id: 'formal',
        categoryKey: 'catStandard',
        labelKey: 'emotionFormal',
        prompt: 'Speak with absolute professionalism and clarity. Articulate every letter precisely. The tone should be objective, serious, and business-like, suitable for official announcements.',
        recommendedSpeed: 1.0
    },

    // --- 1. Literature & Creativity ---
    {
        id: 'epic_poet',
        categoryKey: 'catLiterature',
        labelKey: 'styleEpicPoet',
        prompt: 'Perform as a legendary Arabic poet reciting a masterpiece. Your voice must be resonant, grand, and rhythmic. CRITICAL: Pronounce the vowel movements (Harakat) at the end of verses if it maintains the rhyme (Qafiya). Do not rush; let the words breathe.',
        recommendedSpeed: 0.9 
    },
    {
        id: 'heritage_narrator',
        categoryKey: 'catLiterature',
        labelKey: 'styleHeritageNarrator',
        prompt: 'You are a traditional Hakawati (Storyteller) sitting by a fire. Use a dynamic vocal range: whisper when the scene is mysterious, and raise your voice when the action peaks.',
        recommendedSpeed: 1.0
    },

    // --- 2. Acting & Directing ---
    {
        id: 'dramatic_actor',
        categoryKey: 'catActing',
        labelKey: 'styleDramaticActor',
        prompt: 'Perform this script with intense theatrical presence. Fully embody the emotions in the text. Use pauses for dramatic effect.',
        recommendedSpeed: 1.0
    },
    {
        id: 'motivator',
        categoryKey: 'catEducation',
        labelKey: 'styleMotivator',
        prompt: 'You are a motivational speaker commanding a room. Your voice must be powerful, confident, and punchy.',
        recommendedSpeed: 1.15
    }
];

export const getVoiceStyle = (id: string): VoiceStyle | undefined => {
    return VOICE_STYLES.find(s => s.id === id);
};
