import { useState } from 'react'
import { ChatMessage, ChatSession, Attachment, Author } from '@/components/ai-assistant/types'
import { 
  generateStudyPlan, 
  generateFlashcards, 
  generateNotes, 
  generateQuiz, 
  generateConceptMap, 
  generateELI5, 
  generateChatResponse, 
  analyzeFiles, 
  generateChatTitle 
} from '@/services/aiService'

interface UseAIAssistantProps {
  chatSessions: ChatSession[]
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  currentChatId: string | null
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const useAIAssistant = ({
  chatSessions,
  setChatSessions,
  currentChatId,
  setCurrentChatId,
  sidebarOpen,
  setSidebarOpen
}: UseAIAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const currentChat = chatSessions.find(session => session.id === currentChatId)
  const messages = currentChat?.messages || []

  const generateAIResponse = async (prompt: string, attachments: Attachment[] = [], history: ChatMessage[] = []): Promise<ChatMessage> => {
    const lowerCasePrompt = prompt.toLowerCase()
    
    try {
      // Helper function to check if prompt is asking for explanation/teaching (NOT quiz)
      const isExplanationRequest = (text: string): boolean => {
        const explanationKeywords = [
          'explain', 'teach', 'how to', 'what is', 'what are',
          'give me an example', 'show me', 'help me understand',
          'can you explain', 'tell me about', 'describe',
          'how does', 'why does', 'study tips', 'learn about'
        ];
        return explanationKeywords.some(keyword => text.includes(keyword));
      };

      // Helper function to check if prompt explicitly requests a quiz
      const isQuizRequest = (text: string): boolean => {
        const quizKeywords = [
          'create a quiz', 'make a quiz', 'generate quiz',
          'quiz me', 'test me', 'give me questions',
          'practice questions', 'mcq', 'multiple choice',
          'ask me questions', 'test my knowledge'
        ];
        return quizKeywords.some(keyword => text.includes(keyword));
      };
      
      // Check for keywords that trigger structured output
      if (lowerCasePrompt.includes('study plan')) {
        const plan = await generateStudyPlan(prompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'study_plan', value: plan }]
        }
      }
      
      if (lowerCasePrompt.includes('flashcard')) {
        const flashcards = await generateFlashcards(prompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'flashcards', value: flashcards }]
        }
      }
      
      // FIXED: Only trigger quiz mode when explicitly requested
      // Don't trigger on general words like "test" or "exam" in educational context
      if (isQuizRequest(lowerCasePrompt) && !isExplanationRequest(lowerCasePrompt)) {
        const quizPrompt = attachments.length > 0 
          ? `${prompt}. Please create a quiz based on the content of the attached file(s). Focus on the main topics and key points from the material.`
          : prompt;
        const quiz = await generateQuiz(quizPrompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'quiz', value: quiz }]
        }
      }
      
      if (lowerCasePrompt.includes('summary') || lowerCasePrompt.includes('summarize') || 
          lowerCasePrompt.includes('notes') || lowerCasePrompt.includes('note')) {
        // Provide better context for summary/note generation
        const notesPrompt = attachments.length > 0 
          ? `${prompt}. Please create detailed notes or a summary based on the content of the attached file(s). Focus on the main topics and key points from the material.`
          : prompt;
        const notes = await generateNotes(notesPrompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'notes', value: notes }]
        }
      }
      
      if (lowerCasePrompt.includes('eli5') || lowerCasePrompt.includes("explain like i'm 5")) {
        const eli5 = await generateELI5(prompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'eli5', value: eli5 }]
        }
      }
      
      if (lowerCasePrompt.includes('concept map') || lowerCasePrompt.includes('mind map')) {
        const conceptMap = await generateConceptMap(prompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'concept_map', value: conceptMap }]
        }
      }
      
      // If there are attachments, use the file analysis model
      if (attachments.length > 0) {
        // Provide better context for file analysis
        const analysisPrompt = prompt || "Please provide a comprehensive analysis of the uploaded file(s). Include a summary of the main topics, key points, and any important details.";
        const textResponse = await analyzeFiles(analysisPrompt, attachments)
        return {
          id: Date.now().toString(),
          author: Author.AI,
          content: [{ type: 'text', value: textResponse }]
        }
      }
      
      // Otherwise, use the conversational model
      const textResponse = await generateChatResponse(prompt, history)
      return {
        id: Date.now().toString(),
        author: Author.AI,
        content: [{ type: 'text', value: textResponse }]
      }
    } catch (error) {
      console.error('Error calling AI service:', error)
      
      // Check if this is a quota limit error
      let errorMessage = "I'm having trouble connecting to the AI service right now. Please try again later.";
      
      // Check if the error message contains quota-related terms
      if (error instanceof Error) {
        const errorString = error.toString().toLowerCase();
        if (errorString.includes('quota') || errorString.includes('429') || errorString.includes('exceeded')) {
          errorMessage = "You've reached your AI service quota limit. Please wait for the quota to reset or try again later.";
        } else if (errorString.includes('api key') || errorString.includes('unauthorized')) {
          errorMessage = "There's an issue with your API key configuration. Please check your API settings.";
        }
      }
      
      // Fallback response
      return {
        id: Date.now().toString(),
        author: Author.AI,
        content: [{
          type: 'text',
          value: errorMessage
        }]
      }
    }
  }

  const processAndAddMessage = async (content: string, attachments: Attachment[] = []) => {
    // If we have attachments but no content, provide a default prompt for file analysis
    let finalContent = content;
    if (attachments.length > 0 && (!content || content.trim() === '')) {
      finalContent = "Please provide a comprehensive analysis of the uploaded file(s). Include a summary of the main topics, key points, and any important details.";
    }
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      author: Author.USER,
      content: [{ type: 'text', value: finalContent }],
      attachments,
    }
    
    setIsLoading(true)

    try {
      if (currentChatId) {
        // Add user message to existing chat
        setChatSessions(prevSessions => {
          const updatedSessions = prevSessions.map(session => {
            if (session.id === currentChatId) {
              return { ...session, messages: [...session.messages, userMessage] }
            }
            return session
          })
          return updatedSessions
        })
        
        // Get current chat history for context
        const currentChat = chatSessions.find(s => s.id === currentChatId)
        const history = currentChat?.messages || []
        
        const aiResponse = await generateAIResponse(finalContent, attachments, history)
        console.log('=== AI Response Generated ===', aiResponse)
        console.log('=== AI Response Content ===', aiResponse.content)
        console.log('=== AI Response Content Type ===', aiResponse.content[0]?.type)
        const contentValue = aiResponse.content[0]?.value
        console.log('=== AI Response Content Value ===', typeof contentValue === 'string' ? contentValue.substring(0, 200) : contentValue)

        // Validate the AI response before adding
        if (!aiResponse || !aiResponse.content || aiResponse.content.length === 0) {
          console.error('=== INVALID AI RESPONSE ===', aiResponse)
          throw new Error('AI generated an invalid response')
        }

        // Add AI response
        setChatSessions(prevSessions => {
          const finalSessions = prevSessions.map(session => {
            if (session.id === currentChatId) {
              const updatedSession = { ...session, messages: [...session.messages, aiResponse] }
              console.log('=== Updated Session Messages ===', updatedSession.messages.length, 'messages')
              console.log('=== Last Message ===', updatedSession.messages[updatedSession.messages.length - 1])
              return updatedSession
            }
            return session
          })
          console.log('=== Final Sessions After Update ===', finalSessions.length, 'sessions')
          return finalSessions
        })

      } else {
        // Create a new chat
        const tempChat: ChatSession = {
          id: Date.now().toString(),
          title: finalContent.length > 30 ? finalContent.substring(0, 30) + '...' : finalContent,
          messages: [userMessage]
        }
        
        setChatSessions(prev => [...prev, tempChat])
        setCurrentChatId(tempChat.id)

        const [aiResponse, title] = await Promise.all([
          generateAIResponse(finalContent, attachments, [userMessage]),
          generateChatTitle(finalContent)
        ])
        
        // Update the temporary chat with the AI response and proper title
        setChatSessions(prev => prev.map(session => 
          session.id === tempChat.id 
            ? { ...session, title, messages: [userMessage, aiResponse] }
            : session
        ))
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Check if this is a quota limit error
      let errorMessageText = "I'm having trouble connecting to the AI service right now. Please try again later.";
      
      // Check if the error message contains quota-related terms
      if (error instanceof Error) {
        const errorString = error.toString().toLowerCase();
        if (errorString.includes('quota') || errorString.includes('429') || errorString.includes('exceeded')) {
          errorMessageText = "You've reached your AI service quota limit. Please wait for the quota to reset or try again later.";
        } else if (errorString.includes('api key') || errorString.includes('unauthorized')) {
          errorMessageText = "There's an issue with your API key configuration. Please check your API settings.";
        }
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        author: Author.AI,
        content: [{ type: 'text', value: errorMessageText }],
        isError: true,
      }
      
      if (currentChatId) {
        setChatSessions(prevSessions => prevSessions.map(session => {
          if (session.id === currentChatId) {
            return { ...session, messages: [...session.messages, errorMessage] }
          }
          return session
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    setSidebarOpen(false) // Close sidebar on mobile after creating new chat
  }
  
  const handleSelectChat = (id: string) => {
    setCurrentChatId(id)
    setSidebarOpen(false) // Close sidebar on mobile after selecting chat
  }

  const handleDeleteChat = (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      setChatSessions(prev => prev.filter(session => session.id !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(null)
      }
    }
  }

  const handleDeleteAllChats = () => {
    if (window.confirm('Are you sure you want to delete all chat conversations? This action cannot be undone.')) {
      setChatSessions([])
      setCurrentChatId(null)
      localStorage.removeItem('studyai-chat-sessions')
    }
  }

  const handleRegenerateResponse = async (messageId: string) => {
    if (!currentChatId) return;
    
    const currentChat = chatSessions.find(s => s.id === currentChatId);
    if (!currentChat) return;

    // Find the message to regenerate and get the previous user message
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return; // Can't regenerate if there's no previous user message

    const userMessage = currentChat.messages[messageIndex - 1];
    if (userMessage.author !== Author.USER) return;

    // Extract user prompt and attachments
    const userPrompt = userMessage.content
      .map(c => typeof c.value === 'string' ? c.value : '')
      .join('\n');
    const attachments = userMessage.attachments || [];

    setIsLoading(true);

    try {
      // Remove the old AI response
      setChatSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === currentChatId) {
            return {
              ...session,
              messages: session.messages.filter(m => m.id !== messageId)
            };
          }
          return session;
        })
      );

      // Get chat history up to the user message
      const history = currentChat.messages.slice(0, messageIndex);

      // Generate new response
      const aiResponse = await generateAIResponse(userPrompt, attachments, history);

      // Add new AI response
      setChatSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === currentChatId) {
            return {
              ...session,
              messages: [...session.messages, aiResponse]
            };
          }
          return session;
        })
      );
    } catch (error) {
      console.error('Error regenerating response:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        author: Author.AI,
        content: [{ type: 'text', value: "Failed to regenerate response. Please try again." }],
        isError: true,
      };
      
      setChatSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === currentChatId) {
            return {
              ...session,
              messages: [...session.messages, errorMessage]
            };
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    processAndAddMessage,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleDeleteAllChats,
    handleRegenerateResponse
  }
}