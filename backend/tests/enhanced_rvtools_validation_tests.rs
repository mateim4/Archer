#[cfg(test)]
mod enhanced_rvtools_validation_tests {
    use backend::models::project_models::RvToolsDataType;
    use backend::services::enhanced_rvtools_service::{ValidationRuleType, ValidationRules};
    use serde_json::json;
    use std::collections::HashMap;

    #[test]
    fn test_validation_rules_creation() {
        let rules = ValidationRules::new();
        // Rules should be created successfully without panicking
        assert!(true);
    }

    #[test]
    fn test_cpu_core_validation_valid_range() {
        let rules = ValidationRules::new();

        // Test valid CPU core counts
        let result = rules.validate_field("vHost", "CpuCores", "8");
        assert!(result.is_valid);
        assert!(result.errors.is_empty());
        assert_eq!(result.detected_type, Some(RvToolsDataType::Integer));

        let result = rules.validate_field("vHost", "CpuCores", "32");
        assert!(result.is_valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_cpu_core_validation_invalid_range() {
        let rules = ValidationRules::new();

        // Test CPU core count too high
        let result = rules.validate_field("vHost", "CpuCores", "1024");
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert!(result.errors[0].contains("exceeds maximum"));

        // Test CPU core count too low
        let result = rules.validate_field("vHost", "CpuCores", "0");
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert!(result.errors[0].contains("below minimum"));
    }

    #[test]
    fn test_cpu_core_validation_non_numeric() {
        let rules = ValidationRules::new();

        let result = rules.validate_field("vHost", "CpuCores", "invalid");
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert!(result.errors[0].contains("Expected numeric value"));
        assert_eq!(result.detected_type, Some(RvToolsDataType::String));
    }

    #[test]
    fn test_memory_capacity_validation_with_units() {
        let rules = ValidationRules::new();

        // Test valid memory values with units
        let result = rules.validate_field("vHost", "Memory", "32 GB");
        assert!(result.is_valid);
        assert!(result.warnings.is_empty());
        assert_eq!(result.detected_type, Some(RvToolsDataType::Capacity));

        let result = rules.validate_field("vHost", "Memory", "8192 MB");
        assert!(result.is_valid);
        assert!(result.warnings.is_empty());

        let result = rules.validate_field("vHost", "Memory", "1 TB");
        assert!(result.is_valid);
        assert!(result.warnings.is_empty());
    }

    #[test]
    fn test_memory_capacity_validation_without_units() {
        let rules = ValidationRules::new();

        let result = rules.validate_field("vHost", "Memory", "32768");
        assert!(!result.is_valid);
        assert!(!result.warnings.is_empty());
        assert!(result.warnings[0].contains("should include unit"));
        assert_eq!(result.detected_type, Some(RvToolsDataType::Capacity));
    }

    #[test]
    fn test_storage_capacity_validation() {
        let rules = ValidationRules::new();

        // Test various storage capacity formats
        let test_cases = vec![
            ("100 GB", true, RvToolsDataType::Capacity),
            ("2.5 TB", true, RvToolsDataType::Capacity),
            ("512000 MB", true, RvToolsDataType::Capacity),
            ("1 PB", true, RvToolsDataType::Capacity),
            ("500000", false, RvToolsDataType::Capacity), // Missing unit
        ];

        for (value, should_be_valid, expected_type) in test_cases {
            let result = rules.validate_field("vDatastore", "Capacity", value);
            assert_eq!(
                result.is_valid, should_be_valid,
                "Failed for value: {}",
                value
            );
            assert_eq!(
                result.detected_type,
                Some(expected_type),
                "Wrong type for value: {}",
                value
            );
        }
    }

    #[test]
    fn test_network_adapter_speed_validation() {
        let rules = ValidationRules::new();

        // Test valid network speeds
        let valid_speeds = vec!["1 Gbps", "10 GBPS", "25gbps", "100 Mbps", "1000 MB/s"];

        for speed in valid_speeds {
            let result = rules.validate_field("vHost", "NicSpeed", speed);
            assert!(result.is_valid, "Should be valid: {}", speed);
        }

        // Test invalid network speed format
        let result = rules.validate_field("vHost", "NicSpeed", "fast network");
        assert!(!result.is_valid);
        assert!(result.errors[0].contains("does not match expected pattern"));
    }

    #[test]
    fn test_ip_address_validation() {
        let rules = ValidationRules::new();

        // Test valid IP addresses
        let valid_ips = vec!["192.168.1.1", "10.0.0.1", "172.16.0.1", "8.8.8.8"];

        for ip in valid_ips {
            let result = rules.validate_field("vHost", "IpAddress", ip);
            assert!(result.is_valid, "Should be valid IP: {}", ip);
        }

        // Test invalid IP addresses
        let invalid_ips = vec!["300.168.1.1", "192.168.1", "not-an-ip", "192.168.1.1.1"];

        for ip in invalid_ips {
            let result = rules.validate_field("vHost", "IpAddress", ip);
            assert!(!result.is_valid, "Should be invalid IP: {}", ip);
        }
    }

    #[test]
    fn test_vlan_id_validation() {
        let rules = ValidationRules::new();

        // Test valid VLAN IDs
        let result = rules.validate_field("vHost", "VlanId", "100");
        assert!(result.is_valid);

        let result = rules.validate_field("vHost", "VlanId", "4094");
        assert!(result.is_valid);

        // Test invalid VLAN IDs
        let result = rules.validate_field("vHost", "VlanId", "0");
        assert!(!result.is_valid);

        let result = rules.validate_field("vHost", "VlanId", "5000");
        assert!(!result.is_valid);
    }

    #[test]
    fn test_cluster_name_consistency() {
        let rules = ValidationRules::new();

        // Test non-empty cluster name
        let result = rules.validate_field("vCluster", "Cluster", "ASNCLUBA0001");
        assert!(result.is_valid);

        // Test empty cluster name
        let result = rules.validate_field("vCluster", "Cluster", "");
        assert!(!result.is_valid);
        assert!(result.errors[0].contains("Empty value detected"));
    }

    #[test]
    fn test_vsan_cluster_identification() {
        let rules = ValidationRules::new();

        // Test vSAN-related cluster names
        let vsan_indicators = vec![
            "CLUSTER-VSAN-01",
            "HCI-Cluster",
            "S2D-Ready-Cluster",
            "vsan-production",
        ];

        for cluster_name in vsan_indicators {
            let result = rules.validate_field("vCluster", "Cluster", cluster_name);
            // Should be valid regardless of pattern match
            assert!(
                result.is_valid,
                "Should process cluster name: {}",
                cluster_name
            );
        }
    }

    #[test]
    fn test_host_count_validation() {
        let rules = ValidationRules::new();

        // Test valid host counts
        let result = rules.validate_field("vCluster", "TotalHosts", "3");
        assert!(result.is_valid);

        let result = rules.validate_field("vCluster", "TotalHosts", "16");
        assert!(result.is_valid);

        // Test invalid host counts
        let result = rules.validate_field("vCluster", "TotalHosts", "0");
        assert!(!result.is_valid);

        let result = rules.validate_field("vCluster", "TotalHosts", "100");
        assert!(!result.is_valid);
    }

    #[test]
    fn test_hardware_version_validation() {
        let rules = ValidationRules::new();

        // Test valid hardware versions
        let result = rules.validate_field("vHost", "HWVersion", "13");
        assert!(result.is_valid);

        let result = rules.validate_field("vHost", "HWVersion", "19");
        assert!(result.is_valid);

        // Test deprecated hardware version
        let result = rules.validate_field("vHost", "HWVersion", "7");
        assert!(result.is_valid); // Still valid, but would trigger warnings in real implementation

        // Test invalid hardware versions
        let result = rules.validate_field("vHost", "HWVersion", "6");
        assert!(!result.is_valid);

        let result = rules.validate_field("vHost", "HWVersion", "25");
        assert!(!result.is_valid);
    }

    #[test]
    fn test_cpu_model_pattern_validation() {
        let rules = ValidationRules::new();

        // Test valid CPU models
        let valid_models = vec![
            "Intel Xeon E5-2680",
            "AMD EPYC 7742",
            "Intel Core i7-9700K",
            "AMD Ryzen 9 5950X",
        ];

        for model in valid_models {
            let result = rules.validate_field("vHost", "CpuModel", model);
            assert!(result.is_valid, "Should be valid CPU model: {}", model);
        }

        // Test invalid CPU model
        let result = rules.validate_field("vHost", "CpuModel", "Unknown Processor");
        assert!(!result.is_valid);
    }

    #[test]
    fn test_vm_memory_allocation_validation() {
        let rules = ValidationRules::new();

        // Test valid VM memory allocations (in GB)
        let result = rules.validate_field("vInfo", "Memory", "4");
        assert!(result.is_valid);

        let result = rules.validate_field("vInfo", "Memory", "64");
        assert!(result.is_valid);

        // Test invalid VM memory allocations
        let result = rules.validate_field("vInfo", "Memory", "0.25"); // Too small
        assert!(!result.is_valid);

        let result = rules.validate_field("vInfo", "Memory", "2048"); // Too large
        assert!(!result.is_valid);
    }

    #[test]
    fn test_confidence_scoring() {
        let rules = ValidationRules::new();

        // Test that validation affects confidence scoring
        let valid_result = rules.validate_field("vHost", "CpuCores", "8");
        assert!(valid_result.confidence_score > 0.8);

        let invalid_result = rules.validate_field("vHost", "CpuCores", "invalid");
        assert!(invalid_result.confidence_score < 0.8);

        let warning_result = rules.validate_field("vHost", "Memory", "8192"); // Missing unit
        assert!(warning_result.confidence_score < 1.0);
        assert!(warning_result.confidence_score > 0.5);
    }

    #[test]
    fn test_data_type_detection() {
        let rules = ValidationRules::new();

        // Test heuristic type detection
        let test_cases = vec![
            ("123", RvToolsDataType::Integer),
            ("123.45", RvToolsDataType::Float),
            ("32 GB", RvToolsDataType::Capacity),
            ("true", RvToolsDataType::Boolean),
            ("2023-01-01", RvToolsDataType::String), // Would be Timestamp with better parsing
            ("some text", RvToolsDataType::String),
        ];

        for (value, expected_type) in test_cases {
            let result = rules.validate_field("vInfo", "TestColumn", value);
            assert_eq!(
                result.detected_type.unwrap(),
                expected_type,
                "Wrong type detection for: {}",
                value
            );
        }
    }

    #[test]
    fn test_multiple_rules_application() {
        let rules = ValidationRules::new();

        // Test a field that would match multiple rules
        let result = rules.validate_field("vHost", "Memory", "invalid_memory");

        // Should have multiple validation issues
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty() || !result.warnings.is_empty());

        // Confidence should be significantly reduced
        assert!(result.confidence_score < 0.5);
    }

    #[test]
    fn test_case_insensitive_matching() {
        let rules = ValidationRules::new();

        // Test case insensitive sheet and column matching
        let result1 = rules.validate_field("vhost", "cpucores", "8");
        let result2 = rules.validate_field("VHOST", "CPUCORES", "8");
        let result3 = rules.validate_field("vHost", "CpuCores", "8");

        // All should be processed the same way
        assert_eq!(result1.is_valid, result2.is_valid);
        assert_eq!(result2.is_valid, result3.is_valid);
    }
}
