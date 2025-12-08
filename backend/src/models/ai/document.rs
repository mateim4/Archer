use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentSourceType {
    Upload,
    Confluence,
    Sharepoint,
    Github,
    GoogleDrive,
    Onedrive,
    FileServer,
    ObjectStorage,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Error,
    Deprecated,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SensitivityLevel {
    Public = 1,
    Internal = 2,
    Confidential = 3,
    Restricted = 4,
    TopSecret = 5,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Option<Thing>,
    pub title: String,
    pub filename: Option<String>,
    pub mime_type: Option<String>,
    pub source_type: DocumentSourceType,
    pub source_url: Option<String>,
    pub source_id: Option<String>,
    pub content_hash: String,
    pub version: Option<String>,
    pub size_bytes: Option<i64>,
    pub page_count: Option<i32>,
    pub chunk_count: i32,
    pub status: DocumentStatus,
    pub error_message: Option<String>,
    pub sensitivity_level: SensitivityLevel,
    pub tags: Vec<String>,
    pub source_created_at: Option<DateTime<Utc>>,
    pub source_modified_at: Option<DateTime<Utc>>,
    pub last_synced_at: Option<DateTime<Utc>>,
    pub indexed_at: Option<DateTime<Utc>>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub filename: Option<String>,
    pub mime_type: Option<String>,
    pub source_type: DocumentSourceType,
    pub source_url: Option<String>,
    pub content_hash: String,
    pub size_bytes: Option<i64>,
    pub sensitivity_level: Option<SensitivityLevel>,
    pub tags: Option<Vec<String>>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDocumentRequest {
    pub status: Option<DocumentStatus>,
    pub error_message: Option<String>,
    pub chunk_count: Option<i32>,
    pub indexed_at: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}
