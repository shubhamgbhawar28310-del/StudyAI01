import React from 'react'
import { ChatMessage as ChatMessageType } from '@/components/ai-assistant/types'
import { EnhancedChatMessage } from './components/EnhancedChatMessage'

interface ChatMessageProps {
  message?: ChatMessageType
  isLoading?: boolean
  onRegenerate?: () => void
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
  message, 
  isLoading = false,
  onRegenerate 
}) => {
  return (
    <EnhancedChatMessage 
      message={message} 
      isLoading={isLoading}
      onRegenerate={onRegenerate}
    />
  )
}