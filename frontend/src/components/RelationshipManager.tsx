/**
 * RelationshipManager Component
 * 
 * Modal for creating and managing ticket relationships.
 * Allows searching for tickets and selecting relationship types.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  DismissRegular,
  SearchRegular,
  AddRegular,
} from '@fluentui/react-icons';
import { PurpleGlassButton, PurpleGlassInput, PurpleGlassDropdown } from './ui';
import { apiClient, type TicketRelationType, type Ticket } from '../utils/apiClient';
import { RelationshipBadge } from './RelationshipBadge';

interface RelationshipManagerProps {
  ticketId: string;
  ticketTitle: string;
  onClose: () => void;
  onRelationshipCreated: () => void;
}

const relationshipOptions: { value: TicketRelationType; label: string; description: string }[] = [
  { value: 'PARENT_OF', label: 'Parent of', description: 'This ticket is parent of the selected ticket' },
  { value: 'CHILD_OF', label: 'Child of', description: 'This ticket is child of the selected ticket' },
  { value: 'DUPLICATE_OF', label: 'Duplicate of', description: 'This ticket is a duplicate (will be closed)' },
  { value: 'RELATED_TO', label: 'Related to', description: 'General relationship between tickets' },
  { value: 'BLOCKED_BY', label: 'Blocked by', description: 'This ticket is blocked by the selected ticket' },
  { value: 'BLOCKS', label: 'Blocks', description: 'This ticket blocks the selected ticket' },
  { value: 'CAUSED_BY', label: 'Caused by', description: 'This ticket was caused by the selected ticket' },
];

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  ticketId,
  ticketTitle,
  onClose,
  onRelationshipCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [relationshipType, setRelationshipType] = useState<TicketRelationType>('RELATED_TO');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for tickets
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const response = await apiClient.getTickets();
      const results = response.filter((ticket: Ticket) => 
        ticket.id !== ticketId && 
        (ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         ticket.id.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      setError('Failed to search tickets');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, ticketId]);

  // Auto-search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleCreateRelationship = useCallback(async () => {
    if (!selectedTicket) return;

    setIsCreating(true);
    setError(null);
    try {
      await apiClient.createRelationship(ticketId, {
        target_ticket_id: selectedTicket.id,
        relationship_type: relationshipType,
        notes: notes.trim() || undefined,
      });
      onRelationshipCreated();
      onClose();
    } catch (err) {
      setError('Failed to create relationship');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }, [selectedTicket, ticketId, relationshipType, notes, onRelationshipCreated, onClose]);

  // Modal backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalBackdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    backdropFilter: 'var(--backdrop-filter)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  };

  const searchResultStyle: React.CSSProperties = {
    padding: '12px',
    background: 'var(--btn-secondary-bg)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginBottom: '8px',
  };

  return (
    <div style={modalBackdropStyle} onClick={handleBackdropClick}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>
              Add Relationship
            </h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Link {ticketTitle} to another ticket
            </p>
          </div>
          <PurpleGlassButton variant="ghost" onClick={onClose} style={{ padding: '8px' }}>
            <DismissRegular style={{ fontSize: '20px' }} />
          </PurpleGlassButton>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Search Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
            Search for ticket
          </label>
          <div style={{ position: 'relative' }}>
            <PurpleGlassInput
              placeholder="Enter ticket ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <SearchRegular style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '16px',
            }} />
          </div>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Searching...
          </div>
        )}

        {searchResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
              Select ticket
            </label>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {searchResults.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    ...searchResultStyle,
                    background: selectedTicket?.id === ticket.id ? 'var(--brand-primary-light)' : 'var(--btn-secondary-bg)',
                    border: selectedTicket?.id === ticket.id ? '2px solid var(--brand-primary)' : 'none',
                  }}
                  onClick={() => setSelectedTicket(ticket)}
                  onMouseEnter={(e) => {
                    if (selectedTicket?.id !== ticket.id) {
                      e.currentTarget.style.background = 'var(--btn-secondary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTicket?.id !== ticket.id) {
                      e.currentTarget.style.background = 'var(--btn-secondary-bg)';
                    }
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {ticket.id}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                    {ticket.title}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 6px',
                      background: 'var(--card-bg)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}>
                      {ticket.priority}
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      background: 'var(--card-bg)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Type Selection */}
        {selectedTicket && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                Relationship type
              </label>
              <PurpleGlassDropdown
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as TicketRelationType)}
              >
                {relationshipOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </PurpleGlassDropdown>
              <div style={{ marginTop: '8px', padding: '8px' }}>
                <RelationshipBadge type={relationshipType} />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                Notes (optional)
              </label>
              <PurpleGlassInput
                placeholder="Add notes about this relationship..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <PurpleGlassButton variant="ghost" onClick={onClose}>
                Cancel
              </PurpleGlassButton>
              <PurpleGlassButton 
                onClick={handleCreateRelationship}
                disabled={isCreating}
              >
                <AddRegular style={{ marginRight: '8px' }} />
                {isCreating ? 'Creating...' : 'Create Relationship'}
              </PurpleGlassButton>
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedTicket && searchResults.length === 0 && !isSearching && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <SearchRegular style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p>Search for a ticket to create a relationship</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipManager;
