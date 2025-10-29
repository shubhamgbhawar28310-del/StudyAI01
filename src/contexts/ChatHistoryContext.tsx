import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Types for Chat History
export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'suggestions'
  content: string
  timestamp: string
  suggestions?: AISuggestion[]
}

export interface AISuggestion {
  id: string
  type: 'task' | 'flashcard' | 'schedule' | 'summary'
  title: string
  content: TaskSuggestion[] | FlashcardSuggestion[] | ScheduleSuggestion[] | string
  accepted?: boolean
  rejected?: boolean
}

export interface TaskSuggestion {
  title: string
  priority: string
  estimate: string
}

export interface FlashcardSuggestion {
  question: string
  answer: string
}

export interface ScheduleSuggestion {
  title: string
  date: string
  duration: number
}

export interface ChatSession {
  id: string
  title: string
  summary?: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface ChatHistoryState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isLoading: boolean
}

type ChatHistoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CREATE_NEW_SESSION'; payload?: { title?: string } }
  | { type: 'SET_CURRENT_SESSION'; payload: string }
  | { type: 'ADD_MESSAGE_TO_SESSION'; payload: { sessionId: string; message: ChatMessage } }
  | { type: 'UPDATE_SESSION'; payload: ChatSession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'LOAD_SESSIONS'; payload: ChatSession[] }
  | { type: 'UPDATE_SESSION_TITLE'; payload: { sessionId: string; title: string } }
  | { type: 'GENERATE_SESSION_SUMMARY'; payload: { sessionId: string; summary: string } }

const initialState: ChatHistoryState = {
  sessions: [],
  currentSessionId: null,
  isLoading: false
}

function chatHistoryReducer(state: ChatHistoryState, action: ChatHistoryAction): ChatHistoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'CREATE_NEW_SESSION': {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: action.payload?.title || 'New Chat',
        messages: [{
          id: '1',
          type: 'ai',
          content: "Hi! I'm your AI study assistant. I can help you:\n\n• Create and organize tasks\n• Plan your study schedule\n• Analyze your uploaded materials\n• Provide study guidance and explanations\n• Generate flashcards and summaries\n\nUpload your notes, images, or documents, or just ask me anything about your studies!",
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      }
      
      return {
        ...state,
        sessions: [newSession, ...state.sessions.map(s => ({ ...s, isActive: false }))],
        currentSessionId: newSession.id
      }
    }

    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSessionId: action.payload,
        sessions: state.sessions.map(session => ({
          ...session,
          isActive: session.id === action.payload
        }))
      }

    case 'ADD_MESSAGE_TO_SESSION': {
      const { sessionId, message } = action.payload
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, message],
                updatedAt: new Date().toISOString()
              }
            : session
        )
      }
    }

    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        )
      }

    case 'DELETE_SESSION': {
      const updatedSessions = state.sessions.filter(session => session.id !== action.payload)
      let newCurrentSessionId = state.currentSessionId
      
      // If we're deleting the current session, switch to the first available session
      if (state.currentSessionId === action.payload) {
        newCurrentSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null
      }
      
      return {
        ...state,
        sessions: updatedSessions.map((session, index) => ({
          ...session,
          isActive: session.id === newCurrentSessionId
        })),
        currentSessionId: newCurrentSessionId
      }
    }

    case 'LOAD_SESSIONS':
      return {
        ...state,
        sessions: action.payload
      }

    case 'UPDATE_SESSION_TITLE':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, title: action.payload.title, updatedAt: new Date().toISOString() }
            : session
        )
      }

    case 'GENERATE_SESSION_SUMMARY':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, summary: action.payload.summary, updatedAt: new Date().toISOString() }
            : session
        )
      }

    default:
      return state
  }
}

interface ChatHistoryContextType {
  state: ChatHistoryState
  dispatch: React.Dispatch<ChatHistoryAction>
  // Session operations
  createNewSession: (title?: string) => string
  setCurrentSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  // Message operations
  addMessageToCurrentSession: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  // Utility functions
  getCurrentSession: () => ChatSession | undefined
  getSessionById: (sessionId: string) => ChatSession | undefined
  generateSessionSummary: (sessionId: string) => void
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined)

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatHistoryReducer, initialState)

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChatHistory = localStorage.getItem('studyAI-chatHistory')
    if (savedChatHistory) {
      try {
        const parsedHistory = JSON.parse(savedChatHistory)
        dispatch({ type: 'LOAD_SESSIONS', payload: parsedHistory.sessions || [] })
        if (parsedHistory.currentSessionId) {
          dispatch({ type: 'SET_CURRENT_SESSION', payload: parsedHistory.currentSessionId })
        } else if (parsedHistory.sessions && parsedHistory.sessions.length > 0) {
          dispatch({ type: 'SET_CURRENT_SESSION', payload: parsedHistory.sessions[0].id })
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
        // Create initial session if loading fails
        dispatch({ type: 'CREATE_NEW_SESSION' })
      }
    } else {
      // Create initial session if no history exists
      dispatch({ type: 'CREATE_NEW_SESSION' })
    }
  }, [])

  // Save chat history to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      sessions: state.sessions,
      currentSessionId: state.currentSessionId
    }
    localStorage.setItem('studyAI-chatHistory', JSON.stringify(dataToSave))
  }, [state.sessions, state.currentSessionId])

  // Session operations
  const createNewSession = (title?: string): string => {
    dispatch({ type: 'CREATE_NEW_SESSION', payload: { title } })
    // Return the new session ID (we know it will be the current timestamp)
    return Date.now().toString()
  }

  const setCurrentSession = (sessionId: string) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId })
  }

  const deleteSession = (sessionId: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: sessionId })
  }

  const updateSessionTitle = (sessionId: string, title: string) => {
    dispatch({ type: 'UPDATE_SESSION_TITLE', payload: { sessionId, title } })
  }

  // Message operations
  const addMessageToCurrentSession = (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!state.currentSessionId) return
    
    const message: ChatMessage = {
      ...messageData,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString()
    }
    
    dispatch({ 
      type: 'ADD_MESSAGE_TO_SESSION', 
      payload: { sessionId: state.currentSessionId, message } 
    })
  }

  const addMessageToSession = (sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const message: ChatMessage = {
      ...messageData,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString()
    }
    
    dispatch({ 
      type: 'ADD_MESSAGE_TO_SESSION', 
      payload: { sessionId, message } 
    })
  }

  // Utility functions
  const getCurrentSession = (): ChatSession | undefined => {
    return state.sessions.find(session => session.id === state.currentSessionId)
  }

  const getSessionById = (sessionId: string): ChatSession | undefined => {
    return state.sessions.find(session => session.id === sessionId)
  }

  const generateSessionSummary = (sessionId: string) => {
    const session = getSessionById(sessionId)
    if (!session || session.messages.length < 3) return

    // Generate a simple summary based on the first few user messages
    const userMessages = session.messages.filter(m => m.type === 'user').slice(0, 3)
    let summary = ''
    
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content
      if (firstMessage.length > 50) {
        summary = firstMessage.substring(0, 50) + '...'
      } else {
        summary = firstMessage
      }
      
      if (userMessages.length > 1) {
        summary += ` and ${userMessages.length - 1} more topics`
      }
    } else {
      summary = 'New conversation'
    }

    dispatch({ 
      type: 'GENERATE_SESSION_SUMMARY', 
      payload: { sessionId, summary } 
    })
  }

  const value: ChatHistoryContextType = {
    state,
    dispatch,
    createNewSession,
    setCurrentSession,
    deleteSession,
    updateSessionTitle,
    addMessageToCurrentSession,
    addMessageToSession,
    getCurrentSession,
    getSessionById,
    generateSessionSummary
  }

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  )
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext)
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider')
  }
  return context
}