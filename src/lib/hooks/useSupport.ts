import { useState, useEffect } from 'react';
import { SupportTicket, FAQ } from '../types';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('category')
        .order('order');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Failed to fetch FAQs');
    }
  };

  // Fetch support tickets
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Create new support ticket
  const createTicket = async (subject: string, message: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([
          {
            subject,
            message,
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      setTickets(prev => [data[0], ...prev]);
      toast.success('Support ticket created successfully');
      return data[0];
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
      throw error;
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select();

      if (error) throw error;

      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status, updated_at: new Date().toISOString() } : ticket
        )
      );

      toast.success('Ticket status updated');
      return data[0];
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket status');
      throw error;
    }
  };

  // Get tickets by status
  const getTicketsByStatus = (status: SupportTicket['status']) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  // Get FAQs by category
  const getFaqsByCategory = (category: string) => {
    return faqs.filter(faq => faq.category === category);
  };

  // Initialize data
  useEffect(() => {
    fetchFaqs();
    fetchTickets();
  }, []);

  return {
    tickets,
    faqs,
    loading,
    error,
    createTicket,
    updateTicketStatus,
    getTicketsByStatus,
    getFaqsByCategory,
    fetchTickets,
    fetchFaqs
  };
} 