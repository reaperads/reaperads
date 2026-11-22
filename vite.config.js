import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = process.env.APP || 'portfolio'

export default defineConfig({
  root: path.resolve(__dirname, 'apps', app),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist', app),
    emptyOutDir: true,
  },
  server: {
    fs: { allow: [__dirname] },
  },
})
