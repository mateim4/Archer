use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::{Response, IntoResponse},
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::net::IpAddr;

use crate::utils::api_response::{ApiResponse, helpers};

/// Rate limiter configuration
#[derive(Clone, Debug)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
    pub burst_limit: u32,
    pub window_duration: Duration,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            requests_per_minute: 100,
            burst_limit: 20,
            window_duration: Duration::from_secs(60),
        }
    }
}

/// Rate limit information for a client
#[derive(Debug, Clone)]
struct RateLimitEntry {
    requests: u32,
    window_start: Instant,
    last_request: Instant,
}

/// In-memory rate limiter (for production, consider Redis)
#[derive(Clone)]
pub struct RateLimiter {
    config: RateLimitConfig,
    clients: Arc<Mutex<HashMap<String, RateLimitEntry>>>,
}

impl RateLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            config,
            clients: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn check_rate_limit(&self, client_id: &str) -> Result<(), RateLimitError> {
        let now = Instant::now();
        let mut clients = self.clients.lock().unwrap();

        let entry = clients.entry(client_id.to_string()).or_insert(RateLimitEntry {
            requests: 0,
            window_start: now,
            last_request: now,
        });

        // Reset window if expired
        if now.duration_since(entry.window_start) >= self.config.window_duration {
            entry.requests = 0;
            entry.window_start = now;
        }

        // Check burst limit (requests within short timeframe)
        if now.duration_since(entry.last_request) < Duration::from_secs(1) {
            if entry.requests >= self.config.burst_limit {
                return Err(RateLimitError::BurstLimitExceeded);
            }
        }

        // Check rate limit
        if entry.requests >= self.config.requests_per_minute {
            return Err(RateLimitError::RateLimitExceeded);
        }

        entry.requests += 1;
        entry.last_request = now;

        Ok(())
    }

    /// Clean up old entries to prevent memory leak
    pub fn cleanup_old_entries(&self) {
        let now = Instant::now();
        let mut clients = self.clients.lock().unwrap();
        
        clients.retain(|_, entry| {
            now.duration_since(entry.last_request) < Duration::from_secs(300) // 5 minutes
        });
    }
}

#[derive(Debug)]
pub enum RateLimitError {
    RateLimitExceeded,
    BurstLimitExceeded,
}

/// Rate limiting middleware
pub fn create_rate_limit_middleware(
    config: RateLimitConfig,
) -> impl Fn(Request<axum::body::Body>, Next<axum::body::Body>) -> std::pin::Pin<Box<dyn std::future::Future<Output = Response> + Send>> + Clone {
    let rate_limiter = RateLimiter::new(config);
    
    move |request: Request<axum::body::Body>, next: Next<axum::body::Body>| {
        let rate_limiter = rate_limiter.clone();
        
        Box::pin(async move {
            // Extract client identifier (IP address or user ID if authenticated)
            let client_id = extract_client_id(&request);
            
            match rate_limiter.check_rate_limit(&client_id) {
                Ok(()) => {
                    // Add rate limit headers to response
                    let response = next.run(request).await;
                    add_rate_limit_headers(response, &rate_limiter.config)
                }
                Err(RateLimitError::RateLimitExceeded) => {
                    ApiResponse::<()>::error("RATE_LIMITED", "Rate limit exceeded. Please try again later.")
                        .into_response()
                }
                Err(RateLimitError::BurstLimitExceeded) => {
                    ApiResponse::<()>::error("RATE_LIMITED", "Burst limit exceeded. Please slow down.")
                        .into_response()
                }
            }
        })
    }
}

fn extract_client_id(request: &Request<axum::body::Body>) -> String {
    // Try to get the real IP from X-Forwarded-For header first
    if let Some(forwarded_for) = request.headers().get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Try X-Real-IP header
    if let Some(real_ip) = request.headers().get("x-real-ip") {
        if let Ok(ip_str) = real_ip.to_str() {
            return ip_str.to_string();
        }
    }

    // Fall back to connection info (this might not work in all environments)
    // For now, use a default identifier
    "unknown".to_string()
}

fn add_rate_limit_headers(mut response: Response, config: &RateLimitConfig) -> Response {
    let headers = response.headers_mut();
    
    headers.insert(
        "X-RateLimit-Limit",
        config.requests_per_minute.to_string().parse().unwrap(),
    );
    
    headers.insert(
        "X-RateLimit-Window",
        config.window_duration.as_secs().to_string().parse().unwrap(),
    );
    
    response
}

/// Specific rate limiting for different endpoint types
pub mod presets {
    use super::*;

    pub fn api_default() -> RateLimitConfig {
        RateLimitConfig {
            requests_per_minute: 100,
            burst_limit: 20,
            window_duration: Duration::from_secs(60),
        }
    }

    pub fn file_upload() -> RateLimitConfig {
        RateLimitConfig {
            requests_per_minute: 10,
            burst_limit: 3,
            window_duration: Duration::from_secs(60),
        }
    }

    pub fn data_heavy() -> RateLimitConfig {
        RateLimitConfig {
            requests_per_minute: 30,
            burst_limit: 5,
            window_duration: Duration::from_secs(60),
        }
    }

    pub fn authentication() -> RateLimitConfig {
        RateLimitConfig {
            requests_per_minute: 5,
            burst_limit: 2,
            window_duration: Duration::from_secs(60),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limiter_allows_requests_within_limit() {
        let config = RateLimitConfig {
            requests_per_minute: 5,
            burst_limit: 3,
            window_duration: Duration::from_secs(60),
        };
        let limiter = RateLimiter::new(config);

        // Should allow first few requests
        assert!(limiter.check_rate_limit("test_client").is_ok());
        assert!(limiter.check_rate_limit("test_client").is_ok());
        assert!(limiter.check_rate_limit("test_client").is_ok());
    }

    #[test]
    fn test_rate_limiter_blocks_excess_requests() {
        let config = RateLimitConfig {
            requests_per_minute: 2,
            burst_limit: 1,
            window_duration: Duration::from_secs(60),
        };
        let limiter = RateLimiter::new(config);

        // Allow first requests
        assert!(limiter.check_rate_limit("test_client").is_ok());
        assert!(limiter.check_rate_limit("test_client").is_ok());
        
        // Should block the third request
        assert!(limiter.check_rate_limit("test_client").is_err());
    }

    #[test]
    fn test_different_clients_have_separate_limits() {
        let config = RateLimitConfig::default();
        let limiter = RateLimiter::new(config);

        // Different clients should have separate rate limits
        assert!(limiter.check_rate_limit("client1").is_ok());
        assert!(limiter.check_rate_limit("client2").is_ok());
    }
}