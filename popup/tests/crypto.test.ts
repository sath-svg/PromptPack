import { describe, it, expect } from "vitest";
import {
  isObfuscated,
  isEncrypted,
  PmtpkError,
  SCHEMA_VERSION,
} from "../shared/crypto";

// Note: encodePmtpk, decodePmtpk, encryptPmtpk, decryptPmtpk use Blob.stream()
// and CompressionStream APIs which are only available in browsers.
// Those functions should be tested via E2E tests in a real browser.

describe("crypto", () => {
  describe("isObfuscated", () => {
    it("returns true for obfuscated magic bytes", () => {
      const data = new Uint8Array([0x50, 0x50, 0x4b, 0x00, 0x01, 0x02]);
      expect(isObfuscated(data)).toBe(true);
    });

    it("returns false for encrypted magic bytes", () => {
      const data = new Uint8Array([0x50, 0x50, 0x4b, 0x01, 0x01, 0x02]);
      expect(isObfuscated(data)).toBe(false);
    });

    it("returns false for short data", () => {
      const data = new Uint8Array([0x50, 0x50]);
      expect(isObfuscated(data)).toBe(false);
    });

    it("returns false for random data", () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      expect(isObfuscated(data)).toBe(false);
    });
  });

  describe("isEncrypted", () => {
    it("returns true for encrypted magic bytes", () => {
      const data = new Uint8Array([0x50, 0x50, 0x4b, 0x01, 0x01, 0x02]);
      expect(isEncrypted(data)).toBe(true);
    });

    it("returns false for obfuscated magic bytes", () => {
      const data = new Uint8Array([0x50, 0x50, 0x4b, 0x00, 0x01, 0x02]);
      expect(isEncrypted(data)).toBe(false);
    });

    it("returns false for short data", () => {
      const data = new Uint8Array([0x50, 0x50]);
      expect(isEncrypted(data)).toBe(false);
    });

    it("returns false for empty data", () => {
      const data = new Uint8Array([]);
      expect(isEncrypted(data)).toBe(false);
    });
  });

  describe("PmtpkError", () => {
    it("has correct name and code for CORRUPTED", () => {
      const error = new PmtpkError("Test error", "CORRUPTED");
      expect(error.name).toBe("PmtpkError");
      expect(error.code).toBe("CORRUPTED");
      expect(error.message).toBe("Test error");
    });

    it("has correct name and code for WRONG_PASSWORD", () => {
      const error = new PmtpkError("Bad password", "WRONG_PASSWORD");
      expect(error.code).toBe("WRONG_PASSWORD");
    });

    it("has correct name and code for UNSUPPORTED_VERSION", () => {
      const error = new PmtpkError("Old version", "UNSUPPORTED_VERSION");
      expect(error.code).toBe("UNSUPPORTED_VERSION");
    });

    it("has correct name and code for INVALID_FORMAT", () => {
      const error = new PmtpkError("Bad format", "INVALID_FORMAT");
      expect(error.code).toBe("INVALID_FORMAT");
    });

    it("extends Error", () => {
      const error = new PmtpkError("Test", "CORRUPTED");
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("SCHEMA_VERSION", () => {
    it("is a valid semver-like string", () => {
      expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+$/);
    });

    it("is currently version 1.0", () => {
      expect(SCHEMA_VERSION).toBe("1.0");
    });
  });
});
