import React, { useRef } from 'react'
import { ChatMessage, Attachment } from '@/components/ai-assistant/types'
import { WelcomeScreen } from '@/components/ai-assistant/WelcomeScreen'
import { ChatMessageComponent } from '@/components/ai-assistant/ChatMessage'
import { ChatInput } from '@/components/ai-assistant/ChatInput'

interface ChatAreaProps {
  messages: ChatMessage[]
  isLoading: boolean
  onSendMessage: (content: string, attachments: Attachment[]) => void
  currentChatId: string | null
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  currentChatId,
  sidebarOpen,
  setSidebarOpen,
  messagesEndRef
}) => {
  return (
    <main className="flex flex-col h-full min-h-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen onPromptClick={(prompt) => onSendMessage(prompt, [])} />
          ) : (
            <div className="space-y-0">
              {messages.map(msg => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              {isLoading && <ChatMessageComponent isLoading={true} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
          <p className="text-xs text-center text-muted-foreground mt-3">
            Aivy can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </main>
  )
}