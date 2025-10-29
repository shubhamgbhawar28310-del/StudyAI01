export enum Author {
  USER = 'user',
  AI = 'ai',
}

export interface Attachment {
  name: string
  type: string
  content: string // base64 encoded content
  extractedText?: string // For parsed documents
  file?: File // Actual File object for backend processing
}

export interface StudyPlanItem {
  day: string
  topic: string
  tasks: string[]
  duration: string
}

export interface StudyPlan {
  title: string
  items: StudyPlanItem[]
}

export interface Flashcard {
  front: string
  back: string
}

export interface NoteItem {
  heading: string
  points: string[]
}

export interface Notes {
  title: string
  summary: string
  items: NoteItem[]
}

export interface QuizQuestion {
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  answer: string
  explanation?: string
}

export interface Quiz {
  title: string
  questions: QuizQuestion[]
}

export interface ConceptMapNode {
  id: string
  topic: string
  summary: string
  children: ConceptMapNode[]
}

export interface ConceptMap {
  title: string
  root: ConceptMapNode
}

export interface ELI5 {
  title: string
  explanation: string
  analogy: string
}

export type MessageContentType = 'text' | 'study_plan' | 'flashcards' | 'notes' | 'quiz' | 'concept_map' | 'eli5'

export interface MessageContent {
  type: MessageContentType
  value: string | StudyPlan | Flashcard[] | Notes | Quiz | ConceptMap | ELI5
}

export interface ChatMessage {
  id: string
  author: Author
  content: MessageContent[]
  attachments?: Attachment[]
  isError?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
}