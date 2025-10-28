import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GraduationCap } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/components/ai-assistant/types';
import { CodeBlock } from './CodeBlock';
import { MessageActions } from './MessageActions';

interface AssistantMessageProps {
  message: ChatMessageType;
  onCopy: (text: string) => void;
  onRegenerate?: () => void;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = memo(({ 
  message, 
  onCopy, 
  onRegenerate 
}) => {
  // Extract text content from message
  const textContent = message.content
    .map(c => typeof c.value === 'string' ? c.value : JSON.stringify(c.value))
    .join('\n\n');

  const handleCopy = () => {
    onCopy(textContent);
  };

  return (
    <div className="group w-full py-6 px-4 bg-muted/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Centered container like ChatGPT */}
      <div className="max-w-3xl mx-auto">
        {/* Message container with avatar and content */}
        <div className="flex gap-4">
          {/* AI Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Message Content */}
          <div className="flex-1 min-w-0 space-y-2">
          {/* Markdown Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:mt-5 prose-headings:mb-3 prose-p:leading-7 prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-pre:my-4 prose-pre:p-0 prose-code:text-sm prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom code block renderer
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const inline = !match;
                  
                  if (!inline && match) {
                    return (
                      <CodeBlock
                        language={match[1]}
                        code={codeString}
                        showLineNumbers={true}
                      />
                    );
                  }
                  
                  // Inline code
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Style headings with proper spacing
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold border-b border-border pb-2 mb-4 mt-6 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold border-b border-border pb-2 mb-3 mt-5 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold mb-2 mt-3">
                    {children}
                  </h4>
                ),
                // Style lists with proper indentation
                ul: ({ children }) => (
                  <ul className="list-disc space-y-1.5 my-3 ml-5">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal space-y-1.5 my-3 ml-5">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-7 pl-1">
                    {children}
                  </li>
                ),
                // Style tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-4 py-2">
                    {children}
                  </td>
                ),
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                // Style paragraphs with consistent spacing
                p: ({ children }) => (
                  <p className="leading-7 my-3 text-foreground">
                    {children}
                  </p>
                ),
                // Style strong/bold text
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                // Style emphasis/italic text
                em: ({ children }) => (
                  <em className="italic">
                    {children}
                  </em>
                ),
              }}
            >
              {textContent}
            </ReactMarkdown>
          </div>

          {/* Action Buttons */}
          <MessageActions
            messageContent={textContent}
            onCopy={handleCopy}
            onRegenerate={onRegenerate}
            showRegenerate={!!onRegenerate}
          />
        </div>
        </div>
      </div>
    </div>
  );
});

AssistantMessage.displayName = 'AssistantMessage';
