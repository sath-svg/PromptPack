# Building PromptPack for macOS

This guide covers building the PromptPack desktop app for macOS.

## Prerequisites

### Required
- **macOS 10.15 (Catalina) or later**
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```
- **Node.js 20+**
  ```bash
  # Using Homebrew
  brew install node
  ```
- **Rust**
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### Add Rust Targets
```bash
rustup target add x86_64-apple-darwin    # Intel Macs
rustup target add aarch64-apple-darwin   # Apple Silicon (M1/M2/M3)
```

## Build Options

### Option 1: Universal Binary (Recommended)

Works on both Intel and Apple Silicon Macs. This is the recommended build for distribution.

```bash
cd app
npm install
npm run build
npm run tauri build -- --target universal-apple-darwin
```

**Output:**
- `src-tauri/target/universal-apple-darwin/release/bundle/dmg/PromptPack_0.1.0_universal.dmg`
- `src-tauri/target/universal-apple-darwin/release/bundle/macos/PromptPack.app`

**Size:** ~15 MB (contains both architectures)

### Option 2: Intel Only

For Intel-based Macs (2020 and earlier).

```bash
npm run tauri build -- --target x86_64-apple-darwin
```

**Output:**
- `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/PromptPack_0.1.0_x64.dmg`

**Size:** ~8 MB

### Option 3: Apple Silicon Only

For M1, M2, M3 Macs.

```bash
npm run tauri build -- --target aarch64-apple-darwin
```

**Output:**
- `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/PromptPack_0.1.0_aarch64.dmg`

**Size:** ~8 MB

### Option 4: Interactive Build Script

Use the provided build script for an interactive experience:

```bash
chmod +x build-macos.sh
./build-macos.sh
```

The script will prompt you to choose:
1. Universal Binary (Intel + Apple Silicon)
2. Intel only (x86_64)
3. Apple Silicon only (aarch64)
4. All builds

## Development Mode

For development with hot-reload:

```bash
npm run tauri:dev
```

This starts the app in development mode with:
- Hot module replacement
- DevTools enabled
- Fast rebuild times

## Code Signing & Notarization

### Why Sign?

Unsigned apps will show a warning when users try to open them. Signing requires an Apple Developer account ($99/year).

### Steps to Sign

1. **Join Apple Developer Program**
   - Go to https://developer.apple.com
   - Enroll in the program ($99/year)

2. **Create Certificates in Xcode**
   - Open Xcode
   - Go to Settings → Accounts
   - Add your Apple ID
   - Manage Certificates → Create "Developer ID Application" certificate

3. **Configure Tauri**

   Add to `tauri.conf.json`:
   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
       }
     }
   }
   ```

4. **Notarize (Optional but Recommended)**

   Notarization prevents Gatekeeper warnings:
   ```bash
   # After building
   xcrun notarytool submit PromptPack_0.1.0_universal.dmg \
     --apple-id "your-apple-id@email.com" \
     --team-id "YOUR_TEAM_ID" \
     --password "app-specific-password"
   ```

   Get an app-specific password from https://appleid.apple.com

### GitHub Actions Signing

For automated signing in CI/CD:

1. Export your signing certificate:
   ```bash
   # In Keychain Access, export as .p12
   ```

2. Convert to base64:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```

3. Add GitHub Secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: Base64 certificate
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Certificate password

## Testing the Build

### Installation
1. Locate the `.dmg` file in the bundle directory
2. Double-click to mount
3. Drag `PromptPack.app` to Applications folder

### First Launch
- Right-click → Open (first time only)
- Or: System Settings → Privacy & Security → Allow

### Verification
```bash
# Check code signature
codesign -vvv --deep --strict /Applications/PromptPack.app

# Check notarization (if notarized)
spctl -a -vvv -t install /Applications/PromptPack.app
```

## Common Issues

### "Cannot verify developer"
- The app isn't signed. Users need to right-click → Open
- Or: System Settings → Privacy & Security → Open Anyway

### Build fails with "target not found"
```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### Missing Node modules
```bash
rm -rf node_modules package-lock.json
npm install
```

### Xcode errors
```bash
xcode-select --install
sudo xcode-select --reset
```

## Distribution

### Self-Distribution
1. Build the Universal Binary
2. Sign and notarize (recommended)
3. Upload `.dmg` to your website
4. Provide installation instructions

### Mac App Store (Advanced)
- Requires additional setup
- Different signing requirements
- See Tauri docs: https://tauri.app/distribute/

## File Locations

After building, find your files at:

```
app/src-tauri/target/
├── universal-apple-darwin/
│   └── release/
│       └── bundle/
│           ├── dmg/
│           │   └── PromptPack_0.1.0_universal.dmg
│           └── macos/
│               └── PromptPack.app
├── x86_64-apple-darwin/
│   └── release/bundle/dmg/
└── aarch64-apple-darwin/
    └── release/bundle/dmg/
```

## Deployment to Website

After building, copy the DMG files to your website:

```bash
# From the app directory
cp src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg \
   ../web/public/downloads/PromptPack-Universal.dmg

cp src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/*.dmg \
   ../web/public/downloads/PromptPack-Intel.dmg

cp src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/*.dmg \
   ../web/public/downloads/PromptPack-AppleSilicon.dmg
```

## Resources

- [Tauri Documentation](https://tauri.app)
- [Apple Developer Program](https://developer.apple.com)
- [Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

## Support

For build issues:
- Check [GitHub Issues](https://github.com/yourusername/PromptPack/issues)
- Review Tauri docs: https://tauri.app/start/
- macOS-specific: https://tauri.app/distribute/macos/

---

**Happy Building! 🚀**
