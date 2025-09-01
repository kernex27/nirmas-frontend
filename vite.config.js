import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: './',   // ✅ cocok untuk Firebase Hosting di root domain
})

