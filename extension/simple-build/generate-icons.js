// Simple script to generate basic icon files
const fs = require('fs');

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#4CAF50" rx="${size/8}"/>
    <circle cx="${size/2}" cy="${size*0.35}" r="${size*0.15}" fill="white"/>
    <rect x="${size*0.4}" y="${size*0.5}" width="${size*0.2}" height="${size*0.3}" fill="white" rx="${size*0.02}"/>
    <text x="${size/2}" y="${size*0.85}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size*0.15}" font-weight="bold">AI</text>
  </svg>`;
}

// Generate icons
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(`icon${size}.svg`, svg);
  console.log(`Created icon${size}.svg`);
});

console.log('SVG icons created. You can convert them to PNG using online tools or image editors.');
console.log('For now, the extension will work with SVG files.');

// Create simple base64 PNG icons as fallback
function createBase64Icon(size) {
  // Simple green square with "AI" text as base64 PNG
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#4CAF50" rx="${size/8}"/>
    <text x="${size/2}" y="${size/2 + size/8}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size/3}" font-weight="bold">AI</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

// Update manifest to use SVG files
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Keep SVG icons for now
manifest.action.default_icon = {
  "16": "icon16.svg",
  "32": "icon32.svg",
  "48": "icon48.svg",
  "128": "icon128.svg"
};

manifest.icons = {
  "16": "icon16.svg",
  "32": "icon32.svg",
  "48": "icon48.svg",
  "128": "icon128.svg"
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('Updated manifest.json to use SVG icons');
console.log('Notification icon issue should be resolved by removing iconUrl from notifications');
