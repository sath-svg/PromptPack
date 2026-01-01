# PromptPack

> Stop losing your best prompts. Save, organize, and share LLM prompts across ChatGPT, Claude, and Gemini.

[Website](https://pmtpk.com) | [Chrome Extension](https://chrome.google.com/webstore) | [Documentation](./DOCUMENTATION.md)

## Overview

PromptPack is a Chrome extension with a web dashboard that helps you capture, organize, and reuse your best AI prompts. The best prompts shouldn't disappear into chat history—save them with one click and turn them into repeatable workflows.

### Key Features

- **One-Click Saving**: Save button appears directly in ChatGPT, Claude, and Gemini prompt boxes
- **Cross-Platform**: Works seamlessly across all three major LLMs
- **Encrypted Export**: Export prompts as password-protected `.pmtpk` files
- **Cloud Sync**: Pro users get automatic sync across devices
- **Dashboard**: Create and manage custom prompt packs from the web
- **Secure**: AES-GCM encryption with PBKDF2 key derivation

## Quick Start

### For Users

1. Install the [PromptPack Chrome extension](https://chrome.google.com/webstore)
2. Visit ChatGPT, Claude, or Gemini
3. Click the PromptPack save button while typing a prompt
4. Access your saved prompts from the extension popup

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/PromptPack.git
cd PromptPack

# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Build the extension
cd popup
bun install
bun run dev

# Run the web app
cd ../web
bun install
bun run dev

# Deploy the API
cd ../api
bun install
bun run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development setup.

## Project Structure

```
PromptPack/
├── popup/              # Chrome Extension
│   ├── content/        # Content scripts for ChatGPT, Claude, Gemini
│   ├── shared/         # Shared utilities (auth, crypto, storage)
│   ├── tests/          # Unit tests (67 tests)
│   └── popup.ts        # Main extension UI
├── web/                # Next.js Web Application
│   ├── src/app/        # App Router pages
│   ├── convex/         # Convex backend functions
│   └── public/         # Static assets
├── api/                # Cloudflare Workers API
│   └── src/index.ts    # R2 storage handler
└── docs/               # Documentation
```

## Technology Stack

### Extension
- **TypeScript** 5.9 + Vite 7.2
- **Chrome Extension API** (Manifest V3)
- **IndexedDB** for local storage
- **Vitest** for testing (67 tests)

### Web App
- **Next.js** 15.3 (App Router)
- **React** 19.1
- **Convex** 1.31 (serverless backend)
- **Clerk** (authentication)
- **Stripe** (payments)
- **Tailwind CSS** 4.1

### API
- **Cloudflare Workers** (serverless)
- **Cloudflare R2** (object storage)

## Features

### Free Tier
- Save up to 10 prompts per LLM source
- Export prompts as `.pmtpk` files
- Basic encryption (XOR obfuscation)
- Local browser storage

### Pro Tier ($9/month)
- Save up to 40 prompts per source
- Cloud sync across devices
- Import up to 2 custom prompt packs
- Create 2 custom packs on dashboard
- Password-protected AES-GCM encryption
- Priority support

## Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Product features and architecture
- **[TODO-PRODUCTION.md](./TODO-PRODUCTION.md)** - Production deployment guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guide
- **[popup/tests/README.md](./popup/tests/README.md)** - Testing documentation

## Security

PromptPack uses industry-standard encryption:

- **AES-GCM** authenticated encryption
- **PBKDF2** key derivation (100,000 iterations)
- **SHA-256** integrity verification
- Password-protected exports (exactly 5 characters)

See [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed security information.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

## Testing

```bash
# Extension tests (67 tests)
cd popup
bun run test

# Run with coverage
bun run test:coverage
```

## Deployment

See [TODO-PRODUCTION.md](./TODO-PRODUCTION.md) for production deployment checklist.

```bash
# Build extension for production
cd popup
bun run build

# Build web app
cd web
bun run build

# Deploy API
cd api
bun run deploy
```

## License

MIT License - Copyright (c) 2025 sath-svg

See [LICENSE](./LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/PromptPack/issues)
- **Email**: [sathvik.work@gmail.com](mailto:sathvik.work@gmail.com)
- **Website**: [pmtpk.com](https://pmtpk.com)

## Acknowledgments

Built with:
- [Clerk](https://clerk.com) - Authentication
- [Convex](https://convex.dev) - Backend
- [Cloudflare](https://cloudflare.com) - Infrastructure
- [Stripe](https://stripe.com) - Payments
- [Next.js](https://nextjs.org) - Web framework

---

**Made with ❤️ for prompt engineers everywhere**
