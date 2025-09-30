use axum::response::{Json, IntoResponse, Response};
use axum::http::StatusCode;
use serde::{Serialize, Deserialize};
use serde_json::{json, Value};
use chrono::{Utc, DateTime};

/// Standard API response format for all endpoints
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<ApiError>,
    pub metadata: Option<Value>,
    pub timestamp: DateTime<Utc>,
}

/// Standard error structure
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<Value>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    /// Create a successful response with data
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
            metadata: None,
            timestamp: Utc::now(),
        }
    }

    /// Create a successful response with data and metadata
    pub fn success_with_metadata(data: T, metadata: Value) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
            metadata: Some(metadata),
            timestamp: Utc::now(),
        }
    }
}

impl ApiResponse<()> {
    /// Create an error response
    pub fn error(code: &str, message: &str) -> Self {
        ApiResponse {
            success: false,
            data: None,
            error: Some(ApiError {
                code: code.to_string(),
                message: message.to_string(),
                details: None,
            }),
            metadata: None,
            timestamp: Utc::now(),
        }
    }

    /// Create an error response with details
    pub fn error_with_details(code: &str, message: &str, details: Value) -> Self {
        ApiResponse {
            success: false,
            data: None,
            error: Some(ApiError {
                code: code.to_string(),
                message: message.to_string(),
                details: Some(details),
            }),
            metadata: None,
            timestamp: Utc::now(),
        }
    }
}

/// Helper trait for creating API responses
pub trait IntoApiResponse<T> {
    fn into_api_response(self) -> ApiResponse<T>;
}

impl<T, E> IntoApiResponse<T> for Result<T, E>
where
    T: Serialize,
    E: std::fmt::Display,
{
    fn into_api_response(self) -> ApiResponse<T> {
        match self {
            Ok(data) => ApiResponse::success(data),
            Err(err) => ApiResponse {
                success: false,
                data: None,
                error: Some(ApiError {
                    code: "INTERNAL_ERROR".to_string(),
                    message: err.to_string(),
                    details: None,
                }),
                metadata: None,
                timestamp: Utc::now(),
            },
        }
    }
}

/// Standard implementation for axum response
impl<T> IntoResponse for ApiResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        let status = if self.success {
            StatusCode::OK
        } else {
            match self.error.as_ref().map(|e| e.code.as_str()) {
                Some("NOT_FOUND") => StatusCode::NOT_FOUND,
                Some("BAD_REQUEST") | Some("VALIDATION_ERROR") => StatusCode::BAD_REQUEST,
                Some("UNAUTHORIZED") => StatusCode::UNAUTHORIZED,
                Some("FORBIDDEN") => StatusCode::FORBIDDEN,
                Some("CONFLICT") => StatusCode::CONFLICT,
                Some("PAYLOAD_TOO_LARGE") => StatusCode::PAYLOAD_TOO_LARGE,
                Some("RATE_LIMITED") => StatusCode::TOO_MANY_REQUESTS,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            }
        };

        (status, Json(self)).into_response()
    }
}

/// Common API response helpers
pub mod helpers {
    use super::*;

    pub fn ok<T: Serialize>(data: T) -> ApiResponse<T> {
        ApiResponse::success(data)
    }

    pub fn created<T: Serialize>(data: T) -> impl IntoResponse {
        (StatusCode::CREATED, ApiResponse::success(data))
    }

    pub fn not_found(message: &str) -> ApiResponse<()> {
        ApiResponse::error("NOT_FOUND", message)
    }

    pub fn bad_request(message: &str) -> ApiResponse<()> {
        ApiResponse::error("BAD_REQUEST", message)
    }

    pub fn validation_error(message: &str, details: Value) -> ApiResponse<()> {
        ApiResponse::error_with_details("VALIDATION_ERROR", message, details)
    }

    pub fn internal_error(message: &str) -> ApiResponse<()> {
        ApiResponse::error("INTERNAL_ERROR", message)
    }

    pub fn conflict(message: &str) -> ApiResponse<()> {
        ApiResponse::error("CONFLICT", message)
    }

    pub fn unauthorized(message: &str) -> ApiResponse<()> {
        ApiResponse::error("UNAUTHORIZED", message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_success_response() {
        let response = ApiResponse::success("test_data");
        assert!(response.success);
        assert_eq!(response.data, Some("test_data"));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_error_response() {
        let response = ApiResponse::<()>::error("TEST_ERROR", "Test error message");
        assert!(!response.success);
        assert!(response.data.is_none());
        assert!(response.error.is_some());
        
        let error = response.error.unwrap();
        assert_eq!(error.code, "TEST_ERROR");
        assert_eq!(error.message, "Test error message");
    }

    #[test]
    fn test_result_conversion() {
        let success_result: Result<String, &str> = Ok("success".to_string());
        let response = success_result.into_api_response();
        assert!(response.success);

        let error_result: Result<String, &str> = Err("error");
        let response = error_result.into_api_response();
        assert!(!response.success);
    }
}