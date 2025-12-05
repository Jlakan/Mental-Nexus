/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,             // Permite usar describe, it, expect sin importarlos siempre
    environment: 'jsdom',      // Simula un navegador (necesario para React)
    setupFiles: './src/setupTests.ts', // Archivo de configuración que crearemos a continuación
  },
})