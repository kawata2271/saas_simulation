import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@audio': resolve(__dirname, 'src/audio'),
      '@i18n': resolve(__dirname, 'src/i18n'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@game-types': resolve(__dirname, 'src/types'),
    },
  },
})
