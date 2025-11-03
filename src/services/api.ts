// API Service for connecting to backend
// In production on Vercel, use relative URLs (same domain)
// In development, use localhost backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

// Chat API
export const chatAPI = {
  // Send message to AI
  async sendMessage(message: string, context?: any[], conversationId?: string, userId?: string, model?: string) {
    return apiCall('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context,
        conversationId,
        userId: userId || 'default',
        model: model || 'google' // Default to google if not specified
      })
    });
  },

  // Get conversation history
  async getHistory(userId: string) {
    return apiCall(`/chat/history/${userId}`);
  },

  // Generate study plan
  async generatePlan(topic: string, duration: string, level: string, model?: string, preferences?: any) {
    return apiCall('/chat/generate-plan', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        duration,
        level,
        model: model || 'google',
        preferences
      })
    });
  },

  // Edit content
  async editContent(content: string, instructions: string) {
    return apiCall('/chat/edit', {
      method: 'POST',
      body: JSON.stringify({
        content,
        instructions
      })
    });
  },

  // Generate flashcards
  async generateFlashcards(content: string, count: number = 10) {
    return apiCall('/chat/flashcards', {
      method: 'POST',
      body: JSON.stringify({
        content,
        count
      })
    });
  }
};

// Document API
export const documentAPI = {
  // Upload and analyze document with server-side text extraction
  async uploadDocument(file: File): Promise<{ extractedText: string; filename: string; success?: boolean; error?: string; details?: string }> {
    console.log("API: Uploading document:", file.name, file.type);
    const formData = new FormData();
    formData.append('file', file); // Changed from 'document' to 'file' to match backend

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      console.log("API: Upload response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API: Upload error response:", errorText);
        throw new Error(`Upload Error: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log("API: Upload successful, result:", result);
      
      // Handle backend errors gracefully
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('API: Document Upload Error:', error);
      // Return a structured error response instead of throwing
      return {
        extractedText: '',
        filename: file.name,
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // Analyze text directly
  async analyzeText(content: string, title?: string) {
    return apiCall('/documents/analyze-text', {
      method: 'POST',
      body: JSON.stringify({
        content,
        title
      })
    });
  },

  // Generate study materials
  async generateMaterials(content: string, materialType?: string) {
    return apiCall('/documents/generate-materials', {
      method: 'POST',
      body: JSON.stringify({
        content,
        materialType
      })
    });
  }
};

// Study API
export const studyAPI = {
  // Create study plan
  async createStudyPlan(topic: string, duration: string, level: string = 'intermediate', preferences: any = {}, userId?: string) {
    return apiCall('/study/plan/create', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        duration,
        level,
        preferences,
        userId: userId || 'default'
      })
    });
  },

  // Get specific plan
  async getStudyPlan(planId: string) {
    return apiCall(`/study/plan/${planId}`);
  },

  // Update plan
  async updateStudyPlan(planId: string, updates: any) {
    return apiCall(`/study/plan/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Get all plans for user
  async getUserStudyPlans(userId: string) {
    return apiCall(`/study/plans/${userId}`);
  },

  // Generate flashcards
  async generateFlashcards(topic: string, count: number = 10, content: string = '', userId?: string) {
    return apiCall('/study/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        count,
        content,
        userId: userId || 'default'
      })
    });
  },

  // Get flashcards by ID
  async getFlashcards(flashcardSetId: string) {
    return apiCall(`/study/flashcards/${flashcardSetId}`);
  },

  // Generate study notes
  async generateStudyNotes(topic: string, content: string = '', format: string = 'markdown') {
    return apiCall('/study/notes/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        content,
        format
      })
    });
  }
};

// Export all APIs
export default {
  chat: chatAPI,
  documents: documentAPI,
  study: studyAPI
};