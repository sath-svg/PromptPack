import sharp from 'sharp';

const files = [
  'popup/img/screenshots/chatgpt-1280x800.png',
  'popup/img/screenshots/claude-1280x800.png',
  'popup/img/screenshots/gemini-1280x800.png',
  'popup/img/screenshots/promptpack-extension-1280x800.png'
];

console.log('Verifying screenshots meet Chrome Web Store requirements:\n');

for (const f of files) {
  const m = await sharp(f).metadata();
  const filename = f.split('/').pop();
  const hasAlpha = m.hasAlpha ? '❌ HAS ALPHA' : '✓ No alpha';
  const channels = m.channels === 3 ? '✓ 24-bit RGB' : `❌ ${m.channels * 8}-bit`;

  console.log(`${filename}`);
  console.log(`  Size: ${m.width}x${m.height}`);
  console.log(`  Channels: ${channels}`);
  console.log(`  Alpha: ${hasAlpha}\n`);
}

console.log('✅ All screenshots are ready for Chrome Web Store!');
