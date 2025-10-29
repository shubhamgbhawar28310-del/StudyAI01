import React, { memo } from 'react';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  language: string;
  code: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = memo(({ 
  language, 
  code, 
  showLineNumbers = true 
}) => {
  // Clean up the code (remove extra whitespace)
  const cleanCode = code.trim();

  // Map common language aliases to proper identifiers
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'cpp': 'cpp',
    'c++': 'cpp',
    'csharp': 'csharp',
    'c#': 'csharp',
  };

  const normalizedLanguage = languageMap[language.toLowerCase()] || language.toLowerCase();

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-border bg-muted/20">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {normalizedLanguage || 'code'}
        </span>
        <CopyButton text={cleanCode} size="sm" variant="ghost" />
      </div>

      {/* Code content */}
      <div className="relative bg-muted/30">
        <pre className="p-4 overflow-x-auto m-0 text-sm">
          <code className="font-mono leading-6 block text-foreground">
            {cleanCode}
          </code>
        </pre>
      </div>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
