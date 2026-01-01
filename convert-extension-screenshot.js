import sharp from 'sharp';

const file = 'web/public/img/PromptPack extension.png';

async function convert() {
  const metadata = await sharp(file).metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}`);

  await sharp(file)
    .resize(1280, 800, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .flatten({ background: { r: 15, g: 23, b: 42 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile('popup/img/screenshots/promptpack-extension-1280x800.png');

  console.log('✓ Created promptpack-extension-1280x800.png');

  await sharp(file)
    .resize(640, 400, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .flatten({ background: { r: 15, g: 23, b: 42 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile('popup/img/screenshots/promptpack-extension-640x400.png');

  console.log('✓ Created promptpack-extension-640x400.png');
}

convert();
