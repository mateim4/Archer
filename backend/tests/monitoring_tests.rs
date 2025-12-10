// Archer ITSM - Monitoring & Alerting Module Tests
// Tests for alerts, alert rules, and auto-ticket creation

#[cfg(test)]
mod monitoring_tests {
    use backend::database::{self, Database};
    use backend::middleware::auth::AuthenticatedUser;
    use backend::models::monitoring::{
        AlertCondition, AlertSeverity, AlertStatus, CreateAlertRequest,
    };
    use backend::models::ticket::TicketPriority;
    use backend::services::monitoring_service::MonitoringService;
    use std::sync::Arc;

    // ========================================================================
    // TEST SETUP HELPERS
    // ========================================================================

    async fn setup_test_db() -> Arc<Database> {
        let db = database::new_test()
            .await
            .expect("Failed to create test database");
        Arc::new(db)
    }

    async fn cleanup_monitoring(db: &Database) {
        let _: Result<surrealdb::Response, _> = db.query("DELETE alert").await;
        let _: Result<surrealdb::Response, _> = db.query("DELETE alert_rule").await;
    }

    fn create_test_user() -> AuthenticatedUser {
        AuthenticatedUser {
            user_id: "test-user-1".to_string(),
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
            roles: vec!["admin".to_string()],
            permissions: vec![],
            tenant_id: None,
        }
    }

    fn create_test_alert_request() -> CreateAlertRequest {
        CreateAlertRequest {
            title: "High CPU Usage".to_string(),
            description: "CPU usage has exceeded 90% threshold".to_string(),
            severity: AlertSeverity::High,
            source: "manual".to_string(),
            source_alert_id: None,
            affected_ci_id: None,
            metric_name: Some("cpu_usage".to_string()),
            metric_value: Some(95.5),
            threshold: Some(90.0),
            tags: vec!["cpu".to_string(), "performance".to_string()],
        }
    }

    // ========================================================================
    // ALERT CRUD TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_alert_success() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());
        let user = create_test_user();
        let request = create_test_alert_request();

        let result = service.create_alert(request.clone(), &user).await;

        assert!(result.is_ok());
        let alert = result.unwrap();
        assert_eq!(alert.title, request.title);
        assert_eq!(alert.severity, AlertSeverity::High);
        assert_eq!(alert.status, AlertStatus::Active);
        assert_eq!(alert.metric_value, Some(95.5));
        assert_eq!(alert.threshold, Some(90.0));

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_list_alerts_with_filters() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());
        let user = create_test_user();

        // Create multiple alerts
        let mut request1 = create_test_alert_request();
        request1.severity = AlertSeverity::Critical;
        let _ = service.create_alert(request1, &user).await;

        let mut request2 = create_test_alert_request();
        request2.severity = AlertSeverity::High;
        let _ = service.create_alert(request2, &user).await;

        let mut request3 = create_test_alert_request();
        request3.severity = AlertSeverity::Low;
        let _ = service.create_alert(request3, &user).await;

        // List all alerts
        let result = service
            .list_alerts(None, None, None, None, None, None, 0, 10)
            .await;
        assert!(result.is_ok());
        let (alerts, total) = result.unwrap();
        assert_eq!(alerts.len(), 3);
        assert_eq!(total, 3);

        // Filter by severity
        let result = service
            .list_alerts(
                Some(vec![AlertSeverity::Critical]),
                None,
                None,
                None,
                None,
                None,
                0,
                10,
            )
            .await;
        assert!(result.is_ok());
        let (filtered_alerts, _) = result.unwrap();
        assert_eq!(filtered_alerts.len(), 1);
        assert_eq!(filtered_alerts[0].severity, AlertSeverity::Critical);

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_acknowledge_alert() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());
        let user = create_test_user();
        let request = create_test_alert_request();

        // Create alert
        let alert = service.create_alert(request, &user).await.unwrap();
        let alert_id = alert.id.as_ref().unwrap().to_string();

        // Acknowledge it
        let ack_request = backend::models::monitoring::AcknowledgeAlertRequest {
            acknowledged_by: user.user_id.clone(),
        };
        let result = service.acknowledge_alert(&alert_id, ack_request).await;

        assert!(result.is_ok());
        let updated_alert = result.unwrap();
        assert_eq!(updated_alert.status, AlertStatus::Acknowledged);
        assert!(updated_alert.acknowledged_at.is_some());
        assert_eq!(updated_alert.acknowledged_by, Some(user.user_id));

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_resolve_alert() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());
        let user = create_test_user();
        let request = create_test_alert_request();

        // Create alert
        let alert = service.create_alert(request, &user).await.unwrap();
        let alert_id = alert.id.as_ref().unwrap().to_string();

        // Resolve it
        let resolve_request = backend::models::monitoring::ResolveAlertRequest {
            resolved_by: user.user_id.clone(),
            resolution_note: Some("Issue fixed".to_string()),
        };
        let result = service.resolve_alert(&alert_id, resolve_request).await;

        assert!(result.is_ok());
        let updated_alert = result.unwrap();
        assert_eq!(updated_alert.status, AlertStatus::Resolved);
        assert!(updated_alert.resolved_at.is_some());
        assert_eq!(updated_alert.resolved_by, Some(user.user_id));

        cleanup_monitoring(&db).await;
    }

    // ========================================================================
    // ALERT DEDUPLICATION TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_alert_deduplication() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());
        let user = create_test_user();

        // Create first alert with source_alert_id
        let mut request1 = create_test_alert_request();
        request1.source = "prometheus".to_string();
        request1.source_alert_id = Some("prom-alert-123".to_string());
        let alert1 = service.create_alert(request1.clone(), &user).await.unwrap();

        // Try to create duplicate alert
        let alert2 = service.create_alert(request1.clone(), &user).await.unwrap();

        // Should return the same alert (deduplication)
        assert_eq!(alert1.id, alert2.id);
        assert_eq!(alert1.title, alert2.title);

        cleanup_monitoring(&db).await;
    }

    // ========================================================================
    // SEVERITY TO PRIORITY MAPPING TESTS
    // ========================================================================

    #[test]
    fn test_severity_to_priority_mapping() {
        assert_eq!(
            AlertSeverity::Critical.to_ticket_priority(),
            TicketPriority::P1
        );
        assert_eq!(
            AlertSeverity::High.to_ticket_priority(),
            TicketPriority::P2
        );
        assert_eq!(
            AlertSeverity::Medium.to_ticket_priority(),
            TicketPriority::P3
        );
        assert_eq!(
            AlertSeverity::Low.to_ticket_priority(),
            TicketPriority::P4
        );
        assert_eq!(
            AlertSeverity::Info.to_ticket_priority(),
            TicketPriority::P4
        );
    }

    // ========================================================================
    // ALERT RULE TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_alert_rule() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());

        let result = service
            .create_alert_rule(
                "High CPU Rule".to_string(),
                Some("Alert when CPU > 90%".to_string()),
                "avg(cpu_usage)".to_string(),
                AlertCondition::GreaterThan,
                90.0,
                AlertSeverity::High,
                true,
                None,
                15,
            )
            .await;

        assert!(result.is_ok());
        let rule = result.unwrap();
        assert_eq!(rule.name, "High CPU Rule");
        assert_eq!(rule.threshold, 90.0);
        assert_eq!(rule.severity, AlertSeverity::High);
        assert!(rule.is_active);
        assert!(rule.auto_create_ticket);

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_list_alert_rules() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());

        // Create multiple rules
        let _ = service
            .create_alert_rule(
                "Rule 1".to_string(),
                None,
                "metric1".to_string(),
                AlertCondition::GreaterThan,
                100.0,
                AlertSeverity::Critical,
                false,
                None,
                5,
            )
            .await;

        let _ = service
            .create_alert_rule(
                "Rule 2".to_string(),
                None,
                "metric2".to_string(),
                AlertCondition::LessThan,
                10.0,
                AlertSeverity::Low,
                true,
                None,
                10,
            )
            .await;

        let result = service.list_alert_rules().await;
        assert!(result.is_ok());
        let rules = result.unwrap();
        assert_eq!(rules.len(), 2);

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_update_alert_rule() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());

        // Create rule
        let rule = service
            .create_alert_rule(
                "Original Name".to_string(),
                None,
                "metric".to_string(),
                AlertCondition::GreaterThan,
                50.0,
                AlertSeverity::Medium,
                true,
                None,
                5,
            )
            .await
            .unwrap();

        let rule_id = rule.id.as_ref().unwrap().to_string();

        // Update rule
        let result = service
            .update_alert_rule(
                &rule_id,
                Some("Updated Name".to_string()),
                None,
                None,
                None,
                Some(75.0),
                None,
                None,
                None,
                Some(false),
                None,
            )
            .await;

        assert!(result.is_ok());
        let updated_rule = result.unwrap();
        assert_eq!(updated_rule.name, "Updated Name");
        assert_eq!(updated_rule.threshold, 75.0);
        assert!(!updated_rule.is_active);

        cleanup_monitoring(&db).await;
    }

    #[tokio::test]
    async fn test_delete_alert_rule() {
        let db = setup_test_db().await;
        let service = MonitoringService::new(db.clone());

        // Create rule
        let rule = service
            .create_alert_rule(
                "Rule to Delete".to_string(),
                None,
                "metric".to_string(),
                AlertCondition::GreaterThan,
                100.0,
                AlertSeverity::High,
                false,
                None,
                5,
            )
            .await
            .unwrap();

        let rule_id = rule.id.as_ref().unwrap().to_string();

        // Delete rule
        let result = service.delete_alert_rule(&rule_id).await;
        assert!(result.is_ok());

        // Verify deletion
        let get_result = service.get_alert_rule(&rule_id).await;
        assert!(get_result.is_err());

        cleanup_monitoring(&db).await;
    }

    // ========================================================================
    // ALERT CONDITION EVALUATION TESTS
    // ========================================================================

    #[test]
    fn test_alert_condition_evaluation() {
        // Greater Than
        assert!(AlertCondition::GreaterThan.evaluate(95.0, 90.0));
        assert!(!AlertCondition::GreaterThan.evaluate(85.0, 90.0));

        // Less Than
        assert!(AlertCondition::LessThan.evaluate(5.0, 10.0));
        assert!(!AlertCondition::LessThan.evaluate(15.0, 10.0));

        // Equals
        assert!(AlertCondition::Equals.evaluate(50.0, 50.0));
        assert!(!AlertCondition::Equals.evaluate(50.0, 51.0));

        // Not Equals
        assert!(AlertCondition::NotEquals.evaluate(50.0, 51.0));
        assert!(!AlertCondition::NotEquals.evaluate(50.0, 50.0));
    }
}
