import React from 'react'
import { MessageContent } from './types'
import { StudyPlanner } from './StudyPlanner'
import { FlashcardViewer } from './FlashcardViewer'
import { NotesViewer } from './NotesViewer'
import { QuizViewer } from './QuizViewer'
import { ConceptMapViewer } from './ConceptMapViewer'
import { Eli5Viewer } from './Eli5Viewer'

interface MessageContentRendererProps {
  content: MessageContent
}

export const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({ content }) => {
  switch (content.type) {
    case 'study_plan':
      return <StudyPlanner plan={content.value as any} />
    case 'flashcards':
      return <FlashcardViewer flashcards={content.value as any} />
    case 'notes':
      return <NotesViewer notes={content.value as any} />
    case 'quiz':
      return <QuizViewer quiz={content.value as any} />
    case 'concept_map':
      return <ConceptMapViewer map={content.value as any} />
    case 'eli5':
      return <Eli5Viewer content={content.value as any} />
    case 'text':
    default:
      // Check if the value is a string or needs to be converted to string
      const textValue = typeof content.value === 'string' ? content.value : JSON.stringify(content.value, null, 2)
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2">
          <div className="whitespace-pre-wrap">{textValue}</div>
        </div>
      )
  }
}