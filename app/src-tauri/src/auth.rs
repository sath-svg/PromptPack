use base64::Engine;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthSession {
    pub user_id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub image_url: Option<String>,
    pub tier: String,
    pub session_token: String,
    pub expires_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClerkTokenClaims {
    pub sub: String,           // User ID
    pub email: Option<String>,
    pub exp: i64,              // Expiration timestamp
    pub iat: i64,              // Issued at timestamp
}

/// Verify a Clerk session token (simplified - in production use proper JWT verification)
pub fn verify_session_token(token: &str) -> Result<ClerkTokenClaims, AuthError> {
    // Decode JWT without verification for now (Clerk handles verification on their end)
    // In production, you would verify the JWT signature using Clerk's public key

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(AuthError::InvalidToken);
    }

    // Decode the payload (second part)
    let payload = parts[1];

    // Add padding if needed for base64 decoding
    let padded = match payload.len() % 4 {
        2 => format!("{}==", payload),
        3 => format!("{}=", payload),
        _ => payload.to_string(),
    };

    let decoded = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(padded.replace('+', "-").replace('/', "_").trim_end_matches('='))
        .or_else(|_| {
            base64::engine::general_purpose::STANDARD.decode(&padded)
        })
        .map_err(|_| AuthError::InvalidToken)?;

    let claims: ClerkTokenClaims =
        serde_json::from_slice(&decoded).map_err(|_| AuthError::InvalidToken)?;

    // Check expiration
    let now = chrono::Utc::now().timestamp();
    if claims.exp < now {
        return Err(AuthError::TokenExpired);
    }

    Ok(claims)
}
