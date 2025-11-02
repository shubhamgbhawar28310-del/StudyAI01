import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getTaskFiles,
  getTaskNotes,
  deleteTaskFile,
  deleteTaskNote,
  getTaskFileData,
  downloadFile,
  formatFileSize,
} from '@/services/taskFilesService';
import {
  X,
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Download,
  Eye,
  FileText,
  StickyNote,
  PaperclipIcon,
  Plus,
  Save,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

export function TaskDetailModal({ isOpen, onClose, taskId }: TaskDetailModalProps) {
  const { state, updateTask, deleteTask, getTaskById, getMaterialsByTask } = useStudyPlanner();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [taskNotes, setTaskNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'missed',
  });

  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskDetails();
    } else {
      resetState();
    }
  }, [isOpen, taskId]);

  const resetState = () => {
    setTask(null);
    setIsEditing(false);
    setIsLoading(true);
    setUploadedFiles([]);
    setTaskNotes([]);
    setMaterials([]);
    setDateError('');
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate due date
  const validateDueDate = (date: string): boolean => {
    if (!date) {
      setDateError('');
      return true;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setDateError('Due date cannot be in the past');
      return false;
    }

    setDateError('');
    return true;
  };

  // Handle date change with validation
  const handleDateChange = (date: string) => {
    setEditForm((prev) => ({ ...prev, dueDate: date }));
    validateDueDate(date);
  };

  const loadTaskDetails = async () => {
    if (!taskId) return;

    setIsLoading(true);
    try {
      // Get task from context
      const taskData = getTaskById(taskId);
      if (!taskData) {
        toast({
          title: '❌ Error',
          description: 'Task not found',
          variant: 'destructive',
        });
        onClose();
        return;
      }

      setTask(taskData);
      setEditForm({
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority,
        dueDate: taskData.dueDate || '',
        status: taskData.status || 'pending',
      });

      // Load files and notes
      const [files, notes] = await Promise.all([
        getTaskFiles(taskId),
        getTaskNotes(taskId),
      ]);

      setUploadedFiles(files);
      setTaskNotes(notes);

      // Get materials from context
      const taskMaterials = getMaterialsByTask(taskId);
      setMaterials(taskMaterials);
    } catch (error) {
      console.error('Error loading task details:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to load task details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = () => {
    if (!task) return;

    // Validate date before saving
    const isDateValid = validateDueDate(editForm.dueDate);

    if (!isDateValid) {
      toast({
        title: '❌ Invalid Date',
        description: 'Please fix the date error before saving',
        variant: 'destructive',
      });
      return;
    }

    updateTask({
      ...task,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      dueDate: editForm.dueDate,
      status: editForm.status,
    });

    setTask({
      ...task,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      dueDate: editForm.dueDate,
      status: editForm.status,
    });

    setIsEditing(false);
    toast({
      title: '✅ Success',
      description: 'Task updated successfully',
    });
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate || '',
        status: task.status || 'pending',
      });
    }
    setDateError('');
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    if (!task) return;

    const newStatus = task.completed ? 'pending' : 'completed';
    updateTask({
      ...task,
      completed: !task.completed,
      status: newStatus,
    });

    setTask({
      ...task,
      completed: !task.completed,
      status: newStatus,
    });

    toast({
      title: task.completed ? '📝 Task Reopened' : '✅ Task Completed',
      description: task.completed
        ? 'Task marked as pending'
        : 'Great job! Task marked as completed',
    });
  };

  const handleDeleteTask = () => {
    if (!task) return;

    if (confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      deleteTask(task.id);
      toast({
        title: '🗑️ Task Deleted',
        description: 'Task and all attachments have been removed',
      });
      onClose();
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

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const success = await deleteTaskFile(fileId);
      if (success) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast({
          title: '🗑️ File Deleted',
          description: 'File has been removed',
        });
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const success = await deleteTaskNote(noteId);
      if (success) {
        setTaskNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast({
          title: '🗑️ Note Deleted',
          description: 'Note has been removed',
        });
      }
    }
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task?.status !== 'completed';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-96"
            >
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading task details...</p>
              </div>
            </motion.div>
          ) : task ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <div className="px-6 py-5 space-y-4">
                  {/* Title Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="text-2xl font-bold h-auto py-2"
                          placeholder="Task title"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold break-words leading-tight">
                          {task.title}
                        </h2>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row - Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getPriorityColor(task.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>

                      <Badge className={getStatusColor(task.status || 'pending')}>
                        {task.status || 'pending'}
                      </Badge>

                      {task.subject && (
                        <Badge variant="outline" className="font-medium">
                          {task.subject}
                        </Badge>
                      )}

                      {task.dueDate && (
                        <Badge
                          variant={isOverdue(task.dueDate) ? 'destructive' : 'secondary'}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && ' (Overdue)'}
                        </Badge>
                      )}

                      {task.estimate && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimate}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/20 dark:border-black/20">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!!dateError}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4 mr-1.5" />
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="bg-white/50 dark:bg-black/20"
                          >
                            <Edit2 className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={task.completed ? 'outline' : 'default'}
                            onClick={handleToggleComplete}
                            className={
                              task.completed
                                ? 'bg-white/50 dark:bg-black/20'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }
                          >
                            {task.completed ? (
                              <>
                                <Circle className="h-4 w-4 mr-1.5" />
                                Reopen
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Complete
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Delete button separated on the right */}
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteTask}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="files">
                      Files ({uploadedFiles.length + materials.length})
                    </TabsTrigger>
                    <TabsTrigger value="notes">Notes ({taskNotes.length})</TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Description
                      </h3>
                      {isEditing ? (
                        <Textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          rows={6}
                          placeholder="Add a description..."
                        />
                      ) : (
                        <div className="p-4 bg-muted/30 rounded-lg min-h-[100px]">
                          {task.description ? (
                            <p className="whitespace-pre-wrap">{task.description}</p>
                          ) : (
                            <p className="text-muted-foreground italic">
                              No description provided
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Priority
                        </h3>
                        {isEditing ? (
                          <select
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priority: e.target.value as any,
                              })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        ) : (
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Status
                        </h3>
                        {isEditing ? (
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({ ...editForm, status: e.target.value as any })
                            }
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                          </select>
                        ) : (
                          <Badge className={getStatusColor(task.status || 'pending')}>
                            {task.status || 'pending'}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Due Date
                        </h3>
                        {isEditing ? (
                          <div>
                            <Input
                              type="date"
                              value={editForm.dueDate}
                              min={getTodayDate()}
                              onChange={(e) => handleDateChange(e.target.value)}
                              className={dateError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {dateError && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span className="font-bold">⚠</span> {dateError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">
                            {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Created
                        </h3>
                        <p className="text-sm">{formatDate(task.createdAt)}</p>
                      </div>
                    </div>

                    {task.estimate && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Estimated Time
                        </h3>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimate}
                        </Badge>
                      </div>
                    )}
                  </TabsContent>

                  {/* Files Tab */}
                  <TabsContent value="files" className="space-y-4">
                    {uploadedFiles.length === 0 && materials.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No files attached</h3>
                        <p className="text-muted-foreground mb-4">
                          Upload files to attach them to this task
                        </p>
                        <Button
                          onClick={() => {
                            // Open TaskModal in edit mode to add files
                            onClose();
                            // Trigger edit modal
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Files
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Uploaded Files */}
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.file_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(file.file_size)} •{' '}
                                  {new Date(file.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewFile(file.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadFile(file.id, file.file_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Materials from Context */}
                        {materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-8 w-8 text-purple-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{material.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {material.type} •{' '}
                                  {new Date(material.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <Badge variant="outline">{material.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="space-y-4">
                    {taskNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add notes to keep track of important information
                        </p>
                        <Button
                          onClick={() => {
                            // Open TaskModal in edit mode to add notes
                            onClose();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {taskNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4 text-yellow-500" />
                                <h4 className="font-medium">
                                  {note.title || 'Task Note'}
                                </h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {note.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(note.created_at).toLocaleDateString()} at{' '}
                              {new Date(note.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-muted/30">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <PaperclipIcon className="h-4 w-4" />
                      {uploadedFiles.length + materials.length} files
                    </span>
                    <span className="flex items-center gap-1">
                      <StickyNote className="h-4 w-4" />
                      {taskNotes.length} notes
                    </span>
                  </div>
                  <span>Last updated: {formatDate(task.updatedAt)}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-96"
            >
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Task Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The task you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={onClose}>Close</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
