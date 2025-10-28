import React, { useState, useEffect } from 'react'
import { MessageContent } from './types'
import { StudyPlanner } from './StudyPlanner'
import { FlashcardViewer } from './FlashcardViewer'
import { NotesViewer } from './NotesViewer'
import { QuizViewer } from './QuizViewer'
import { ConceptMapViewer } from './ConceptMapViewer'
import { Eli5Viewer } from './Eli5Viewer'
import ReactMarkdown from 'react-markdown'

interface MessageContentRendererProps {
  content: MessageContent
}

// Safe Markdown Renderer with error handling and fallback
const SafeMarkdownRenderer: React.FC<{ content: MessageContent }> = ({ content }) => {
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)

  // Check if the value is a string or needs to be converted to string
  const textValue = typeof content.value === 'string' ? content.value : JSON.stringify(content.value, null, 2)

  useEffect(() => {
    // Reset rendering state when content changes
    setIsRendering(true)
    setRenderError(null)
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsRendering(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [textValue])

  // Error boundary for markdown rendering
  try {
    if (renderError) {
      // Fallback to styled pre block
      return (
        <div className="max-w-none">
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Markdown rendering failed. Showing plain text instead.
          </div>
          <pre className="whitespace-pre-wrap break-words text-sm bg-muted/30 p-4 rounded-lg overflow-auto max-h-[600px]">
            {textValue}
          </pre>
        </div>
      )
    }

    if (isRendering) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="animate-pulse">Loading content...</div>
        </div>
      )
    }

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-pre:max-w-full prose-pre:overflow-x-auto">
        <div className="max-h-[800px] overflow-y-auto">
          <ReactMarkdown
            components={{
              // Ensure code blocks don't break layout
              pre: ({ node, ...props }) => (
                <pre className="overflow-x-auto max-w-full" {...props} />
              ),
              // Ensure images don't break layout
              img: ({ node, ...props }) => (
                <img className="max-w-full h-auto" {...props} />
              ),
            }}
          >
            {textValue}
          </ReactMarkdown>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Markdown render error:', error)
    setRenderError((error as Error).message)
    
    // Fallback to plain text
    return (
      <div className="max-w-none">
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
          ⚠️ Error displaying file content. Showing plain text.
        </div>
        <pre className="whitespace-pre-wrap break-words text-sm bg-muted/30 p-4 rounded-lg overflow-auto max-h-[600px]">
          {textValue}
        </pre>
      </div>
    )
  }
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
      return <SafeMarkdownRenderer content={content} />
  }
}