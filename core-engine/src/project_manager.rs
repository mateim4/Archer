use crate::models::project::{Project, HardwarePool};
use crate::CoreEngineError;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

pub struct ProjectManager {
    projects_dir: PathBuf,
    hardware_pool_file: PathBuf,
}

impl ProjectManager {
    /// Creates a new ProjectManager.
    ///
    /// # Arguments
    ///
    /// * `config_dir` - The application's configuration directory.
    pub fn new(config_dir: &Path) -> Result<Self, CoreEngineError> {
        let projects_dir = config_dir.join("projects");
        fs::create_dir_all(&projects_dir).map_err(|e| {
            CoreEngineError::io(format!(
                "Failed to create projects directory at {}: {}",
                projects_dir.display(),
                e
            ))
        })?;

        let hardware_pool_file = config_dir.join("hardware_pool.json");

        Ok(Self {
            projects_dir,
            hardware_pool_file,
        })
    }

    /// Loads all projects from the projects directory.
    pub fn load_projects(&self) -> Result<HashMap<String, Project>, CoreEngineError> {
        let mut projects = HashMap::new();
        let entries = fs::read_dir(&self.projects_dir).map_err(|e| {
            CoreEngineError::io(format!(
                "Failed to read projects directory at {}: {}",
                self.projects_dir.display(),
                e
            ))
        })?;

        for entry in entries {
            let entry = entry.map_err(|e| CoreEngineError::io(format!("Failed to read directory entry: {}", e)))?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                let file_content = fs::read_to_string(&path)
                    .map_err(|e| CoreEngineError::io(format!("Failed to read project file at {}: {}", path.display(), e)))?;

                let project: Project = serde_json::from_str(&file_content)
                    .map_err(|e| CoreEngineError::parsing(format!("Failed to parse project file {}: {}", path.display(), e)))?;

                if let Some(id) = &project.id {
                    projects.insert(id.to_string(), project);
                }
            }
        }
        Ok(projects)
    }

    /// Saves a single project to its file.
    pub fn save_project(&self, project: &Project) -> Result<(), CoreEngineError> {
        let id_str = match &project.id {
            Some(id) => id.to_string(),
            None => return Err(CoreEngineError::validation("Project has no ID to save with")),
        };

        let project_file = self.projects_dir.join(format!("{}.json", id_str));
        let file_content = serde_json::to_string_pretty(project)
            .map_err(|e| CoreEngineError::serialization(format!("Failed to serialize project {}: {}", id_str, e)))?;

        fs::write(&project_file, file_content)
            .map_err(|e| CoreEngineError::io(format!("Failed to write project file {}: {}", project_file.display(), e)))
    }

    /// Deletes a project's file.
    pub fn delete_project(&self, project_id: &str) -> Result<(), CoreEngineError> {
        let project_file = self.projects_dir.join(format!("{}.json", project_id));
        if project_file.exists() {
            fs::remove_file(&project_file)
                .map_err(|e| CoreEngineError::io(format!("Failed to delete project file {}: {}", project_file.display(), e)))
        } else {
            Ok(()) // If file doesn't exist, it's already "deleted"
        }
    }

    /// Loads the hardware pool from its file.
    pub fn load_hardware_pool(&self) -> Result<HardwarePool, CoreEngineError> {
        if self.hardware_pool_file.exists() {
            let file_content = fs::read_to_string(&self.hardware_pool_file).map_err(|e| {
                CoreEngineError::io(format!(
                    "Failed to read hardware pool file at {}: {}",
                    self.hardware_pool_file.display(),
                    e
                ))
            })?;
            serde_json::from_str(&file_content)
                .map_err(|e| CoreEngineError::parsing(format!("Failed to parse hardware pool file: {}", e)))
        } else {
            // If the file doesn't exist, return a default, empty pool
            Ok(HardwarePool::default())
        }
    }

    /// Saves the hardware pool to its file.
    pub fn save_hardware_pool(&self, hardware_pool: &HardwarePool) -> Result<(), CoreEngineError> {
        let file_content = serde_json::to_string_pretty(hardware_pool)
            .map_err(|e| CoreEngineError::serialization(format!("Failed to serialize hardware pool: {}", e)))?;

        fs::write(&self.hardware_pool_file, file_content)
            .map_err(|e| CoreEngineError::io(format!("Failed to write hardware pool file {}: {}", self.hardware_pool_file.display(), e)))
    }
}
