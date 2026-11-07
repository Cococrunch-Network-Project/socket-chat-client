import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // เปิดให้เครื่องอื่นใน LAN เข้าหน้าเว็บได้ (ใช้ตอนเดโม R1)
    host: true,
  },
})
