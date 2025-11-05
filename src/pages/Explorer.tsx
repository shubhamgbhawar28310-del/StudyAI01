import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Brain,
  TrendingUp,
  FolderOpen,
  Timer,
  Compass,
  Zap,
  Target
} from 'lucide-react'

interface ExplorerProps {
  setActiveTab: (tab: string) => void
}

const tools = [
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Get instant help with your studies using advanced AI technology',
    icon: Bot,
    badge: 'Beta',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Create and study with interactive flashcards for better retention',
    icon: Brain,
    badge: null,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track your progress and visualize your study patterns',
    icon: TrendingUp,
    badge: null,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    id: 'materials',
    title: 'Materials',
    description: 'Organize and access all your study materials in one place',
    icon: FolderOpen,
    badge: null,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
  },
  {
    id: 'pomodoro-timer',
    title: 'Pomodoro Timer',
    description: 'Stay focused with the proven Pomodoro technique',
    icon: Timer,
    badge: null,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20'
  },
]

export function Explorer({ setActiveTab }: ExplorerProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Explorer
            </h1>
            <p className="text-muted-foreground">
              Discover powerful tools to enhance your learning experience
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800 group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    {tool.badge && (
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setActiveTab(tool.id)}
                    className={`w-full bg-gradient-to-r ${tool.color} text-white hover:opacity-90 transition-opacity`}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Study Groups', description: 'Collaborate with peers' },
            { title: 'Quiz Generator', description: 'Auto-generate practice quizzes' },
            { title: 'NoteIQ', description: 'Smart note-taking with AI' },
            { title: 'Smart Schedule', description: 'Let AI plan your study time' },
          ].map((item, index) => (
            <Card key={index} className="opacity-60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {item.title}
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
