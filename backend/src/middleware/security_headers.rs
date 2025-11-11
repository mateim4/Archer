use axum::{
    http::{Request, HeaderValue},
    middleware::Next,
    response::Response,
};

/// Security headers middleware
/// Adds essential security headers to all responses
pub async fn security_headers<B>(request: Request<B>, next: Next<B>) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();

    // Content Security Policy (CSP)
    // Restricts resources the page can load
    headers.insert(
        "Content-Security-Policy",
        HeaderValue::from_static(
            "default-src 'self'; \
             script-src 'self' 'unsafe-inline' 'unsafe-eval'; \
             style-src 'self' 'unsafe-inline'; \
             img-src 'self' data: https:; \
             font-src 'self' data:; \
             connect-src 'self' http://localhost:* ws://localhost:*; \
             frame-ancestors 'none';"
        ),
    );

    // X-Frame-Options: Prevents clickjacking attacks
    headers.insert(
        "X-Frame-Options",
        HeaderValue::from_static("DENY"),
    );

    // X-Content-Type-Options: Prevents MIME type sniffing
    headers.insert(
        "X-Content-Type-Options",
        HeaderValue::from_static("nosniff"),
    );

    // X-XSS-Protection: Enables browser XSS filter (legacy support)
    headers.insert(
        "X-XSS-Protection",
        HeaderValue::from_static("1; mode=block"),
    );

    // Referrer-Policy: Controls referrer information
    headers.insert(
        "Referrer-Policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // Permissions-Policy: Controls browser features
    headers.insert(
        "Permissions-Policy",
        HeaderValue::from_static(
            "geolocation=(), microphone=(), camera=(), payment=()"
        ),
    );

    // Strict-Transport-Security (HSTS): Enforces HTTPS (only in production with HTTPS)
    // Commented out for local development - enable in production with HTTPS
    // headers.insert(
    //     "Strict-Transport-Security",
    //     HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
    // );

    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        response::IntoResponse,
    };
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_security_headers_applied() {
        let app = axum::Router::new()
            .route("/", axum::routing::get(|| async { "OK" }))
            .layer(axum::middleware::from_fn(security_headers));

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        
        let headers = response.headers();
        assert!(headers.contains_key("Content-Security-Policy"));
        assert!(headers.contains_key("X-Frame-Options"));
        assert!(headers.contains_key("X-Content-Type-Options"));
        assert!(headers.contains_key("X-XSS-Protection"));
        assert!(headers.contains_key("Referrer-Policy"));
        assert!(headers.contains_key("Permissions-Policy"));
    }

    #[tokio::test]
    async fn test_x_frame_options_deny() {
        let app = axum::Router::new()
            .route("/", axum::routing::get(|| async { "OK" }))
            .layer(axum::middleware::from_fn(security_headers));

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        let x_frame_options = response.headers().get("X-Frame-Options").unwrap();
        assert_eq!(x_frame_options, "DENY");
    }
}
