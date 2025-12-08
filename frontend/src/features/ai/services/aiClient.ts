/**
 * AI Engine API Client
 * 
 * Handles communication with the Archer AI Engine (Python sidecar).
 * This is the only place that directly calls the AI Engine API.
 */

import type { 
  AIHealthStatus, 
  LibrarianMessage, 
  TicketSuggestion, 
  SimilarTicket,
  RootCauseAnalysis,
  AIInsight 
} from '../types/ai.types';

/** AI Engine base URL from environment */
const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

/** Standard fetch options with timeout */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * AI Engine API Client
 */
export const aiClient = {
  /**
   * Check AI Engine health status
   */
  async checkHealth(): Promise<AIHealthStatus> {
    try {
      const response = await fetchWithTimeout(`${AI_ENGINE_URL}/health/ready`, {}, 5000);
      
      if (!response.ok) {
        return {
          status: 'unavailable',
          version: 'unknown',
          provider: 'unknown',
          lastCheck: new Date(),
        };
      }
      
      const data = await response.json();
      return {
        status: data.status === 'ready' ? 'healthy' : 'degraded',
        version: data.version || '0.1.0',
        provider: data.provider || 'unknown',
        lastCheck: new Date(),
      };
    } catch (error) {
      console.warn('[AI Client] Health check failed:', error);
      return {
        status: 'unavailable',
        version: 'unknown',
        provider: 'unknown',
        lastCheck: new Date(),
      };
    }
  },

  /**
   * Get available LLM providers
   */
  async getProviders(): Promise<{ providers: string[]; primaryProvider: string }> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/models/providers`);
    if (!response.ok) throw new Error('Failed to fetch providers');
    return response.json();
  },

  /**
   * Send a message to the Librarian (RAG-powered Q&A)
   */
  async askLibrarian(
    message: string, 
    conversationHistory: LibrarianMessage[] = [],
    context?: { pageType?: string; pageId?: string }
  ): Promise<LibrarianMessage> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: conversationHistory.map(m => ({ role: m.role, content: m.content })),
        context,
      }),
    }, 30000); // 30s timeout for chat
    
    if (!response.ok) throw new Error('Librarian request failed');
    
    const data = await response.json();
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
      sources: data.sources || [],
    };
  },

  /**
   * Get ticket category/priority suggestions
   */
  async suggestTicketCategory(
    title: string, 
    description: string
  ): Promise<TicketSuggestion> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/tickets/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    }, 15000);
    
    if (!response.ok) throw new Error('Suggestion request failed');
    return response.json();
  },

  /**
   * Find similar tickets
   */
  async findSimilarTickets(
    description: string, 
    limit = 5
  ): Promise<SimilarTicket[]> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/tickets/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, limit }),
    }, 15000);
    
    if (!response.ok) throw new Error('Similar tickets request failed');
    return response.json();
  },

  /**
   * Generate root cause analysis for an alert
   */
  async generateRCA(
    alertId: string,
    alertData: Record<string, unknown>
  ): Promise<RootCauseAnalysis> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/monitoring/rca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, alertData }),
    }, 30000);
    
    if (!response.ok) throw new Error('RCA generation failed');
    return response.json();
  },

  /**
   * Get correlated alerts
   */
  async getCorrelatedAlerts(
    alertId: string,
    timeWindowMinutes = 15
  ): Promise<Array<{ id: string; title: string; correlation: number }>> {
    const response = await fetchWithTimeout(
      `${AI_ENGINE_URL}/api/monitoring/correlate?alertId=${alertId}&windowMinutes=${timeWindowMinutes}`
    );
    
    if (!response.ok) throw new Error('Correlation request failed');
    return response.json();
  },

  /**
   * Get AI insights for dashboard
   */
  async getInsights(limit = 5): Promise<AIInsight[]> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/insights?limit=${limit}`);
    
    if (!response.ok) throw new Error('Insights request failed');
    return response.json();
  },

  /**
   * Semantic search across the knowledge base
   */
  async semanticSearch(
    query: string, 
    filters?: { type?: string; dateRange?: { from: Date; to: Date } }
  ): Promise<Array<{ id: string; title: string; snippet: string; score: number; type: string }>> {
    const response = await fetchWithTimeout(`${AI_ENGINE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters }),
    }, 15000);
    
    if (!response.ok) throw new Error('Search request failed');
    return response.json();
  },
};

export default aiClient;
