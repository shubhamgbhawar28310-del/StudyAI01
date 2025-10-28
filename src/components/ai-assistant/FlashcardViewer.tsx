import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Plus, Calendar } from 'lucide-react'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'

interface Flashcard {
  front: string
  back: string
}

interface FlashcardViewerProps {
  flashcards: Flashcard[] | string
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const { addFlashcard } = useStudyPlanner()

  // Check if flashcards is a string (markdown content) or array (structured data)
  const isMarkdownContent = typeof flashcards === 'string'

  const goToNext = () => {
    if (Array.isArray(flashcards)) {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    }
    setIsFlipped(false)
  }

  const goToPrev = () => {
    if (Array.isArray(flashcards)) {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    }
    setIsFlipped(false)
  }

  const addToFlashcards = (card: Flashcard) => {
    addFlashcard({
      question: card.front,
      answer: card.back,
      subject: 'AI Generated',
      difficulty: 'medium'
    })
  }

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Flashcards</h3>
          <Button size="sm" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{flashcards as string}</div>
        </div>
      </div>
    )
  }

  // Render structured content (backward compatibility)
  if (!Array.isArray(flashcards) || flashcards.length === 0) return null
  
  const currentCard = flashcards[currentIndex]
    
  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Flashcards</h3>
        <Button size="sm" variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      {currentCard && (
        <div
          className="w-full h-48 rounded-lg shadow-lg cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-card rounded-lg border">
              <p className="text-center font-semibold">{currentCard.front}</p>
            </div>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-primary/10 rounded-lg border rotate-y-180">
              <p className="text-center">{currentCard.back}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <Button onClick={goToPrev} variant="outline">
          <Brain className="w-4 h-4 mr-1" />
          Prev
        </Button>
        <p className="text-sm">{currentIndex + 1} / {flashcards.length}</p>
        <div className="flex gap-2">
          <Button onClick={() => addToFlashcards(currentCard)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add to Study
          </Button>
          <Button onClick={goToNext} variant="outline">
            Next
            <Brain className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}