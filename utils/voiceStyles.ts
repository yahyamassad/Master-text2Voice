
import { VoiceStyle } from "../types";

export const VOICE_STYLES: VoiceStyle[] = [
    // --- 1. Literature & Creativity ---
    {
        id: 'epic_poet',
        categoryKey: 'catLiterature',
        labelKey: 'styleEpicPoet',
        // CRITICAL UPDATE: Explicit instruction to pronounce ending vowels (No Waqf on Sukun) for Rhyme.
        prompt: 'Recite as a legendary Arab poet. IMPORTANT: Do NOT silence the last letter of the line (No Sukun). You MUST pronounce the vowel (Harakat) at the end of sentences to maintain the Rhyme (Qafiya) and Meter. Tone: Rhythmic, resonant, grand, musical.',
        recommendedSpeed: 1.0
    },
    {
        id: 'heritage_narrator',
        categoryKey: 'catLiterature',
        labelKey: 'styleHeritageNarrator',
        prompt: 'Speak like a traditional Hakawati telling a gripping tale by the fire. Use dynamic intonation—whisper when mysterious, raise voice when exciting. Do not be monotone. Tone: Storyteller, warm, fluctuating.',
        recommendedSpeed: 1.0
    },
    {
        id: 'philosopher',
        categoryKey: 'catLiterature',
        labelKey: 'stylePhilosopher',
        prompt: 'Speak with deep wisdom but flow like water. Connect your ideas smoothly. Do not sound sleepy; sound like you have discovered a great truth. Tone: Profound, clear, flowing.',
        recommendedSpeed: 0.95
    },

    // --- 2. Acting & Directing ---
    {
        id: 'dramatic_actor',
        categoryKey: 'catActing',
        labelKey: 'styleDramaticActor',
        prompt: 'Act this out with full theatrical presence. Feel the words. If it is sad, sound heartbroken. If angry, sound fierce. Use the full range of human emotion. Tone: Theatrical, intense, expressive.',
        recommendedSpeed: 1.05
    },
    {
        id: 'comedian',
        categoryKey: 'catActing',
        labelKey: 'styleComedian',
        prompt: 'Deliver lines with punchy timing and a smile in the voice. Keep it upbeat and energetic. Sound like you are telling a funny anecdote to friends. Tone: Humorous, bouncy, quick.',
        recommendedSpeed: 1.15
    },
    {
        id: 'thriller',
        categoryKey: 'catActing',
        labelKey: 'styleThriller',
        prompt: 'Whisper intensely close to the mic. Create a spine-chilling atmosphere. Every word should sound like a dangerous secret. Tone: Breathless, ominous, sharp.',
        recommendedSpeed: 0.95
    },

    // --- 3. Media & Broadcast ---
    {
        id: 'news_anchor',
        categoryKey: 'catMedia',
        labelKey: 'styleNewsAnchor',
        prompt: 'Project a commanding, "Breaking News" authority. articulate every syllable perfectly. Fast, urgent, and credible. Tone: Professional, authoritative, urgent.',
        recommendedSpeed: 1.1
    },
    {
        id: 'sports_commentator',
        categoryKey: 'catMedia',
        labelKey: 'styleSportsCommentator',
        prompt: 'SCREAM with excitement! Sound like a goal has just been scored in a final match. Maximum energy, fast pace, high pitch. Tone: Hype, explosive, loud.',
        recommendedSpeed: 1.3
    },
    {
        id: 'talk_show_host',
        categoryKey: 'catMedia',
        labelKey: 'styleTalkShow',
        prompt: 'Be the most charismatic person in the room. Warm, inviting, and very smooth. Engage the listener directly. Tone: Charismatic, radio-quality, smooth.',
        recommendedSpeed: 1.05
    },

    // --- 4. Education & Guidance ---
    {
        id: 'teacher',
        categoryKey: 'catEducation',
        labelKey: 'styleTeacher',
        prompt: 'Explain clearly and enthusiastically. Use vocal emphasis to highlight key concepts. Sound happy to be teaching. Tone: Educational, bright, articulate.',
        recommendedSpeed: 1.05
    },
    {
        id: 'counselor',
        categoryKey: 'catEducation',
        labelKey: 'styleCounselor',
        prompt: 'Speak with absolute safety and warmth. Your voice should feel like a hug. Gentle, slow, and reassuring. Tone: Therapeutic, soft, kind.',
        recommendedSpeed: 0.95
    },
    {
        id: 'motivator',
        categoryKey: 'catEducation',
        labelKey: 'styleMotivator',
        prompt: 'Command the room. Use short, punchy sentences. Drive the listener to action. Failure is not an option. Tone: Powerful, driving, alpha.',
        recommendedSpeed: 1.2
    }
];

export const getVoiceStyle = (id: string): VoiceStyle | undefined => {
    return VOICE_STYLES.find(s => s.id === id);
};
