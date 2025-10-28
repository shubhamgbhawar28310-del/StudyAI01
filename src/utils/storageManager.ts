const STORAGE_KEY = 'studyai-chat-sessions';
const MAX_SESSIONS = 10;
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of quota
const MAX_STRING_SIZE = 4500000; // ~4.5MB (leaving some buffer from 5MB)

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
}

// Helper to estimate size of an object in bytes
const getSizeInBytes = (obj: any): number => {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return new Blob([str]).size;
};

// Clean up message content to reduce size
const cleanMessage = (message: any): any => {
  if (!message) return message;
  
  // Create a shallow copy to avoid mutating the original
  const cleaned = { ...message };
  
  // Remove large content from old messages
  if (cleaned.attachments?.length) {
    cleaned.attachments = cleaned.attachments.map((attachment: any) => ({
      ...attachment,
      content: undefined, // Remove base64 content
      size: attachment.size,
      name: attachment.name,
      type: attachment.type
    }));
  }

  // Truncate long content
  if (cleaned.content && cleaned.content.length > 15000) {
    cleaned.content = cleaned.content.substring(0, 15000) + '... [truncated]';
  }

  return cleaned;
};

export const getSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing chat sessions:', error);
    return [];
  }
};

const saveSessionsToStorage = (sessions: ChatSession[]): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const data = JSON.stringify(sessions);
    
    // Check if we're approaching storage limit
    if (getSizeInBytes(data) > MAX_STRING_SIZE) {
      console.warn('Approaching storage limit, cleaning up old sessions...');
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting cleanup...');
      return false;
    }
    console.error('Error saving chat sessions:', error);
    return false;
  }
};

export const saveSessions = (sessions: ChatSession[]): ChatSession[] => {
  if (!Array.isArray(sessions)) {
    console.error('Invalid sessions data');
    return [];
  }

  // Clean up sessions before saving
  const cleanedSessions = sessions
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) // Newest first
    .slice(0, MAX_SESSIONS) // Take only the most recent sessions
    .map(session => ({
      ...session,
      messages: session.messages?.map(cleanMessage) || []
    }));

  // Try to save with cleanup
  if (saveSessionsToStorage(cleanedSessions)) {
    return cleanedSessions;
  }

  // If we're still too large, try with fewer sessions
  const reducedSessions = [cleanedSessions[0]]; // Keep only the most recent session
  if (saveSessionsToStorage(reducedSessions)) {
    console.warn('Storage full, keeping only the most recent session');
    return reducedSessions;
  }

  // Last resort: clear all sessions
  console.error('Storage full, clearing all sessions');
  localStorage.removeItem(STORAGE_KEY);
  return [];
};

export const addSession = (session: Omit<ChatSession, 'createdAt' | 'updatedAt'>): ChatSession[] => {
  const sessions = getSessions();
  const now = Date.now();
  
  const newSession: ChatSession = {
    ...session,
    createdAt: now,
    updatedAt: now
  };

  // Remove existing session with same ID if it exists
  const updatedSessions = [
    newSession,
    ...sessions.filter(s => s.id !== session.id)
  ];

  return saveSessions(updatedSessions);
};

export const deleteSession = (id: string): ChatSession[] => {
  const sessions = getSessions();
  const updatedSessions = sessions.filter(session => session.id !== id);
  return saveSessions(updatedSessions);
};

export const getStorageInfo = () => {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      quota: 0,
      percentage: 0,
      warning: false
    };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const used = getSizeInBytes(data);
    const percentage = Math.min(100, (used / MAX_STRING_SIZE) * 100);
    
    return {
      used,
      quota: MAX_STRING_SIZE,
      percentage,
      warning: percentage > (STORAGE_WARNING_THRESHOLD * 100)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      used: 0,
      quota: 0,
      percentage: 0,
      warning: false
    };
  }
};
