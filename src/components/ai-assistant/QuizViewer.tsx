import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronRight, RotateCcw, CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface QuizQuestion {
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  answer: string
  explanation?: string
}

interface Quiz {
  title: string
  questions: QuizQuestion[]
}

interface QuizViewerProps {
  quiz: Quiz | string
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ quiz }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({})
  const [showResults, setShowResults] = useState(false)
  
  // Check if quiz is a string (markdown content) or object (structured data)
  const isMarkdownContent = typeof quiz === 'string'

  // For structured quizzes
  const structuredQuiz = typeof quiz === 'object' ? quiz as Quiz : null
  const currentQuestion = structuredQuiz?.questions[currentIndex]
  const isSubmitted = submitted[currentIndex]
  const userAnswer = userAnswers[currentIndex]
  const isCorrect = currentQuestion && isSubmitted && userAnswer?.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()

  const handleAnswerChange = (answer: string) => {
    if (isSubmitted || !structuredQuiz) return
    setUserAnswers(prev => ({ ...prev, [currentIndex]: answer }))
  }

  const handleSubmit = () => {
    if (!userAnswer?.trim() || !structuredQuiz) return
    setSubmitted(prev => ({...prev, [currentIndex]: true }))
  }

  const handleNext = () => {
    if (!structuredQuiz) return
    if (currentIndex < structuredQuiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const score = structuredQuiz ? Object.keys(submitted).reduce((acc, key) => {
    const index = parseInt(key, 10)
    if(userAnswers[index]?.toLowerCase().trim() === structuredQuiz.questions[index].answer.toLowerCase().trim()) {
      return acc + 1
    }
    return acc
  }, 0) : 0

  const restartQuiz = () => {
    setCurrentIndex(0)
    setUserAnswers({})
    setSubmitted({})
    setShowResults(false)
  }

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Quiz</h3>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{quiz as string}</div>
        </div>
      </div>
    )
  }

  if (showResults && structuredQuiz) {
    return (
      <div className="mt-4 w-full max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {score}/{structuredQuiz.questions.length}
            </div>
            <p className="text-lg mb-4">
              {score === structuredQuiz.questions.length ? 'Perfect! 🎉' : 
               score >= structuredQuiz.questions.length * 0.8 ? 'Great job! 👍' :
               score >= structuredQuiz.questions.length * 0.6 ? 'Good effort! 👌' :
               'Keep practicing! 💪'}
            </p>
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(score / structuredQuiz.questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round((score / structuredQuiz.questions.length) * 100)}% Correct
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={restartQuiz} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!structuredQuiz) return null
  
  return (
    <div className="mt-4 w-full max-w-2xl mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-xl font-bold">{structuredQuiz.title}</CardTitle>
            <Badge variant="secondary" className="text-sm">
              Question {currentIndex + 1} of {structuredQuiz.questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <p className="font-semibold text-lg mb-4">{currentQuestion?.question}</p>
            
            <div className="space-y-3">
              {currentQuestion?.type === 'multiple_choice' && currentQuestion.options?.map((option, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswerChange(option)}
                  disabled={isSubmitted}
                  variant={userAnswer === option ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-3 px-4 text-left whitespace-normal"
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </Button>
              ))}
              {currentQuestion?.type === 'true_false' && ['True', 'False'].map((option, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswerChange(option)}
                  disabled={isSubmitted}
                  variant={userAnswer === option ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-3 px-4 text-left"
                >
                  {option}
                </Button>
              ))}
              {currentQuestion?.type === 'short_answer' && (
                <div className="space-y-2">
                  <Input 
                    value={userAnswer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Type your answer here..."
                    className="text-base"
                  />
                </div>
              )}
            </div>

            {isSubmitted && currentQuestion && (
              <div className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-bold">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                
                {!isCorrect && (
                  <p className="mb-2">
                    <span className="font-medium">Correct Answer:</span> {currentQuestion.answer}
                  </p>
                )}
                
                {currentQuestion.explanation && (
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p>{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button 
              onClick={handlePrevious} 
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {isSubmitted ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  {currentIndex === structuredQuiz.questions.length - 1 ? (
                    <>
                      Finish Quiz <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next Question <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!userAnswer?.trim()} size="sm">
                  Check Answer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}