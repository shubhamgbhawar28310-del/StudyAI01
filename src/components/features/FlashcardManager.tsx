import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { generateFlashcards } from '@/services/aiService'
import { 
  Plus,
  Sparkles, 
  Edit, 
  Trash2,
  Loader2,
  CheckCircle,
  X,
  BookOpen,
  Eye,
  RotateCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export function FlashcardManager() {
  const { state, addFlashcardDeck, updateFlashcardDeck, deleteFlashcardDeck } = useStudyPlanner()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  
  // View mode state
  const [viewingDeckId, setViewingDeckId] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  // Form state
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' }
  ])
  
  // AI Generator state
  const [aiTopic, setAiTopic] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddCard = () => {
    setCards([...cards, { question: '', answer: '' }])
  }

  const handleRemoveCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index))
    }
  }

  const handleCardChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)
  }

  const handleSaveDeck = () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    const validCards = cards.filter(card => card.question.trim() && card.answer.trim())
    if (validCards.length === 0) {
      setError('Please add at least one complete flashcard')
      return
    }

    if (editingDeckId) {
      const existingDeck = state.flashcardDecks.find(d => d.id === editingDeckId)
      if (existingDeck) {
        updateFlashcardDeck({
          ...existingDeck,
          topic: topic.trim(),
          cards: validCards
        })
      }
    } else {
      addFlashcardDeck({
        topic: topic.trim(),
        cards: validCards
      })
    }

    resetForm()
    showSuccessMessage()
  }

  const handleEditDeck = (deckId: string) => {
    const deck = state.flashcardDecks.find(d => d.id === deckId)
    if (deck) {
      setTopic(deck.topic)
      setCards(deck.cards.length > 0 ? deck.cards : [{ question: '', answer: '' }])
      setEditingDeckId(deckId)
      setShowCreateForm(true)
      setShowAIGenerator(false)
    }
  }

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Are you sure you want to delete this flashcard deck?')) {
      deleteFlashcardDeck(deckId)
      showSuccessMessage()
    }
  }

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim() && !aiContent.trim()) {
      setError('Please enter a topic or content to generate flashcards')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const prompt = aiContent.trim() 
        ? `Generate flashcards from this content:\n\n${aiContent}` 
        : `Generate educational flashcards about: ${aiTopic}`

      const response = await generateFlashcards(prompt, [])
      const generatedCards = parseFlashcardsFromMarkdown(response)
      
      if (generatedCards.length === 0) {
        throw new Error('No flashcards were generated. Please try again.')
      }

      // Auto-save generated flashcards
      addFlashcardDeck({
        topic: aiTopic.trim() || 'AI Generated Flashcards',
        cards: generatedCards
      })

      resetForm()
      showSuccessMessage()
    } catch (err) {
      console.error('Error generating flashcards:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
    } finally {
      setIsGenerating(false)
    }
  }

  const parseFlashcardsFromMarkdown = (markdown: string): Array<{ question: string; answer: string }> => {
    const cards: Array<{ question: string; answer: string }> = []
    const cardSections = markdown.split(/###\s*Card\s*\d+|(?=\*\*Question:\*\*)/i)
    
    for (const section of cardSections) {
      if (!section.trim()) continue
      
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

  const resetForm = () => {
    setTopic('')
    setCards([{ question: '', answer: '' }])
    setAiTopic('')
    setAiContent('')
    setEditingDeckId(null)
    setShowCreateForm(false)
    setShowAIGenerator(false)
    setError(null)
  }

  const showSuccessMessage = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleViewDeck = (deckId: string) => {
    setViewingDeckId(deckId)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const handleCloseViewer = () => {
    setViewingDeckId(null)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const handleNextCard = () => {
    const deck = state.flashcardDecks.find(d => d.id === viewingDeckId)
    if (deck && currentCardIndex < deck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Flashcards</h2>
          <p className="text-muted-foreground mt-1">
            {state.flashcardDecks.length} saved decks
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm()
              setShowAIGenerator(true)
              setShowCreateForm(false)
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateForm(true)
              setShowAIGenerator(false)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Flashcard
          </Button>
        </div>
      </div>

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
              <span className="font-medium">Success! Flashcards saved.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generator Form */}
      <AnimatePresence>
        {showAIGenerator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Flashcard Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIGenerator(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Topic
                  </label>
                  <Input
                    placeholder="e.g., OOP in C++, Machine Learning Basics..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Content (Optional)
                  </label>
                  <Textarea
                    placeholder="Paste your notes or content here..."
                    value={aiContent}
                    onChange={(e) => setAiContent(e.target.value)}
                    rows={4}
                    disabled={isGenerating}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || (!aiTopic.trim() && !aiContent.trim())}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingDeckId ? 'Edit Flashcard Deck' : 'Create New Flashcard Deck'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Topic / Title
                  </label>
                  <Input
                    placeholder="e.g., C++ Basics, Biology Chapter 3..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Flashcards
                    </label>
                    <Button
                      onClick={handleAddCard}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                  </div>

                  {cards.map((card, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Card {index + 1}</Badge>
                          {cards.length > 1 && (
                            <Button
                              onClick={() => handleRemoveCard(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Question
                          </label>
                          <Textarea
                            placeholder="Enter question..."
                            value={card.question}
                            onChange={(e) => handleCardChange(index, 'question', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Answer
                          </label>
                          <Textarea
                            placeholder="Enter answer..."
                            value={card.answer}
                            onChange={(e) => handleCardChange(index, 'answer', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDeck}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    {editingDeckId ? 'Update' : 'Save'} Deck
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard Grid */}
      {state.flashcardDecks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first flashcard deck manually or use AI to generate them
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  resetForm()
                  setShowAIGenerator(true)
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setShowCreateForm(true)
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.flashcardDecks.map((deck, deckIndex) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: deckIndex * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{deck.topic}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDeck(deck.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deck.cards.slice(0, 2).map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="p-3 bg-muted rounded-lg text-sm"
                      >
                        <p className="font-medium text-xs text-muted-foreground mb-1">Q:</p>
                        <p className="line-clamp-1 mb-2">{card.question}</p>
                        <p className="font-medium text-xs text-muted-foreground mb-1">A:</p>
                        <p className="line-clamp-1 text-muted-foreground">{card.answer}</p>
                      </div>
                    ))}
                    {deck.cards.length > 2 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{deck.cards.length - 2} more card{deck.cards.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                    
                    <Button
                      onClick={() => handleViewDeck(deck.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Flashcards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Flashcard Viewer Modal */}
      <AnimatePresence>
        {viewingDeckId && (() => {
          const viewingDeck = state.flashcardDecks.find(d => d.id === viewingDeckId)
          if (!viewingDeck) return null
          
          const currentCard = viewingDeck.cards[currentCardIndex]
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={handleCloseViewer}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{viewingDeck.topic}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Card {currentCardIndex + 1} of {viewingDeck.cards.length}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseViewer}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Flip Card */}
                    <div
                      className="relative min-h-[300px] cursor-pointer"
                      onClick={handleFlipCard}
                    >
                      <AnimatePresence mode="wait">
                        {!isFlipped ? (
                          <motion.div
                            key="question"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center"
                          >
                            <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground mb-3">Question</p>
                            <p className="text-xl font-medium text-center">{currentCard.question}</p>
                            <p className="text-sm text-muted-foreground mt-6">Click to flip</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="answer"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 p-8 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 rounded-lg border-2 border-green-200 dark:border-green-800 flex flex-col items-center justify-center"
                          >
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground mb-3">Answer</p>
                            <p className="text-lg text-center">{currentCard.answer}</p>
                            <p className="text-sm text-muted-foreground mt-6">Click to flip back</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        onClick={handlePreviousCard}
                        disabled={currentCardIndex === 0}
                        variant="outline"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      <Button
                        onClick={handleFlipCard}
                        variant="outline"
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Flip Card
                      </Button>

                      <Button
                        onClick={handleNextCard}
                        disabled={currentCardIndex === viewingDeck.cards.length - 1}
                        variant="outline"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
