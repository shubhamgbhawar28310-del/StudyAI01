import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Send, Sparkles, Bug, Lightbulb, MessageSquare, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { submitFeedback } from '@/services/feedbackService'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

const feedbackTypes = [
  { 
    value: 'bug', 
    label: 'Bug Report', 
    icon: Bug, 
    emoji: '🐞',
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  { 
    value: 'suggestion', 
    label: 'Feature Suggestion', 
    icon: Lightbulb, 
    emoji: '💡',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  { 
    value: 'general', 
    label: 'General Feedback', 
    icon: MessageSquare, 
    emoji: '✨',
    color: 'from-blue-500 to-purple-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
]

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<string>('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const selectedType = feedbackTypes.find(t => t.value === feedbackType)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedbackType || !message.trim()) {
      toast({
        title: 'Oops!',
        description: 'Please select a feedback type and share your thoughts.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    // Submit feedback to Supabase
    const result = await submitFeedback({
      feedback_type: feedbackType as 'bug' | 'suggestion' | 'general',
      message: message.trim(),
      email: email.trim() || undefined
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowSuccess(true)

      // Show success toast
      toast({
        title: '✅ Got it! Thanks for helping improve StudyAI',
        description: 'Your feedback means the world to us 💙',
        duration: 5000
      })
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error || 'Please try again later.',
        variant: 'destructive'
      })
    }
  }

  const handleCloseSuccess = () => {
    setFeedbackType('')
    setMessage('')
    setEmail('')
    setShowSuccess(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal Container - Perfectly Centered */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[90%] sm:w-[80%] md:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20 border border-gray-200/50 dark:border-gray-700/50 pointer-events-auto"
            >

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="space-y-4 mb-6 pt-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <div className="text-center space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      We'd Love Your Thoughts 💙
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto px-2">
                      Hey! Thanks for using StudyAI. We're constantly improving, and your feedback makes a <span className="font-semibold text-indigo-600 dark:text-indigo-400">huge difference</span>. 
                      This project is built for students, by someone who's been there. Let's build something amazing together.
                    </p>
                  </div>
                </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {!showSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Feedback Type - Card Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      What's on your mind?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon
                        const isSelected = feedbackType === type.value
                        return (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() => setFeedbackType(type.value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? `${type.borderColor} ${type.bgColor} shadow-md`
                                : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center ${
                                isSelected ? 'shadow-lg' : 'opacity-70'
                              }`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <span className={`text-xs font-medium text-center leading-tight ${
                                isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {type.label}
                              </span>
                            </div>
                            {isSelected && (
                              <motion.div
                                layoutId="selected-indicator"
                                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Message Textarea with enhanced styling */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Your message
                    </label>
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's working or what's not... Don't hold back — every note helps us make StudyAI smarter."
                        rows={5}
                        className="w-full px-4 py-3 bg-white/90 dark:bg-gray-900/60 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                        {message.length}/500
                      </div>
                    </div>
                  </div>

                  {/* Optional Email with icon */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email <span className="text-gray-400 font-normal text-xs">(optional, for follow-ups)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 pl-10 bg-white/90 dark:bg-gray-900/60 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Submit Button with enhanced styling */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 text-base"
                    >
                      {isSubmitting ? (
                        <motion.div
                          className="flex items-center gap-2"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Heart className="h-5 w-5 fill-current" />
                          <span>Sending your thoughts...</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="flex items-center gap-2"
                          whileHover={{ gap: '12px' }}
                        >
                          <Send className="h-5 w-5" />
                          <span>Submit Feedback</span>
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Bottom Note with enhanced styling */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 pt-2"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-3">
                      <Heart className="h-3 w-3 fill-current text-pink-500" />
                      Every message is read personally by the team
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center space-y-6"
                >
                  {/* Animated Success Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative w-24 h-24 mx-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-xl opacity-50" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                      <motion.div
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={3} />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Success Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Thank You! 💙
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Your thoughts mean a lot. We're on it and will keep making StudyAI better for you!
                    </p>
                  </motion.div>

                  {/* Decorative Elements */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Building something amazing together</span>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </motion.div>

                  {/* Close Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={handleCloseSuccess}
                      className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Close
                    </Button>
                  </motion.div>
                </motion.div>
              )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
