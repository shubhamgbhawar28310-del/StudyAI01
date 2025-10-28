import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { TaskModal } from '@/components/modals/TaskModal'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  CheckSquare, 
  Plus, 
  Calendar,
  Clock,
  Flag,
  Search,
  Trash2,
  Edit,
  Timer,
  Sparkles,
  Filter,
  PaperclipIcon,
  Eye,
  Download,
  Upload,
  FileText,
  Image as ImageIcon
} from 'lucide-react'

interface TaskManagerProps {
  showHeader?: boolean
  maxTasks?: number
  showFilters?: boolean
  compactMode?: boolean
  onTaskSelect?: (taskId: string) => void
}

export function TaskManager({ 
  showHeader = true, 
  maxTasks, 
  showFilters = true, 
  compactMode = false,
  onTaskSelect 
}: TaskManagerProps) {
  const { 
    state, 
    toggleTask, 
    deleteTask, 
    generateFlashcardsForTask, 
    setCurrentPomodoroTask,
    getMaterialsByTask,
    addMaterial
  } = useStudyPlanner()
  
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [searchTerm, setSearchTerm] = useState('')
  const [showAIUploadModal, setShowAIUploadModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'completed' && task.completed) ||
                         (filter === 'pending' && !task.completed)
    
    return matchesSearch && matchesFilter
  }).slice(0, maxTasks)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'secondary'
      case 'medium': return 'default'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId)
    setShowTaskModal(true)
  }

  const handleTaskModalClose = () => {
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const handleStartPomodoro = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      setCurrentPomodoroTask(task)
      // In a real app, this would navigate to pomodoro timer or open it in a modal
      alert(`Pomodoro timer started for: ${task.title}`)
    }
  }

  const handleGenerateFlashcards = (taskId: string) => {
    generateFlashcardsForTask(taskId)
    const task = state.tasks.find(t => t.id === taskId)
    if (task) {
      alert(`Flashcards generated for: ${task.title}`)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setIsAnalyzing(true)
    
    files.forEach(file => {
      // Add the file as a material
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        
        addMaterial({
          title: file.name,
          description: `Uploaded file for AI analysis`,
          type: file.type.includes('image') ? 'image' : 
                file.type.includes('pdf') ? 'pdf' : 
                'document',
          fileName: file.name,
          fileSize: file.size,
          content: file.type.includes('image') ? '' : content,
          tags: ['ai-uploaded']
        })
      }
      
      if (file.type.includes('image')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })

    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      alert(`🤖 AI Analysis Complete!\n\nI've analyzed your ${files.length} file(s) and added them to your materials. Check the AI Assistant tab for detailed suggestions including:\n\n• Suggested study tasks\n• Generated flashcards\n• Recommended schedule\n• Content summaries\n\nClick on "AI Assistant 🤖" in the sidebar to review and accept the suggestions!`)
    }, 3000)
  }

  const handleViewMaterial = (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (material && material.content) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${material.title}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h1>${material.title}</h1>
              <pre style="white-space: pre-wrap;">${material.content}</pre>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    }
  }

  const handleDownloadMaterial = (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (material && material.content) {
      const blob = new Blob([material.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = material.fileName || `${material.title}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'image': return '🖼️'
      case 'document': return '📝'
      case 'note': return '📋'
      default: return '📎'
    }
  }

  const completedTasks = state.tasks.filter(t => t.completed).length
  const pendingTasks = state.tasks.length - completedTasks

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tasks</h2>
            <p className="text-muted-foreground">Manage your study tasks</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 text-purple-700 hover:from-purple-200 hover:to-pink-200"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    🤖
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  📂 AI Upload
                </>
              )}
            </Button>
            <Button 
              onClick={() => setShowTaskModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.ppt,.pptx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {!compactMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{state.tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({state.tasks.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingTasks})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed ({completedTasks})
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {compactMode ? 'Recent Tasks' : `Your Tasks (${filteredTasks.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search' : 'Create your first task to get started'}
              </p>
              {!maxTasks && (
                <div className="flex gap-2 justify-center mt-4">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 text-purple-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    📂 Upload & AI Analyze
                  </Button>
                  <Button 
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTasks.map((task, index) => {
                  const taskMaterials = getMaterialsByTask(task.id)
                  
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-lg transition-all cursor-pointer ${
                        task.completed ? 'bg-muted/30 opacity-75' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => onTaskSelect?.(task.id)}
                    >
                      <div className="flex items-start gap-4 p-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </h4>
                            <Badge 
                              variant={getPriorityBadgeVariant(task.priority)} 
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          
                          {task.description && !compactMode && (
                            <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {task.subject && (
                              <span className="flex items-center gap-1">
                                <Flag className="h-3 w-3" />
                                {task.subject}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {taskMaterials.length > 0 && (
                              <span className="flex items-center gap-1">
                                <PaperclipIcon className="h-3 w-3" />
                                {taskMaterials.length} material{taskMaterials.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {!compactMode && (
                              <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Task Materials */}
                          {taskMaterials.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {taskMaterials.slice(0, compactMode ? 2 : 4).map(material => (
                                <div 
                                  key={material.id}
                                  className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{getTypeIcon(material.type)}</span>
                                  <span className="truncate max-w-[100px]">{material.title}</span>
                                  <div className="flex gap-1">
                                    {material.content && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewMaterial(material.id)}
                                        className="h-5 w-5 p-0"
                                        title="View"
                                      >
                                        <Eye className="h-2 w-2" />
                                      </Button>
                                    )}
                                    {material.content && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadMaterial(material.id)}
                                        className="h-5 w-5 p-0"
                                        title="Download"
                                      >
                                        <Download className="h-2 w-2" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {taskMaterials.length > (compactMode ? 2 : 4) && (
                                <span className="text-xs text-muted-foreground px-2 py-1">
                                  +{taskMaterials.length - (compactMode ? 2 : 4)} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!compactMode && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartPomodoro(task.id)}
                                className="h-8 w-8 p-0"
                                title="Start Pomodoro"
                              >
                                <Timer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateFlashcards(task.id)}
                                className="h-8 w-8 p-0"
                                title="Generate Flashcards"
                                disabled={task.flashcardsGenerated}
                              >
                                <Sparkles className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task.id)}
                            className="h-8 w-8 p-0"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskModal
        isOpen={showTaskModal}
        onClose={handleTaskModalClose}
        editingTaskId={editingTask}
      />
    </div>
  )
}