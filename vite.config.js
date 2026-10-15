import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves at the domain root; GitHub Pages serves under the repository path.
export default defineConfig({
  plugins: [react()],
  base: (process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL) ? '/' : '/Aurora-Planet-Tracker/',
});
