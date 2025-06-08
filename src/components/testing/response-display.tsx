'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';

interface ResponseDisplayProps {
  data: any;
  error?: string | null;
  loading?: boolean;
  status?: number;
  responseTime?: number;
  title?: string;
}

export function ResponseDisplay({
  data,
  error,
  loading = false,
  status,
  responseTime,
  title = "Response"
}: ResponseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = error || JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const content = error || JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'default';
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'secondary';
    if (status >= 400 && status < 500) return 'destructive';
    if (status >= 500) return 'destructive';
    return 'default';
  };

  const getStatusBadgeClass = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (status >= 400 && status < 500) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (status >= 500) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatJsonWithSyntaxHighlighting = (obj: any) => {
    const jsonString = JSON.stringify(obj, null, 2);
    return jsonString
      .replace(/"([^"]+)":/g, '<span style="color: #75d4ff">"$1"</span>:') // Keys - bright blue (color4)
      .replace(/: "([^"]*)"/g, ': <span style="color: #b6e875">"$1"</span>') // String values - bright green (color2)
      .replace(/: (\d+\.?\d*)/g, ': <span style="color: #b975e6">$1</span>') // Numbers - bright purple (color5)
      .replace(/: (true|false)/g, ': <span style="color: #ffc150">$1</span>') // Booleans - bright yellow (color3)
      .replace(/: null/g, ': <span style="color: #6cbeb5">null</span>'); // Null - cyan (color6)
  };

  return (
    <Card className={`w-full transition-all duration-200 ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {status && (
              <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${getStatusBadgeClass(status)}`}>
                {status}
              </span>
            )}
            {responseTime && (
              <span className="px-2 py-1 rounded text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {responseTime}ms
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={loading}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading || (!data && !error)}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-0">
          <div className="relative">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-2 font-mono">Error:</p>
                <pre className="text-xs overflow-auto whitespace-pre-wrap text-red-600 dark:text-red-300 font-mono bg-red-100 dark:bg-red-900/20 p-3 rounded border">
                  {error}
                </pre>
              </div>
            ) : data ? (
              <div className="bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-700">
                <div className={`overflow-auto font-mono text-sm ${isFullscreen ? 'max-h-[calc(100vh-200px)]' : 'max-h-96'}`}>
                  <pre 
                    className="p-4 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-[#b2c8d6]"
                    dangerouslySetInnerHTML={{ 
                      __html: formatJsonWithSyntaxHighlighting(data) 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No data to display
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 