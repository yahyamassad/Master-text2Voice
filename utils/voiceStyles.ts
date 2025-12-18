
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
        recommendedSpeed: 0.9 // Slower for poetry
    },
    {
        id: 'heritage_narrator',
        categoryKey: 'catLiterature',
        labelKey: 'styleHeritageNarrator',
        prompt: 'You are a traditional Hakawati (Storyteller) sitting by a fire. Use a dynamic vocal range: whisper when the scene is mysterious, and raise your voice when the action peaks. Your goal is to captivate the listener completely.',
        recommendedSpeed: 1.0
    },
    {
        id: 'philosopher',
        categoryKey: 'catLiterature',
        labelKey: 'stylePhilosopher',
        prompt: 'Speak with deep wisdom and contemplation. Your flow should be liquid and smooth, connecting ideas seamlessly. Sound like a thinker who has just discovered a profound truth and is sharing it gently.',
        recommendedSpeed: 0.95
    },

    // --- 2. Acting & Directing ---
    {
        id: 'dramatic_actor',
        categoryKey: 'catActing',
        labelKey: 'styleDramaticActor',
        prompt: 'Perform this script with intense theatrical presence. Fully embody the emotions in the text—if it screams, you scream; if it weeps, you weep. Do not just read; act. Use pauses for dramatic effect.',
        recommendedSpeed: 1.0
    },
    {
        id: 'comedian',
        categoryKey: 'catActing',
        labelKey: 'styleComedian',
        prompt: 'Deliver the lines with punchy, energetic timing. Sound like you are telling a hilarious story to your best friends. Use a playful, bouncy tone with a smile in your voice.',
        recommendedSpeed: 1.10
    },
    {
        id: 'thriller',
        categoryKey: 'catActing',
        labelKey: 'styleThriller',
        prompt: 'Whisper intensely, as if sharing a dangerous secret. Keep the tension high and the pace controlled. Every word should sound ominous and spine-chilling.',
        recommendedSpeed: 0.95
    },

    // --- 3. Media & Broadcast ---
    {
        id: 'news_anchor',
        categoryKey: 'catMedia',
        labelKey: 'styleNewsAnchor',
        prompt: 'You are a prime-time news anchor breaking urgent news. Your voice must be authoritative, urgent, and credible. Maintain a steady, fast pace with perfect articulation. No hesitation.',
        recommendedSpeed: 1.1
    },
    {
        id: 'sports_commentator',
        categoryKey: 'catMedia',
        labelKey: 'styleSportsCommentator',
        prompt: 'You are commenting on the final minute of a championship match! Your voice should be high-energy, loud, and explosive with excitement. Use rapid-fire delivery for high-action moments.',
        recommendedSpeed: 1.25
    },
    {
        id: 'talk_show_host',
        categoryKey: 'catMedia',
        labelKey: 'styleTalkShow',
        prompt: 'You are the host of a late-night radio show. Your voice is smooth, warm, and charismatic. Speak as if you are having an intimate, engaging conversation with the listener.',
        recommendedSpeed: 1.05
    },

    // --- 4. Education & Guidance ---
    {
        id: 'teacher',
        categoryKey: 'catEducation',
        labelKey: 'styleTeacher',
        prompt: 'You are a kind and enthusiastic teacher explaining a new concept. Speak clearly, patiently, and encouragingly. Use vocal emphasis on key terms to ensure the student understands.',
        recommendedSpeed: 1.0
    },
    {
        id: 'counselor',
        categoryKey: 'catEducation',
        labelKey: 'styleCounselor',
        prompt: 'Speak with a therapeutic, reassuring tone. Your voice should feel safe and warm, like a comforting hug. Pace should be slow, gentle, and calming.',
        recommendedSpeed: 0.95
    },
    {
        id: 'motivator',
        categoryKey: 'catEducation',
        labelKey: 'styleMotivator',
        prompt: 'You are a motivational speaker commanding a room. Your voice must be powerful, confident, and punchy. Drive the listener to take action immediately. Failure is not an option.',
        recommendedSpeed: 1.15
    }
];

export const getVoiceStyle = (id: string): VoiceStyle | undefined => {
    return VOICE_STYLES.find(s => s.id === id);
};
