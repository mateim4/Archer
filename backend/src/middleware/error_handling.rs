use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::time::Instant;
use tracing::{error, info, warn};

use crate::utils::api_response::{helpers, ApiResponse};

/// Global error handling middleware
pub async fn error_handler<B>(request: Request<B>, next: Next<B>) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();

    info!("Request: {} {} - Processing started", method, uri.path());

    let response = next.run(request).await;
    let status = response.status();
    let duration = start.elapsed();

    // Log based on status code
    match status {
        StatusCode::OK | StatusCode::CREATED | StatusCode::ACCEPTED => {
            info!(
                "Request: {} {} - Completed successfully ({}) in {:?}",
                method,
                uri.path(),
                status,
                duration
            );
        }
        StatusCode::BAD_REQUEST | StatusCode::NOT_FOUND | StatusCode::CONFLICT => {
            warn!(
                "Request: {} {} - Client error ({}) in {:?}",
                method,
                uri.path(),
                status,
                duration
            );
        }
        _ => {
            error!(
                "Request: {} {} - Server error ({}) in {:?}",
                method,
                uri.path(),
                status,
                duration
            );
        }
    }

    response
}

/// CORS handling middleware
pub async fn cors_handler<B>(request: Request<B>, next: Next<B>) -> Response {
    let response = next.run(request).await;

    // Add CORS headers if not already present
    let (mut parts, body) = response.into_parts();

    // Allow common CORS headers
    parts
        .headers
        .insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    parts.headers.insert(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS".parse().unwrap(),
    );
    parts.headers.insert(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
            .parse()
            .unwrap(),
    );
    parts
        .headers
        .insert("Access-Control-Max-Age", "3600".parse().unwrap());

    Response::from_parts(parts, body)
}

/// Request logging middleware
pub async fn request_logger<B>(request: Request<B>, next: Next<B>) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    let headers_count = request.headers().len();

    info!(
        "🔍 {} {} - Headers: {}, Started processing",
        method, uri, headers_count
    );

    let response = next.run(request).await;
    let status = response.status();
    let duration = start.elapsed();

    info!(
        "✅ {} {} - Status: {}, Duration: {:?}",
        method, uri, status, duration
    );

    response
}

/// Convert panics into proper API errors
pub async fn panic_handler<B>(request: Request<B>, next: Next<B>) -> Response {
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| async {
        next.run(request).await
    }));

    match result {
        Ok(response_future) => response_future.await,
        Err(_) => {
            error!("Request handler panicked");
            helpers::internal_error("Internal server error occurred").into_response()
        }
    }
}
