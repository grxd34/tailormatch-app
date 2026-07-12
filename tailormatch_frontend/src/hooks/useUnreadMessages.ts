import { useQuery, useQueryClient } from 'react-query';
import { requestsAPI, messagesAPI, tailorAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

// Helper functions for localStorage
const getReadMessages = (): Set<string> => {
  try {
    const stored = localStorage.getItem('readMessages');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markMessagesAsRead = (messageIds: string[]) => {
  try {
    const readMessages = getReadMessages();
    messageIds.forEach(id => readMessages.add(id));
    localStorage.setItem('readMessages', JSON.stringify(Array.from(readMessages)));
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
};

const isMessageRead = (messageId: number): boolean => {
  const readMessages = getReadMessages();
  return readMessages.has(messageId.toString());
};

interface UnreadMessageCount {
  requestId: number;
  count: number;
  hasUnread: boolean;
}

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use different API endpoints based on user type
  const { data: requests } = useQuery(
    user?.is_tailor ? 'tailor-requests' : 'my-requests',
    user?.is_tailor ? tailorAPI.getRequests : requestsAPI.getMy,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Listen for new message events
  useEffect(() => {
    const handleNewMessage = () => {
      console.log('New message event received, invalidating unread counts');
      queryClient.invalidateQueries('unread-message-counts');
    };

    window.addEventListener('newMessage', handleNewMessage);
    return () => window.removeEventListener('newMessage', handleNewMessage);
  }, [queryClient]);

  const { data: unreadCounts, isLoading } = useQuery(
    'unread-message-counts',
    async () => {
      console.log('Fetching unread counts for user:', user?.is_tailor ? 'tailor' : 'customer');
      console.log('Requests:', requests);
      if (!requests) return [];
      
      const counts: UnreadMessageCount[] = [];
      
      for (const request of requests) {
        try {
          // Get messages for this request
          const messages = await messagesAPI.getByRequest(request.id);
          
          // Count only unread messages (messages not sent by current user and not read in localStorage)
          // For tailors: count messages from customers
          // For customers: count messages from tailors
          const unreadCount = messages.filter(message => 
            message.sender.id !== user?.id && !isMessageRead(message.id)
          ).length;
          
          console.log(`Request ${request.id}: ${unreadCount} unread messages out of ${messages.length} total`);
          
          counts.push({
            requestId: request.id,
            count: unreadCount,
            hasUnread: unreadCount > 0
          });
        } catch (error) {
          console.error(`Failed to get messages for request ${request.id}:`, error);
          counts.push({
            requestId: request.id,
            count: 0,
            hasUnread: false
          });
        }
      }
      
      return counts;
    },
    {
      enabled: !!requests,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const totalUnreadCount = unreadCounts?.reduce((sum, item) => sum + item.count, 0) || 0;
  const hasAnyUnread = unreadCounts?.some(item => item.hasUnread) || false;
  
  console.log('Total unread count:', totalUnreadCount, 'Has any unread:', hasAnyUnread);

  const refreshUnreadCounts = () => {
    queryClient.invalidateQueries('unread-message-counts');
  };

  return {
    unreadCounts: unreadCounts || [],
    totalUnreadCount,
    hasAnyUnread,
    isLoading,
    refreshUnreadCounts
  };
};

// Export helper functions for use in Chat component
export { markMessagesAsRead, isMessageRead, getReadMessages };
