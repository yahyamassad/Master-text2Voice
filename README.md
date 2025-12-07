
# Sawtli - AI Audio Workstation 🎙️

**Sawtli (صوتلي)** is a cutting-edge, Arabic-first AI Audio Workstation designed to revolutionize digital voice production. It bridges the gap between text translation, AI speech generation, and professional audio engineering.

Unlike standard TTS tools, Sawtli offers **Voice Personas** (Acting, Media, Poetry) and a built-in **Audio Studio** (Mixer, EQ, Ducking), making it a complete solution for content creators, broadcasters, and authors.

## 🌟 Key Features

### 🎭 Voice Personas (New!)
Transform static text into a performance using specialized AI instructions:
-   **Literature**: Epic Poet, Heritage Narrator (Hakawati), Philosopher.
-   **Acting**: Dramatic Actor, Comedian, Thriller/Horror.
-   **Media**: News Anchor, Sports Commentator, Talk Show Host.
-   **Education**: Master Teacher, Counselor, Motivational Coach.

### 🎛️ Professional Audio Studio
A web-based DAW (Digital Audio Workstation) built right into the app:
-   **Mixer**: Blend AI voice with background music.
-   **Auto-Ducking**: Automatically lowers music volume when speech is detected (Broadcast style).
-   **DSP Effects**: 5-Band EQ, Compression, Reverb, Echo/Delay.
-   **Format Support**: Export as MP3 (Web) or WAV (Lossless Studio Quality).

### 🧠 Advanced Linguistics
-   **Context-Aware Translation**: Translates between 13+ languages while preserving meaning.
-   **Smart Tashkeel**: Automatic Arabic diacritization optimized for pronunciation (Waqf rules).
-   **Multi-Speaker**: Script support for up to 4 distinct characters in a single scene.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/sawtli.git
    cd sawtli
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory. You need keys for Gemini (Intelligence) and Azure (Standard Voices).
    ```env
    # Core AI Engine
    SAWTLI_GEMINI_KEY=your_google_gemini_key_here

    # Standard Voices (Microsoft)
    AZURE_SPEECH_KEY=your_azure_key_here
    AZURE_SPEECH_REGION=your_azure_region

    # Firebase (Auth & Database)
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_PROJECT_ID=...
    # ... add other firebase client vars
    ```

4.  **Run the App:**
    ```bash
    npm run dev
    ```

## 🛠️ Tech Stack

-   **Frontend**: React 18, TypeScript, Vite
-   **Styling**: Tailwind CSS, Custom Animations
-   **AI Core**: Google Gemini 2.5 Flash (Logic & Ultra Voices)
-   **Speech Engine**: Microsoft Azure Neural TTS (Pro Voices)
-   **Backend**: Vercel Serverless Functions (Node.js)
-   **Database**: Firebase Firestore & Auth
-   **Audio Processing**: Web Audio API (Client-side DSP)

## 📄 License

**Sawtli** is proprietary software. All rights reserved.
