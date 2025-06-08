'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Square, Trash2, Wifi, WifiOff, Clock } from 'lucide-react';
import { useServerSentEvents, type SSEEvent } from '../../hooks/use-server-sent-events';
import { ParameterForm } from './parameter-form';

interface Parameter {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

interface StreamConfig {
  path: string;
  description: string;
  presets?: { [key: string]: Parameter[] };
}

interface StreamTesterProps {
  config: StreamConfig;
  baseUrl?: string;
}

export function StreamTester({ config, baseUrl = 'http://localhost:3001' }: StreamTesterProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const buildUrl = useCallback(() => {
    let url = config.path;
    
    if (parameters.length > 0) {
      const searchParams = new URLSearchParams();
      parameters.forEach(param => {
        searchParams.append(param.key, param.value);
      });
      url += `?${searchParams.toString()}`;
    }

    return `${baseUrl}${url}`;
  }, [config.path, parameters, baseUrl]);

  // Memoize the URL to prevent unnecessary recalculations
  const currentUrl = useMemo(() => buildUrl(), [buildUrl]);

  // Memoize callback functions to prevent recreating them on every render
  const handleConnect = useCallback(() => {
    console.log('SSE Connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('SSE Disconnected');
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('SSE Error:', err);
  }, []);

  const handleEvent = useCallback((event: SSEEvent) => {
    console.log('SSE Event:', event);
  }, []);

  const {
    isConnected,
    events,
    error,
    connectionCount,
    connect,
    disconnect,
    clearEvents,
    clearError,
    isSupported
  } = useServerSentEvents(streamUrl, {
    maxEvents: 50,
    autoConnect: false,
    retryInterval: 3000,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    onEvent: handleEvent
  });

  const startStream = useCallback(() => {
    const url = buildUrl();
    setStreamUrl(url);
    // Connect will be triggered by the hook when URL changes
    setTimeout(() => connect(), 100);
  }, [buildUrl, connect]);

  const stopStream = useCallback(() => {
    disconnect();
    setStreamUrl(null);
  }, [disconnect]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [disconnect]);

  if (!isSupported) {
    return (
      <Card className="h-fit">
        <CardContent className="text-center py-8">
          <p className="text-destructive">Server-Sent Events are not supported in this browser</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-fit max-w-full">
      {/* Stream Header */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant="outline" className="shrink-0">SSE</Badge>
                <CardTitle className="text-base font-semibold truncate">
                  {config.path}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                {connectionCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {connectionCount}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2">{config.description}</p>
            
            <div className="flex flex-wrap gap-2">
              {!isConnected ? (
                <Button onClick={startStream} className="min-w-28 w-full sm:w-auto">
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Start Stream</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              ) : (
                <Button onClick={stopStream} variant="destructive" className="min-w-28 w-full sm:w-auto">
                  <Square className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Stop Stream</span>
                  <span className="sm:hidden">Stop</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={clearEvents}
                disabled={events.length === 0}
                className="min-w-24 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Clear Events</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Stream URL Preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Stream URL
            </label>
            <div className="bg-muted/50 rounded-md p-2 font-mono text-xs break-all">
              {currentUrl}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-md p-2">
              <div className="flex items-center justify-between">
                <p className="text-destructive text-xs font-medium">Connection Error:</p>
                <Button variant="outline" onClick={clearError} className="h-8 px-3 text-xs">
                  Clear
                </Button>
              </div>
              <p className="text-destructive text-xs mt-1 break-words">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Parameters */}
      <div className="w-full">
        <ParameterForm
          parameters={parameters}
          onChange={setParameters}
          presets={config.presets}
          title="Stream Parameters"
        />
      </div>

      {/* Real-time Events */}
      <Card className="w-full flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {events.length}
              </Badge>
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="hidden md:inline">Last 50</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-64 lg:max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                {isConnected ? 'Waiting for events...' : 'Start the stream to see events'}
              </div>
            ) : (
              events.slice().reverse().map((event: SSEEvent, index: number) => (
                <div
                  key={`${event.timestamp}-${index}`}
                  className="border rounded-lg p-2 bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {event.type}
                      </Badge>
                      {event.id && (
                        <Badge variant="outline" className="text-xs truncate">
                          {event.id}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-background rounded p-2">
                    <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap max-h-32">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 