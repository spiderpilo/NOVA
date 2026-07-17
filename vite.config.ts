import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.join(__dirname, 'certs', 'key.pem')
const certPath = path.join(__dirname, 'certs', 'cert.pem')
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

if (!hasCerts) {
  console.warn('No TLS cert found in certs/ — run `npm run gen-cert` for HTTPS. Falling back to plain HTTP.')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: hasCerts ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) } : undefined,
    proxy: {
      '/api': {
        target: hasCerts ? 'https://localhost:3001' : 'http://localhost:3001',
        secure: false, // self-signed cert
      },
    },
  },
})
