'use client';

import React from 'react';
import { Eye, Code2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JsonValue, JsonObject, JsonArray } from './types';
import { humanizeFieldName, getArrayItemLabel } from './fieldUtils';

interface PreviewPanelProps {
  data: JsonValue;
  sectionTitle: string;
}

/**
 * PreviewPanel Component
 *
 * Shows a formatted preview of how the content will appear
 * in the final blueprint.
 */
export function PreviewPanel({ data, sectionTitle }: PreviewPanelProps): React.JSX.Element {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="from-primary/20 to-primary-accent/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
          <Eye className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-semibold">Preview</h3>
          <p className="text-text-secondary text-sm">How your content will appear</p>
        </div>
      </div>

      {/* Preview content */}
      <div className="glass-card space-y-6 p-6">
        <PreviewNode data={data} level={0} />
      </div>

      {/* JSON view (collapsed by default) */}
      <details className="glass-card overflow-hidden">
        <summary className="text-text-secondary flex min-h-[44px] cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5">
          <Code2 className="h-4 w-4" />
          View Raw JSON
        </summary>
        <div className="border-t border-white/10 bg-black/20 p-4">
          <pre className="text-text-secondary overflow-x-auto font-mono text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}

interface PreviewNodeProps {
  data: JsonValue;
  level: number;
  propertyKey?: string;
}

function PreviewNode({ data, level, propertyKey }: PreviewNodeProps) {
  // Null or undefined
  if (data === null || data === undefined) {
    return (
      <div className="text-text-secondary text-sm italic">
        {propertyKey && <span className="font-medium">{humanizeFieldName(propertyKey)}: </span>}
        <span className="text-white/30">Not set</span>
      </div>
    );
  }

  // Primitive values
  if (typeof data !== 'object') {
    const isHeading = level === 0 || propertyKey?.toLowerCase().includes('title');

    if (typeof data === 'boolean') {
      return (
        <div className="text-sm">
          {propertyKey && (
            <span className="text-foreground font-medium">{humanizeFieldName(propertyKey)}: </span>
          )}
          <span className={cn('font-semibold', data ? 'text-green-400' : 'text-red-400')}>
            {data ? 'Yes' : 'No'}
          </span>
        </div>
      );
    }

    if (typeof data === 'number') {
      return (
        <div className="text-sm">
          {propertyKey && (
            <span className="text-foreground font-medium">{humanizeFieldName(propertyKey)}: </span>
          )}
          <span className="font-mono text-green-400">{data}</span>
        </div>
      );
    }

    // String value
    if (isHeading) {
      return (
        <div className="space-y-1">
          {propertyKey && level > 0 && (
            <div className="text-primary text-xs font-medium tracking-wide uppercase">
              {humanizeFieldName(propertyKey)}
            </div>
          )}
          <h2
            className={cn(
              'text-foreground font-bold',
              level === 0 && 'text-2xl',
              level === 1 && 'text-xl',
              level === 2 && 'text-lg',
              level >= 3 && 'text-base'
            )}
          >
            {data}
          </h2>
        </div>
      );
    }

    // Check if it's a long paragraph
    const isLongText = typeof data === 'string' && data.length > 100;

    return (
      <div className="space-y-1">
        {propertyKey && (
          <div className="text-primary text-xs font-medium">{humanizeFieldName(propertyKey)}</div>
        )}
        <div
          className={cn(
            'text-text-secondary',
            isLongText ? 'text-sm leading-relaxed whitespace-pre-wrap' : 'text-sm'
          )}
        >
          {data}
        </div>
      </div>
    );
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="text-text-secondary text-sm italic">
          {propertyKey && <span className="font-medium">{humanizeFieldName(propertyKey)}: </span>}
          <span className="text-white/30">No items</span>
        </div>
      );
    }

    // Check if array contains primitives (render as list)
    const isPrimitiveArray = data.every((item) => typeof item !== 'object' || item === null);

    if (isPrimitiveArray) {
      return (
        <div className="space-y-2">
          {propertyKey && (
            <div className="text-foreground text-sm font-semibold">
              {humanizeFieldName(propertyKey)}
            </div>
          )}
          <ul className="list-none space-y-1.5">
            {data.map((item, index) => (
              <li key={index} className="text-text-secondary flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{String(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Array of objects - render as cards
    return (
      <div className="space-y-3">
        {propertyKey && (
          <div className="text-foreground text-sm font-semibold">
            {humanizeFieldName(propertyKey)}
          </div>
        )}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <FileText className="text-primary h-4 w-4" />
                <span className="text-primary text-sm font-medium">
                  {propertyKey ? getArrayItemLabel(propertyKey, index) : `Item ${index + 1}`}
                </span>
              </div>
              <PreviewNode data={item} level={level + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Object
  const entries = Object.entries(data as JsonObject);

  if (entries.length === 0) {
    return (
      <div className="text-text-secondary text-sm italic">
        {propertyKey && <span className="font-medium">{humanizeFieldName(propertyKey)}: </span>}
        <span className="text-white/30">No data</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {propertyKey && level > 0 && (
        <h3
          className={cn(
            'text-foreground border-b border-white/10 pb-2 font-semibold',
            level === 1 && 'text-lg',
            level === 2 && 'text-base',
            level >= 3 && 'text-sm'
          )}
        >
          {humanizeFieldName(propertyKey)}
        </h3>
      )}
      {entries.map(([key, value]) => (
        <PreviewNode key={key} data={value} level={level + 1} propertyKey={key} />
      ))}
    </div>
  );
}
