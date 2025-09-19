#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function syncVersions() {
    try {
        console.log('🔄 Syncing versions between package.json and manifest.json...');
        
        // Read package.json
        const packageJsonPath = path.join(rootDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const packageVersion = packageJson.version;
        
        // Read manifest.json
        const manifestJsonPath = path.join(rootDir, 'manifest.json');
        const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
        const manifestVersion = manifestJson.version;
        
        console.log(`📦 Package.json version: ${packageVersion}`);
        console.log(`📋 Manifest.json version: ${manifestVersion}`);
        
        if (packageVersion === manifestVersion) {
            console.log('✅ Versions are already in sync!');
            return;
        }
        
        // Use package.json version as source of truth
        console.log(`🔄 Updating manifest.json version from ${manifestVersion} to ${packageVersion}...`);
        
        manifestJson.version = packageVersion;
        
        // Write updated manifest.json
        fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2));
        
        console.log('✅ Versions synced successfully!');
        console.log(`📋 Both files now use version: ${packageVersion}`);
        
    } catch (error) {
        console.error('❌ Version sync failed:', error.message);
        process.exit(1);
    }
}

// Run the sync
syncVersions();
