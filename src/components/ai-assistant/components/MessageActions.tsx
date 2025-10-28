import React from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageActionsProps {
  messageContent: string;
  onCopy: () => void;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageContent, 
  onCopy, 
  onRegenerate,
  showRegenerate = false 
}) => {
  return (
    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        onClick={onCopy}
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        title="Copy message"
      >
        <Copy className="w-3.5 h-3.5 mr-1.5" />
        Copy
      </Button>
      
      {showRegenerate && onRegenerate && (
        <Button
          onClick={onRegenerate}
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          title="Regenerate response"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Regenerate
        </Button>
      )}
    </div>
  );
};
