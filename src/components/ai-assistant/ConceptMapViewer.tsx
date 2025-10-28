import React from 'react'

interface ConceptMapNode {
  id: string
  topic: string
  summary: string
  children: ConceptMapNode[]
}

interface ConceptMap {
  title: string
  root: ConceptMapNode
}

interface ConceptMapViewerProps {
  map: ConceptMap | string
}

export const ConceptMapViewer: React.FC<ConceptMapViewerProps> = ({ map }) => {
  // Check if map is a string (markdown content) or object (structured data)
  const isMarkdownContent = typeof map === 'string'

  const Node: React.FC<{ node: ConceptMapNode, level: number }> = ({ node, level }) => {
    const levelColors = [
      'border-blue-500',
      'border-green-500', 
      'border-purple-500',
      'border-red-500',
      'border-yellow-500',
    ]
    const color = levelColors[level % levelColors.length]

    return (
      <li className="my-2">
        <div className={`p-3 rounded-lg bg-muted border-l-4 ${color}`}>
          <h4 className="font-bold">{node.topic}</h4>
          <p className="text-sm text-muted-foreground">{node.summary}</p>
        </div>
        {node.children && node.children.length > 0 && (
          <ul className="pl-6 mt-2 border-l-2 border-muted">
            {node.children.map(child => <Node key={child.id} node={child} level={level + 1} />)}
          </ul>
        )}
      </li>
    )
  }

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
        <h3 className="text-xl font-bold mb-4">Concept Map</h3>
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{map as string}</div>
        </div>
      </div>
    )
  }

  // Render structured content (backward compatibility)
  if (typeof map !== 'object' || map === null) return null
  
  const structuredMap = map as ConceptMap
  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
      <h3 className="text-xl font-bold mb-4">{structuredMap.title}</h3>
      <ul>
        <Node node={structuredMap.root} level={0} />
      </ul>
    </div>
  )
}