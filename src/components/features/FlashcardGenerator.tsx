import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useStudyPlanner, Flashcard } from '@/contexts/StudyPlannerContext'
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  Sparkles,
  BookOpen,
  Target,
  Filter,
  Search
} from 'lucide-react'

interface FlashcardGeneratorProps {
  compactMode?: boolean
  maxCards?: number
  showFilters?: boolean
}

export function FlashcardGenerator({ 
  compactMode = false, 
  maxCards, 
  showFilters = true 
}: FlashcardGeneratorProps) {
  const { 
    state, 
    addFlashcard, 
    updateFlashcard, 
    deleteFlashcard,
    generateFlashcardsForTask
  } = useStudyPlanner()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [studyMode, setStudyMode] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [filter, setFilter] = useState('all') // all, easy, medium, hard
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    taskId: ''
  })

  const filteredCards = state.flashcards.filter(card => {
    const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDifficulty = filter === 'all' || card.difficulty === filter
    const matchesSubject = subjectFilter === 'all' || card.subject === subjectFilter
    
    return matchesSearch && matchesDifficulty && matchesSubject
  }).slice(0, maxCards)

  const subjects = [...new Set(state.flashcards.map(card => card.subject).filter(Boolean))]
  const studyCards = filteredCards.filter(card => card.reviewCount === 0 || needsReview(card))

  function needsReview(card: Flashcard) {
    if (!card.nextReview) return true
    return new Date(card.nextReview) <= new Date()
  }

  const handleCreateCard = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return

    addFlashcard({
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      subject: formData.subject || undefined,
      difficulty: formData.difficulty,
      taskId: formData.taskId || undefined
    })

    setFormData({
      question: '',
      answer: '',
      subject: '',
      difficulty: 'medium',
      taskId: ''
    })
    setShowCreateForm(false)
  }

  const handleEditCard = (cardId: string) => {
    const card = state.flashcards.find(c => c.id === cardId)
    if (card) {
      setFormData({
        question: card.question,
        answer: card.answer,
        subject: card.subject || '',
        difficulty: card.difficulty as 'easy' | 'medium' | 'hard',
        taskId: card.taskId || ''
      })
      setEditingCard(cardId)
      setShowCreateForm(true)
    }
  }

  const handleUpdateCard = () => {
    if (!editingCard || !formData.question.trim() || !formData.answer.trim()) return

    const card = state.flashcards.find(c => c.id === editingCard)
    if (card) {
      updateFlashcard({
        ...card,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        subject: formData.subject || undefined,
        difficulty: formData.difficulty,
        taskId: formData.taskId || undefined
      })
    }

    setFormData({
      question: '',
      answer: '',
      subject: '',
      difficulty: 'medium',
      taskId: ''
    })
    setEditingCard(null)
    setShowCreateForm(false)
  }

  const handleStudyResponse = (correct: boolean) => {
    const card = studyCards[currentCardIndex]
    if (!card) return

    const newReviewCount = card.reviewCount + 1
    const newCorrectCount = card.correctCount + (correct ? 1 : 0)
    const accuracy = newCorrectCount / newReviewCount
    
    // Spaced repetition algorithm
    let nextReviewDays = 1
    if (accuracy >= 0.8) {
      nextReviewDays = Math.min(30, Math.pow(2, newReviewCount - 1))
    } else if (accuracy >= 0.6) {
      nextReviewDays = Math.min(7, newReviewCount)
    } else {
      nextReviewDays = 1
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + nextReviewDays)

    updateFlashcard({
      ...card,
      reviewCount: newReviewCount,
      correctCount: newCorrectCount,
      lastReviewed: new Date().toISOString(),
      nextReview: nextReview.toISOString()
    })

    setShowAnswer(false)
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      setStudyMode(false)
      setCurrentCardIndex(0)
      alert(`Study session complete! You reviewed ${studyCards.length} cards.`)
    }
  }

  const handleGenerateFromTask = (taskId: string) => {
    generateFlashcardsForTask(taskId)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'hard': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  if (studyMode && studyCards.length > 0) {
    const currentCard = studyCards[currentCardIndex]
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Study Session
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentCardIndex + 1} / {studyCards.length}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStudyMode(false)
                  setCurrentCardIndex(0)
                  setShowAnswer(false)
                }}
              >
                Exit Study
              </Button>
            </div>
          </div>
          <Progress value={(currentCardIndex / studyCards.length) * 100} className="h-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-4"
          >
            <div className="p-6 bg-muted rounded-lg min-h-[200px] flex items-center justify-center">
              <div>
                <p className="text-lg font-medium mb-2">
                  {showAnswer ? 'Answer:' : 'Question:'}
                </p>
                <p className="text-xl">
                  {showAnswer ? currentCard.answer : currentCard.question}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {currentCard.subject && (
                <Badge variant="outline">{currentCard.subject}</Badge>
              )}
              <Badge className={getDifficultyColor(currentCard.difficulty)}>
                {currentCard.difficulty}
              </Badge>
            </div>

            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                Show Answer
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleStudyResponse(false)}
                  variant="outline"
                  className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleStudyResponse(true)}
                  className="flex-1 bg-green-500 text-white hover:bg-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Correct
                </Button>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {!compactMode && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Flashcards</h2>
            <p className="text-muted-foreground">Create and study with AI-powered flashcards</p>
          </div>
          <div className="flex gap-2">
            {studyCards.length > 0 && (
              <Button
                onClick={() => setStudyMode(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                Study ({studyCards.length})
              </Button>
            )}
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Card
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      {!compactMode && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                  <p className="text-2xl font-bold">{state.flashcards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Need Review</p>
                  <p className="text-2xl font-bold">{studyCards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Mastered</p>
                  <p className="text-2xl font-bold">
                    {state.flashcards.filter(c => c.reviewCount > 0 && (c.correctCount / c.reviewCount) >= 0.8).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">From Tasks</p>
                  <p className="text-2xl font-bold">
                    {state.flashcards.filter(c => c.taskId).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate from Tasks */}
      {!compactMode && state.tasks.filter(t => !t.flashcardsGenerated).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate from Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {state.tasks.filter(t => !t.flashcardsGenerated).slice(0, 6).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.subject}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateFromTask(task.id)}
                    className="ml-2"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flashcards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {subjects.length > 0 && (
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Subject
                    </label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Subject</SelectItem>
                        {['Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Economics', 'Psychology', 'Other'].map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Difficulty
                    </label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as 'easy' | 'medium' | 'hard' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Question *
                  </label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Answer *
                  </label>
                  <Textarea
                    placeholder="Enter the answer..."
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingCard(null)
                      setFormData({
                        question: '',
                        answer: '',
                        subject: '',
                        difficulty: 'medium',
                        taskId: ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingCard ? handleUpdateCard : handleCreateCard}
                    disabled={!formData.question.trim() || !formData.answer.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    {editingCard ? 'Update Card' : 'Create Card'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcards List */}
      {!compactMode && (
        <Card>
          <CardHeader>
            <CardTitle>
              {compactMode ? 'Recent Cards' : `Your Flashcards (${filteredCards.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCards.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search' : 'Create your first flashcard to get started'}
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flashcard
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {card.subject && (
                            <Badge variant="outline" className="text-xs">
                              {card.subject}
                            </Badge>
                          )}
                          <Badge className={`text-xs ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCard(card.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFlashcard(card.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                        <p className="text-sm line-clamp-2">{card.question}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{card.answer}</p>
                      </div>

                      {card.reviewCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Accuracy: {Math.round((card.correctCount / card.reviewCount) * 100)}% 
                          ({card.correctCount}/{card.reviewCount})
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}