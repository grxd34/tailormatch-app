import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { messagesAPI } from '../services/api';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { markMessagesAsRead, isMessageRead, getReadMessages } from '../hooks/useUnreadMessages';
import toast from 'react-hot-toast';

interface ChatProps {
  requestId: number;
  tailorName?: string;
  customerName?: string;
}

const Chat: React.FC<ChatProps> = ({ requestId, tailorName, customerName }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markAllMessagesAsRead = () => {
    // Get all message IDs that are not from the current user
    const unreadMessageIds = messages
      .filter(msg => msg.sender.id !== user?.id)
      .map(msg => msg.id.toString());
    
    if (unreadMessageIds.length > 0) {
      // Mark messages as read in localStorage
      markMessagesAsRead(unreadMessageIds);
      
      // Update local state to reflect read status
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
      
      // Invalidate unread message counts
      queryClient.invalidateQueries('unread-message-counts');
    }
  };

  // Mark messages as read immediately when chat is opened
  useEffect(() => {
    // Mark all messages for this request as read in localStorage
    const markRequestMessagesAsRead = () => {
      try {
        const readMessages = getReadMessages();
        // Get all message IDs from the current messages state
        const currentMessageIds = messages
          .filter(msg => msg.sender.id !== user?.id)
          .map(msg => msg.id.toString());
        
        // Mark them as read
        currentMessageIds.forEach(id => readMessages.add(id));
        localStorage.setItem('readMessages', JSON.stringify(Array.from(readMessages)));
        
        // Invalidate unread message counts to refresh indicators
        queryClient.invalidateQueries('unread-message-counts');
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    markRequestMessagesAsRead();
  }, [requestId, user?.id, queryClient]);

  // Fetch existing messages
  const { data: existingMessages, isLoading } = useQuery(
    ['messages', requestId],
    () => messagesAPI.getByRequest(requestId),
    {
      onSuccess: (data) => {
        setMessages(data);
        // Mark all messages as read when chat is opened
        markAllMessagesAsRead();
      }
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (message: string) => messagesAPI.send(requestId, message),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', requestId]);
        setNewMessage('');
      },
      onError: (error: any) => {
        toast.error('Failed to send message');
        console.error('Send message error:', error);
      }
    }
  );

  // WebSocket for real-time messaging
  const { sendMessage: sendWebSocketMessage, sendTyping, isConnected, typingUsers } = useChatWebSocket(
    requestId,
    (chatMessage) => {
      console.log('Received new chat message:', chatMessage);
      // Convert ChatMessage to Message format
      const message: Message = {
        id: chatMessage.id,
        sender: {
          id: chatMessage.sender.id,
          username: chatMessage.sender.email, // Use email as username fallback
          email: chatMessage.sender.email,
          name: chatMessage.sender.name,
          phone: '', // Not available in chat message
          location_lat: null,
          location_lng: null,
          profile_photo: null,
          is_tailor: false, // Will be determined by context
          created_at: ''
        },
        message: chatMessage.message,
        created_at: chatMessage.created_at,
        is_read: chatMessage.sender.id === user?.id || isMessageRead(chatMessage.id),
        read_at: chatMessage.sender.id === user?.id ? chatMessage.created_at : undefined
      };
      
      // Add new message to the list
      setMessages(prev => [...prev, message]);
      
      // If this is a message from someone else, invalidate unread message counts
      if (message.sender.id !== user?.id) {
        queryClient.invalidateQueries('unread-message-counts');
        // Dispatch global event for other components
        window.dispatchEvent(new CustomEvent('newMessage'));
      }
    },
    (indicator) => {
      // Handle typing indicators
      console.log(`${indicator.user} is ${indicator.is_typing ? 'typing' : 'not typing'}`);
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Send via WebSocket for real-time delivery (if connected)
    if (isConnected) {
      sendWebSocketMessage(newMessage);
    }
    
    // Always send via API for persistence
    sendMessageMutation.mutate(newMessage);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Chat</h3>
          <p className="text-sm text-gray-600">
            {user?.is_tailor ? `Customer: ${customerName}` : `Tailor: ${tailorName}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {!isConnected && (
            <span className="text-xs text-orange-500">
              (Messages will be sent via API)
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(dateMessages[0].created_at)}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isOwnMessage = message.sender.id === user?.id;
              const showAvatar = index === 0 || dateMessages[index - 1].sender.id !== message.sender.id;
              const isRead = isOwnMessage || isMessageRead(message.id);
              
              return (
                <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {!isOwnMessage && showAvatar && (
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                        {message.sender.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8 mr-2"></div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        } ${!isRead && !isOwnMessage ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs">
                            {isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                        {!isOwnMessage && !isRead && (
                          <span className="text-xs text-blue-600 font-medium">NEW</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={isConnected ? "Type a message..." : "Connecting to chat..."}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={false}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
