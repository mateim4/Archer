/**
 * AIInsightCard Component
 * 
 * Displays AI-powered insights, suggestions, and predictions.
 * Uses glassmorphic styling with accent border (no background tinting).
 * 
 * Part of Phase 4: AI Integration
 * Features:
 * - Proactive incident predictions
 * - Resource optimization suggestions
 * - Anomaly detection alerts
 * - Trend analysis insights
 * 
 * Design principles:
 * - All colors use CSS variables for theme awareness
 * - No background tinting - only left border accent
 * - Circular confidence indicator for visual clarity
 */

import React, { useState, useEffect } from 'react';
import {
  SparkleRegular,
  LightbulbRegular,
  ArrowTrendingRegular,
  ShieldCheckmarkRegular,
  RocketRegular,
  DismissRegular,
  ChevronRightRegular,
  ThumbLikeRegular,
  ThumbDislikeRegular,
  InfoRegular,
  AlertRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';

export type InsightType = 'prediction' | 'suggestion' | 'anomaly' | 'trend' | 'optimization';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface AIInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  confidence: number; // 0-100
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  metadata?: {
    source?: string;
    relatedItems?: string[];
    timeframe?: string;
    impact?: 'low' | 'medium' | 'high';
  };
  createdAt: string;
}

export interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, helpful: boolean) => void;
  compact?: boolean;
  showConfidence?: boolean;
}

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'prediction':
      return <SparkleRegular />;
    case 'suggestion':
      return <LightbulbRegular />;
    case 'anomaly':
      return <AlertRegular />;
    case 'trend':
      return <ArrowTrendingRegular />;
    case 'optimization':
      return <RocketRegular />;
  }
};

// Severity colors using CSS variables for theme awareness
const getSeverityColor = (severity: InsightSeverity): string => {
  switch (severity) {
    case 'critical': return 'var(--color-error, #ef4444)';
    case 'warning': return 'var(--color-warning, #f59e0b)';
    case 'success': return 'var(--color-success, #10b981)';
    default: return 'var(--brand-primary, #8b5cf6)';
  }
};

const getImpactColor = (impact?: 'low' | 'medium' | 'high'): string | null => {
  switch (impact) {
    case 'high': return 'var(--color-error, #ef4444)';
    case 'medium': return 'var(--color-warning, #f59e0b)';
    case 'low': return 'var(--color-success, #10b981)';
    default: return null;
  }
};

const getImpactLabel = (impact?: 'low' | 'medium' | 'high'): string | null => {
  switch (impact) {
    case 'high': return 'High Impact';
    case 'medium': return 'Medium Impact';
    case 'low': return 'Low Impact';
    default: return null;
  }
};

/**
 * Circular Confidence Indicator
 * Shows confidence as a ring/arc indicator
 */
const ConfidenceRing: React.FC<{ confidence: number; size?: number }> = ({ 
  confidence, 
  size = 44 
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;
  
  // Color based on confidence level
  const getConfidenceColor = () => {
    if (confidence >= 80) return 'var(--color-success, #10b981)';
    if (confidence >= 60) return 'var(--color-warning, #f59e0b)';
    return 'var(--text-muted, #9ca3af)';
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: size, 
        height: size,
        flexShrink: 0,
      }}
      title={`${confidence}% confidence`}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--glass-border, rgba(255,255,255,0.1))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getConfidenceColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {confidence}%
      </div>
    </div>
  );
};

/**
 * Single AI Insight Card
 * - No background tinting, uses glass/card background
 * - Left border accent for severity indication
 * - All colors are theme-aware via CSS variables
 */
export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  onDismiss,
  onFeedback,
  compact = false,
  showConfidence = true,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null);
  const severityColor = getSeverityColor(insight.severity);
  const impactColor = getImpactColor(insight.metadata?.impact);
  const impactLabel = getImpactLabel(insight.metadata?.impact);
  
  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(helpful ? 'helpful' : 'not-helpful');
    onFeedback?.(insight.id, helpful);
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border, rgba(139, 92, 246, 0.15))',
        borderLeft: `4px solid ${severityColor}`,
        padding: compact ? '12px' : '16px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: compact ? '8px' : '12px' }}>
        {/* Icon */}
        <div
          style={{
            width: compact ? '32px' : '40px',
            height: compact ? '32px' : '40px',
            minWidth: compact ? '32px' : '40px',
            borderRadius: '12px',
            background: `color-mix(in srgb, ${severityColor} 15%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: severityColor,
            flexShrink: 0,
          }}
        >
          {getInsightIcon(insight.type)}
        </div>
        
        {/* Title & Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h4
              style={{
                margin: 0,
                fontSize: compact ? '0.875rem' : '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {insight.title}
            </h4>
            {showConfidence && insight.confidence >= 80 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'color-mix(in srgb, var(--color-success, #10b981) 15%, transparent)',
                  color: 'var(--color-success, #10b981)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                <ShieldCheckmarkRegular style={{ fontSize: '12px' }} />
                High Confidence
              </span>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}>
            <span style={{ textTransform: 'capitalize' }}>{insight.type}</span>
            {insight.metadata?.timeframe && (
              <>
                <span>•</span>
                <span>{insight.metadata.timeframe}</span>
              </>
            )}
            {impactLabel && impactColor && (
              <>
                <span>•</span>
                <span style={{ color: impactColor, fontWeight: 500 }}>
                  {impactLabel}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Confidence Ring (shown in header for non-compact) */}
        {showConfidence && !compact && (
          <ConfidenceRing confidence={insight.confidence} size={44} />
        )}
        
        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(insight.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dismiss insight"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--glass-hover-bg, rgba(0,0,0,0.05))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <DismissRegular style={{ fontSize: '16px' }} />
          </button>
        )}
      </div>
      
      {/* Description */}
      <p
        style={{
          margin: 0,
          marginBottom: compact ? '8px' : '16px',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {insight.description}
      </p>
      
      {/* Footer: Action + Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Action Button */}
        {(insight.actionLabel || insight.actionPath) && (
          <button
            onClick={() => {
              if (insight.onAction) insight.onAction();
              else if (insight.actionPath) window.location.href = insight.actionPath;
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: `color-mix(in srgb, ${severityColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: severityColor,
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `color-mix(in srgb, ${severityColor} 25%, transparent)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `color-mix(in srgb, ${severityColor} 15%, transparent)`;
            }}
          >
            {insight.actionLabel || 'View Details'}
            <ChevronRightRegular style={{ fontSize: '14px' }} />
          </button>
        )}
        
        {/* Feedback Buttons */}
        {onFeedback && !feedbackGiven && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Was this helpful?
            </span>
            <button
              onClick={() => handleFeedback(true)}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--glass-hover-bg, rgba(0,0,0,0.05))';
                e.currentTarget.style.borderColor = 'var(--color-success, #10b981)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
              }}
            >
              <ThumbLikeRegular style={{ fontSize: '14px' }} />
              Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              style={{
                background: 'none',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--glass-hover-bg, rgba(0,0,0,0.05))';
                e.currentTarget.style.borderColor = 'var(--color-error, #ef4444)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
              }}
            >
              <ThumbDislikeRegular style={{ fontSize: '14px' }} />
              No
            </button>
          </div>
        )}
        
        {/* Feedback Given Confirmation */}
        {feedbackGiven && (
          <div 
            style={{ 
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-success, #10b981)',
            }}
          >
            <CheckmarkCircleRegular style={{ fontSize: '14px' }} />
            Thanks for your feedback!
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AI Insights Panel - Groups multiple insights
 */
export interface AIInsightsPanelProps {
  insights: AIInsight[];
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, helpful: boolean) => void;
  title?: string;
  maxVisible?: number;
  compact?: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  onDismiss,
  onFeedback,
  title = 'AI Insights',
  maxVisible = 3,
  compact = false,
}) => {
  const [visibleInsights, setVisibleInsights] = useState<AIInsight[]>([]);
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    // Sort by severity and confidence
    const sorted = [...insights].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, success: 2, info: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.confidence - a.confidence;
    });
    
    setVisibleInsights(showAll ? sorted : sorted.slice(0, maxVisible));
  }, [insights, maxVisible, showAll]);
  
  const handleDismiss = (id: string) => {
    setVisibleInsights(prev => prev.filter(i => i.id !== id));
    onDismiss?.(id);
  };
  
  if (insights.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px dashed var(--glass-border, rgba(255,255,255,0.1))',
          textAlign: 'center',
        }}
      >
        <SparkleRegular 
          style={{ 
            fontSize: '32px', 
            color: 'var(--text-muted)',
            marginBottom: '12px',
            display: 'block',
          }} 
        />
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          No AI insights available at the moment.
        </p>
        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Insights will appear as patterns are detected in your data.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SparkleRegular style={{ color: 'var(--brand-primary)', fontSize: '20px' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {title}
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Powered by AI
          </span>
          <InfoRegular style={{ fontSize: '14px', color: 'var(--text-muted)' }} />
        </div>
      </div>
      
      {/* Insights List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {visibleInsights.map(insight => (
          <AIInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismiss}
            onFeedback={onFeedback}
            compact={compact}
          />
        ))}
      </div>
      
      {/* Show More / Less */}
      {insights.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px',
            background: 'none',
            border: '1px dashed var(--glass-border, rgba(255,255,255,0.1))',
            borderRadius: '12px',
            cursor: 'pointer',
            color: 'var(--brand-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: "'Poppins', sans-serif",
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-hover-bg, rgba(0,0,0,0.05))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          {showAll ? `Show Less` : `Show ${insights.length - maxVisible} More Insights`}
        </button>
      )}
    </div>
  );
};

export default AIInsightCard;
