/**
 * KBSuggestionsForTicket Component
 * 
 * Loads and displays Knowledge Base article suggestions for a specific ticket.
 * Wrapper around KBSuggestionPanel that handles loading from API.
 * 
 * Part of Phase 1: Ticket Enhancements - KB Integration (TASK-007)
 */

import React, { useState, useEffect } from 'react';
import { KBSuggestionPanel } from './KBSuggestionPanel';
import { apiClient, type ArticleSuggestion } from '../../utils/apiClient';

export interface KBSuggestionsForTicketProps {
  /** Ticket ID */
  ticketId: string;
  
  /** Ticket title for matching */
  ticketTitle: string;
  
  /** Ticket description for matching */
  ticketDescription?: string;
  
  /** Category hint for better matching */
  category?: string;
  
  /** Max number of suggestions (default: 5) */
  maxSuggestions?: number;
  
  /** Callback when article is clicked */
  onArticleClick?: (articleId: string) => void;
  
  /** Callback when "solved my problem" is clicked */
  onSolvedProblem?: (articleId: string) => void;
}

export const KBSuggestionsForTicket: React.FC<KBSuggestionsForTicketProps> = ({
  ticketId,
  ticketTitle,
  ticketDescription,
  category,
  maxSuggestions = 5,
  onArticleClick,
  onSolvedProblem,
}) => {
  const [suggestions, setSuggestions] = useState<ArticleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!ticketTitle) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = await apiClient.suggestKBArticles({
          title: ticketTitle,
          description: ticketDescription,
          category,
          limit: maxSuggestions,
        });
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to load KB suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [ticketId, ticketTitle, ticketDescription, category, maxSuggestions]);

  const handleArticleClick = (articleId: string) => {
    // Open in new tab
    window.open(`/app/knowledge/article/${articleId}`, '_blank');
    
    // Notify parent
    if (onArticleClick) {
      onArticleClick(articleId);
    }
  };

  const handleSolvedProblem = async (articleId: string) => {
    try {
      // Link the article to the ticket as resolution
      await apiClient.linkArticleToTicket(ticketId, {
        article_id: articleId,
        was_helpful: true,
      });
      
      // Notify parent
      if (onSolvedProblem) {
        onSolvedProblem(articleId);
      }
    } catch (error) {
      console.error('Failed to link article:', error);
      alert('Failed to link article to ticket');
    }
  };

  return (
    <KBSuggestionPanel
      suggestions={suggestions}
      loading={loading}
      onArticleClick={handleArticleClick}
      onSolvedProblem={handleSolvedProblem}
      showSolvedButton={true}
    />
  );
};

export default KBSuggestionsForTicket;
