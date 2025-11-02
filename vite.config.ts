import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose the Vercel-provided environment variable to the client-side code.
    // Vite performs a direct string replacement, so the value needs to be stringified.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // FIX: Expose Firebase environment variables to the client-side code. This is necessary
    // to make them available under `process.env` and resolve TypeScript errors.
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
    'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID),
  }
})
