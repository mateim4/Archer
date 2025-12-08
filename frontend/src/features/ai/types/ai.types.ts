/**
 * AI Feature Types
 * 
 * Type definitions for AI-related functionality in Archer.
 * All AI code is isolated in features/ai/ to maintain separation
 * from core application logic.
 */

/** Available AI feature flags */
export type AIFeatureFlag =
  | 'ticket-suggestions'
  | 'similar-tickets'
  | 'smart-search'
  | 'anomaly-detection'
  | 'librarian-chat'
  | 'rca-generation'
  | 'monitoring-actions'
  | 'asset-classification'
  | 'risk-assessment';

/** AI Engine health status */
export interface AIHealthStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  version: string;
  provider: string;
  lastCheck: Date;
}

/** AI Context state */
export interface AIState {
  /** Whether AI features are enabled in config */
  isEnabled: boolean;
  /** Whether AI Engine is currently healthy */
  isHealthy: boolean;
  /** Current health status details */
  healthStatus: AIHealthStatus | null;
  /** Which features are enabled */
  enabledFeatures: Set<AIFeatureFlag>;
  /** Loading state for initial health check */
  isLoading: boolean;
  /** Error message if health check failed */
  error: string | null;
}

/** Chat message for Librarian */
export interface LibrarianMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: LibrarianSource[];
}

/** Source citation from RAG */
export interface LibrarianSource {
  id: string;
  title: string;
  type: 'runbook' | 'kb' | 'ticket' | 'wiki' | 'document';
  snippet: string;
  relevance: number;
  url?: string;
}

/** Ticket suggestion response */
export interface TicketSuggestion {
  category?: string;
  subcategory?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignmentGroup?: string;
  confidence: number;
  reasoning?: string;
}

/** Similar ticket for display */
export interface SimilarTicket {
  id: string;
  title: string;
  status: string;
  resolution?: string;
  similarity: number;
  createdAt: Date;
}

/** Monitoring action suggestion */
export interface MonitoringAction {
  id: string;
  type: 'investigate-before' | 'correlate' | 'compare-baseline' | 'check-dependencies';
  label: string;
  icon: string;
  parameters: Record<string, unknown>;
}

/** Root cause analysis result */
export interface RootCauseAnalysis {
  summary: string;
  probableCauses: Array<{
    cause: string;
    confidence: number;
    evidence: string[];
  }>;
  suggestedActions: string[];
  relatedAlerts: string[];
  generatedAt: Date;
}

/** AI insights for dashboard */
export interface AIInsight {
  id: string;
  type: 'recommendation' | 'anomaly' | 'trend' | 'warning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
}
