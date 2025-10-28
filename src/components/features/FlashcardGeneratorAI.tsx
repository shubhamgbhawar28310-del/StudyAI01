import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { generateFlashcards } from '@/services/aiService'
import { 
  Brain, 
  Sparkles, 
  RotateCw, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Loader2,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  BookOpen
} from 'lucide-react'

interface FlashcardData {
  question: string
  answer: string
}

interface FlashcardGeneratorAIProps {
  compactMode?: boolean
}

export function FlashcardGeneratorAI({ compactMode = false }: FlashcardGeneratorAIProps) {
  const { addFlashcard } = useStudyPlanner()
  
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 })
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim() && !content.trim()) {
      setError('Please enter a topic or content to generate flashcards')
      return
    }

    setIsGenerating(true)
    setError(null)
    setFlashcards([])

    try {
      const prompt = content.trim() 
        ? `Generate flashcards from this content:\n\n${content}` 
        : `Generate educational flashcards about: ${topic}`

      const response = await generateFlashcards(prompt, [])
      
      // Parse the markdown response to extract flashcards
      const cards = parseFlashcardsFromMarkdown(response)
      
      if (cards.length === 0) {
        throw new Error('No flashcards were generated. Please try again with a different topic.')
      }

      setFlashcards(cards)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (err) {
      console.error('Error generating flashcards:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const parseFlashcardsFromMarkdown = (markdown: string): FlashcardData[] => {
    const cards: FlashcardData[] = []
    
    // Split by card sections (### Card or **Question:**)
    const cardSections = markdown.split(/###\s*Card\s*\d+|(?=\*\*Question:\*\*)/i)
    
    for (const section of cardSections) {
      if (!section.trim()) continue
      
      // Extract question and answer
      const questionMatch = section.match(/\*\*Question:\*\*\s*(.+?)(?=\*\*Answer:\*\*|$)/is)
      const answerMatch = section.match(/\*\*Answer:\*\*\s*(.+?)(?=###|$)/is)
      
      if (questionMatch && answerMatch) {
        cards.push({
          question: questionMatch[1].trim(),
          answer: answerMatch[1].trim()
        })
      }
    }
    
    return cards
  }

  const handleSaveAll = () => {
    flashcards.forEach(card => {
      addFlashcard({
        question: card.question,
        answer: card.answer,
        subject: topic || 'AI Generated',
        difficulty: 'medium'
      })
    })
    
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleStudyResponse = (correct: boolean) => {
    setStudyStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }))
    
    if (currentIndex < flashcards.length - 1) {
      handleNext()
    } else {
      setStudyMode(false)
      alert(`Study session complete!\n\nCorrect: ${studyStats.correct + (correct ? 1 : 0)}\nIncorrect: ${studyStats.incorrect + (correct ? 0 : 1)}`)
      setStudyStats({ correct: 0, incorrect: 0 })
    }
  }

  const exportToPDF = () => {
    // Create a simple text export (can be enhanced with a PDF library)
    const text = flashcards.map((card, i) => 
      `Card ${i + 1}\nQ: ${card.question}\nA: ${card.answer}\n\n`
    ).join('')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcards-${topic || 'generated'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Study Mode View
  if (studyMode && flashcards.length > 0) {
    const currentCard = flashcards[currentIndex]
    
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Study Mode
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {currentIndex + 1} / {flashcards.length}
              </Badge>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">✓ {studyStats.correct}</span>
                <span className="text-red-600 font-medium">✗ {studyStats.incorrect}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStudyMode(false)
                  setStudyStats({ correct: 0, incorrect: 0 })
                  setCurrentIndex(0)
                  setIsFlipped(false)
                }}
              >
                Exit
              </Button>
            </div>
          </div>
          <Progress value={((currentIndex + 1) / flashcards.length) * 100} className="h-2 mt-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-6"
          >
            <div 
              className="relative min-h-[300px] cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div 
                  className={`absolute inset-0 p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center ${isFlipped ? 'invisible' : 'visible'}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground mb-3">Question</p>
                  <p className="text-xl font-medium">{currentCard.question}</p>
                  <p className="text-sm text-muted-foreground mt-6">Click to reveal answer</p>
                </div>

                {/* Back */}
                <div 
                  className={`absolute inset-0 p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 rounded-lg border-2 border-green-200 dark:border-green-800 flex flex-col items-center justify-center ${isFlipped ? 'visible' : 'invisible'}`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground mb-3">Answer</p>
                  <p className="text-lg">{currentCard.answer}</p>
                </div>
              </motion.div>
            </div>

            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-center"
              >
                <Button
                  onClick={() => handleStudyResponse(false)}
                  variant="outline"
                  className="flex-1 max-w-xs text-red-500 border-red-500 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleStudyResponse(true)}
                  className="flex-1 max-w-xs bg-green-500 text-white hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Correct
                </Button>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!compactMode && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Flashcard Generator
            </h2>
            <p className="text-muted-foreground mt-1">
              Generate interactive flashcards instantly with AI
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Flashcards saved successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Topic or Subject
            </label>
            <Input
              placeholder="e.g., OOP in C++, Photosynthesis, World War II..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Content (Optional)
            </label>
            <Textarea
              placeholder="Paste your notes, text, or content here to generate flashcards from it..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!topic.trim() && !content.trim())}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Flashcards
                </>
              )}
            </Button>
            
            {flashcards.length > 0 && (
              <Button
                onClick={() => {
                  setFlashcards([])
                  setTopic('')
                  setContent('')
                  setError(null)
                }}
                variant="outline"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flashcards Display */}
      {flashcards.length > 0 && (
        <>
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {flashcards.length} cards generated
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setStudyMode(true)}
                variant="outline"
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0"
              >
                <Brain className="h-4 w-4 mr-2" />
                Study Mode
              </Button>
              <Button
                onClick={handleSaveAll}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
              <Button
                onClick={exportToPDF}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Card Viewer */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Card {currentIndex + 1} of {flashcards.length}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Progress value={((currentIndex + 1) / flashcards.length) * 100} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="relative min-h-[300px] cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div
                        key="front"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center min-h-[300px]"
                      >
                        <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground mb-3">Question</p>
                        <p className="text-xl font-medium text-center">{flashcards[currentIndex].question}</p>
                        <p className="text-sm text-muted-foreground mt-6">Click to reveal answer</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="back"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 rounded-lg border-2 border-green-200 dark:border-green-800 flex flex-col items-center justify-center min-h-[300px]"
                      >
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground mb-3">Answer</p>
                        <p className="text-lg text-center">{flashcards[currentIndex].answer}</p>
                        <p className="text-sm text-muted-foreground mt-6">Click to see question</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Grid View */}
          <Card>
            <CardHeader>
              <CardTitle>All Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      index === currentIndex ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => {
                      setCurrentIndex(index)
                      setIsFlipped(false)
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Card {index + 1}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Q:</p>
                        <p className="text-sm line-clamp-2">{card.question}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">A:</p>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{card.answer}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
