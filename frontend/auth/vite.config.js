import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '00c50958779b.ngrok-free.app' // 👈 Add your ngrok domain here
    ]
  }
})



