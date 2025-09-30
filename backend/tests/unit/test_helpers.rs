use axum::{extract::State, http::StatusCode, Json};
use serde_json::{json, Value};
use crate::database::DatabaseManager;
use anyhow::Result;

pub struct TestDatabase {
    pub db: DatabaseManager,
}

impl TestDatabase {
    pub async fn new() -> Result<Self> {
        let db = DatabaseManager::new().await?;
        Ok(Self { db })
    }

    pub async fn cleanup(&self) -> Result<()> {
        // Clean up test data
        let _result = self.db.db.query("DELETE hardware_basket").await?;
        let _result = self.db.db.query("DELETE hardware_model").await?;
        Ok(())
    }
}

pub fn create_test_hardware_basket() -> Value {
    json!({
        "name": "Test Basket",
        "vendor": "Dell",
        "description": "Test hardware basket for unit tests",
        "status": "active"
    })
}

pub fn create_test_hardware_model() -> Value {
    json!({
        "name": "PowerEdge R650",
        "vendor": "Dell",
        "cpu": "Intel Xeon Silver 4314",
        "memory": "64GB DDR4",
        "storage": "2x 480GB SSD",
        "form_factor": "1U Rack",
        "power_consumption": 600
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_connection() {
        let test_db = TestDatabase::new().await;
        assert!(test_db.is_ok());
    }

    #[tokio::test]
    async fn test_create_hardware_basket() {
        let test_db = TestDatabase::new().await.unwrap();
        
        let basket_data = create_test_hardware_basket();
        let result = test_db.db.create_hardware_basket(
            basket_data["name"].as_str().unwrap(),
            basket_data["vendor"].as_str().unwrap(),
            Some(basket_data["description"].as_str().unwrap())
        ).await;
        
        assert!(result.is_ok());
        
        // Cleanup
        test_db.cleanup().await.unwrap();
    }

    #[tokio::test]
    async fn test_hardware_model_creation() {
        let model_data = create_test_hardware_model();
        
        assert_eq!(model_data["name"], "PowerEdge R650");
        assert_eq!(model_data["vendor"], "Dell");
        assert_eq!(model_data["cpu"], "Intel Xeon Silver 4314");
    }
}