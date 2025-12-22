import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Import the plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add the plugin to the plugins array
  ],
  build: {
    outDir: '../backend/public', // Adjust the output directory
    emptyOutDir: true,
  },
  base: '/', // Set the base URL for the project
  // For v4, PostCSS config is often no longer needed in many setups
});
