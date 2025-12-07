
import { VoiceStyle } from "../types";

export const VOICE_STYLES: VoiceStyle[] = [
    // --- 1. Literature & Creativity ---
    {
        id: 'epic_poet',
        categoryKey: 'catLiterature',
        labelKey: 'styleEpicPoet',
        // OLD: Recite... slow pace...
        // NEW: Passionate, rhythmic, flowing.
        prompt: 'Recite with passion, grandeur, and a captivating flow. Focus on the beauty of the rhythm and rhyme. Sound like a legendary Arab poet performing in a lively market. Tone: Powerful, resonant, fluid.',
        recommendedSpeed: 1.05 // Was 0.9
    },
    {
        id: 'heritage_narrator',
        categoryKey: 'catLiterature',
        labelKey: 'styleHeritageNarrator',
        // NEW: Engaging, warm, not sleepy.
        prompt: 'Speak with the engaging and warm tone of a master storyteller (Hakawati) who is keeping an audience on the edge of their seats. Use natural intonation and lively storytelling. Tone: Warm, charming, active.',
        recommendedSpeed: 1.0 // Was 0.95
    },
    {
        id: 'philosopher',
        categoryKey: 'catLiterature',
        labelKey: 'stylePhilosopher',
        // NEW: Clear, wise, but conversational.
        prompt: 'Speak with clarity and wisdom, but keep a natural, conversational flow. Do not drag the words. Sound like a modern thinker sharing a fascinating idea. Tone: Intellectual, clear, smooth.',
        recommendedSpeed: 1.0 // Was 0.85
    },

    // --- 2. Acting & Directing ---
    {
        id: 'dramatic_actor',
        categoryKey: 'catActing',
        labelKey: 'styleDramaticActor',
        prompt: 'Perform with intense emotion and cinematic presence. The voice should be full of feeling but keep a natural acting pace. Tone: Emotional, deep, cinematic.',
        recommendedSpeed: 1.05 // Was 1.0
    },
    {
        id: 'comedian',
        categoryKey: 'catActing',
        labelKey: 'styleComedian',
        prompt: 'Speak fast, punchy, and with a smile in your voice. Use energetic timing suitable for stand-up comedy. Tone: Playful, funny, quick.',
        recommendedSpeed: 1.15 // Was 1.1
    },
    {
        id: 'thriller',
        categoryKey: 'catActing',
        labelKey: 'styleThriller',
        prompt: 'Speak in a low, intense, and mysterious whisper. Create tension without being too slow. Sound dangerous and captivating. Tone: Eerie, suspenseful, sharp.',
        recommendedSpeed: 0.95 // Was 0.9
    },

    // --- 3. Media & Broadcast ---
    {
        id: 'news_anchor',
        categoryKey: 'catMedia',
        labelKey: 'styleNewsAnchor',
        prompt: 'Speak with a sharp, professional, and fast-paced broadcasting tone. Deliver the text with urgency and authority like breaking news. Tone: Formal, objective, crisp.',
        recommendedSpeed: 1.1 // Was 1.05
    },
    {
        id: 'sports_commentator',
        categoryKey: 'catMedia',
        labelKey: 'styleSportsCommentator',
        prompt: 'Speak with EXPLOSIVE energy and very high speed. Scream with excitement like a goal was just scored. High pitch and fast tempo. Tone: Hype, fast, loud.',
        recommendedSpeed: 1.25 // Was 1.2
    },
    {
        id: 'talk_show_host',
        categoryKey: 'catMedia',
        labelKey: 'styleTalkShow',
        prompt: 'Speak with a very friendly, smooth, and charismatic tone. Sound like a popular FM radio host greeting fans. Energetic and warm. Tone: Charismatic, smooth, lively.',
        recommendedSpeed: 1.05 // Was 1.0
    },

    // --- 4. Education & Guidance ---
    {
        id: 'teacher',
        categoryKey: 'catEducation',
        labelKey: 'styleTeacher',
        prompt: 'Speak clearly and energetically. Sound like a passionate teacher who loves the subject and wants to engage students. Avoid being boring. Tone: Educational, bright, articulate.',
        recommendedSpeed: 1.05 // Was 0.95
    },
    {
        id: 'counselor',
        categoryKey: 'catEducation',
        labelKey: 'styleCounselor',
        prompt: 'Speak with genuine empathy and kindness, but keep a supportive and hopeful rhythm. Do not sound sad. Tone: Gentle, reassuring, warm.',
        recommendedSpeed: 1.0 // Was 0.9
    },
    {
        id: 'motivator',
        categoryKey: 'catEducation',
        labelKey: 'styleMotivator',
        prompt: 'Speak with power, authority, and driving energy. Push the listener to take action immediately. Fast and punchy. Tone: Strong, confident, uplifting.',
        recommendedSpeed: 1.15 // Was 1.1
    }
];

export const getVoiceStyle = (id: string): VoiceStyle | undefined => {
    return VOICE_STYLES.find(s => s.id === id);
};
