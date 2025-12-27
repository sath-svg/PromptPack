# PromptPack Popup Unit Tests

Comprehensive unit test suite for the PromptPack browser extension popup.

## Test Coverage

### 📦 Total: 67 Tests across 4 Files

## Test Files

### 1. `crypto.test.ts` (25 tests)
Tests for cryptographic operations and file format validation.

**isObfuscated** (4 tests)
- ✅ Returns true for obfuscated magic bytes
- ✅ Returns false for encrypted magic bytes
- ✅ Returns false for short data
- ✅ Returns false for random data

**isEncrypted** (4 tests)
- ✅ Returns true for encrypted magic bytes
- ✅ Returns false for obfuscated magic bytes
- ✅ Returns false for short data
- ✅ Returns false for empty data

**PmtpkError** (5 tests)
- ✅ Has correct name and code for CORRUPTED
- ✅ Has correct name and code for WRONG_PASSWORD
- ✅ Has correct name and code for UNSUPPORTED_VERSION
- ✅ Has correct name and code for INVALID_FORMAT
- ✅ Extends Error

**SCHEMA_VERSION** (2 tests)
- ✅ Is a valid semver-like string
- ✅ Is currently version 1.0

**File Corruption Detection** (10 tests)
- ✅ Rejects files with corrupted magic bytes
- ✅ Rejects files with partial magic bytes
- ✅ Rejects files with wrong magic byte order
- ✅ Rejects truncated files (less than 4 bytes)
- ✅ Rejects files with invalid version byte
- ✅ Rejects completely random data
- ✅ Rejects plain text files
- ✅ Rejects ZIP files with similar magic bytes
- ✅ Correctly identifies valid obfuscated file format
- ✅ Correctly identifies valid encrypted file format

### 2. `promptStore.test.ts` (13 tests)
Tests for local prompt storage operations.

**listPrompts** (2 tests)
- ✅ Returns empty array when no prompts exist
- ✅ Returns prompts sorted by createdAt descending (newest first)

**savePrompt** (6 tests)
- ✅ Saves a new prompt successfully
- ✅ Rejects empty text
- ✅ Deduplicates prompts with same text and source
- ✅ Allows same text from different sources
- ✅ Enforces max prompt limit
- ✅ Trims whitespace from text

**deletePrompt** (2 tests)
- ✅ Deletes a prompt by id
- ✅ Does nothing if id not found

**deletePromptsBySource** (2 tests)
- ✅ Deletes all prompts from a specific source
- ✅ Does nothing if source has no prompts

**clearAllPrompts** (1 test)
- ✅ Removes all prompts

### 3. `auth.test.ts` (10 tests)
Tests for authentication-based functionality and prompt limits.

**Not Signed In (Guest User)** (4 tests)
- ✅ Allows saving up to MAX_PROMPTS (10 prompts)
- ✅ Prevents adding beyond MAX_PROMPTS limit
- ✅ Shows correct MAX_PROMPTS in error message
- ✅ Enforces prompt limit consistently across sources

**Free Account Functionality** (2 tests)
- ✅ Free account has MAX_PROMPTS limit
- ✅ Free account cannot exceed MAX_PROMPTS

**MAX_PROMPTS constant verification** (2 tests)
- ✅ MAX_PROMPTS is set to 10
- ✅ Enforces exactly MAX_PROMPTS limit

**Edge Cases for Prompt Limits** (2 tests)
- ✅ Allows replacing duplicate prompt without exceeding limit
- ✅ Handles whitespace-only text as empty (does not count towards limit)

### 4. `pro-account.test.ts` (19 tests)
Tests for Pro account features including import functionality.

**Prompt Limits** (2 tests)
- ✅ Pro users can save more than 10 prompts
- ✅ Pro users hit MAX_PROMPTS limit eventually

**Login Redirection** (2 tests)
- ✅ Pro user clicking 'Save to Dashboard' opens dashboard URL
- ✅ Free user clicking sign-in opens sign-in page

**Import Functionality** (5 tests)
- ✅ Allows importing prompts from valid pack
- ✅ Enforces MAX_IMPORTED_PACKS limit
- ✅ Tracks imported pack names to enforce pack limit
- ✅ Import adds prompts without exceeding total prompt limit
- ✅ Import respects MAX_PROMPTS total limit

**File Import Validation** (5 tests)
- ✅ Should accept valid .pmtpk file format
- ✅ Should accept valid encrypted .pmtpk file format
- ✅ Should reject corrupted files during import
- ✅ Should reject plain text files masquerading as .pmtpk
- ✅ Should reject truncated files

**Import Button Availability** (2 tests)
- ✅ MAX_IMPORTED_PACKS constant is defined
- ✅ MAX_IMPORTED_PACKS is set to 2

**Dashboard vs Sign-in Routing** (3 tests)
- ✅ Constructs correct dashboard URL for pro users
- ✅ Constructs correct sign-in URL for free users
- ✅ Production URLs use https

## Running Tests

```bash
# Run all tests
cd popup
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

## Test Configuration

Tests use Vitest with the following setup:
- **Environment**: jsdom (browser-like environment)
- **Globals**: Enabled for describe/it/expect
- **Coverage**: v8 provider with text and HTML reporters

## Key Testing Principles

### User Types Tested
1. **Guest (Not signed in)**: 10 prompts max, no import, no dashboard access
2. **Free Account**: 10 prompts max, no import, redirects to sign-in page
3. **Pro Account**: Unlimited prompts (up to MAX_PROMPTS), can import packs, dashboard access

### File Format Validation
- Magic bytes: `0x50 0x50 0x4B` (PPK)
- Version byte: `0x00` (obfuscated) or `0x01` (encrypted)
- Minimum size: 4 bytes
- Rejects corrupted, truncated, or invalid files

### Constants
- `MAX_PROMPTS = 10`: Maximum prompts for guest/free users
- `MAX_IMPORTED_PACKS = 2`: Maximum imported packs for pro users
- `SCHEMA_VERSION = "1.0"`: Current file format version

## Mocking Strategy

All tests use mocked Chrome APIs:
- `chrome.storage.local`: In-memory storage mock
- `chrome.tabs.create`: URL navigation mock
- `crypto.randomUUID`: Deterministic UUID generation

This ensures tests run quickly and don't require a real Chrome environment.
