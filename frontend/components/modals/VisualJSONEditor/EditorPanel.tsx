'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { JsonValue, JsonObject, JsonArray } from './types';
import type { ValidationError } from './validation';
import { getErrorForPath } from './validation';
import {
  humanizeFieldName,
  inferFieldMetadata,
  getArrayItemLabel,
  getPlaceholder,
} from './fieldUtils';

interface EditorPanelProps {
  data: JsonValue;
  onUpdate: (newData: JsonValue) => void;
  validationErrors: ValidationError[];
  sectionTitle: string;
}

/**
 * EditorPanel Component
 *
 * Card-based editing interface with smart field labels,
 * collapsible sections, and inline validation.
 */
export function EditorPanel({
  data,
  onUpdate,
  validationErrors,
  sectionTitle,
}: EditorPanelProps): React.JSX.Element {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="text-text-secondary flex items-start gap-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Edit your content below. Changes are saved automatically as drafts. Click Save Changes to
          apply.
        </p>
      </div>

      <EditorNode data={data} path={[]} onUpdate={onUpdate} validationErrors={validationErrors} />
    </div>
  );
}

interface EditorNodeProps {
  data: JsonValue;
  path: (string | number)[];
  onUpdate: (newData: JsonValue) => void;
  validationErrors: ValidationError[];
  propertyKey?: string;
  rootData?: JsonValue; // Add rootData to pass down the complete data structure
}

function EditorNode({
  data,
  path,
  onUpdate,
  validationErrors,
  propertyKey,
  rootData,
}: EditorNodeProps) {
  const [isExpanded, setIsExpanded] = useState(path.length < 2);

  // Use rootData if provided, otherwise use data (for top-level component)
  const actualRootData = rootData ?? data;

  const updateValue = useCallback(
    (newValue: JsonValue) => {
      // Navigate through the data structure and update the value at path
      const updateAtPath = (current: JsonValue, pathSegments: (string | number)[]): JsonValue => {
        if (pathSegments.length === 0) {
          return newValue;
        }

        const [segment, ...rest] = pathSegments;

        if (Array.isArray(current)) {
          const newArray = [...current];
          newArray[segment as number] = updateAtPath(current[segment as number], rest);
          return newArray;
        }

        if (typeof current === 'object' && current !== null) {
          return {
            ...current,
            [segment]: updateAtPath((current as JsonObject)[segment as string], rest),
          };
        }

        return current;
      };

      // IMPORTANT: Always update from the root data to preserve the entire structure
      const updatedRootData = path.length === 0 ? newValue : updateAtPath(actualRootData, path);
      onUpdate(updatedRootData);
    },
    [actualRootData, path, onUpdate]
  );

  const error = getErrorForPath(validationErrors, path);

  // Primitive value (string, number, boolean, null)
  if (data === null || typeof data !== 'object') {
    const metadata = propertyKey ? inferFieldMetadata(propertyKey, data) : null;
    const label = metadata?.label || (propertyKey ? humanizeFieldName(propertyKey) : 'Value');

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <FieldEditor
          value={data}
          label={label}
          description={metadata?.description}
          type={metadata?.type || 'text'}
          placeholder={propertyKey ? getPlaceholder(propertyKey, metadata?.type || 'text') : ''}
          onChange={updateValue}
          error={error}
        />
      </motion.div>
    );
  }

  // Array
  if (Array.isArray(data)) {
    const label = propertyKey ? humanizeFieldName(propertyKey) : 'Items';

    return (
      <div className="space-y-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-card flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all hover:bg-white/10"
          aria-expanded={isExpanded}
        >
          <div className="flex min-w-0 items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="text-primary h-5 w-5 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/50" />
            )}
            <List className="h-5 w-5 flex-shrink-0 text-yellow-400" />
            <div className="min-w-0">
              <h3 className="text-foreground truncate text-base font-semibold">{label}</h3>
              <p className="text-text-secondary text-xs">
                {data.length} item{data.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {error && (
            <Badge
              variant="outline"
              className="flex-shrink-0 border-red-500/30 bg-red-500/10 text-red-400"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {error.severity === 'error' ? 'Error' : 'Warning'}
            </Badge>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="scrollbar-brand max-h-[60vh] space-y-3 overflow-y-auto pl-4 md:pl-8"
            >
              {error && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
                    error.severity === 'error'
                      ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                      : 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                  )}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              )}

              {data.map((item, index) => (
                <div key={index} className="glass-card space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {propertyKey ? getArrayItemLabel(propertyKey, index) : `Item ${index + 1}`}
                    </Badge>
                  </div>
                  <EditorNode
                    data={item}
                    path={[...path, index]}
                    onUpdate={onUpdate}
                    validationErrors={validationErrors}
                    rootData={actualRootData}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Object
  const entries = Object.entries(data as JsonObject);
  const label = propertyKey ? humanizeFieldName(propertyKey) : 'Section';

  return (
    <div className="space-y-3">
      {propertyKey && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-card flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all hover:bg-white/10"
          aria-expanded={isExpanded}
        >
          <div className="flex min-w-0 items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="text-primary h-5 w-5 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/50" />
            )}
            <Folder className="h-5 w-5 flex-shrink-0 text-blue-400" />
            <div className="min-w-0">
              <h3 className="text-foreground truncate text-base font-semibold">{label}</h3>
              <p className="text-text-secondary text-xs">
                {entries.length} field{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {error && (
            <Badge
              variant="outline"
              className="flex-shrink-0 border-red-500/30 bg-red-500/10 text-red-400"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {error.severity === 'error' ? 'Error' : 'Warning'}
            </Badge>
          )}
        </button>
      )}

      <AnimatePresence>
        {(isExpanded || !propertyKey) && (
          <motion.div
            initial={{ opacity: 0, height: propertyKey ? 0 : 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'scrollbar-brand max-h-[60vh] space-y-4 overflow-y-auto',
              propertyKey && 'pl-4 md:pl-8'
            )}
          >
            {error && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg px-3 py-2 text-sm',
                  error.severity === 'error'
                    ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                    : 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                )}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            {entries.map(([key, value]) => (
              <EditorNode
                key={key}
                data={value}
                path={[...path, key]}
                onUpdate={onUpdate}
                validationErrors={validationErrors}
                propertyKey={key}
                rootData={actualRootData}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FieldEditorProps {
  value: string | number | boolean | null;
  label: string;
  description?: string;
  type: string;
  placeholder?: string;
  onChange: (newValue: JsonValue) => void;
  error?: ValidationError;
}

function FieldEditor({
  value,
  label,
  description,
  type,
  placeholder,
  onChange,
  error,
}: FieldEditorProps) {
  const [localValue, setLocalValue] = useState(String(value ?? ''));

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    // Convert to appropriate type
    if (value === null) {
      onChange(newValue || null);
    } else if (typeof value === 'boolean') {
      onChange(newValue.toLowerCase() === 'true');
    } else if (typeof value === 'number') {
      const parsed = parseFloat(newValue);
      onChange(isNaN(parsed) ? 0 : parsed);
    } else {
      onChange(newValue);
    }
  };

  const getTypeIcon = () => {
    if (type === 'number') return <Hash className="h-4 w-4 text-green-400" />;
    if (type === 'date') return <Calendar className="h-4 w-4 text-purple-400" />;
    if (type === 'boolean') return <ToggleLeft className="h-4 w-4 text-blue-400" />;
    return <Type className="h-4 w-4 text-cyan-400" />;
  };

  const isLongText = type === 'textarea' || (typeof value === 'string' && value.length > 100);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex-shrink-0">{getTypeIcon()}</div>
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`field-${label}`} className="text-foreground text-sm font-medium">
            {label}
          </Label>
          {description && <p className="text-text-secondary text-xs">{description}</p>}
        </div>
      </div>

      {type === 'boolean' ? (
        <select
          id={`field-${label}`}
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          className="focus:border-primary/50 focus:ring-primary/20 min-h-[44px] w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all focus:ring-2 focus:outline-none"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ) : isLongText ? (
        <Textarea
          id={`field-${label}`}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={cn(
            'focus:border-primary/50 focus:ring-primary/20 w-full resize-none rounded-lg border bg-white/5 px-4 py-3 text-sm text-white transition-all focus:ring-2 focus:outline-none',
            error
              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
              : 'border-white/10'
          )}
        />
      ) : (
        <Input
          id={`field-${label}`}
          type={type === 'number' ? 'number' : 'text'}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'focus:border-primary/50 focus:ring-primary/20 min-h-[44px] w-full rounded-lg border bg-white/5 px-4 py-2 text-sm text-white transition-all focus:ring-2 focus:outline-none',
            error
              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
              : 'border-white/10'
          )}
        />
      )}

      {error && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
            error.severity === 'error'
              ? 'border border-red-500/20 bg-red-500/10 text-red-400'
              : 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
          )}
        >
          <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}
