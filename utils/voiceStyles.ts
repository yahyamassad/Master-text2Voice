
import { VoiceStyle } from "../types";

export const VOICE_STYLES: VoiceStyle[] = [
    // --- 1. Literature & Creativity ---
    {
        id: 'epic_poet',
        categoryKey: 'catLiterature',
        labelKey: 'styleEpicPoet',
        prompt: 'Recite the text with a rhythmic, dramatic, and slow pace. Emphasize the rhyme and meter. Sound like an ancient storyteller reciting an epic poem. Tone: Deep, resonant, grave.',
        recommendedSpeed: 0.9
    },
    {
        id: 'heritage_narrator',
        categoryKey: 'catLiterature',
        labelKey: 'styleHeritageNarrator',
        prompt: 'Speak with the warm, nostalgic, and engaging tone of a traditional Hakawati (storyteller). Use clear intonation and pauses to build atmosphere. Tone: Warm, authentic, narrative.',
        recommendedSpeed: 0.95
    },
    {
        id: 'philosopher',
        categoryKey: 'catLiterature',
        labelKey: 'stylePhilosopher',
        prompt: 'Speak slowly, thoughtfully, and with deep pauses for reflection. Sound like a wise thinker pondering the meaning of life. Tone: Calm, contemplative, intellectual.',
        recommendedSpeed: 0.85
    },

    // --- 2. Acting & Directing ---
    {
        id: 'dramatic_actor',
        categoryKey: 'catActing',
        labelKey: 'styleDramaticActor',
        prompt: 'Perform the text with deep emotion and dramatic weight. Express visible sadness or intense feeling where appropriate. Tone: Emotional, heavy, cinematic.',
        recommendedSpeed: 1.0
    },
    {
        id: 'comedian',
        categoryKey: 'catActing',
        labelKey: 'styleComedian',
        prompt: 'Speak with a light, bouncy, and humorous tone. Use timing that suggests a joke or a funny anecdote. Tone: Playful, lighthearted, energetic.',
        recommendedSpeed: 1.1
    },
    {
        id: 'thriller',
        categoryKey: 'catActing',
        labelKey: 'styleThriller',
        prompt: 'Speak in a low, whispery, and suspenseful tone. Build tension with every word. Sound mysterious and slightly ominous. Tone: Eerie, suspenseful, quiet.',
        recommendedSpeed: 0.9
    },

    // --- 3. Media & Broadcast ---
    {
        id: 'news_anchor',
        categoryKey: 'catMedia',
        labelKey: 'styleNewsAnchor',
        prompt: 'Speak with a professional, neutral, and authoritative broadcasting tone. Clear enunciation and steady pace. Tone: Formal, objective, crisp.',
        recommendedSpeed: 1.05
    },
    {
        id: 'sports_commentator',
        categoryKey: 'catMedia',
        labelKey: 'styleSportsCommentator',
        prompt: 'Speak with high energy, excitement, and speed. Sound like you are commentating a live match with sudden bursts of volume. Tone: Hype, fast, loud.',
        recommendedSpeed: 1.2
    },
    {
        id: 'talk_show_host',
        categoryKey: 'catMedia',
        labelKey: 'styleTalkShow',
        prompt: 'Speak with a warm, conversational, and engaging tone. Sound persuasive and interactive, like a radio host speaking to a guest. Tone: Friendly, charismatic, smooth.',
        recommendedSpeed: 1.0
    },

    // --- 4. Education & Guidance ---
    {
        id: 'teacher',
        categoryKey: 'catEducation',
        labelKey: 'styleTeacher',
        prompt: 'Speak clearly, patiently, and articulately. Emphasize key words for understanding. Sound like a kind teacher explaining a concept. Tone: Educational, clear, patient.',
        recommendedSpeed: 0.95
    },
    {
        id: 'counselor',
        categoryKey: 'catEducation',
        labelKey: 'styleCounselor',
        prompt: 'Speak with a soft, reassuring, and empathetic tone. Sound comforting and safe. Tone: Gentle, soft, healing.',
        recommendedSpeed: 0.9
    },
    {
        id: 'motivator',
        categoryKey: 'catEducation',
        labelKey: 'styleMotivator',
        prompt: 'Speak with power, confidence, and driving energy. Inspire the listener to take action. Tone: Strong, confident, uplifting.',
        recommendedSpeed: 1.1
    }
];

export const getVoiceStyle = (id: string): VoiceStyle | undefined => {
    return VOICE_STYLES.find(s => s.id === id);
};
