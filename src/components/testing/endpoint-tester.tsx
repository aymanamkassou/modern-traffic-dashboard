'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { ParameterForm } from './parameter-form';
import { ResponseDisplay } from './response-display';

interface Parameter {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  presets?: { [key: string]: Parameter[] };
  pathParams?: string[];
}

interface EndpointTesterProps {
  config: EndpointConfig;
  baseUrl?: string;
}

export function EndpointTester({ config, baseUrl = 'http://localhost:3001' }: EndpointTesterProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [pathValues, setPathValues] = useState<{ [key: string]: string }>({});
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | undefined>();
  const [status, setStatus] = useState<number | undefined>();

  const buildUrl = () => {
    let url = config.path;
    
    // Replace path parameters
    if (config.pathParams) {
      config.pathParams.forEach(param => {
        const value = pathValues[param];
        if (value) {
          url = url.replace(`:${param}`, encodeURIComponent(value));
        }
      });
    }

    // Add query parameters
    if (parameters.length > 0) {
      const searchParams = new URLSearchParams();
      parameters.forEach(param => {
        searchParams.append(param.key, param.value);
      });
      url += `?${searchParams.toString()}`;
    }

    return `${baseUrl}${url}`;
  };

  const executeRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(undefined);
    setStatus(undefined);

    const startTime = performance.now();

    try {
      const response = await fetch(buildUrl(), {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setStatus(response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setResponse(data);
    } catch (err) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'default';
      case 'POST': return 'default';
      case 'PUT': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600';
      case 'POST': return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
      case 'PUT': return 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700';
      case 'DELETE': return 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700';
      default: return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint Header */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold border w-fit ${getMethodBadgeClass(config.method)}`}>
                {config.method}
              </span>
              <CardTitle className="text-base sm:text-lg font-semibold font-mono break-all">
                {config.path}
              </CardTitle>
            </div>
            <Button
              onClick={executeRequest}
              disabled={loading}
              className="min-w-24 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                  <span className="hidden sm:inline">Testing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Test Endpoint</span>
                  <span className="sm:hidden">Test</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* URL Preview */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">
              Request URL
            </label>
            <div className="bg-muted/50 rounded-md p-4 font-mono text-sm border border-muted-foreground/20 break-all">
              <span className="text-foreground">{baseUrl}</span>
              <span className="text-foreground">{config.path.split('?')[0]}</span>
              {parameters.length > 0 && (
                <>
                  <span className="text-muted-foreground">?</span>
                  {parameters.map((param, index) => (
                    <span key={index}>
                      {index > 0 && <span className="text-muted-foreground">&</span>}
                      <span className="text-foreground">{param.key}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-foreground">{param.value}</span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Path Parameters */}
          {config.pathParams && config.pathParams.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">
                Path Parameters
              </label>
              <div className="space-y-3">
                {config.pathParams.map(param => (
                  <div key={param} className="relative">
                    <div className="flex items-center rounded-md border border-input bg-background">
                      <div className="flex items-center px-3 py-2 bg-muted/50 border-r border-border rounded-l-md">
                        <span className="text-xs font-mono font-medium text-orange-600 dark:text-orange-400">:</span>
                        <span className="text-sm font-mono font-semibold text-orange-600 dark:text-orange-400 ml-0.5">{param}</span>
                      </div>
                      <Input
                        placeholder={`Enter ${param} value`}
                        value={pathValues[param] || ''}
                        onChange={(e) => setPathValues({
                          ...pathValues,
                          [param]: e.target.value
                        })}
                        className="border-0 rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {(responseTime !== undefined || status !== undefined) && (
            <div className="flex items-center gap-4 text-sm">
              {status !== undefined && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Status: {status}</span>
                </div>
              )}
              {responseTime !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Response: {responseTime}ms</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Parameters */}
      <ParameterForm
        parameters={parameters}
        onChange={setParameters}
        presets={config.presets}
        title="Query Parameters"
      />

      {/* Response */}
      <ResponseDisplay
        data={response}
        error={error}
        loading={loading}
        status={status}
        responseTime={responseTime}
        title="Response Data"
      />
    </div>
  );
} 