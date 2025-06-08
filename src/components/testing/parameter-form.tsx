'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface Parameter {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

interface ParameterFormProps {
  parameters: Parameter[];
  onChange: (parameters: Parameter[]) => void;
  presets?: { [key: string]: Parameter[] };
  title?: string;
}

export function ParameterForm({
  parameters,
  onChange,
  presets = {},
  title = "Query Parameters"
}: ParameterFormProps) {
  const [newParam, setNewParam] = useState<Parameter>({ key: '', value: '', type: 'string' });

  const addParameter = useCallback(() => {
    if (newParam.key && newParam.value) {
      onChange([...parameters, { ...newParam }]);
      setNewParam({ key: '', value: '', type: 'string' });
    }
  }, [newParam, parameters, onChange]);

  const removeParameter = useCallback((index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  }, [parameters, onChange]);

  const updateParameter = useCallback((index: number, field: keyof Parameter, value: string) => {
    const updated = parameters.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    );
    onChange(updated);
  }, [parameters, onChange]);

  const loadPreset = useCallback((presetName: string) => {
    const preset = presets[presetName];
    if (preset) {
      onChange(preset);
    }
  }, [presets, onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex gap-2">
            {Object.keys(presets).length > 0 && (
              <Select onValueChange={loadPreset}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(presets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={parameters.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Parameters */}
        {parameters.length > 0 && (
          <div className="space-y-2">
            {parameters.map((param, index) => (
              <div key={`param-${index}-${param.key}`} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => updateParameter(index, 'key', e.target.value)}
                  className="flex-1 font-mono"
                />
                <Input
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => updateParameter(index, 'value', e.target.value)}
                  className="flex-1 font-mono"
                />
                <Select
                  value={param.type}
                  onValueChange={(value) => updateParameter(index, 'type', value as Parameter['type'])}
                >
                  <SelectTrigger className="w-28 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeParameter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Parameter */}
        <div className="border-t pt-4">
          <Label className="text-xs font-medium text-muted-foreground mb-2 block">
            Add Parameter
          </Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Key"
              value={newParam.key}
              onChange={(e) => setNewParam({ ...newParam, key: e.target.value })}
              className="flex-1 font-mono"
            />
            <Input
              placeholder="Value"
              value={newParam.value}
              onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
              className="flex-1 font-mono"
            />
            <Select
              value={newParam.type}
              onValueChange={(value) => setNewParam({ ...newParam, type: value as Parameter['type'] })}
            >
              <SelectTrigger className="w-28 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={addParameter}
              disabled={!newParam.key || !newParam.value}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Parameter Preview */}
        {parameters.length > 0 && (
          <div className="border-t pt-4">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Query String Preview
            </Label>
            <div className="bg-muted/50 rounded-md p-3 font-mono text-sm border border-muted-foreground/20">
              <span className="text-orange-600 dark:text-orange-400">?</span>
              {parameters.map((param, index) => (
                <span key={index}>
                  {index > 0 && <span className="text-orange-600 dark:text-orange-400">&</span>}
                  <span className="text-green-600 dark:text-green-400">{param.key}</span>
                  <span className="text-orange-600 dark:text-orange-400">=</span>
                  <span className="text-purple-600 dark:text-purple-400">{param.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 