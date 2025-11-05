import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MOTIVATIONAL_QUOTES = [
  "Discipline beats motivation — consistency wins the war.",
  "The expert in anything was once a beginner.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "Learning is not attained by chance, it must be sought for with ardor.",
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Focus on being productive instead of busy.",
  "Small daily improvements over time lead to stunning results.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it."
]

export function MotivationalQuote() {
  const [quote, setQuote] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
    return MOTIVATIONAL_QUOTES[randomIndex]
  }

  const refreshQuote = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setQuote(getRandomQuote())
      setIsRefreshing(false)
    }, 300)
  }

  useEffect(() => {
    setQuote(getRandomQuote())
    
    // Auto-rotate quotes every 30 seconds
    const interval = setInterval(() => {
      setQuote(getRandomQuote())
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative mt-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-100 dark:border-blue-900/30 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-1" />
        
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={quote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm sm:text-base italic text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {quote}
            </motion.p>
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={refreshQuote}
          disabled={isRefreshing}
          className="h-8 w-8 p-0 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          title="Get new quote"
        >
          <RefreshCw 
            className={`h-4 w-4 text-blue-500 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </Button>
      </div>
    </motion.div>
  )
}
