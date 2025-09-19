#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildChromeExtension() {
    try {
        console.log('🚀 Building Chrome Web Store package...');
        
        // Read package.json to get version
        const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        const version = packageJson.version;
        
        // Create build-chrome directory
        const buildDir = path.join(rootDir, 'build-chrome');
        const buildVersionDir = path.join(buildDir, `v${version}`);
        
        // Clean and create directories
        if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
        }
        fs.mkdirSync(buildVersionDir, { recursive: true });
        
        // Copy dist files to build directory
        console.log('📁 Copying built files...');
        copyDirectory(path.join(rootDir, 'dist'), buildVersionDir);
        
        // Create zip file
        const zipFileName = `task-manager-extension-v${version}.zip`;
        const zipPath = path.join(buildDir, zipFileName);
        
        console.log(`📦 Creating zip: ${zipFileName}...`);
        await createZip(buildVersionDir, zipPath);
        
        // Get zip file size
        const stats = fs.statSync(zipPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ Chrome Web Store package created successfully!');
        console.log(`📋 Package Details:`);
        console.log(`   Version: ${version}`);
        console.log(`   File: ${zipFileName}`);
        console.log(`   Size: ${fileSizeInMB} MB`);
        console.log(`   Location: ${zipPath}`);
        console.log(`\n🎯 Ready to upload to Chrome Web Store!`);
        
        // List contents for verification
        console.log('\n📄 Package contents:');
        listDirectoryContents(buildVersionDir, '   ');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function createZip(sourceDir, zipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

function listDirectoryContents(dir, indent = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            console.log(`${indent}📁 ${item}/`);
            listDirectoryContents(itemPath, indent + '   ');
        } else {
            const sizeInKB = (stats.size / 1024).toFixed(1);
            console.log(`${indent}📄 ${item} (${sizeInKB} KB)`);
        }
    }
}

// Run the build
buildChromeExtension();
