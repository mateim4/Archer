use crate::models::*;
use crate::Result;

/// Forecasting engine for capacity planning
pub struct ForecastingEngine;

impl ForecastingEngine {
    /// Generate forecast based on historical data and growth parameters
    pub fn generate_forecast(
        historical_data: &[VsphereEnvironment],
        forecast_params: &ForecastParameters,
    ) -> Result<ForecastResult> {
        if historical_data.len() < 2 {
            return Self::generate_simple_forecast(
                historical_data.first().unwrap(),
                forecast_params,
            );
        }

        // Sort historical data by timestamp
        let mut sorted_data = historical_data.to_vec();
        sorted_data.sort_by_key(|env| env.parsed_at);

        // Extract time series data
        let time_series = Self::extract_time_series(&sorted_data);

        // Apply trend analysis
        let trends = Self::calculate_trends(&time_series)?;

        // Generate projections
        let projections = Self::project_future_values(&trends, forecast_params)?;

        Ok(ForecastResult {
            historical_trends: trends,
            projections,
            confidence_level: Self::calculate_confidence_level(&time_series) as f32,
            methodology: "Linear Regression with Exponential Smoothing".to_string(),
            generated_at: chrono::Utc::now(),
        })
    }

    /// Generate simple forecast based on growth factor when historical data is limited
    fn generate_simple_forecast(
        current_environment: &VsphereEnvironment,
        forecast_params: &ForecastParameters,
    ) -> Result<ForecastResult> {
        let current_metrics = &current_environment.summary_metrics;
        let growth_factor = 1.0 + (forecast_params.annual_growth_percent / 100.0);
        let years = forecast_params.forecast_horizon_months as f64 / 12.0;
        
        let compound_growth = growth_factor.powf(years);

        let projected_metrics = EnvironmentSummary {
            total_vcpus: (current_metrics.total_vcpus as f64 * compound_growth) as u32,
            total_pcores: current_metrics.total_pcores, // Physical cores don't grow
            total_provisioned_memory_gb: current_metrics.total_provisioned_memory_gb * compound_growth,
            total_consumed_memory_gb: current_metrics.total_consumed_memory_gb * compound_growth,
            total_provisioned_storage_gb: current_metrics.total_provisioned_storage_gb * compound_growth,
            total_consumed_storage_gb: current_metrics.total_consumed_storage_gb * compound_growth,
            overall_vcpu_pcpu_ratio: current_metrics.overall_vcpu_pcpu_ratio * compound_growth as f32,
            health_issues: Vec::new(),
        };

        Ok(ForecastResult {
            historical_trends: ResourceTrends {
                vcpu_trend: TrendData {
                    slope: current_metrics.total_vcpus as f64 * (growth_factor - 1.0) / 12.0,
                    r_squared: 0.8, // Assumed confidence for growth-based forecast
                    data_points: vec![DataPoint {
                        timestamp: current_environment.parsed_at,
                        value: current_metrics.total_vcpus as f64,
                    }],
                },
                memory_trend: TrendData {
                    slope: current_metrics.total_provisioned_memory_gb * (growth_factor - 1.0) / 12.0,
                    r_squared: 0.8,
                    data_points: vec![DataPoint {
                        timestamp: current_environment.parsed_at,
                        value: current_metrics.total_provisioned_memory_gb,
                    }],
                },
                storage_trend: TrendData {
                    slope: current_metrics.total_consumed_storage_gb * (growth_factor - 1.0) / 12.0,
                    r_squared: 0.8,
                    data_points: vec![DataPoint {
                        timestamp: current_environment.parsed_at,
                        value: current_metrics.total_consumed_storage_gb,
                    }],
                },
                vm_count_trend: TrendData {
                    slope: current_environment.total_vms as f64 * (growth_factor - 1.0) / 12.0,
                    r_squared: 0.8,
                    data_points: vec![DataPoint {
                        timestamp: current_environment.parsed_at,
                        value: current_environment.total_vms as f64,
                    }],
                },
            },
            projections: ResourceProjections {
                target_date: current_environment.parsed_at + chrono::Duration::days(
                    (forecast_params.forecast_horizon_months * 30) as i64
                ),
                projected_metrics: projected_metrics.clone(),
                confidence_intervals: ConfidenceIntervals {
                    vcpu_range: (
                        projected_metrics.total_vcpus as f64 * 0.9,
                        projected_metrics.total_vcpus as f64 * 1.1,
                    ),
                    memory_range: (
                        projected_metrics.total_provisioned_memory_gb * 0.9,
                        projected_metrics.total_provisioned_memory_gb * 1.1,
                    ),
                    storage_range: (
                        projected_metrics.total_consumed_storage_gb * 0.9,
                        projected_metrics.total_consumed_storage_gb * 1.1,
                    ),
                },
            },
            confidence_level: 80.0,
            methodology: "Simple Compound Growth".to_string(),
            generated_at: chrono::Utc::now(),
        })
    }

    /// Extract time series data from historical environments
    fn extract_time_series(environments: &[VsphereEnvironment]) -> TimeSeries {
        let mut vcpu_data = Vec::new();
        let mut memory_data = Vec::new();
        let mut storage_data = Vec::new();
        let mut vm_count_data = Vec::new();

        for env in environments {
            let timestamp = env.parsed_at;
            let metrics = &env.summary_metrics;

            vcpu_data.push(DataPoint {
                timestamp,
                value: metrics.total_vcpus as f64,
            });

            memory_data.push(DataPoint {
                timestamp,
                value: metrics.total_provisioned_memory_gb,
            });

            storage_data.push(DataPoint {
                timestamp,
                value: metrics.total_consumed_storage_gb,
            });

            vm_count_data.push(DataPoint {
                timestamp,
                value: env.total_vms as f64,
            });
        }

        TimeSeries {
            vcpu_data,
            memory_data,
            storage_data,
            vm_count_data,
        }
    }

    /// Calculate trends using linear regression
    fn calculate_trends(time_series: &TimeSeries) -> Result<ResourceTrends> {
        Ok(ResourceTrends {
            vcpu_trend: Self::calculate_linear_trend(&time_series.vcpu_data)?,
            memory_trend: Self::calculate_linear_trend(&time_series.memory_data)?,
            storage_trend: Self::calculate_linear_trend(&time_series.storage_data)?,
            vm_count_trend: Self::calculate_linear_trend(&time_series.vm_count_data)?,
        })
    }

    /// Calculate linear trend for a data series
    fn calculate_linear_trend(data_points: &[DataPoint]) -> Result<TrendData> {
        if data_points.len() < 2 {
            return Err(crate::CoreEngineError::calculation("Need at least 2 data points for trend analysis"));
        }

        // Convert timestamps to numeric values (days since first data point)
        let base_time = data_points[0].timestamp;
        let x_values: Vec<f64> = data_points
            .iter()
            .map(|dp| (dp.timestamp - base_time).num_days() as f64)
            .collect();
        
        let y_values: Vec<f64> = data_points.iter().map(|dp| dp.value).collect();

        // Calculate linear regression
        let n = x_values.len() as f64;
        let sum_x: f64 = x_values.iter().sum();
        let sum_y: f64 = y_values.iter().sum();
        let sum_xy: f64 = x_values.iter().zip(&y_values).map(|(x, y)| x * y).sum();
        let sum_xx: f64 = x_values.iter().map(|x| x * x).sum();
        let _sum_yy: f64 = y_values.iter().map(|y| y * y).sum();

        let slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        
        // Calculate R-squared
        let mean_y = sum_y / n;
        let ss_tot: f64 = y_values.iter().map(|y| (y - mean_y).powi(2)).sum();
        let ss_res: f64 = x_values
            .iter()
            .zip(&y_values)
            .map(|(x, y)| {
                let predicted = slope * x + (sum_y - slope * sum_x) / n;
                (y - predicted).powi(2)
            })
            .sum();
        
        let r_squared = if ss_tot > 0.0 { 1.0 - (ss_res / ss_tot) } else { 0.0 };

        Ok(TrendData {
            slope, // This is per day, we'll convert to per month in projections
            r_squared: r_squared.max(0.0).min(1.0),
            data_points: data_points.to_vec(),
        })
    }

    /// Project future values based on trends
    fn project_future_values(
        trends: &ResourceTrends,
        forecast_params: &ForecastParameters,
    ) -> Result<ResourceProjections> {
        let months_ahead = forecast_params.forecast_horizon_months as f64;
        let days_ahead = months_ahead * 30.0; // Approximate days per month

        // Get the last data point as baseline
        let base_vcpu = trends.vcpu_trend.data_points.last().unwrap().value;
        let base_memory = trends.memory_trend.data_points.last().unwrap().value;
        let base_storage = trends.storage_trend.data_points.last().unwrap().value;
        let base_vm_count = trends.vm_count_trend.data_points.last().unwrap().value;

        // Project values using trend slopes
        let projected_vcpu = (base_vcpu + trends.vcpu_trend.slope * days_ahead).max(base_vcpu) as u32;
        let projected_memory = (base_memory + trends.memory_trend.slope * days_ahead).max(base_memory);
        let projected_storage = (base_storage + trends.storage_trend.slope * days_ahead).max(base_storage);
        let _projected_vm_count = (base_vm_count + trends.vm_count_trend.slope * days_ahead).max(base_vm_count) as usize;

        // Apply business growth factor if specified
        let growth_multiplier = 1.0 + (forecast_params.annual_growth_percent / 100.0 * months_ahead / 12.0);
        
        let final_vcpu = (projected_vcpu as f64 * growth_multiplier) as u32;
        let final_memory = projected_memory * growth_multiplier;
        let final_storage = projected_storage * growth_multiplier;

        let target_date = trends.vcpu_trend.data_points.last().unwrap().timestamp
            + chrono::Duration::days(days_ahead as i64);

        // Calculate confidence intervals based on R-squared values
        let confidence_factor = Self::calculate_confidence_factor(trends);

        Ok(ResourceProjections {
            target_date,
            projected_metrics: EnvironmentSummary {
                total_vcpus: final_vcpu,
                total_pcores: 0, // Will be calculated separately
                total_provisioned_memory_gb: final_memory,
                total_consumed_memory_gb: final_memory * 0.8, // Estimate
                total_provisioned_storage_gb: final_storage * 1.2, // Account for provisioning overhead
                total_consumed_storage_gb: final_storage,
                overall_vcpu_pcpu_ratio: 0.0, // Will be calculated during sizing
                health_issues: Vec::new(),
            },
            confidence_intervals: ConfidenceIntervals {
                vcpu_range: (
                    final_vcpu as f64 * (1.0 - confidence_factor),
                    final_vcpu as f64 * (1.0 + confidence_factor),
                ),
                memory_range: (
                    final_memory * (1.0 - confidence_factor),
                    final_memory * (1.0 + confidence_factor),
                ),
                storage_range: (
                    final_storage * (1.0 - confidence_factor),
                    final_storage * (1.0 + confidence_factor),
                ),
            },
        })
    }

    /// Calculate confidence factor based on trend quality
    fn calculate_confidence_factor(trends: &ResourceTrends) -> f64 {
        let avg_r_squared = (trends.vcpu_trend.r_squared + trends.memory_trend.r_squared + trends.storage_trend.r_squared) / 3.0;
        
        // Higher R-squared means lower uncertainty
        let uncertainty = 1.0 - avg_r_squared;
        (uncertainty * 0.5).max(0.1).min(0.4) // Confidence interval of 10-40%
    }

    /// Calculate overall confidence level
    fn calculate_confidence_level(time_series: &TimeSeries) -> f64 {
        let data_point_count = time_series.vcpu_data.len();
        
        // More data points increase confidence
        let base_confidence: f64 = match data_point_count {
            1 => 60.0,
            2..=3 => 70.0,
            4..=6 => 80.0,
            7..=12 => 90.0,
            _ => 95.0,
        };

        // Adjust based on data consistency (simplified)
        let time_span_days = if data_point_count > 1 {
            (time_series.vcpu_data.last().unwrap().timestamp - time_series.vcpu_data.first().unwrap().timestamp).num_days()
        } else {
            0
        };

        let time_span_bonus: f64 = if time_span_days > 90 { 5.0 } else if time_span_days > 30 { 2.0 } else { 0.0 };

        (base_confidence + time_span_bonus).min(98.0_f64)
    }
}

// Forecasting data structures
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ForecastParameters {
    pub forecast_horizon_months: u32,
    pub annual_growth_percent: f64,
    pub confidence_level: f32,
    pub include_seasonality: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ForecastResult {
    pub historical_trends: ResourceTrends,
    pub projections: ResourceProjections,
    pub confidence_level: f32,
    pub methodology: String,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimeSeries {
    pub vcpu_data: Vec<DataPoint>,
    pub memory_data: Vec<DataPoint>,
    pub storage_data: Vec<DataPoint>,
    pub vm_count_data: Vec<DataPoint>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DataPoint {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub value: f64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ResourceTrends {
    pub vcpu_trend: TrendData,
    pub memory_trend: TrendData,
    pub storage_trend: TrendData,
    pub vm_count_trend: TrendData,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TrendData {
    pub slope: f64, // Rate of change per day
    pub r_squared: f64, // Goodness of fit (0-1)
    pub data_points: Vec<DataPoint>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ResourceProjections {
    pub target_date: chrono::DateTime<chrono::Utc>,
    pub projected_metrics: EnvironmentSummary,
    pub confidence_intervals: ConfidenceIntervals,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConfidenceIntervals {
    pub vcpu_range: (f64, f64),
    pub memory_range: (f64, f64),
    pub storage_range: (f64, f64),
}

impl Default for ForecastParameters {
    fn default() -> Self {
        Self {
            forecast_horizon_months: 36,
            annual_growth_percent: 15.0,
            confidence_level: 80.0,
            include_seasonality: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_linear_trend_calculation() {
        let data_points = vec![
            DataPoint {
                timestamp: chrono::Utc.ymd_opt(2023, 1, 1).unwrap().and_hms_opt(0, 0, 0).unwrap(),
                value: 100.0,
            },
            DataPoint {
                timestamp: chrono::Utc.ymd_opt(2023, 2, 1).unwrap().and_hms_opt(0, 0, 0).unwrap(),
                value: 110.0,
            },
            DataPoint {
                timestamp: chrono::Utc.ymd_opt(2023, 3, 1).unwrap().and_hms_opt(0, 0, 0).unwrap(),
                value: 120.0,
            },
        ];

        let trend = ForecastingEngine::calculate_linear_trend(&data_points).unwrap();
        
        assert!(trend.slope > 0.0); // Should be positive growth
        assert!(trend.r_squared > 0.9); // Should be a good fit for linear data
    }

    #[test]
    fn test_forecast_parameters_default() {
        let params = ForecastParameters::default();
        assert_eq!(params.forecast_horizon_months, 36);
        assert_eq!(params.annual_growth_percent, 15.0);
    }
}
