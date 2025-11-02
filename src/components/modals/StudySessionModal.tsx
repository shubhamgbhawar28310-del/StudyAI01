import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { useToast } from '@/hooks/use-toast';
import {
  getTaskFiles,
  getTaskNotes,
  getTaskFileData,
  downloadFile,
  formatFileSize,
} from '@/services/taskFilesService';
import {
  Calendar,
  Clock,
  Flag,
  FileText,
  StickyNote,
  CheckCircle,
  Target,
  TrendingUp,
  Download,
  Eye,
  PaperclipIcon,
  Timer,
  BookOpen,
  Edit,
  RefreshCw,
  Settings,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { PomodoroTimer } from '@/components/features/PomodoroTimer';

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
}

export function StudySessionModal({ isOpen, onClose, eventId }: StudySessionModalProps) {
  const {
    state,
    updateScheduleEvent,
    updateTask,
    getMaterialsByTask,
  } = useStudyPlanner();
  
  const { toast } = useToast();
  
  // State
  const [event, setEvent] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [taskNotes, setTaskNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Time editing state
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  // Pomodoro customization state
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [customWorkDuration, setCustomWorkDuration] = useState(25);
  const [customBreakDuration, setCustomBreakDuration] = useState(5);
  const [customLongBreakDuration, setCustomLongBreakDuration] = useState(15);
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && eventId) {
      loadEventData();
    } else {
      resetState();
    }
  }, [isOpen, eventId]);
  
  const resetState = () => {
    setEvent(null);
    setTask(null);
    setUploadedFiles([]);
    setTaskNotes([]);
    setMaterials([]);
    setIsRefreshing(false);
    setIsEditingTime(false);
    setEditStartTime('');
    setEditEndTime('');
    setShowPomodoroSettings(false);
    setCustomWorkDuration(25);
    setCustomBreakDuration(5);
    setCustomLongBreakDuration(15);
  };
  
  const loadEventData = async () => {
    if (!eventId) return;
    
    setIsRefreshing(true);
    
    try {
      // Always fetch fresh event data
      const foundEvent = state.scheduleEvents.find(e => e.id === eventId);
      if (!foundEvent) {
        toast({
          title: '❌ Error',
          description: 'Event not found',
          variant: 'destructive',
        });
        onClose();
        return;
      }
      
      setEvent(foundEvent);
      
      // Load task if linked - always fetch fresh data
      if (foundEvent.taskId) {
        // Find task by ID from state
        const linkedTask = state.tasks.find(t => t.id === foundEvent.taskId);
        if (linkedTask) {
          setTask(linkedTask);
          
          // Load task files and notes - fresh data
          try {
            const [files, notes] = await Promise.all([
              getTaskFiles(linkedTask.id),
              getTaskNotes(linkedTask.id),
            ]);
            
            setUploadedFiles(files || []);
            setTaskNotes(notes || []);
            
            // Get materials from context
            const taskMaterials = getMaterialsByTask(linkedTask.id);
            setMaterials(taskMaterials || []);
          } catch (error) {
            console.error('Error loading task files/notes:', error);
            setUploadedFiles([]);
            setTaskNotes([]);
            setMaterials([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load event data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleRefreshData = () => {
    loadEventData();
    toast({
      title: '🔄 Refreshed',
      description: 'Event data updated',
    });
  };
  
  const handleSessionComplete = (pomodoroCount: number, totalMinutes: number) => {
    if (!event) return;
    
    // Update event as completed
    const updatedEvent = {
      ...event,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    };
    
    updateScheduleEvent(updatedEvent);
    
    // Update task if linked
    if (task) {
      const progressIncrease = pomodoroCount * 10; // 10% per pomodoro
      const newProgress = Math.min(100, task.progress + progressIncrease);
      const newStatus = newProgress >= 100 ? 'completed' : 'in_progress';
      
      updateTask({
        ...task,
        progress: newProgress,
        status: newStatus as any,
        completed: newProgress >= 100,
        updatedAt: new Date().toISOString(),
      });
    }
    
    toast({
      title: '✅ Session Complete!',
      description: `Great job! ${pomodoroCount} pomodoros completed. +${pomodoroCount * 20} XP`,
    });
    
    // Reset and close
    resetState();
    onClose();
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  const handleViewFile = async (fileId: string) => {
    const fileData = await getTaskFileData(fileId);
    if (fileData) {
      window.open(fileData, '_blank');
    }
  };
  
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    const fileData = await getTaskFileData(fileId);
    if (fileData) {
      downloadFile(fileData, fileName);
    }
  };
  
  if (!event) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div className="mb-3">
                <h2 className="text-2xl font-bold mb-2 break-words pr-8">
                  {event.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(event.status || 'scheduled')}>
                    {event.status || 'scheduled'}
                  </Badge>
                  
                  {task && (
                    <>
                      <Badge className={getPriorityColor(task.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                      
                      {task.subject && (
                        <Badge variant="outline">{task.subject}</Badge>
                      )}
                    </>
                  )}
                  
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(event.startTime), 'MMM d, h:mm a')}
                  </Badge>
                </div>
              </div>
              
              {/* Refresh Button */}
              <div className="pt-3 border-t border-white/20 dark:border-black/20">
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Task Data
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="timer" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="timer">Timer</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="files">
                    Files ({uploadedFiles.length + materials.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    Notes ({taskNotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                </TabsList>
                
                {/* Timer Tab */}
                <TabsContent value="timer" className="h-[400px] overflow-y-scroll border rounded p-4 space-y-4">
                  {event.status !== 'completed' ? (
                    <>
                      {/* Pomodoro Settings */}
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Pomodoro Settings
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPomodoroSettings(!showPomodoroSettings)}
                          >
                            {showPomodoroSettings ? 'Hide' : 'Customize'}
                          </Button>
                        </div>
                        
                        {showPomodoroSettings && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="work-duration" className="text-xs">
                                  Work Duration (min)
                                </Label>
                                <Input
                                  id="work-duration"
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={customWorkDuration}
                                  onChange={(e) => setCustomWorkDuration(Number(e.target.value))}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="break-duration" className="text-xs">
                                  Short Break (min)
                                </Label>
                                <Input
                                  id="break-duration"
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={customBreakDuration}
                                  onChange={(e) => setCustomBreakDuration(Number(e.target.value))}
                                  className="h-8"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="long-break-duration" className="text-xs">
                                  Long Break (min)
                                </Label>
                                <Input
                                  id="long-break-duration"
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={customLongBreakDuration}
                                  onChange={(e) => setCustomLongBreakDuration(Number(e.target.value))}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Force re-render of PomodoroTimer with new settings
                                  toast({
                                    title: '⚙️ Settings Applied',
                                    description: `Work: ${customWorkDuration}m, Break: ${customBreakDuration}m, Long Break: ${customLongBreakDuration}m`,
                                  });
                                  setShowPomodoroSettings(false);
                                }}
                                className="flex-1"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Apply Settings
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCustomWorkDuration(25);
                                  setCustomBreakDuration(5);
                                  setCustomLongBreakDuration(15);
                                }}
                              >
                                Reset
                              </Button>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              💡 Tip: Standard Pomodoro is 25min work + 5min break. Customize based on your focus needs!
                            </div>
                          </div>
                        )}
                        
                        {!showPomodoroSettings && (
                          <div className="text-sm text-muted-foreground">
                            Current: {customWorkDuration}m work • {customBreakDuration}m break • {customLongBreakDuration}m long break
                          </div>
                        )}
                      </div>
                      
                      {/* Pomodoro Timer */}
                      <PomodoroTimer
                        key={`${customWorkDuration}-${customBreakDuration}-${customLongBreakDuration}`}
                        taskId={task?.id}
                        eventId={event.id}
                        onSessionComplete={handleSessionComplete}
                        customWorkDuration={customWorkDuration}
                        customBreakDuration={customBreakDuration}
                        customLongBreakDuration={customLongBreakDuration}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold mb-2">Session Completed</h3>
                      <p className="text-muted-foreground">
                        This study session has been completed
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="h-[400px] overflow-y-scroll border rounded p-4 space-y-4">
                    <div className="space-y-4">
                      {event.description && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Description
                          </h3>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="whitespace-pre-wrap">{event.description}</p>
                          </div>
                        </div>
                      )}
                      
                      {task && (
                    <>
                      {task.description && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Task Description
                          </h3>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="whitespace-pre-wrap">{task.description}</p>
                          </div>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        {task.dueDate && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                              Deadline
                            </h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">
                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {task.estimate && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                              Estimated Time
                            </h3>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{task.estimate}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      </>
                      )}
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Event Time
                      </h3>
                      <p className="text-sm">
                        {format(new Date(event.startTime), 'h:mm a')} -{' '}
                        {format(new Date(event.endTime), 'h:mm a')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Event Type
                      </h3>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                      </div>
                      
                      {/* Complete Actions - ALWAYS VISIBLE */}
                      <Separator />
                      
                      <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Quick Actions
                    </h3>
                    
                    {event.status === 'completed' ? (
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Event Completed
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          {event.completedAt && format(new Date(event.completedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {task && !task.completed && (
                          <Button
                            onClick={() => {
                              updateTask({
                                ...task,
                                status: 'completed',
                                completed: true,
                                progress: 100,
                                updatedAt: new Date().toISOString(),
                              });
                              
                              toast({
                                title: '✅ Task Completed!',
                                description: 'Great job! Task marked as complete',
                              });
                              
                              loadEventData();
                            }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Task
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => {
                            const updatedEvent = {
                              ...event,
                              status: 'completed' as const,
                              completedAt: new Date().toISOString(),
                            };
                            updateScheduleEvent(updatedEvent);
                            
                            if (task) {
                              updateTask({
                                ...task,
                                status: 'completed',
                                completed: true,
                                progress: 100,
                                updatedAt: new Date().toISOString(),
                              });
                            }
                            
                            toast({
                              title: '✅ Event Completed!',
                              description: task ? 'Event and task marked as complete' : 'Event marked as complete',
                              });
                            
                            onClose();
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Event
                        </Button>
                      </div>
                    )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4">
                  {uploadedFiles.length === 0 && materials.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No files attached</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.file_size)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewFile(file.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadFile(file.id, file.file_name)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <BookOpen className="h-8 w-8 text-purple-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{material.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {material.type}
                              </p>
                            </div>
                            <Badge variant="outline">{material.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  {taskNotes.length === 0 ? (
                    <div className="text-center py-12">
                      <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No notes yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {taskNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-4 border rounded-lg bg-card"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <StickyNote className="h-4 w-4 text-yellow-500" />
                              <h4 className="font-medium">
                                {note.title || 'Task Note'}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {note.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                {/* Progress Tab */}
                <TabsContent value="progress" className="space-y-4">
                  {task ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Task Progress
                          </h3>
                          <span className="text-2xl font-bold">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-3" />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium">Status</h4>
                          </div>
                          <Badge className={getStatusColor(task.status || 'pending')}>
                            {task.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <h4 className="font-medium">Completion</h4>
                          </div>
                          <p className="text-2xl font-bold">
                            {task.completed ? '100%' : `${task.progress}%`}
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!task.completed && (
                          <Button
                            onClick={() => {
                              updateTask({
                                ...task,
                                status: 'completed',
                                completed: true,
                                progress: 100,
                                updatedAt: new Date().toISOString(),
                              });
                              
                              toast({
                                title: '✅ Task Completed!',
                                description: 'Great job! Task marked as complete',
                              });
                              
                              // Refresh data
                              loadEventData();
                            }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Task
                          </Button>
                        )}
                        
                        {event.status !== 'completed' && (
                          <Button
                            onClick={() => {
                              const updatedEvent = {
                                ...event,
                                status: 'completed' as const,
                                completedAt: new Date().toISOString(),
                              };
                              updateScheduleEvent(updatedEvent);
                              
                              toast({
                                title: '✅ Event Completed!',
                                description: 'Study session marked as complete',
                              });
                              
                              // Refresh data
                              loadEventData();
                            }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Event
                          </Button>
                        )}
                      </div>
                      
                      {event.status === 'in_progress' && (
                        <>
                          <Separator />
                          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                            <div className="flex items-center gap-2 mb-2">
                              <Timer className="h-5 w-5 text-blue-600" />
                              <h4 className="font-medium">Session Active</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Use the Timer tab to track your progress! 🎯
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        No task linked to this event
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {task && (
                    <>
                      <span className="flex items-center gap-1">
                        <PaperclipIcon className="h-4 w-4" />
                        {uploadedFiles.length + materials.length} files
                      </span>
                      <span className="flex items-center gap-1">
                        <StickyNote className="h-4 w-4" />
                        {taskNotes.length} notes
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {event.status === 'completed' ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => {
                        // Mark event as completed
                        const updatedEvent = {
                          ...event,
                          status: 'completed' as const,
                          completedAt: new Date().toISOString(),
                        };
                        updateScheduleEvent(updatedEvent);
                        
                        // Mark task as completed if linked
                        if (task) {
                          updateTask({
                            ...task,
                            status: 'completed',
                            completed: true,
                            progress: 100,
                            updatedAt: new Date().toISOString(),
                          });
                        }
                        
                        toast({
                          title: '✅ Event Completed!',
                          description: task ? 'Event and task marked as complete' : 'Event marked as complete',
                        });
                        
                        onClose();
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
