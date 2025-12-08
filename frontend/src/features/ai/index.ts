/**
 * AI Features Module
 * 
 * This module contains ALL AI-related functionality for Archer.
 * Import from this module rather than directly from subfolders.
 * 
 * @example
 * import { AIFeatureGate, useAI, AIBadge } from '@/features/ai';
 */

// Components
export { AIContextProvider, useAI } from './components/AIContextProvider';
export { AIFeatureGate, withAIFeature } from './components/AIFeatureGate';
export { AIBadge } from './components/AIBadge';
export { AIActionButtons } from './components/AIActionButtons';
export { AILoadingState } from './components/AILoadingState';

// Services
export { aiClient } from './services/aiClient';

// Types
export type {
  AIFeatureFlag,
  AIHealthStatus,
  AIState,
  LibrarianMessage,
  LibrarianSource,
  TicketSuggestion,
  SimilarTicket,
  MonitoringAction,
  RootCauseAnalysis,
  AIInsight,
} from './types/ai.types';
