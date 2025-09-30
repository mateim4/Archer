use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::{Response, IntoResponse},
    extract::FromRequest,
    body::Body,
};
use serde_json::Value;
use std::collections::HashMap;

use crate::utils::api_response::{ApiResponse, helpers};

/// Input validation middleware
pub async fn validate_json_content_type<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response {
    let content_type = request
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok());

    // Check if this is a POST/PUT request with body
    let method = request.method();
    if matches!(method, &axum::http::Method::POST | &axum::http::Method::PUT) {
        match content_type {
            Some(ct) if ct.starts_with("application/json") => {
                // Valid JSON content type
                next.run(request).await
            }
            Some(ct) if ct.starts_with("multipart/form-data") => {
                // Valid multipart content type for file uploads
                next.run(request).await
            }
            Some(ct) if ct.starts_with("application/x-www-form-urlencoded") => {
                // Valid form content type
                next.run(request).await
            }
            _ => {
                // Invalid or missing content type
                helpers::bad_request("Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded for POST/PUT requests")
                    .into_response()
            }
        }
    } else {
        // GET, DELETE, etc. - no content type validation needed
        next.run(request).await
    }
}

/// Request size validation middleware
pub async fn validate_request_size<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response {
    const MAX_BODY_SIZE: u64 = 50 * 1024 * 1024; // 50MB

    if let Some(content_length) = request.headers().get("content-length") {
        if let Ok(length_str) = content_length.to_str() {
            if let Ok(length) = length_str.parse::<u64>() {
                if length > MAX_BODY_SIZE {
                    return ApiResponse::<()>::error("PAYLOAD_TOO_LARGE", 
                        &format!("Request body too large. Maximum size: {} bytes", MAX_BODY_SIZE))
                        .into_response();
                }
            }
        }
    }

    next.run(request).await
}

/// Common input validation functions
pub mod validators {
    use regex::Regex;
    use once_cell::sync::Lazy;

    static EMAIL_REGEX: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap()
    });

    static PROJECT_NAME_REGEX: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"^[a-zA-Z0-9\s\-_\.]{1,100}$").unwrap()
    });

    static UUID_REGEX: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$").unwrap()
    });

    pub fn validate_email(email: &str) -> bool {
        EMAIL_REGEX.is_match(email)
    }

    pub fn validate_project_name(name: &str) -> bool {
        PROJECT_NAME_REGEX.is_match(name)
    }

    pub fn validate_uuid(uuid: &str) -> bool {
        UUID_REGEX.is_match(uuid)
    }

    pub fn validate_string_length(s: &str, min: usize, max: usize) -> bool {
        let len = s.len();
        len >= min && len <= max
    }

    pub fn validate_required_string(s: &Option<String>) -> bool {
        s.as_ref().map_or(false, |s| !s.trim().is_empty())
    }

    pub fn sanitize_string(s: &str) -> String {
        s.trim().replace('\0', "").chars().take(1000).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::validators::*;

    #[test]
    fn test_email_validation() {
        assert!(validate_email("test@example.com"));
        assert!(validate_email("user.name@domain.co.uk"));
        assert!(!validate_email("invalid.email"));
        assert!(!validate_email("@domain.com"));
        assert!(!validate_email("user@"));
    }

    #[test]
    fn test_project_name_validation() {
        assert!(validate_project_name("My Project"));
        assert!(validate_project_name("project-123"));
        assert!(validate_project_name("Project_v2.0"));
        assert!(!validate_project_name("")); // too short
        assert!(!validate_project_name("a".repeat(101))); // too long
    }

    #[test]
    fn test_uuid_validation() {
        assert!(validate_uuid("550e8400-e29b-41d4-a716-446655440000"));
        assert!(!validate_uuid("not-a-uuid"));
        assert!(!validate_uuid("550e8400-e29b-41d4-a716"));
    }

    #[test]
    fn test_string_length() {
        assert!(validate_string_length("hello", 1, 10));
        assert!(!validate_string_length("", 1, 10));
        assert!(!validate_string_length("too long string", 1, 10));
    }
}