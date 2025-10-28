import React from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar } from 'lucide-react'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import ReactMarkdown from 'react-markdown'

interface NoteItem {
  heading: string
  points: string[]
}

interface Notes {
  title: string
  summary: string
  items: NoteItem[]
}

interface NotesViewerProps {
  notes: Notes | string
}

export const NotesViewer: React.FC<NotesViewerProps> = ({ notes }) => {
  const { addMaterial } = useStudyPlanner()

  // Check if notes is a string (markdown content) or object (structured data)
  const isMarkdownContent = typeof notes === 'string'

  const addToMaterials = () => {
    if (isMarkdownContent) {
      // Handle markdown content
      addMaterial({
        title: "Notes",
        description: "Generated notes",
        type: 'note',
        content: notes as string
      })
    } else {
      // Handle structured content
      const structuredNotes = notes as Notes
      addMaterial({
        title: structuredNotes.title,
        description: structuredNotes.summary,
        type: 'note',
        content: structuredNotes.items.map(item => 
          `## ${item.heading}\n${item.points.map(point => `- ${point}`).join('\n')}`
        ).join('\n\n')
      })
    }
  }

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
        <div className="flex justify-between items-center not-prose mb-4">
          <h3 className="text-xl font-bold">Notes</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={addToMaterials}>
              <BookOpen className="w-4 h-4 mr-2" />
              Add to Materials
            </Button>
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2">
          <div className="max-h-[800px] overflow-y-auto">
            <ReactMarkdown
              components={{
                pre: ({ node, ...props }) => (
                  <pre className="overflow-x-auto max-w-full" {...props} />
                ),
                img: ({ node, ...props }) => (
                  <img className="max-w-full h-auto" {...props} />
                ),
              }}
            >
              {notes as string}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  // Render structured content (backward compatibility)
  const structuredNotes = notes as Notes
  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full prose dark:prose-invert max-w-none">
      <div className="flex justify-between items-center not-prose mb-4">
        <h3 className="text-xl font-bold">{structuredNotes.title}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={addToMaterials}>
            <BookOpen className="w-4 h-4 mr-2" />
            Add to Materials
          </Button>
        </div>
      </div>

      <p className="italic">{structuredNotes.summary}</p>

      {structuredNotes.items.map((item, index) => (
        <div key={index} className="mt-4">
          <h4>{item.heading}</h4>
          <ul>
            {item.points.map((point, pointIndex) => (
              <li key={pointIndex}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}