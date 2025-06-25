import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync, copyFileSync, mkdirSync } from 'fs';

// Custom plugin to copy manifest and icons
const copyManifestAndIcons = () => {
    return {
        name: 'copy-manifest-and-icons',
        closeBundle: () => {
            // Create icons directory if it doesn't exist
            mkdirSync('./dist/icons', { recursive: true });
            
            // Copy manifest
            copyFileSync('./manifest.json', './dist/manifest.json');
            
            // Copy icons
            copyFileSync('./icons/icon16.png', './dist/icons/icon16.png');
            copyFileSync('./icons/icon48.png', './dist/icons/icon48.png');
            copyFileSync('./icons/icon128.png', './dist/icons/icon128.png');
        }
    };
};

export default defineConfig({
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        }
    },
    plugins: [copyManifestAndIcons()]
}); 