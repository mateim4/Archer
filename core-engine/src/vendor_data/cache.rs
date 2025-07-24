// Caching system for vendor catalog data
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use tokio::fs;
use tokio::sync::RwLock;

use crate::error::CoreEngineError;
use crate::Result;
use super::{ServerModel, ServerSpecifications, CompatibilityMatrix};

/// Cache entry with expiration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry<T> {
    pub data: T,
    pub cached_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

impl<T> CacheEntry<T> {
    fn new(data: T, ttl_hours: i64) -> Self {
        let now = Utc::now();
        Self {
            data,
            cached_at: now,
            expires_at: now + Duration::hours(ttl_hours),
        }
    }
    
    fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }
}

/// Vendor data cache with memory and disk persistence
pub struct VendorDataCache {
    cache_dir: PathBuf,
    memory_cache: Arc<RwLock<MemoryCache>>,
}

/// In-memory cache for fast access
#[derive(Default, Clone)]
struct MemoryCache {
    server_models: HashMap<String, CacheEntry<Vec<ServerModel>>>,
    model_specifications: HashMap<String, CacheEntry<ServerSpecifications>>,
    compatibility_matrices: HashMap<String, CacheEntry<CompatibilityMatrix>>,
}

impl Clone for VendorDataCache {
    fn clone(&self) -> Self {
        Self {
            cache_dir: self.cache_dir.clone(),
            memory_cache: Arc::clone(&self.memory_cache),
        }
    }
}

impl VendorDataCache {
    /// Create new vendor data cache
    pub fn new() -> Self {
        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("lcm-designer")
            .join("vendor-cache");
        
        Self {
            cache_dir,
            memory_cache: Arc::new(RwLock::new(MemoryCache::default())),
        }
    }
    
    /// Initialize cache directory
    pub async fn initialize(&self) -> Result<()> {
        fs::create_dir_all(&self.cache_dir).await
            .map_err(|e| CoreEngineError::io(format!("Failed to create cache directory: {}", e)))?;
        Ok(())
    }
    
    /// Get server models from cache
    pub async fn get_server_models(&self, vendor: &str) -> Result<Option<Vec<ServerModel>>> {
        // Check memory cache first
        {
            let memory_cache = self.memory_cache.read().await;
            if let Some(entry) = memory_cache.server_models.get(vendor) {
                if !entry.is_expired() {
                    return Ok(Some(entry.data.clone()));
                }
            }
        }
        
        // Check disk cache
        let cache_file = self.cache_dir.join(format!("{}_models.json", vendor.to_lowercase()));
        if cache_file.exists() {
            match fs::read_to_string(&cache_file).await {
                Ok(content) => {
                    match serde_json::from_str::<CacheEntry<Vec<ServerModel>>>(&content) {
                        Ok(entry) => {
                            if !entry.is_expired() {
                                // Store in memory cache for faster access
                                let mut memory_cache = self.memory_cache.write().await;
                                memory_cache.server_models.insert(vendor.to_string(), entry.clone());
                                return Ok(Some(entry.data));
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to deserialize cached server models for {}: {}", vendor, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to read cache file for {}: {}", vendor, e);
                }
            }
        }
        
        Ok(None)
    }
    
    /// Store server models in cache
    pub async fn store_server_models(&self, vendor: &str, models: &[ServerModel]) -> Result<()> {
        let entry = CacheEntry::new(models.to_vec(), 24); // 24 hour TTL
        
        // Store in memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            memory_cache.server_models.insert(vendor.to_string(), entry.clone());
        }
        
        // Store in disk cache
        self.initialize().await?;
        let cache_file = self.cache_dir.join(format!("{}_models.json", vendor.to_lowercase()));
        let content = serde_json::to_string_pretty(&entry)
            .map_err(|e| CoreEngineError::serialization(format!("Failed to serialize server models: {}", e)))?;
        
        fs::write(&cache_file, content).await
            .map_err(|e| CoreEngineError::io(format!("Failed to write cache file: {}", e)))?;
        
        Ok(())
    }
    
    /// Get model specifications from cache
    pub async fn get_model_specifications(&self, cache_key: &str) -> Result<Option<ServerSpecifications>> {
        // Check memory cache first
        {
            let memory_cache = self.memory_cache.read().await;
            if let Some(entry) = memory_cache.model_specifications.get(cache_key) {
                if !entry.is_expired() {
                    return Ok(Some(entry.data.clone()));
                }
            }
        }
        
        // Check disk cache
        let safe_key = cache_key.replace(':', "_").replace('/', "_");
        let cache_file = self.cache_dir.join(format!("{}_specs.json", safe_key));
        if cache_file.exists() {
            match fs::read_to_string(&cache_file).await {
                Ok(content) => {
                    match serde_json::from_str::<CacheEntry<ServerSpecifications>>(&content) {
                        Ok(entry) => {
                            if !entry.is_expired() {
                                // Store in memory cache for faster access
                                let mut memory_cache = self.memory_cache.write().await;
                                memory_cache.model_specifications.insert(cache_key.to_string(), entry.clone());
                                return Ok(Some(entry.data));
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to deserialize cached specifications for {}: {}", cache_key, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to read cache file for {}: {}", cache_key, e);
                }
            }
        }
        
        Ok(None)
    }
    
    /// Store model specifications in cache
    pub async fn store_model_specifications(&self, cache_key: &str, specs: &ServerSpecifications) -> Result<()> {
        let entry = CacheEntry::new(specs.clone(), 72); // 72 hour TTL
        
        // Store in memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            memory_cache.model_specifications.insert(cache_key.to_string(), entry.clone());
        }
        
        // Store in disk cache
        self.initialize().await?;
        let safe_key = cache_key.replace(':', "_").replace('/', "_");
        let cache_file = self.cache_dir.join(format!("{}_specs.json", safe_key));
        let content = serde_json::to_string_pretty(&entry)
            .map_err(|e| CoreEngineError::serialization(format!("Failed to serialize specifications: {}", e)))?;
        
        fs::write(&cache_file, content).await
            .map_err(|e| CoreEngineError::io(format!("Failed to write cache file: {}", e)))?;
        
        Ok(())
    }
    
    /// Get compatibility matrix from cache
    pub async fn get_compatibility_matrix(&self, cache_key: &str) -> Result<Option<CompatibilityMatrix>> {
        // Check memory cache first
        {
            let memory_cache = self.memory_cache.read().await;
            if let Some(entry) = memory_cache.compatibility_matrices.get(cache_key) {
                if !entry.is_expired() {
                    return Ok(Some(entry.data.clone()));
                }
            }
        }
        
        // Check disk cache
        let safe_key = cache_key.replace(':', "_").replace('/', "_");
        let cache_file = self.cache_dir.join(format!("{}_compat.json", safe_key));
        if cache_file.exists() {
            match fs::read_to_string(&cache_file).await {
                Ok(content) => {
                    match serde_json::from_str::<CacheEntry<CompatibilityMatrix>>(&content) {
                        Ok(entry) => {
                            if !entry.is_expired() {
                                // Store in memory cache for faster access
                                let mut memory_cache = self.memory_cache.write().await;
                                memory_cache.compatibility_matrices.insert(cache_key.to_string(), entry.clone());
                                return Ok(Some(entry.data));
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to deserialize cached compatibility matrix for {}: {}", cache_key, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to read cache file for {}: {}", cache_key, e);
                }
            }
        }
        
        Ok(None)
    }
    
    /// Store compatibility matrix in cache
    pub async fn store_compatibility_matrix(&self, cache_key: &str, matrix: &CompatibilityMatrix) -> Result<()> {
        let entry = CacheEntry::new(matrix.clone(), 168); // 1 week TTL
        
        // Store in memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            memory_cache.compatibility_matrices.insert(cache_key.to_string(), entry.clone());
        }
        
        // Store in disk cache
        self.initialize().await?;
        let safe_key = cache_key.replace(':', "_").replace('/', "_");
        let cache_file = self.cache_dir.join(format!("{}_compat.json", safe_key));
        let content = serde_json::to_string_pretty(&entry)
            .map_err(|e| CoreEngineError::serialization(format!("Failed to serialize compatibility matrix: {}", e)))?;
        
        fs::write(&cache_file, content).await
            .map_err(|e| CoreEngineError::io(format!("Failed to write cache file: {}", e)))?;
        
        Ok(())
    }
    
    /// Clear cache for a specific vendor
    pub async fn clear_vendor_data(&self, vendor: &str) -> Result<()> {
        // Clear memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            memory_cache.server_models.retain(|k, _| !k.starts_with(vendor));
            memory_cache.model_specifications.retain(|k, _| !k.starts_with(vendor));
            memory_cache.compatibility_matrices.retain(|k, _| !k.starts_with(vendor));
        }
        
        // Clear disk cache files
        let vendor_lower = vendor.to_lowercase();
        if let Ok(entries) = fs::read_dir(&self.cache_dir).await {
            let mut entries = entries;
            while let Ok(Some(entry)) = entries.next_entry().await {
                if let Some(filename) = entry.file_name().to_str() {
                    if filename.starts_with(&vendor_lower) {
                        let _ = fs::remove_file(entry.path()).await;
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Clear all cached data
    pub async fn clear_all(&self) -> Result<()> {
        // Clear memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            memory_cache.server_models.clear();
            memory_cache.model_specifications.clear();
            memory_cache.compatibility_matrices.clear();
        }
        
        // Clear disk cache
        if self.cache_dir.exists() {
            fs::remove_dir_all(&self.cache_dir).await
                .map_err(|e| CoreEngineError::io(format!("Failed to clear cache directory: {}", e)))?;
        }
        
        Ok(())
    }
    
    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> CacheStats {
        let memory_cache = self.memory_cache.read().await;
        
        let disk_size = self.calculate_disk_cache_size().await;
        
        CacheStats {
            memory_entries: memory_cache.server_models.len() 
                + memory_cache.model_specifications.len() 
                + memory_cache.compatibility_matrices.len(),
            disk_size_bytes: disk_size,
            cache_directory: self.cache_dir.clone(),
        }
    }
    
    /// Calculate disk cache size
    async fn calculate_disk_cache_size(&self) -> u64 {
        let mut total_size = 0u64;
        
        if let Ok(entries) = fs::read_dir(&self.cache_dir).await {
            let mut entries = entries;
            while let Ok(Some(entry)) = entries.next_entry().await {
                if let Ok(metadata) = entry.metadata().await {
                    total_size += metadata.len();
                }
            }
        }
        
        total_size
    }
    
    /// Clean up expired entries
    pub async fn cleanup_expired(&self) -> Result<u32> {
        let mut removed_count = 0u32;
        
        // Clean memory cache
        {
            let mut memory_cache = self.memory_cache.write().await;
            
            let before_count = memory_cache.server_models.len();
            memory_cache.server_models.retain(|_, entry| !entry.is_expired());
            removed_count += (before_count - memory_cache.server_models.len()) as u32;
            
            let before_count = memory_cache.model_specifications.len();
            memory_cache.model_specifications.retain(|_, entry| !entry.is_expired());
            removed_count += (before_count - memory_cache.model_specifications.len()) as u32;
            
            let before_count = memory_cache.compatibility_matrices.len();
            memory_cache.compatibility_matrices.retain(|_, entry| !entry.is_expired());
            removed_count += (before_count - memory_cache.compatibility_matrices.len()) as u32;
        }
        
        // Clean disk cache by checking each file
        if let Ok(entries) = fs::read_dir(&self.cache_dir).await {
            let mut entries = entries;
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if let Ok(content) = fs::read_to_string(&path).await {
                    // Try to parse as any cache entry type to check expiration
                    let is_expired = if let Ok(entry) = serde_json::from_str::<CacheEntry<serde_json::Value>>(&content) {
                        entry.is_expired()
                    } else {
                        false
                    };
                    
                    if is_expired {
                        let _ = fs::remove_file(&path).await;
                        removed_count += 1;
                    }
                }
            }
        }
        
        Ok(removed_count)
    }
}

/// Cache statistics
#[derive(Debug)]
pub struct CacheStats {
    pub memory_entries: usize,
    pub disk_size_bytes: u64,
    pub cache_directory: PathBuf,
}

impl std::fmt::Display for CacheStats {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, 
            "Cache Stats:\n  Memory entries: {}\n  Disk size: {:.2} MB\n  Cache directory: {}", 
            self.memory_entries,
            self.disk_size_bytes as f64 / 1024.0 / 1024.0,
            self.cache_directory.display()
        )
    }
}
