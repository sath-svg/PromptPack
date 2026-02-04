use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use flate2::{read::GzDecoder, write::GzEncoder, Compression};
use pbkdf2::pbkdf2_hmac;
use rand::Rng;
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use thiserror::Error;

// Magic bytes for PromptPack file format
const MAGIC_BYTES: &[u8] = b"PPK";
const VERSION_UNENCRYPTED: u8 = 0;
const VERSION_ENCRYPTED: u8 = 1;
const OBFUSCATION_KEY: &[u8] = b"PromptPack";
const PBKDF2_ITERATIONS: u32 = 100_000;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Invalid file format")]
    InvalidFormat,
    #[error("Invalid version: {0}")]
    InvalidVersion(u8),
    #[error("Hash mismatch - file may be corrupted")]
    HashMismatch,
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Compression failed: {0}")]
    CompressionFailed(String),
    #[error("Decompression failed: {0}")]
    DecompressionFailed(String),
    #[error("Password required")]
    PasswordRequired,
    #[error("Invalid password")]
    InvalidPassword,
}

/// XOR obfuscation with the PromptPack key
fn xor_obfuscate(data: &[u8]) -> Vec<u8> {
    data.iter()
        .enumerate()
        .map(|(i, &byte)| byte ^ OBFUSCATION_KEY[i % OBFUSCATION_KEY.len()])
        .collect()
}

/// Compress data using gzip
fn compress(data: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(data)
        .map_err(|e| CryptoError::CompressionFailed(e.to_string()))?;
    encoder
        .finish()
        .map_err(|e| CryptoError::CompressionFailed(e.to_string()))
}

/// Decompress gzip data
fn decompress(data: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let mut decoder = GzDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| CryptoError::DecompressionFailed(e.to_string()))?;
    Ok(decompressed)
}

/// Derive encryption key from password using PBKDF2
fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, PBKDF2_ITERATIONS, &mut key);
    key
}

/// Encrypt data with AES-256-GCM
fn encrypt_aes(data: &[u8], password: &str) -> Result<Vec<u8>, CryptoError> {
    let mut rng = rand::thread_rng();

    // Generate random salt and nonce
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    rng.fill(&mut salt);
    rng.fill(&mut nonce_bytes);

    let key = derive_key(password, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    // Combine salt + nonce + ciphertext
    let mut result = Vec::with_capacity(16 + 12 + ciphertext.len());
    result.extend_from_slice(&salt);
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Decrypt data with AES-256-GCM
fn decrypt_aes(data: &[u8], password: &str) -> Result<Vec<u8>, CryptoError> {
    if data.len() < 28 {
        return Err(CryptoError::DecryptionFailed("Data too short".to_string()));
    }

    let salt = &data[0..16];
    let nonce_bytes = &data[16..28];
    let ciphertext = &data[28..];

    let key = derive_key(password, salt);
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CryptoError::InvalidPassword)
}

/// Encode data to PromptPack format (.pmtpk)
pub fn encode_pack(json_data: &str, password: Option<&str>) -> Result<Vec<u8>, CryptoError> {
    // Compress the JSON
    let compressed = compress(json_data.as_bytes())?;

    // Determine version and process payload
    let (version, payload) = if let Some(pwd) = password {
        // Encrypt then obfuscate
        let encrypted = encrypt_aes(&compressed, pwd)?;
        let obfuscated = xor_obfuscate(&encrypted);
        (VERSION_ENCRYPTED, obfuscated)
    } else {
        // Just obfuscate
        let obfuscated = xor_obfuscate(&compressed);
        (VERSION_UNENCRYPTED, obfuscated)
    };

    // Calculate SHA-256 hash of payload
    let mut hasher = Sha256::new();
    hasher.update(&payload);
    let hash = hasher.finalize();

    // Build final file: magic + version + hash + payload
    let mut result = Vec::with_capacity(3 + 1 + 32 + payload.len());
    result.extend_from_slice(MAGIC_BYTES);
    result.push(version);
    result.extend_from_slice(&hash);
    result.extend_from_slice(&payload);

    Ok(result)
}

/// Decode data from PromptPack format (.pmtpk)
pub fn decode_pack(data: &[u8], password: Option<&str>) -> Result<String, CryptoError> {
    // Minimum size: magic(3) + version(1) + hash(32) + some payload
    if data.len() < 37 {
        return Err(CryptoError::InvalidFormat);
    }

    // Check magic bytes
    if &data[0..3] != MAGIC_BYTES {
        return Err(CryptoError::InvalidFormat);
    }

    let version = data[3];
    let stored_hash = &data[4..36];
    let payload = &data[36..];

    // Verify hash
    let mut hasher = Sha256::new();
    hasher.update(payload);
    let computed_hash = hasher.finalize();
    if computed_hash.as_slice() != stored_hash {
        return Err(CryptoError::HashMismatch);
    }

    // De-obfuscate
    let deobfuscated = xor_obfuscate(payload);

    // Decrypt if needed
    let decompressed = match version {
        VERSION_UNENCRYPTED => decompress(&deobfuscated)?,
        VERSION_ENCRYPTED => {
            let pwd = password.ok_or(CryptoError::PasswordRequired)?;
            let decrypted = decrypt_aes(&deobfuscated, pwd)?;
            decompress(&decrypted)?
        }
        v => return Err(CryptoError::InvalidVersion(v)),
    };

    String::from_utf8(decompressed)
        .map_err(|e| CryptoError::DecompressionFailed(e.to_string()))
}

/// Check if a .pmtpk file is encrypted
#[allow(dead_code)]
pub fn is_encrypted(data: &[u8]) -> Result<bool, CryptoError> {
    if data.len() < 4 {
        return Err(CryptoError::InvalidFormat);
    }
    if &data[0..3] != MAGIC_BYTES {
        return Err(CryptoError::InvalidFormat);
    }
    Ok(data[3] == VERSION_ENCRYPTED)
}
