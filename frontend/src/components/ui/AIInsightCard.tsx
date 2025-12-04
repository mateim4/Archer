/**
 * AIInsightCard Component
 * 
 * Displays AI-powered insights, suggestions, and predictions.
 * Uses glassmorphic styling with subtle gradient accents.
 * 
 * Part of Phase 4: AI Integration
 * Features:
 * - Proactive incident predictions
 * - Resource optimization suggestions
 * - Anomaly detection alerts
 * - Trend analysis insights
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
import { DesignTokens } from '../../styles/designSystem';

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

const getSeverityStyles = (severity: InsightSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        borderColor: DesignTokens.colors.error,
        bgColor: `${DesignTokens.colors.error}08`,
        iconColor: DesignTokens.colors.error,
        badgeColor: `${DesignTokens.colors.error}15`,
      };
    case 'warning':
      return {
        borderColor: DesignTokens.colors.warning,
        bgColor: `${DesignTokens.colors.warning}08`,
        iconColor: DesignTokens.colors.warning,
        badgeColor: `${DesignTokens.colors.warning}15`,
      };
    case 'success':
      return {
        borderColor: DesignTokens.colors.success,
        bgColor: `${DesignTokens.colors.success}08`,
        iconColor: DesignTokens.colors.success,
        badgeColor: `${DesignTokens.colors.success}15`,
      };
    default: // info
      return {
        borderColor: DesignTokens.colors.primary,
        bgColor: `${DesignTokens.colors.primary}08`,
        iconColor: DesignTokens.colors.primary,
        badgeColor: `${DesignTokens.colors.primary}15`,
      };
  }
};

const getImpactLabel = (impact?: 'low' | 'medium' | 'high') => {
  switch (impact) {
    case 'high': return { label: 'High Impact', color: DesignTokens.colors.error };
    case 'medium': return { label: 'Medium Impact', color: DesignTokens.colors.warning };
    case 'low': return { label: 'Low Impact', color: DesignTokens.colors.success };
    default: return null;
  }
};

/**
 * Single AI Insight Card
 */
export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  onDismiss,
  onFeedback,
  compact = false,
  showConfidence = true,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null);
  const styles = getSeverityStyles(insight.severity);
  const impactInfo = getImpactLabel(insight.metadata?.impact);
  
  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(helpful ? 'helpful' : 'not-helpful');
    onFeedback?.(insight.id, helpful);
  };

  return (
    <div
      style={{
        position: 'relative',
        background: styles.bgColor,
        backdropFilter: 'blur(12px)',
        borderRadius: DesignTokens.borderRadius.xl,
        border: `1px solid ${styles.borderColor}30`,
        borderLeft: `4px solid ${styles.borderColor}`,
        padding: compact ? DesignTokens.spacing.md : DesignTokens.spacing.lg,
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
            borderRadius: DesignTokens.borderRadius.lg,
            background: styles.badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styles.iconColor,
            flexShrink: 0,
          }}
        >
          {getInsightIcon(insight.type)}
        </div>
        
        {/* Title & Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4
              style={{
                margin: 0,
                fontSize: compact ? DesignTokens.typography.sm : DesignTokens.typography.base,
                fontWeight: DesignTokens.typography.semibold,
                color: DesignTokens.colors.textPrimary,
                fontFamily: DesignTokens.typography.fontFamily,
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
                  borderRadius: DesignTokens.borderRadius.full,
                  background: `${DesignTokens.colors.success}15`,
                  color: DesignTokens.colors.success,
                  fontSize: DesignTokens.typography.xs,
                  fontWeight: DesignTokens.typography.medium,
                }}
              >
                <ShieldCheckmarkRegular style={{ fontSize: '12px' }} />
                High Confidence
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: DesignTokens.typography.xs, color: DesignTokens.colors.textMuted }}>
            <span style={{ textTransform: 'capitalize' }}>{insight.type}</span>
            {insight.metadata?.timeframe && (
              <>
                <span>•</span>
                <span>{insight.metadata.timeframe}</span>
              </>
            )}
            {impactInfo && (
              <>
                <span>•</span>
                <span style={{ color: impactInfo.color, fontWeight: DesignTokens.typography.medium }}>
                  {impactInfo.label}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(insight.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: DesignTokens.colors.textMuted,
              borderRadius: DesignTokens.borderRadius.sm,
              transition: 'all 0.15s ease',
            }}
            title="Dismiss insight"
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
          fontSize: DesignTokens.typography.sm,
          color: DesignTokens.colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {insight.description}
      </p>
      
      {/* Confidence Bar (optional) */}
      {showConfidence && !compact && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: DesignTokens.typography.xs, color: DesignTokens.colors.textMuted }}>
              AI Confidence
            </span>
            <span style={{ fontSize: DesignTokens.typography.xs, fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textSecondary }}>
              {insight.confidence}%
            </span>
          </div>
          <div
            style={{
              height: '4px',
              background: DesignTokens.colors.gray100,
              borderRadius: DesignTokens.borderRadius.full,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${insight.confidence}%`,
                background: insight.confidence >= 80 
                  ? DesignTokens.colors.success 
                  : insight.confidence >= 60 
                    ? DesignTokens.colors.warning 
                    : DesignTokens.colors.textMuted,
                borderRadius: DesignTokens.borderRadius.full,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}
      
      {/* Footer: Action + Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              background: `${styles.borderColor}15`,
              border: `1px solid ${styles.borderColor}30`,
              borderRadius: DesignTokens.borderRadius.md,
              cursor: 'pointer',
              color: styles.iconColor,
              fontSize: DesignTokens.typography.sm,
              fontWeight: DesignTokens.typography.medium,
              fontFamily: DesignTokens.typography.fontFamily,
              transition: 'all 0.15s ease',
            }}
          >
            {insight.actionLabel || 'View Details'}
            <ChevronRightRegular style={{ fontSize: '14px' }} />
          </button>
        )}
        
        {/* Feedback Buttons */}
        {onFeedback && !feedbackGiven && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: DesignTokens.typography.xs, color: DesignTokens.colors.textMuted }}>
              Was this helpful?
            </span>
            <button
              onClick={() => handleFeedback(true)}
              style={{
                background: 'none',
                border: `1px solid ${DesignTokens.colors.gray200}`,
                padding: '4px 8px',
                borderRadius: DesignTokens.borderRadius.sm,
                cursor: 'pointer',
                color: DesignTokens.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: DesignTokens.typography.xs,
              }}
            >
              <ThumbLikeRegular style={{ fontSize: '14px' }} />
              Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              style={{
                background: 'none',
                border: `1px solid ${DesignTokens.colors.gray200}`,
                padding: '4px 8px',
                borderRadius: DesignTokens.borderRadius.sm,
                cursor: 'pointer',
                color: DesignTokens.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: DesignTokens.typography.xs,
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
              fontSize: DesignTokens.typography.xs,
              color: DesignTokens.colors.success,
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
          padding: DesignTokens.spacing.xl,
          background: `${DesignTokens.colors.primary}05`,
          borderRadius: DesignTokens.borderRadius.xl,
          border: `1px dashed ${DesignTokens.colors.gray200}`,
          textAlign: 'center',
        }}
      >
        <SparkleRegular 
          style={{ 
            fontSize: '32px', 
            color: DesignTokens.colors.textMuted,
            marginBottom: '12px',
          }} 
        />
        <p style={{ margin: 0, color: DesignTokens.colors.textSecondary, fontSize: DesignTokens.typography.sm }}>
          No AI insights available at the moment.
        </p>
        <p style={{ margin: '8px 0 0', color: DesignTokens.colors.textMuted, fontSize: DesignTokens.typography.xs }}>
          Insights will appear as patterns are detected in your data.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: DesignTokens.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SparkleRegular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
          <h3
            style={{
              margin: 0,
              fontSize: DesignTokens.typography.lg,
              fontWeight: DesignTokens.typography.semibold,
              color: DesignTokens.colors.textPrimary,
              fontFamily: DesignTokens.typography.fontFamily,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: DesignTokens.borderRadius.full,
              background: `${DesignTokens.colors.primary}15`,
              color: DesignTokens.colors.primary,
              fontSize: DesignTokens.typography.xs,
              fontWeight: DesignTokens.typography.medium,
            }}
          >
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: DesignTokens.typography.xs, color: DesignTokens.colors.textMuted }}>
            Powered by AI
          </span>
          <InfoRegular style={{ fontSize: '14px', color: DesignTokens.colors.textMuted }} />
        </div>
      </div>
      
      {/* Insights List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.md }}>
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
            marginTop: DesignTokens.spacing.md,
            padding: '12px',
            background: 'none',
            border: `1px dashed ${DesignTokens.colors.gray200}`,
            borderRadius: DesignTokens.borderRadius.lg,
            cursor: 'pointer',
            color: DesignTokens.colors.primary,
            fontSize: DesignTokens.typography.sm,
            fontWeight: DesignTokens.typography.medium,
            fontFamily: DesignTokens.typography.fontFamily,
            transition: 'all 0.15s ease',
          }}
        >
          {showAll ? `Show Less` : `Show ${insights.length - maxVisible} More Insights`}
        </button>
      )}
    </div>
  );
};

export default AIInsightCard;
