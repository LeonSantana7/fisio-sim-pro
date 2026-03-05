import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, 'public', 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(__dirname, 'public', 'pwa-192.png'));

    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(__dirname, 'public', 'pwa-512.png'));

    await sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

    console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
