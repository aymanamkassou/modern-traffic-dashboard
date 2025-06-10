import { useEffect, useRef, useState, useCallback } from 'react';
import { sseManager } from '@/lib/sse-connection-manager';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
  id?: string;
}

export interface SSEState {
  isConnected: boolean;
  events: SSEEvent[];
  error: string | null;
  connectionCount: number;
}

export interface UseSSEOptions {
  maxEvents?: number;
  autoConnect?: boolean;
  retryInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onEvent?: (event: SSEEvent) => void;
}

export function useServerSentEvents(
  url: string | null, 
  options: UseSSEOptions = {}
) {
  const {
    maxEvents = 100,
    autoConnect = false,
    onConnect,
    onDisconnect,
    onError,
    onEvent
  } = options;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    events: [],
    error: null,
    connectionCount: 0
  });

  const subscriberIdRef = useRef<string>(`sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  
  // Use refs to store callbacks to avoid recreating connect function when they change
  const callbacksRef = useRef({
    onConnect,
    onDisconnect,
    onError,
    onEvent
  });

  // Update callback refs when they change
  useEffect(() => {
    callbacksRef.current = {
      onConnect,
      onDisconnect,
      onError,
      onEvent
    };
  }, [onConnect, onDisconnect, onError, onEvent]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    if (isMountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        error: null
      }));
    }
  }, []);

  const connect = useCallback(() => {
    // Prevent SSR issues
    if (typeof window === 'undefined' || !url) {
      return;
    }
    
    // Disconnect existing connection
    disconnect();

    console.log(`🔌 SSE Hook: Connecting to ${url}`, { subscriberId: subscriberIdRef.current });

    try {
      const unsubscribe = sseManager.subscribe(url, {
        id: subscriberIdRef.current,
        onConnect: () => {
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              error: null,
              connectionCount: prev.connectionCount + 1
            }));
            callbacksRef.current.onConnect?.();
          }
        },
        onDisconnect: () => {
          if (isMountedRef.current) {
            setState(prev => ({ 
              ...prev, 
              isConnected: false 
            }));
            callbacksRef.current.onDisconnect?.();
          }
        },
        onError: (error) => {
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              isConnected: false,
              error: error.message
            }));
            callbacksRef.current.onError?.(error);
          }
        },
        onEvent: (event) => {
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              events: [...prev.events.slice(-(maxEvents - 1)), event]
            }));
            callbacksRef.current.onEvent?.(event);
          }
        }
      });

      unsubscribeRef.current = unsubscribe;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create SSE connection';
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: errorMsg,
          isConnected: false
        }));
        callbacksRef.current.onError?.(new Error(errorMsg));
      }
    }
  }, [url, maxEvents, disconnect]);

  const clearEvents = useCallback(() => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, events: [] }));
    }
  }, []);

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, error: null }));
    }
  }, []);

  // Auto-connect effect - only run on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && autoConnect && url) {
      // Small delay to prevent SSR hydration issues
      const timer = setTimeout(() => {
        connect();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoConnect, url, connect]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    clearEvents,
    clearError,
    isSupported: typeof EventSource !== 'undefined'
  };
} 