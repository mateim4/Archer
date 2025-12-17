/**
 * Ticket Query Hooks - TanStack Query
 * 
 * Provides queries and mutations for Service Desk tickets.
 * 
 * @example
 * ```tsx
 * // In a component
 * const { data: tickets, isLoading } = useTickets();
 * const { data: ticket } = useTicket(ticketId);
 * const createTicket = useCreateTicket();
 * 
 * // Create a ticket
 * createTicket.mutate({ title: 'New ticket', ... });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type TicketFilters } from './queryKeys';
import { staleTimes } from './queryClient';
import { 
  apiClient, 
  type Ticket, 
  type CreateTicketRequest,
  type TicketComment,
  type TicketAttachment,
} from '@/utils/apiClient';

// =============================================================================
// TICKET QUERIES
// =============================================================================

/**
 * Fetch all tickets with optional filters
 */
export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async () => {
      const response = await apiClient.getTickets();
      return Array.isArray(response) ? response : [];
    },
    staleTime: staleTimes.tickets,
    // Provide empty array as placeholder while loading
    placeholderData: [],
  });
}

/**
 * Fetch a single ticket by ID
 */
export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId ?? ''),
    queryFn: () => apiClient.getTicket(ticketId!),
    enabled: !!ticketId,
    staleTime: staleTimes.tickets,
  });
}

/**
 * Fetch ticket comments
 */
export function useTicketComments(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.comments(ticketId ?? ''),
    queryFn: async () => {
      const response = await apiClient.getTicketComments(ticketId!);
      return response?.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: staleTimes.tickets,
    placeholderData: [],
  });
}

/**
 * Fetch ticket attachments
 */
export function useTicketAttachments(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.attachments(ticketId ?? ''),
    queryFn: async () => {
      const response = await apiClient.getTicketAttachments(ticketId!);
      return response?.data ?? [];
    },
    enabled: !!ticketId,
    staleTime: staleTimes.tickets,
    placeholderData: [],
  });
}

/**
 * Fetch ticket relationships
 */
export function useTicketRelationships(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tickets.relationships(ticketId ?? ''),
    queryFn: () => apiClient.getTicketRelationships(ticketId!),
    enabled: !!ticketId,
    staleTime: staleTimes.tickets,
  });
}

// =============================================================================
// TICKET MUTATIONS
// =============================================================================

/**
 * Create a new ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ticket: CreateTicketRequest) => apiClient.createTicket(ticket),
    onSuccess: () => {
      // Invalidate ticket list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

/**
 * Update a ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) => 
      apiClient.updateTicket(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both the specific ticket and the list
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

/**
 * Add a comment to a ticket
 */
export function useAddTicketComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, content, isInternal = false }: { 
      ticketId: string; 
      content: string; 
      isInternal?: boolean;
    }) => apiClient.addTicketComment(ticketId, { content, is_internal: isInternal }),
    onSuccess: (_, { ticketId }) => {
      // Invalidate comments to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.comments(ticketId) });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteTicketComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, commentId }: { ticketId: string; commentId: string }) => 
      apiClient.deleteTicketComment(ticketId, commentId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.comments(ticketId) });
    },
  });
}

/**
 * Upload an attachment
 */
export function useUploadTicketAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, file }: { ticketId: string; file: File }) => 
      apiClient.uploadTicketAttachment(ticketId, file),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.attachments(ticketId) });
    },
  });
}

/**
 * Delete an attachment
 */
export function useDeleteTicketAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, attachmentId }: { ticketId: string; attachmentId: string }) => 
      apiClient.deleteTicketAttachment(ticketId, attachmentId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.attachments(ticketId) });
    },
  });
}

/**
 * Delete a ticket relationship
 */
export function useDeleteTicketRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, relationshipId }: { ticketId: string; relationshipId: string }) => 
      apiClient.deleteTicketRelationship(ticketId, relationshipId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.relationships(ticketId) });
    },
  });
}
