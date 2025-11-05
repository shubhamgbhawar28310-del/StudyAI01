import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Brain, 
  Sparkles 
} from 'lucide-react'

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
  const examplePrompts = [
    "Help me create a study schedule for my upcoming exams",
    "Generate flashcards for my biology chapter",
    "Create a mind map for my history project",
    "Analyze my study habits and suggest improvements"
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Aivy
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Your intelligent study companion. Ask me anything about your studies, and I'll help you succeed!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        {examplePrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => onPromptClick(prompt)}
            className="h-auto p-6 text-left justify-start hover:bg-accent transition-colors group"
          >
            <div className="flex items-start gap-4 w-full">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {index === 0 && <Calendar className="w-5 h-5" />}
                {index === 1 && <BookOpen className="w-5 h-5" />}
                {index === 2 && <Brain className="w-5 h-5" />}
                {index === 3 && <Sparkles className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{prompt}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}