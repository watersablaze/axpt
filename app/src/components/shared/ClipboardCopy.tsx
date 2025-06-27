'use client';

import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClipboardCopyProps {
  label: string;
  value: string;
  className?: string;
  showIcon?: boolean;
  multiline?: boolean;
}

export default function ClipboardCopy({
  label,
  value,
  className,
  showIcon = true,
  multiline = false,
}: ClipboardCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className={cn('rounded-md p-3 border bg-muted relative', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-mono text-muted-foreground max-w-[calc(100%-3rem)]">
          {label}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-1 text-muted hover:text-white transition"
        >
          {showIcon && <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div
        className={cn(
          'text-[11px] font-mono text-muted-foreground mt-1',
          multiline ? 'whitespace-pre-wrap break-words' : 'truncate'
        )}
      >
        {value}
      </div>
    </div>
  );
}