import { build } from 'vite';
import react from '@vitejs/plugin-react';

await build({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
