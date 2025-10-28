import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, Author } from '@/components/ai-assistant/types';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { QuizFormatter } from './QuizFormatter';
import { Toast } from './Toast';
import { GraduationCap } from 'lucide-react';

interface EnhancedChatMessageProps {
  message?: ChatMessageType;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({ 
  message, 
  isLoading = false,
  onRegenerate 
}) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="group w-full py-6 px-4 bg-muted/20">
        <div className="flex gap-4 max-w-3xl mx-auto">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isUser = message.author === Author.USER;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setToast({ message: 'Copied to clipboard!', type: 'success' });
      })
      .catch(() => {
        setToast({ message: 'Failed to copy', type: 'error' });
      });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Check if content is quiz-related
  const isQuizContent = (content: string) => {
    return content.toLowerCase().includes('quiz') && 
           (content.includes('Question') || content.includes('**Question'));
  };

  // Render user message
  if (isUser) {
    return (
      <>
        <UserMessage message={message} onCopy={handleCopy} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </>
    );
  }

  // Render assistant message
  // Check if it's a quiz and format accordingly
  const textContent = message.content
    .map(c => typeof c.value === 'string' ? c.value : JSON.stringify(c.value))
    .join('\n\n');

  if (isQuizContent(textContent)) {
    return (
      <>
        <div className="group w-full py-6 px-4 bg-muted/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <QuizFormatter content={textContent} />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </>
    );
  }

  return (
    <>
      <AssistantMessage 
        message={message} 
        onCopy={handleCopy} 
        onRegenerate={onRegenerate}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
};
