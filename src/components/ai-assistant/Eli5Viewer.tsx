import React from 'react'
import { Lightbulb } from 'lucide-react'

interface ELI5 {
  title: string
  explanation: string
  analogy: string
}

interface Eli5ViewerProps {
  content: ELI5 | string
}

export const Eli5Viewer: React.FC<Eli5ViewerProps> = ({ content }) => {
  // Check if content is a string (markdown content) or object (structured data)
  const isMarkdownContent = typeof content === 'string'

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg w-full border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center mb-3">
          <Lightbulb className="w-8 h-8 text-yellow-500 mr-3"/>
          <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">Explain Like I'm 5</h3>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{content as string}</div>
        </div>
      </div>
    )
  }

  // Render structured content (backward compatibility)
  if (typeof content !== 'object' || content === null) return null
  
  const structuredContent = content as ELI5
  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg w-full border border-yellow-200 dark:border-yellow-700">
      <div className="flex items-center mb-3">
        <Lightbulb className="w-8 h-8 text-yellow-500 mr-3"/>
        <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">Explain Like I'm 5: {structuredContent.title}</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground">The Simple Idea</h4>
          <p className="text-muted-foreground">{structuredContent.explanation}</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground">An Analogy</h4>
          <p className="text-muted-foreground">"{structuredContent.analogy}"</p>
        </div>
      </div>
    </div>
  )
}