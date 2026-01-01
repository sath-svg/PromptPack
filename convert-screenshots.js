import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function convertScreenshots() {
  const screenshotFiles = [
    'web/public/img/chatgpt.png',
    'web/public/img/gemini.png',
    'web/public/img/claude.png',
    'web/public/img/promptpack-extension.png'
  ];

  const outputDir = 'popup/img/screenshots';

  // Create output directory if needed
  try {
    await import('fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));
  } catch (err) {
    // Directory might already exist
  }

  console.log('Converting screenshots for Chrome Web Store...\n');

  for (const file of screenshotFiles) {
    try {
      console.log(`Processing: ${file}`);

      // Get original metadata
      const metadata = await sharp(file).metadata();
      console.log(`  Original: ${metadata.width}x${metadata.height}`);

      // Extract filename without path
      const filename = file.split('/').pop().replace('.png', '');

      // Target dimension: 1280x800 (recommended for Chrome Web Store)
      const targetWidth = 1280;
      const targetHeight = 800;

      // Resize to 1280x800, maintaining aspect ratio with cover fit
      await sharp(file)
        .resize(targetWidth, targetHeight, {
          fit: 'contain', // Contain the image within bounds, add padding if needed
          background: { r: 15, g: 23, b: 42, alpha: 1 } // Dark background, no transparency
        })
        .flatten({ background: { r: 15, g: 23, b: 42 } }) // Remove any alpha channel
        .png({
          compressionLevel: 9,
          palette: false // Force 24-bit RGB (no alpha)
        })
        .toFile(`${outputDir}/${filename}-1280x800.png`);

      console.log(`  ✓ Created ${filename}-1280x800.png`);

      // Also create 640x400 version (smaller alternative)
      await sharp(file)
        .resize(640, 400, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .flatten({ background: { r: 15, g: 23, b: 42 } })
        .png({
          compressionLevel: 9,
          palette: false
        })
        .toFile(`${outputDir}/${filename}-640x400.png`);

      console.log(`  ✓ Created ${filename}-640x400.png\n`);

    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
      console.log('');
    }
  }

  console.log('\n✅ Screenshot conversion complete!');
  console.log('\nFiles created in popup/img/screenshots/:');
  console.log('  - *-1280x800.png (recommended for Chrome Web Store)');
  console.log('  - *-640x400.png (smaller alternative)');
  console.log('\nAll files are 24-bit PNG (no alpha channel) as required.');
}

convertScreenshots();
