# Contributing to PromptPack

Thank you for your interest in contributing to PromptPack! This guide will help you get started with development.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Development Setup

### Prerequisites

- **Bun** 1.0+ (recommended) or **Node.js** 18+
- **Git**
- **Chrome** browser (for extension testing)
- **Cloudflare account** (for API development)
- **Convex account** (for backend development)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/PromptPack.git
cd PromptPack
```

2. **Install dependencies**

```bash
# Extension
cd popup
bun install

# Web app
cd ../web
bun install

# API
cd ../api
bun install
```

3. **Set up environment variables**

**Web App** (`web/.env.local`):
```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Cloudflare R2
NEXT_PUBLIC_ASSET_BASE_URL=https://your-r2-bucket.r2.dev
R2_API_URL=http://localhost:8787
NEXT_PUBLIC_R2_API_URL=http://localhost:8787

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**API** (`api/wrangler.toml`):
```toml
name = "promptpack-api"
account_id = "your-cloudflare-account-id"

[vars]
ENVIRONMENT = "development"
CONVEX_URL = "https://your-project.convex.site"
ALLOWED_ORIGINS = "http://localhost:3000,chrome-extension://*"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "promptpack-files-dev"
```

4. **Configure extension**

Update `popup/shared/config.ts` for local development:
```typescript
export const BASE_URL = "http://localhost:3000";
export const API_BASE = "http://localhost:8787";
export const IS_PRODUCTION = false;
```

5. **Start development servers**

```bash
# Terminal 1: Extension
cd popup
bun run dev

# Terminal 2: Web app
cd web
bun run dev
npx convex dev  # In a separate terminal

# Terminal 3: API
cd api
bun run dev
```

6. **Load extension in Chrome**

- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `popup/dist` directory

---

## Project Structure

### Extension (`popup/`)

```
popup/
├── content/
│   ├── chatgpt.ts        # ChatGPT content script
│   ├── claude.ts          # Claude content script
│   └── gemini.ts          # Gemini content script
├── shared/
│   ├── api.ts             # API client
│   ├── auth.ts            # Authentication logic
│   ├── config.ts          # Configuration (EDIT THIS FOR ENV)
│   ├── crypto.ts          # Encryption/decryption
│   ├── db.ts              # IndexedDB wrapper
│   ├── promptStore.ts     # Prompt CRUD operations
│   ├── safeStorage.ts     # Atomic storage wrapper
│   └── theme.ts           # Theme synchronization
├── tests/
│   ├── auth.test.ts
│   ├── crypto.test.ts
│   ├── promptStore.test.ts
│   └── pro-account.test.ts
├── popup.ts               # Main UI (1078 lines)
├── popup.css              # Styles
├── manifest.config.ts     # Extension manifest
└── package.json
```

### Web App (`web/`)

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── dashboard/                  # Dashboard pages
│   │   │   ├── page.tsx
│   │   │   ├── saved-prompts.tsx
│   │   │   └── prompt-packs.tsx
│   │   ├── pricing/                    # Pricing page
│   │   └── api/                        # API routes
│   │       ├── auth/                   # Auth endpoints
│   │       ├── packs/                  # Pack management
│   │       └── stripe/                 # Stripe integration
│   ├── components/                     # React components
│   └── lib/
│       ├── constants.ts                # Configuration
│       ├── crypto.ts                   # Encryption utilities
│       └── billing-client.ts           # Stripe client
├── convex/
│   ├── schema.ts                       # Database schema
│   ├── users.ts                        # User management
│   ├── packs.ts                        # Pack queries/mutations
│   ├── savedPacks.ts                   # Saved prompts
│   ├── http.ts                         # HTTP routes (webhooks)
│   └── stripe.ts                       # Stripe integration
└── package.json
```

### API (`api/`)

```
api/
├── src/
│   └── index.ts           # R2 storage handler (452 lines)
├── wrangler.toml          # Cloudflare configuration
└── package.json
```

---

## Development Workflow

### Working on the Extension

1. Make changes to TypeScript files in `popup/`
2. Vite will automatically rebuild (HMR enabled)
3. Reload extension in Chrome (`chrome://extensions/` → click refresh icon)
4. Test in ChatGPT, Claude, or Gemini

**Key files to edit:**
- `popup/popup.ts` - Main UI logic
- `popup/content/*.ts` - Content scripts for each LLM
- `popup/shared/promptStore.ts` - Storage logic
- `popup/shared/config.ts` - Configuration

### Working on the Web App

1. Make changes in `web/src/`
2. Next.js will hot-reload automatically
3. View changes at `http://localhost:3000`

**Key files to edit:**
- `web/src/app/page.tsx` - Landing page
- `web/src/app/dashboard/*.tsx` - Dashboard components
- `web/convex/*.ts` - Backend functions
- `web/src/lib/constants.ts` - Configuration

### Working on the API

1. Make changes to `api/src/index.ts`
2. Wrangler will automatically restart
3. Test at `http://localhost:8787`

**Testing R2 uploads:**
```bash
curl -X POST http://localhost:8787/upload \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@test.pmtpk"
```

---

## Testing

### Extension Tests

We use **Vitest** with **jsdom** for testing.

```bash
cd popup

# Run all tests
bun run test

# Run tests once
bun run test:run

# Run with coverage
bun run test:coverage

# Run specific test file
bun run test crypto.test.ts
```

**Test Structure:**
- `tests/crypto.test.ts` - 25 tests for file format and encryption
- `tests/promptStore.test.ts` - 13 tests for CRUD operations
- `tests/auth.test.ts` - 10 tests for auth-based limits
- `tests/pro-account.test.ts` - 19 tests for Pro features

**Writing Tests:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createPack, validatePack } from '../shared/crypto';

describe('Pack Creation', () => {
  it('should create valid pack with prompts', async () => {
    const prompts = [{ text: 'Test prompt', url: '', createdAt: Date.now() }];
    const pack = await createPack('chatgpt', 'Test Pack', prompts);

    expect(pack).toBeInstanceOf(ArrayBuffer);
    expect(pack.byteLength).toBeGreaterThan(37); // Header + payload
  });
});
```

### Web App Tests

Currently, there are no tests for the web app. Contributions welcome!

**Recommended setup:**
- **E2E**: Playwright or Cypress
- **Component**: Vitest + Testing Library
- **API Routes**: Vitest

---

## Code Style

### TypeScript

- Use **TypeScript** for all new code
- Enable strict mode
- Prefer `const` over `let`
- Use async/await over Promises.then()
- Use named exports over default exports

**Good:**
```typescript
export const createPack = async (source: string, title: string): Promise<ArrayBuffer> => {
  // ...
};
```

**Bad:**
```typescript
export default function createPack(source, title) {
  return new Promise((resolve) => {
    // ...
  });
}
```

### React

- Use **functional components** with hooks
- Use **TypeScript interfaces** for props
- Keep components small and focused
- Extract reusable logic into custom hooks

**Good:**
```typescript
interface PromptCardProps {
  text: string;
  onCopy: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ text, onCopy }) => {
  return <div onClick={onCopy}>{text}</div>;
};
```

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase
- **Functions**: camelCase, descriptive verbs

```typescript
// Good
const FREE_PROMPT_LIMIT = 10;
interface UserProfile { ... }
const fetchUserData = async () => { ... };

// Bad
const freepromptlimit = 10;
interface user_profile { ... }
const get_data = () => { ... };
```

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for public APIs

```typescript
/**
 * Encrypts a prompt pack with AES-GCM encryption
 * @param data - Pack data to encrypt
 * @param password - 5-character alphanumeric password
 * @returns Encrypted pack as ArrayBuffer
 */
export const encryptPack = async (data: PackData, password: string): Promise<ArrayBuffer> => {
  // ...
};
```

### Linting

Run ESLint before committing:

```bash
cd popup
bun run lint

cd ../web
bun run lint
```

---

## Pull Request Process

### Before Submitting

1. **Run tests**: Ensure all tests pass
   ```bash
   cd popup && bun run test
   ```

2. **Lint code**: Fix any linting errors
   ```bash
   bun run lint
   ```

3. **Build locally**: Verify builds succeed
   ```bash
   bun run build
   ```

4. **Test manually**: Test changes in Chrome with extension loaded

### PR Guidelines

1. **Branch naming**:
   - `feature/description` - New features
   - `fix/description` - Bug fixes
   - `docs/description` - Documentation updates
   - `refactor/description` - Code refactoring

2. **Commit messages**:
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issues when applicable

   **Good:**
   ```
   Add Claude save button detection

   - Implement selector for Claude's prompt input
   - Add retry logic for dynamic content
   - Fixes #123
   ```

3. **PR description**:
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes
   - Reference related issues

4. **Size**:
   - Keep PRs focused and small
   - One feature/fix per PR
   - Large changes should be split into multiple PRs

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] Extension tested in Chrome

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
```

---

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward-compatible
- **PATCH** (0.0.1): Bug fixes

### Creating a Release

1. **Update version numbers**:
   - `popup/manifest.config.ts` - Extension version
   - `web/package.json` - Web app version
   - `api/package.json` - API version

2. **Update CHANGELOG.md**:
   ```markdown
   ## [1.1.0] - 2025-01-15

   ### Added
   - Claude save button support

   ### Fixed
   - Auth session expiration bug
   ```

3. **Create release branch**:
   ```bash
   git checkout -b release/v1.1.0
   git commit -am "Release v1.1.0"
   git tag v1.1.0
   git push origin release/v1.1.0 --tags
   ```

4. **Build production artifacts**:
   ```bash
   # Extension
   cd popup
   bun run build
   zip -r promptpack-v1.1.0.zip dist/

   # Web app
   cd ../web
   bun run build

   # API
   cd ../api
   bun run deploy
   ```

5. **Submit to Chrome Web Store**:
   - Upload `promptpack-v1.1.0.zip`
   - Update store description if needed
   - Submit for review

---

## Common Development Tasks

### Adding a New LLM Platform

1. Create content script: `popup/content/newllm.ts`
2. Add selector logic for prompt input
3. Register in `popup/manifest.config.ts`
4. Add icon/branding
5. Update tests
6. Update documentation

### Adding a New Configuration Option

1. Add to `popup/shared/config.ts`
2. Add to `web/src/lib/constants.ts` if needed
3. Update TypeScript types
4. Update TODO-PRODUCTION.md
5. Document in DOCUMENTATION.md

### Debugging Extension Issues

1. **Check console**: Right-click extension icon → Inspect popup
2. **Check background logs**: `chrome://extensions/` → background page
3. **Check content script**: Inspect page → Sources → Content Scripts
4. **Clear storage**:
   ```javascript
   // In popup console
   chrome.storage.local.clear()
   indexedDB.deleteDatabase('promptpack')
   ```

### Debugging API Issues

1. **Check Wrangler logs**:
   ```bash
   cd api
   bun run dev
   # Logs appear in terminal
   ```

2. **Test locally**:
   ```bash
   curl -v http://localhost:8787/health
   ```

3. **Check R2 bucket**:
   ```bash
   npx wrangler r2 object list promptpack-files-dev
   ```

---

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/PromptPack/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/PromptPack/discussions)
- **Email**: sathvik.work@gmail.com

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

---

Thank you for contributing to PromptPack!
