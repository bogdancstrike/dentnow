import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const allowedHosts = ['dentnow.doncik.ro', 'dentnow.ro', 'www.dentnow.ro'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '3000'),
    host: true,
    allowedHosts,
  },
  preview: {
    host: true,
    allowedHosts,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
