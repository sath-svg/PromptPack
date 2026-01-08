import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createPromoTiles() {
  // You'll need to update this path to your source image
  const sourceImage = process.argv[2] || 'source-promo.png';

  console.log(`Processing: ${sourceImage}`);

  try {
    // Get original image dimensions
    const metadata = await sharp(sourceImage).metadata();
    console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

    // Small Promo Tile: 440x280
    // Strategy: Center crop focusing on the main content
    await sharp(sourceImage)
      .resize(440, 280, {
        fit: 'cover',
        position: 'center'
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } }) // Remove alpha if PNG
      .jpeg({ quality: 95 })
      .toFile('popup/img/promo-tile-440x280.jpg');

    console.log('✓ Created promo-tile-440x280.jpg');

    // Also create PNG version
    await sharp(sourceImage)
      .resize(440, 280, {
        fit: 'cover',
        position: 'center'
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('popup/img/promo-tile-440x280.png');

    console.log('✓ Created promo-tile-440x280.png');

    // Marquee Promo Tile: 1400x560
    // Strategy: Smart crop to preserve logo and main UI elements
    await sharp(sourceImage)
      .resize(1400, 560, {
        fit: 'cover',
        position: 'center'
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } })
      .jpeg({ quality: 95 })
      .toFile('popup/img/marquee-promo-1400x560.jpg');

    console.log('✓ Created marquee-promo-1400x560.jpg');

    // Also create PNG version
    await sharp(sourceImage)
      .resize(1400, 560, {
        fit: 'cover',
        position: 'center'
      })
      .flatten({ background: { r: 15, g: 23, b: 42 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('popup/img/marquee-promo-1400x560.png');

    console.log('✓ Created marquee-promo-1400x560.png');

    console.log('\n✅ All promotional tiles created successfully!');
    console.log('\nFiles created:');
    console.log('  - popup/img/promo-tile-440x280.jpg');
    console.log('  - popup/img/promo-tile-440x280.png');
    console.log('  - popup/img/marquee-promo-1400x560.jpg');
    console.log('  - popup/img/marquee-promo-1400x560.png');

  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

createPromoTiles();
