//! Dependency Validator Service
//!
//! This service validates domino hardware swap dependency chains for cluster migrations.
//! It detects circular dependencies, validates execution order, and generates critical path analysis.
//!
//! ## Features
//! - Circular dependency detection using depth-first search
//! - Topological sorting for execution order
//! - Critical path calculation for project timeline
//! - Detailed error and warning messages

use chrono::Utc;
use std::collections::{HashMap, HashSet};

use crate::models::migration_models::*;
use surrealdb::sql::Thing;

/// Service for validating cluster migration dependencies
pub struct DependencyValidator {
    strategies: Vec<ClusterMigrationPlan>,
}

impl DependencyValidator {
    /// Create a new dependency validator
    pub fn new(strategies: Vec<ClusterMigrationPlan>) -> Self {
        Self { strategies }
    }

    /// Validate all dependencies and return comprehensive results
    pub fn validate(&self) -> DependencyValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut circular_dependencies = Vec::new();

        // Build dependency graph
        let graph = self.build_dependency_graph();

        // Check for circular dependencies
        circular_dependencies = self.detect_circular_dependencies(&graph);

        // Validate domino sources exist
        self.validate_domino_sources(&mut errors, &mut warnings);

        // Generate execution order (topological sort)
        let execution_order = match circular_dependencies.is_empty() {
            true => self.topological_sort(&graph),
            false => {
                errors.push(
                    "Cannot generate execution order due to circular dependencies".to_string(),
                );
                Vec::new()
            }
        };

        // Calculate critical path and convert results to Thing identifiers for compatibility with API models
        let critical_path_names = if execution_order.is_empty() {
            Vec::new()
        } else {
            self.calculate_critical_path(&graph, &execution_order)
        };

        let topological_order: Vec<Thing> = execution_order
            .iter()
            .map(|cluster| Thing::from(("clusters", cluster.as_str())))
            .collect();

        let critical_path: Vec<Thing> = critical_path_names
            .iter()
            .map(|cluster| Thing::from(("clusters", cluster.as_str())))
            .collect();

        let is_valid = errors.is_empty() && circular_dependencies.is_empty();
        let has_circular_dependencies = !circular_dependencies.is_empty();

        DependencyValidationResult {
            is_valid,
            has_circular_dependencies,
            circular_dependencies,
            topological_order,
            execution_order,
            critical_path,
            warnings,
            errors,
            validated_at: Utc::now(),
        }
    }

    /// Build a dependency graph from cluster strategies
    ///
    /// Returns a HashMap where:
    /// - Key: cluster name
    /// - Value: list of cluster names this cluster depends on
    fn build_dependency_graph(&self) -> HashMap<String, Vec<String>> {
        let mut graph: HashMap<String, Vec<String>> = HashMap::new();

        for strategy in &self.strategies {
            let cluster_name = strategy.target_cluster_name.clone();

            // Initialize entry for this cluster
            graph.entry(cluster_name.clone()).or_insert_with(Vec::new);

            // Add domino dependency if present
            if strategy.strategy_type == MigrationStrategyType::DominoHardwareSwap {
                if let Some(ref domino_source) = strategy.domino_source_cluster {
                    graph
                        .entry(cluster_name.clone())
                        .or_insert_with(Vec::new)
                        .push(domino_source.clone());
                }
            }

            // Note: dependencies field contains Thing IDs which need to be resolved to names
            // For now, domino_source_cluster provides the necessary dependency info
        }

        graph
    }

    /// Detect circular dependencies using depth-first search
    fn detect_circular_dependencies(
        &self,
        graph: &HashMap<String, Vec<String>>,
    ) -> Vec<CircularDependency> {
        let mut circular_deps = Vec::new();
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();
        let mut path: Vec<String> = Vec::new();

        for node in graph.keys() {
            if !visited.contains(node) {
                self.dfs_detect_cycle(
                    node,
                    graph,
                    &mut visited,
                    &mut rec_stack,
                    &mut path,
                    &mut circular_deps,
                );
            }
        }

        circular_deps
    }

    /// Depth-first search for cycle detection
    fn dfs_detect_cycle(
        &self,
        node: &str,
        graph: &HashMap<String, Vec<String>>,
        visited: &mut HashSet<String>,
        rec_stack: &mut HashSet<String>,
        path: &mut Vec<String>,
        circular_deps: &mut Vec<CircularDependency>,
    ) {
        visited.insert(node.to_string());
        rec_stack.insert(node.to_string());
        path.push(node.to_string());

        if let Some(neighbors) = graph.get(node) {
            for neighbor in neighbors {
                if !visited.contains(neighbor) {
                    self.dfs_detect_cycle(neighbor, graph, visited, rec_stack, path, circular_deps);
                } else if rec_stack.contains(neighbor) {
                    // Cycle detected - extract the cycle path
                    if let Some(cycle_start_idx) = path.iter().position(|n| n == neighbor) {
                        let cycle_path: Vec<String> = path[cycle_start_idx..].to_vec();
                        let mut full_cycle = cycle_path.clone();
                        full_cycle.push(neighbor.to_string());

                        circular_deps.push(CircularDependency {
                            cycle: full_cycle.clone(),
                            cluster_ids: Vec::new(), // Will be populated later if needed
                            cluster_chain: full_cycle.clone(),
                            description: format!(
                                "Circular dependency detected: {}",
                                full_cycle.join(" → ")
                            ),
                        });
                    }
                }
            }
        }

        path.pop();
        rec_stack.remove(node);
    }

    /// Validate that domino source clusters exist in the project
    fn validate_domino_sources(&self, errors: &mut Vec<String>, warnings: &mut Vec<String>) {
        let cluster_names: HashSet<String> = self
            .strategies
            .iter()
            .filter_map(|s| s.source_cluster_name.clone())
            .collect();

        for strategy in &self.strategies {
            if strategy.strategy_type == MigrationStrategyType::DominoHardwareSwap {
                if let Some(ref domino_source) = strategy.domino_source_cluster {
                    // Check if domino source exists in the project
                    if !cluster_names.contains(domino_source) {
                        errors.push(format!(
                            "Cluster '{}' depends on domino source '{}' which does not exist in this project",
                            strategy.target_cluster_name, domino_source
                        ));
                    }

                    // Check if domino source has a completion date set
                    if strategy.hardware_available_date.is_none() {
                        warnings.push(format!(
                            "Cluster '{}' domino source '{}' has no hardware availability date set",
                            strategy.target_cluster_name, domino_source
                        ));
                    }
                }
            }
        }
    }

    /// Perform topological sort to generate execution order
    ///
    /// Uses Kahn's algorithm for topological sorting
    fn topological_sort(&self, graph: &HashMap<String, Vec<String>>) -> Vec<String> {
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut result = Vec::new();
        let mut queue = Vec::new();

        // Calculate in-degrees
        for node in graph.keys() {
            in_degree.entry(node.clone()).or_insert(0);
        }

        for neighbors in graph.values() {
            for neighbor in neighbors {
                *in_degree.entry(neighbor.clone()).or_insert(0) += 1;
            }
        }

        // Find nodes with in-degree 0
        for (node, &degree) in &in_degree {
            if degree == 0 {
                queue.push(node.clone());
            }
        }

        // Process queue
        while let Some(node) = queue.pop() {
            result.push(node.clone());

            if let Some(neighbors) = graph.get(&node) {
                for neighbor in neighbors {
                    if let Some(degree) = in_degree.get_mut(neighbor) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push(neighbor.clone());
                        }
                    }
                }
            }
        }

        // Reverse to get proper execution order (dependencies first)
        result.reverse();
        result
    }

    /// Calculate critical path for project timeline
    ///
    /// Returns the longest dependency chain, which determines minimum project duration
    fn calculate_critical_path(
        &self,
        graph: &HashMap<String, Vec<String>>,
        execution_order: &[String],
    ) -> Vec<String> {
        let mut longest_path: Vec<String> = Vec::new();
        let mut path_lengths: HashMap<String, usize> = HashMap::new();
        let mut predecessors: HashMap<String, String> = HashMap::new();

        // Calculate longest path to each node
        for node in execution_order {
            let mut max_length = 0;
            let mut max_predecessor = None;

            if let Some(deps) = graph.get(node) {
                for dep in deps {
                    let dep_length = path_lengths.get(dep).copied().unwrap_or(0);
                    if dep_length + 1 > max_length {
                        max_length = dep_length + 1;
                        max_predecessor = Some(dep.clone());
                    }
                }
            }

            path_lengths.insert(node.clone(), max_length);
            if let Some(pred) = max_predecessor {
                predecessors.insert(node.clone(), pred);
            }
        }

        // Find node with maximum path length
        if let Some((last_node, _)) = path_lengths.iter().max_by_key(|(_, &length)| length) {
            // Backtrack to build critical path
            let mut current = last_node.clone();
            longest_path.push(current.clone());

            while let Some(pred) = predecessors.get(&current) {
                longest_path.push(pred.clone());
                current = pred.clone();
            }

            longest_path.reverse();
        }

        longest_path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use surrealdb::sql::{Id, Thing};

    fn create_test_strategy(
        source_name: &str,
        target_name: &str,
        domino_source: Option<String>,
    ) -> ClusterMigrationPlan {
        let strategy_type = if domino_source.is_some() {
            MigrationStrategyType::DominoHardwareSwap
        } else {
            MigrationStrategyType::NewHardwarePurchase
        };

        let mut plan = ClusterMigrationPlan::new(
            Thing::from(("projects", "test")),
            target_name.to_string(),
            strategy_type.clone(),
            Thing::from(("users", "tester")),
        );

        plan.source_cluster_name = Some(source_name.to_string());
        plan.domino_source_cluster = domino_source;
        plan.strategy_type = strategy_type;

        if plan.strategy_type == MigrationStrategyType::DominoHardwareSwap {
            plan.hardware_available_date = Some(Utc::now());
        }

        plan
    }

    #[test]
    fn test_no_circular_dependencies() {
        let strategies = vec![
            create_test_strategy("DEV-01", "HYPERV-DEV-01", None),
            create_test_strategy("PROD-01", "HYPERV-PROD-01", Some("DEV-01".to_string())),
        ];

        let validator = DependencyValidator::new(strategies);
        let result = validator.validate();

        assert!(result.is_valid);
        assert!(result.circular_dependencies.is_empty());
        assert_eq!(result.execution_order.len(), 2);
    }

    #[test]
    fn test_circular_dependency_detection() {
        let strategies = vec![
            create_test_strategy("CLUSTER-A", "HYPERV-A", Some("CLUSTER-B".to_string())),
            create_test_strategy("CLUSTER-B", "HYPERV-B", Some("CLUSTER-A".to_string())),
        ];

        let validator = DependencyValidator::new(strategies);
        let result = validator.validate();

        assert!(!result.is_valid);
        assert!(!result.circular_dependencies.is_empty());
    }

    #[test]
    fn test_execution_order() {
        let strategies = vec![
            create_test_strategy("DEV-01", "HYPERV-DEV-01", None),
            create_test_strategy("TEST-01", "HYPERV-TEST-01", Some("DEV-01".to_string())),
            create_test_strategy("PROD-01", "HYPERV-PROD-01", Some("TEST-01".to_string())),
        ];

        let validator = DependencyValidator::new(strategies);
        let result = validator.validate();

        assert!(result.is_valid);
        assert_eq!(result.execution_order.len(), 3);

        // DEV-01 should be first, PROD-01 should be last
        assert_eq!(result.execution_order[0], "HYPERV-DEV-01");
        assert_eq!(result.execution_order[2], "HYPERV-PROD-01");
    }

    #[test]
    fn test_critical_path_calculation() {
        let strategies = vec![
            create_test_strategy("DEV-01", "HYPERV-DEV-01", None),
            create_test_strategy("TEST-01", "HYPERV-TEST-01", Some("DEV-01".to_string())),
            create_test_strategy("PROD-01", "HYPERV-PROD-01", Some("TEST-01".to_string())),
            create_test_strategy("QA-01", "HYPERV-QA-01", Some("DEV-01".to_string())),
        ];

        let validator = DependencyValidator::new(strategies);
        let result = validator.validate();

        assert!(result.is_valid);
        assert!(!result.critical_path.is_empty());

        let critical_path_names: Vec<String> = result
            .critical_path
            .iter()
            .map(|thing| match &thing.id {
                Id::String(value) => value.clone(),
                other => other.to_string(),
            })
            .collect();

        // Critical path should be DEV-01 → TEST-01 → PROD-01 (length 3)
        assert_eq!(critical_path_names.len(), 3);
        assert_eq!(critical_path_names[0], "HYPERV-DEV-01");
        assert_eq!(critical_path_names[2], "HYPERV-PROD-01");
    }
}
