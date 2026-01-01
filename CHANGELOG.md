# Changelog

All notable changes to PromptPack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation (README.md, CONTRIBUTING.md, CHANGELOG.md)
- Production-ready configuration for pmtpk.com
- 67 unit tests for extension functionality

### Changed
- Migrated from npm to Bun for package management
- Updated all production URLs to pmtpk.com (in dev branch)

### Fixed
- Production configuration status in TODO-PRODUCTION.md

## [1.0.0] - 2025-01-01

### Added
- Chrome extension with one-click saving for ChatGPT, Claude, and Gemini
- Web dashboard for prompt management (Next.js 15)
- Cloudflare Workers API for R2 storage
- Convex serverless backend
- Clerk authentication integration
- Stripe subscription management ($9/month Pro tier)
- `.pmtpk` file format with encryption support
- AES-GCM encryption with PBKDF2 key derivation
- Free tier (10 prompts per source)
- Pro tier (40 prompts per source, cloud sync, custom packs)
- Import/export functionality
- Undo/redo support for deletions
- Theme synchronization with LLM websites
- Grace period handling for subscription cancellations
- Comprehensive test suite (67 tests)

### Features by Component

#### Extension
- Content scripts for ChatGPT, Claude, and Gemini
- IndexedDB storage for Pro users
- Chrome storage API for Free users
- Session management (7-day expiration)
- Duplicate detection
- Automatic source detection
- URL capture with prompts

#### Web Dashboard
- Landing page with product showcase
- Dashboard for viewing saved prompts
- Prompt pack creation (Pro only)
- Pricing page with Stripe integration
- Marketplace (placeholder for future)
- Support button with email integration
- User profile with extension sync

#### API
- R2 file upload/download/delete
- CORS configuration for extension and web
- Auth token validation (base64 encoded)
- File integrity checks

#### Backend (Convex)
- User management with Clerk sync
- Prompt pack metadata storage
- Saved prompts tracking by source
- Purchased packs (marketplace foundation)
- Stripe webhook handlers
- Clerk webhook handlers
- Cron jobs for grace period cleanup

### Security
- AES-GCM authenticated encryption
- PBKDF2 key derivation (100,000 iterations)
- SHA-256 integrity verification
- XOR obfuscation for non-encrypted exports
- Session token expiration
- CORS protection

### Infrastructure
- Cloudflare Workers for serverless API
- Cloudflare R2 for object storage
- Convex for real-time database
- Vercel for web app hosting (presumed)
- Chrome Web Store distribution (pending)

## Version History

### Pre-release Development

**[0.9.0] - 2024-12**
- Beta testing phase
- Production configuration updates
- Documentation improvements
- Test coverage expansion

**[0.5.0] - 2024-11**
- Initial prototype
- Basic save functionality
- Local storage only
- Single LLM support (ChatGPT)

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] Chrome Web Store submission and approval
- [ ] Enhanced error handling
- [ ] Rate limiting on API
- [ ] JWT validation for requests
- [ ] Analytics integration
- [ ] Production monitoring setup

### [1.2.0] - Planned
- [ ] Marketplace functionality
- [ ] Pack discovery and browsing
- [ ] Pack purchasing flow
- [ ] Revenue sharing system
- [ ] Pack reviews and ratings

### [2.0.0] - Vision
- [ ] Agent-ready workflows
- [ ] Drag-and-drop prompt modules
- [ ] Advanced pack templates
- [ ] Collaboration features
- [ ] Team accounts
- [ ] API access for developers

---

## Breaking Changes

### 1.0.0
- Initial release - no breaking changes from pre-release versions
- Password length changed from fixed 5 characters to 1-14 characters
- Migration from development to production URLs

---

## Security Advisories

No security vulnerabilities reported to date.

To report security issues, please email: sathvik.work@gmail.com

---

## Contributors

- [@sath-svg](https://github.com/sath-svg) - Creator and maintainer

---

## Links

- [Website](https://pmtpk.com)
- [Documentation](./DOCUMENTATION.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Production Checklist](./TODO-PRODUCTION.md)
- [GitHub Repository](https://github.com/yourusername/PromptPack)

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security updates
