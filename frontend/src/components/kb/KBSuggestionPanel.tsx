/**
 * KBSuggestionPanel Component
 * 
 * Displays Knowledge Base article suggestions during ticket creation
 * Features:
 * - Compact card view with relevance scores
 * - Expandable article previews
 * - "This solved my problem" action
 * - Purple Glass design system compliance
 */

import React, { useState } from 'react';
import {
  BookmarkRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CheckmarkCircleRegular,
  EyeRegular,
  ThumbLikeRegular,
  DocumentTextRegular,
} from '@fluentui/react-icons';
import { PurpleGlassCard, PurpleGlassButton } from '../ui';
import { ArticleSuggestion } from '../../utils/apiClient';
import { DesignTokens } from '../../styles/designSystem';

interface KBSuggestionPanelProps {
  suggestions: ArticleSuggestion[];
  loading?: boolean;
  onArticleClick?: (articleId: string) => void;
  onSolvedProblem?: (articleId: string) => void;
  showSolvedButton?: boolean;
}

export const KBSuggestionPanel: React.FC<KBSuggestionPanelProps> = ({
  suggestions,
  loading = false,
  onArticleClick,
  onSolvedProblem,
  showSolvedButton = true,
}) => {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  if (loading) {
    return (
      <PurpleGlassCard style={{ padding: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          color: DesignTokens.colors.textSecondary,
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${DesignTokens.colors.primary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Searching knowledge base...
        </div>
      </PurpleGlassCard>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <PurpleGlassCard style={{ padding: '0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${DesignTokens.colors.surfaceBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <BookmarkRegular style={{ color: DesignTokens.colors.primary, fontSize: '20px' }} />
        <div>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: DesignTokens.colors.textPrimary,
          }}>
            Suggested Knowledge Articles
          </div>
          <div style={{ 
            fontSize: '12px',
            color: DesignTokens.colors.textSecondary,
          }}>
            {suggestions.length} article{suggestions.length !== 1 ? 's' : ''} found that might help
          </div>
        </div>
      </div>

      {/* Suggestion List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.article_id}
            suggestion={suggestion}
            expanded={expandedArticle === suggestion.article_id}
            onToggleExpand={() => setExpandedArticle(
              expandedArticle === suggestion.article_id ? null : suggestion.article_id
            )}
            onViewArticle={() => onArticleClick?.(suggestion.article_id)}
            onSolvedProblem={showSolvedButton ? () => onSolvedProblem?.(suggestion.article_id) : undefined}
          />
        ))}
      </div>
    </PurpleGlassCard>
  );
};

interface SuggestionCardProps {
  suggestion: ArticleSuggestion;
  expanded: boolean;
  onToggleExpand: () => void;
  onViewArticle: () => void;
  onSolvedProblem?: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  expanded,
  onToggleExpand,
  onViewArticle,
  onSolvedProblem,
}) => {
  const relevanceColor = 
    suggestion.relevance_score >= 0.7 ? DesignTokens.colors.success :
    suggestion.relevance_score >= 0.4 ? DesignTokens.colors.warning :
    DesignTokens.colors.textSecondary;

  return (
    <div
      style={{
        borderBottom: `1px solid ${DesignTokens.colors.surfaceBorder}`,
        padding: '16px',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = DesignTokens.colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Title and Relevance */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
        onClick={onToggleExpand}
      >
        <div style={{ flex: 1, marginRight: '12px' }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: 600,
            color: DesignTokens.colors.textPrimary,
            lineHeight: '1.4',
          }}>
            {suggestion.title}
          </h4>
          {suggestion.summary && (
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '12px',
              color: DesignTokens.colors.textSecondary,
              lineHeight: '1.4',
            }}>
              {suggestion.summary}
            </p>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: `${relevanceColor}22`,
            color: relevanceColor,
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {Math.round(suggestion.relevance_score * 100)}% match
          </div>
          {expanded ? (
            <ChevronUpRegular style={{ fontSize: '16px', color: DesignTokens.colors.textSecondary }} />
          ) : (
            <ChevronDownRegular style={{ fontSize: '16px', color: DesignTokens.colors.textSecondary }} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: DesignTokens.colors.textSecondary,
        marginBottom: expanded ? '12px' : '0',
      }}>
        {suggestion.resolution_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckmarkCircleRegular style={{ fontSize: '14px' }} />
            <span>Resolved {suggestion.resolution_count} ticket{suggestion.resolution_count !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ThumbLikeRegular style={{ fontSize: '14px' }} />
          <span>{suggestion.helpful_count} helpful</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <EyeRegular style={{ fontSize: '14px' }} />
          <span>{suggestion.view_count} views</span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ marginTop: '12px' }}>
          {/* Excerpt */}
          <div style={{
            padding: '12px',
            backgroundColor: DesignTokens.colors.surface,
            borderRadius: '6px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '13px',
              color: DesignTokens.colors.textPrimary,
              lineHeight: '1.6',
            }}>
              {suggestion.excerpt}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <PurpleGlassButton
              onClick={(e) => {
                e.stopPropagation();
                onViewArticle();
              }}
              style={{ flex: 1, fontSize: '13px' }}
            >
              <DocumentTextRegular style={{ fontSize: '16px' }} />
              View Full Article
            </PurpleGlassButton>
            {onSolvedProblem && (
              <PurpleGlassButton
                onClick={(e) => {
                  e.stopPropagation();
                  onSolvedProblem();
                }}
                variant="primary"
                style={{ flex: 1, fontSize: '13px' }}
              >
                <CheckmarkCircleRegular style={{ fontSize: '16px' }} />
                This Solved My Problem
              </PurpleGlassButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KBSuggestionPanel;
