/**
 * Icon Generation Script
 * 
 * Generates PNG icons from SVG sources using sharp.
 * Run: npm run generate-icons
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 128];
const iconsDir = join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  console.log('Generating PNG icons from SVG...\n');

  for (const size of sizes) {
    const svgPath = join(iconsDir, `icon${size}.svg`);
    const pngPath = join(iconsDir, `icon${size}.png`);

    try {
      const svgBuffer = readFileSync(svgPath);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✓ Generated icon${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log('\nDone! PNG icons generated in public/icons/');
}

generateIcons();
