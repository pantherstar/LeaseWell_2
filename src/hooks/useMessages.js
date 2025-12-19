import { useState, useEffect, useCallback } from 'react';
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  subscribeToMessages
} from '../services/supabase/database.service';
import { isSupabaseConfigured } from '../services/supabase/client';

/**
 * Hook for managing messages
 * @param {Object} filters - Optional filters { leaseId, unreadOnly }
 * @returns {Object} { messages, unreadCount, loading, error, refetch, send, markAsRead }
 */
export const useMessages = (filters = {}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Return empty array if Supabase is not configured
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await getMessages(filters);

    if (fetchError) {
      setError(fetchError.message);
      setMessages([]);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription if Supabase is configured
    if (isSupabaseConfigured()) {
      const subscription = subscribeToMessages(() => {
        // Refetch when new messages arrive
        fetchMessages();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchMessages]);

  const send = async (messageData) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: sendError } = await sendMessage(messageData);

    if (sendError) {
      return { success: false, error: sendError.message };
    }

    // Refresh messages after sending
    await fetchMessages();
    return { success: true, data };
  };

  const markAsRead = async (messageId) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error: markError } = await markMessageAsRead(messageId);

    if (markError) {
      return { success: false, error: markError.message };
    }

    // Update local state without full refetch
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: true, read_at: new Date().toISOString() } : msg
      )
    );

    return { success: true, data };
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  return {
    messages,
    unreadCount,
    loading,
    error,
    refetch: fetchMessages,
    send,
    markAsRead
  };
};

/**
 * Hook for managing message threads grouped by conversation
 * @returns {Object} { threads, loading, error }
 */
export const useMessageThreads = () => {
  const { messages, loading, error } = useMessages();
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    // Group messages by sender/recipient pairs
    const threadMap = new Map();

    messages.forEach(message => {
      const key = [message.sender_id, message.recipient_id].sort().join('-');

      if (!threadMap.has(key)) {
        threadMap.set(key, {
          id: key,
          participants: [message.sender, message.recipient],
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }

      const thread = threadMap.get(key);
      thread.messages.push(message);

      if (!thread.lastMessage || new Date(message.created_at) > new Date(thread.lastMessage.created_at)) {
        thread.lastMessage = message;
      }

      if (!message.read) {
        thread.unreadCount += 1;
      }
    });

    // Convert map to array and sort by last message time
    const threadsArray = Array.from(threadMap.values()).sort((a, b) => {
      const aTime = new Date(a.lastMessage?.created_at || 0);
      const bTime = new Date(b.lastMessage?.created_at || 0);
      return bTime - aTime;
    });

    setThreads(threadsArray);
  }, [messages]);

  return {
    threads,
    loading,
    error
  };
};
