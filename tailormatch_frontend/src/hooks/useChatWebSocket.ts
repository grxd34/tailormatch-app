import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Message } from '../types';

interface ChatMessage {
  id: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  message: string;
  created_at: string;
}

interface TypingIndicator {
  user: string;
  is_typing: boolean;
}

interface ChatWebSocketMessage {
  type: 'chat_message' | 'typing';
  message?: ChatMessage;
  user?: string;
  is_typing?: boolean;
}

export const useChatWebSocket = (requestId: number, onMessage?: (message: ChatMessage) => void, onTyping?: (indicator: TypingIndicator) => void) => {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !requestId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${requestId}/`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Chat WebSocket connected to:', wsUrl);
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data: ChatWebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'chat_message' && data.message) {
          onMessage?.(data.message);
        } else if (data.type === 'typing' && data.user !== undefined) {
          const indicator: TypingIndicator = {
            user: data.user,
            is_typing: data.is_typing || false
          };
          onTyping?.(indicator);
          
          // Update typing users list
          setTypingUsers(prev => {
            if (indicator.is_typing) {
              return prev.includes(indicator.user) ? prev : [...prev, indicator.user];
            } else {
              return prev.filter(user => user !== indicator.user);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing chat WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('Chat WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setTypingUsers([]);
    };

    wsRef.current.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      console.error('Failed to connect to:', wsUrl);
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, requestId, onMessage, onTyping]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: message
      }));
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }));
    }
  };

  return { 
    sendMessage, 
    sendTyping, 
    isConnected, 
    typingUsers 
  };
};
