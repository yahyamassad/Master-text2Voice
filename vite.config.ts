import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Removed the 'define' block. Environment variables for client-side code
  // should be accessed via `import.meta.env` which Vite handles automatically.
  // This removes the need for this workaround and fixes build-time type errors.
})
