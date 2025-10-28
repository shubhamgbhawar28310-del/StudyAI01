import React, { useState, memo } from 'react';
import { User, Copy } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/components/ai-assistant/types';
import { Button } from '@/components/ui/button';

interface UserMessageProps {
  message: ChatMessageType;
  onCopy: (text: string) => void;
}

export const UserMessage: React.FC<UserMessageProps> = memo(({ message, onCopy }) => {
  const [showCopy, setShowCopy] = useState(false);

  // Extract text content from message
  const textContent = message.content
    .map(c => typeof c.value === 'string' ? c.value : '')
    .join('\n');

  const handleCopy = () => {
    onCopy(textContent);
  };

  return (
    <div className="w-full py-4 px-4">
      {/* Right-aligned container */}
      <div className="flex justify-end max-w-5xl mx-auto">
        {/* Message bubble - max width for user messages */}
        <div 
          className="group relative max-w-xl"
          onMouseEnter={() => setShowCopy(true)}
          onMouseLeave={() => setShowCopy(false)}
        >
          {/* Bubble with gradient background like ChatGPT */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-foreground">
              {textContent}
            </p>
          </div>
          
          {/* Copy Button - Top right corner */}
          <Button
            onClick={handleCopy}
            size="sm"
            variant="ghost"
            className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-background rounded-full shadow-sm"
            title="Copy message"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

UserMessage.displayName = 'UserMessage';
