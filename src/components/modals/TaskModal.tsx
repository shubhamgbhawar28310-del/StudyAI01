import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { 
  Plus, 
  X, 
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  PaperclipIcon
} from 'lucide-react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  editingTaskId?: string | null
}

export function TaskModal({ isOpen, onClose, editingTaskId }: TaskModalProps) {
  const { 
    state, 
    addTask, 
    updateTask, 
    getTaskById,
    addMaterial,
    getMaterialsByTask,
    attachMaterialToTask,
    detachMaterialFromTask
  } = useStudyPlanner()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedMaterials, setAttachedMaterials] = useState<string[]>([])
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    difficulty: 'easy' | 'medium' | 'hard'
    subject: string
    dueDate: string
    dueTime: string
    estimate: string
    reminder: string
  }>({
    title: '',
    description: '',
    priority: 'medium',
    difficulty: 'medium',
    subject: '',
    dueDate: '',
    dueTime: '',
    estimate: '',
    reminder: ''
  })

  const [materialForm, setMaterialForm] = useState<{
    title: string
    content: string
    type: 'note' | 'pdf' | 'image' | 'document' | 'link' | 'other'
  }>({
    title: '',
    content: '',
    type: 'note'
  })

  useEffect(() => {
    // Only reset form when modal opens/closes or when explicitly editing a different task
    if (isOpen) {
      if (editingTaskId) {
        const task = getTaskById(editingTaskId)
        if (task) {
          setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            difficulty: task.difficulty || 'medium',
            subject: task.subject || '',
            dueDate: task.dueDate || '',
            dueTime: task.dueTime || '',
            estimate: task.estimate || '',
            reminder: task.reminder || ''
          })
          setAttachedMaterials(task.materialIds || [])
        }
      } else {
        // Only reset if we're opening a fresh modal (not during file upload)
        if (attachedMaterials.length === 0) {
          setFormData({
            title: '',
            description: '',
            priority: 'medium',
            difficulty: 'medium',
            subject: '',
            dueDate: '',
            dueTime: '',
            estimate: '',
            reminder: ''
          })
        }
      }
    } else {
      // Reset everything when modal closes
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        difficulty: 'medium',
        subject: '',
        dueDate: '',
        dueTime: '',
        estimate: '',
        reminder: ''
      })
      setAttachedMaterials([])
      setShowMaterialForm(false)
      setUploadProgress({})
      setIsUploading(false)
    }
  }, [isOpen, editingTaskId, getTaskById])

  const handleSubmit = () => {
    if (!formData.title.trim()) return

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      completed: false,
      priority: formData.priority,
      difficulty: formData.difficulty,
      subject: formData.subject || undefined,
      dueDate: formData.dueDate || undefined,
      dueTime: formData.dueTime || undefined,
      estimate: formData.estimate || undefined,
      reminder: formData.reminder || undefined,
      progress: 0,
      materialIds: attachedMaterials.length > 0 ? attachedMaterials : undefined
    }

    if (editingTaskId) {
      const existingTask = getTaskById(editingTaskId)
      if (existingTask) {
        updateTask({
          ...existingTask,
          ...taskData
        })
        
        // Link materials to task (bidirectional)
        attachedMaterials.forEach(materialId => {
          attachMaterialToTask(materialId, editingTaskId)
        })
      }
    } else {
      // Create task and get the new task ID
      const newTaskId = addTask(taskData)
      
      // Link all attached materials to the new task (bidirectional)
      attachedMaterials.forEach(materialId => {
        attachMaterialToTask(materialId, newTaskId)
      })
    }

    onClose()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    processFiles(Array.from(files))
  }

  const processFiles = (files: File[]) => {
    setIsUploading(true)
    let completedCount = 0
    const totalFiles = files.length
    
    files.forEach((file, index) => {
      // Validate file type
      const validTypes = [
        'text/plain', 'text/markdown',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ]
      
      const isValidType = validTypes.some(type => file.type === type) || 
                         file.name.match(/\.(txt|md|pdf|doc|docx|jpg|jpeg|png|gif|webp)$/i)
      
      if (!isValidType) {
        alert(`File "${file.name}" is not a supported format. Please upload PDF, DOCX, TXT, or image files.`)
        completedCount++
        if (completedCount === totalFiles) {
          setIsUploading(false)
        }
        return
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum file size is 100MB.`)
        completedCount++
        if (completedCount === totalFiles) {
          setIsUploading(false)
        }
        return
      }
      
      const fileId = `upload-${Date.now()}-${index}`
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
      const reader = new FileReader()
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        }
      }
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        const fileType = getFileType(file.type, file.name)
        
        // Extract base64 content for all file types
        let base64Content = ''
        if (typeof content === 'string' && content.startsWith('data:')) {
          base64Content = content.split(',')[1] || ''
        } else {
          base64Content = content
        }
        
        const materialId = addMaterial({
          title: file.name,
          description: `Uploaded for task: ${formData.title || 'New Task'}`,
          type: fileType,
          content: base64Content,
          fileName: file.name,
          fileSize: file.size,
          subject: formData.subject || undefined
        } as any)

        setAttachedMaterials(prev => [...prev, materialId])
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
        
        completedCount++
        if (completedCount === totalFiles) {
          setIsUploading(false)
        }
      }
      
      reader.onerror = () => {
        alert(`Error uploading file "${file.name}". Please try again.`)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
        
        completedCount++
        if (completedCount === totalFiles) {
          setIsUploading(false)
        }
      }
      
      // Read all files as data URL to properly handle binary files
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleViewMaterial = (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (material && material.content) {
      try {
        // Handle different file types appropriately
        if (material.type === 'image') {
          // For images, reconstruct the data URL
          const mimeType = getMimeTypeFromFileName(material.fileName || material.title)
          const dataUrl = `data:${mimeType};base64,${material.content}`
          const newWindow = window.open('', '_blank')
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${material.title}</title>
                  <style>
                    body { margin: 0; padding: 20px; text-align: center; background: #f5f5f5; }
                    img { max-width: 100%; height: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; }
                    .container { max-width: 1200px; margin: 0 auto; }
                    .header { margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>${material.title}</h1>
                      ${material.description ? `<p><em>${material.description}</em></p>` : ''}
                    </div>
                    <img src="${dataUrl}" alt="${material.title}" />
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        }
        // Handle PDF files
        else if (material.type === 'pdf') {
          // Create blob from base64 content
          const byteString = atob(material.content)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([ab], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        }
        // Handle document files (DOC, DOCX, PPT, PPTX, etc.)
        else if (material.type === 'document') {
          // For document files, create blob with proper MIME type
          const mimeType = getMimeTypeFromFileName(material.fileName || material.title)
          const byteString = atob(material.content)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([ab], { type: mimeType })
          const url = URL.createObjectURL(blob)
          
          // Try to open in browser, if not possible, download
          const newWindow = window.open(url, '_blank')
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Pop-up blocked, trigger download
            const a = document.createElement('a')
            a.href = url
            a.download = material.fileName || material.title
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        }
        // Handle text files
        else {
          const newWindow = window.open('', '_blank')
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${material.title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    pre { white-space: pre-wrap; word-wrap: break-word; background: #f8f8f8; padding: 15px; border-radius: 4px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>${material.title}</h1>
                    ${material.description ? `<p><em>${material.description}</em></p>` : ''}
                    <pre>${material.content}</pre>
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        }
      } catch (error) {
        console.error('Error viewing material:', error)
        alert('Error opening file. The file may be corrupted or in an unsupported format.')
      }
    }
  }

  const handleDownloadMaterial = (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (material && material.content) {
      try {
        // Determine MIME type based on file extension
        const mimeType = getMimeTypeFromFileName(material.fileName || material.title)
        
        let blob: Blob
        
        // Handle different file types
        if (material.type === 'image' || material.type === 'pdf' || material.type === 'document') {
          // For binary files, reconstruct from base64
          const byteString = atob(material.content)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          blob = new Blob([ab], { type: mimeType })
        } else {
          // For text files
          blob = new Blob([material.content], { type: mimeType })
        }
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = material.fileName || material.title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading material:', error)
        alert('Error downloading file. Please try again.')
      }
    }
  }

  const handleCreateMaterial = () => {
    if (!materialForm.title.trim() || !materialForm.content.trim()) return

    const materialId = addMaterial({
      title: materialForm.title.trim(),
      content: materialForm.content.trim(),
      type: materialForm.type,
      subject: formData.subject || undefined,
      description: `Created for task: ${formData.title || 'New Task'}`
    })

    setAttachedMaterials(prev => [...prev, materialId])
    setMaterialForm({
      title: '',
      content: '',
      type: 'note'
    })
    setShowMaterialForm(false)
  }

  const handleRemoveMaterial = (materialId: string) => {
    setAttachedMaterials(prev => prev.filter(id => id !== materialId))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const getFileType = (mimeType: string, fileName: string): 'note' | 'pdf' | 'image' | 'document' | 'link' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document') || 
        fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'document'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') ||
        fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'document'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') ||
        fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'document'
    if (mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) return 'note'
    return 'other'
  }

  const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'pdf':
        return 'application/pdf'
      case 'doc':
        return 'application/msword'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'ppt':
        return 'application/vnd.ms-powerpoint'
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      case 'xls':
        return 'application/vnd.ms-excel'
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'txt':
        return 'text/plain'
      case 'md':
        return 'text/markdown'
      default:
        return 'application/octet-stream'
    }
  }

  const getFileExtension = (type: string): string => {
    switch (type) {
      case 'image': return 'jpg'
      case 'pdf': return 'pdf'
      case 'document': return 'txt'
      case 'note': return 'txt'
      default: return 'txt'
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTaskId ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Task Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Title *
              </label>
              <Input
                placeholder="Task title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Priority
              </label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Difficulty
              </label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
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
                  <SelectItem value="none">No Subject</SelectItem>
                  {['Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Economics', 'Psychology', 'Other'].map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Estimate
              </label>
              <Select 
                value={formData.estimate} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, estimate: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time estimate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Estimate</SelectItem>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="2h">2 hours</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="2d">2 days</SelectItem>
                  <SelectItem value="1w">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Due Time
              </label>
              <Input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <Textarea
              placeholder="Task description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Materials Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Materials & Notes</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMaterialForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Create Material Form */}
            {showMaterialForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-4 border rounded-lg bg-muted/30"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Note title..."
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Select 
                      value={materialForm.type} 
                      onValueChange={(value: 'note' | 'pdf' | 'image' | 'document' | 'link' | 'other') => 
                        setMaterialForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Note content..."
                    value={materialForm.content}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateMaterial}
                      disabled={!materialForm.title.trim() || !materialForm.content.trim()}
                    >
                      Add Note
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMaterialForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="p-3 border rounded-lg bg-muted/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-border bg-muted/10'
                }
                ${attachedMaterials.length > 0 ? 'mb-3' : ''}
              `}
            >
              <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <p className={`text-sm ${isDragging ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-muted-foreground'}`}>
                {isDragging ? 'Drop files here' : 'Drag and drop files here, or click Upload Files'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported: PDF, DOCX, TXT, Images (max 10MB)
              </p>
            </div>

            {/* Attached Materials */}
            {attachedMaterials.length > 0 && (
              <div className="space-y-2">
                {attachedMaterials.map(materialId => {
                  const material = state.materials.find(m => m.id === materialId)
                  if (!material) return null

                  return (
                    <div key={materialId} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <span className="text-lg">{getTypeIcon(material.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{material.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.type} • {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {material.content && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMaterial(materialId)}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        {material.content && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadMaterial(materialId)}
                            className="h-8 w-8 p-0"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMaterial(materialId)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {attachedMaterials.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <PaperclipIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No materials attached</p>
                <p className="text-xs">Upload files or create notes to attach to this task</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title.trim() || isUploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isUploading ? 'Uploading...' : (editingTaskId ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}