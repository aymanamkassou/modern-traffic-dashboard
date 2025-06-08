import { useEffect, useRef, useState, useCallback } from 'react';

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
    retryInterval = 5000,
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

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isConnected: false,
      error: null
    }));
    
    callbacksRef.current.onDisconnect?.();
  }, []);

  const connect = useCallback(() => {
    if (!url) return;
    
    // Disconnect inline to avoid circular dependency
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          connectionCount: prev.connectionCount + 1
        }));
        callbacksRef.current.onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: parsedData.type || 'message',
            data: parsedData.data || parsedData,
            timestamp: parsedData.timestamp || new Date().toISOString(),
            id: event.lastEventId || undefined
          };

          setState(prev => ({
            ...prev,
            events: [...prev.events.slice(-(maxEvents - 1)), sseEvent]
          }));

          callbacksRef.current.onEvent?.(sseEvent);
        } catch (parseError) {
          console.error('Failed to parse SSE event:', parseError);
          const errorEvent: SSEEvent = {
            type: 'parse_error',
            data: { originalData: event.data, error: parseError },
            timestamp: new Date().toISOString()
          };
          
          setState(prev => ({
            ...prev,
            events: [...prev.events.slice(-(maxEvents - 1)), errorEvent]
          }));
        }
      };

      eventSource.onerror = (error) => {
        const errorMsg = 'EventSource connection failed';
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: errorMsg
        }));

        callbacksRef.current.onError?.(new Error(errorMsg));

        // Auto-retry connection
        if (retryInterval > 0) {
          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, retryInterval);
        }
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create EventSource';
      setState(prev => ({
        ...prev,
        error: errorMsg
      }));
      callbacksRef.current.onError?.(new Error(errorMsg));
    }
  }, [url, maxEvents, retryInterval]);

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [autoConnect, url, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
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