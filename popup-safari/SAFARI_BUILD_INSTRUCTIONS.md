# PromptPack Safari Extension - Build & Self-Distribution Instructions

## Prerequisites

- **macOS** (Monterey 12.0 or later recommended)
- **Xcode 14+** (free from Mac App Store)
- **NO Apple Developer Account needed** for self-distribution!

## Step 1: Transfer Files to Mac

Copy the entire `popup-safari` folder to your Mac.

## Step 2: Convert to Safari Extension

Open Terminal on your Mac and run:

```bash
# Navigate to the PromptPack folder
cd /path/to/PromptPack

# Convert to Safari Web Extension
xcrun safari-web-extension-converter popup-safari \
  --project-location PromptPack-Safari \
  --app-name "PromptPack" \
  --bundle-identifier com.pmtpk.promptpack \
  --swift \
  --force
```

### Conversion Options:
- `--macos-only` - Add this flag if you only want macOS (no iOS)
- `--ios-only` - Add this flag if you only want iOS
- Remove both flags for universal (macOS + iOS)

## Step 3: Configure in Xcode

1. Xcode will open automatically after conversion
2. Select the project in the navigator (left sidebar)
3. Under **Signing & Capabilities**:
   - Select your **Team** (Apple Developer account)
   - Ensure **Bundle Identifier** is `com.pmtpk.promptpack`
4. Set **Deployment Target**:
   - macOS: 11.0 or later
   - iOS: 15.0 or later (if building for iOS)

## Step 4: Test Locally

### Enable Developer Mode in Safari:
1. Open **Safari → Settings → Advanced**
2. Check **"Show Develop menu in menu bar"**

### Allow Unsigned Extensions:
1. **Safari → Develop → Allow Unsigned Extensions**
   (You need to do this each time Safari restarts)

### Build and Run:
1. In Xcode, select the **macOS** scheme (or iOS for simulator)
2. Press **⌘+R** to build and run
3. The PromptPack app will launch
4. Go to **Safari → Settings → Extensions**
5. Enable **PromptPack**

## Step 5: Export for Website Distribution (FREE - No Developer Account!)

### Option A: Export as Unsigned App (Recommended)

1. In Xcode: **Product → Archive**
2. In Organizer, select your archive
3. Click **Distribute App**
4. Select **Copy App** (not App Store)
5. Choose a location to save the `.app` file
6. Compress to `.zip` for distribution

### Option B: Export as Developer ID (Requires free Apple ID only)

1. In Xcode: **Product → Archive**
2. Click **Distribute App**
3. Select **Direct Distribution**
4. Sign with your Apple ID (free)
5. Export the `.app` file

### Create Distribution Package

```bash
# Navigate to exported app location
cd /path/to/exported

# Create a zip for download
zip -r PromptPack-Safari-v2.2.0.zip PromptPack.app

# Or create a DMG (prettier)
hdiutil create -volname "PromptPack" -srcfolder PromptPack.app -ov -format UDZO PromptPack-Safari-v2.2.0.dmg
```

## Step 6: Host on Your Website

### Upload Files
Upload to your website (e.g., `pmtpk.com/downloads/`):
- `PromptPack-Safari-v2.2.0.zip` or `.dmg`

### Create Download Page

Add to your website (e.g., `pmtpk.com/safari`):

```html
<h2>PromptPack for Safari</h2>
<p>Version 2.2.0 | macOS 11.0+</p>

<a href="/downloads/PromptPack-Safari-v2.2.0.zip" class="download-btn">
  Download for Safari (macOS)
</a>

<h3>Installation Instructions:</h3>
<ol>
  <li>Download and unzip PromptPack.app</li>
  <li>Move to Applications folder (optional)</li>
  <li>Right-click → Open (first time only, to bypass Gatekeeper)</li>
  <li>Open Safari → Settings → Extensions</li>
  <li>Enable PromptPack</li>
</ol>

<p><strong>Note:</strong> Since this app isn't from the App Store,
macOS may show a security warning. Right-click and select "Open"
to bypass this for the first launch.</p>
```

## User Installation Guide (for your website)

### For Users Downloading from pmtpk.com:

1. **Download** `PromptPack-Safari-v2.2.0.zip`
2. **Unzip** the file (double-click)
3. **Move** `PromptPack.app` to Applications folder
4. **First launch**: Right-click → Open → Click "Open" in dialog
   (This bypasses macOS Gatekeeper for unsigned apps)
5. **Enable in Safari**:
   - Safari → Settings → Extensions
   - Check ✓ PromptPack
6. **Done!** The extension is now active

### If "App can't be opened" error appears:
1. Go to **System Settings → Privacy & Security**
2. Scroll down to find the blocked app message
3. Click **"Open Anyway"**

## Troubleshooting

### "xcrun: error: unable to find utility"
Run: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### Extension not showing in Safari
1. Ensure you allowed unsigned extensions
2. Check Safari → Settings → Extensions
3. Make sure the app is running

### Build errors
1. Clean build: **Product → Clean Build Folder** (⇧⌘K)
2. Ensure correct signing team is selected
3. Check minimum deployment target

## Version Info
- Extension Version: 2.2.0
- Manifest Version: 3
- Minimum Safari: 14.0
- Minimum macOS: 11.0
- Minimum iOS: 15.0
