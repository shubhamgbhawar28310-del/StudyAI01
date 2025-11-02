import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileUpload, SelectedFile } from '@/components/FileUpload';
import {
  getTaskFiles,
  deleteTaskFile,
  getTaskFileData,
  downloadFile,
  uploadTaskFile,
  createTaskNote,
  getTaskNotes,
  deleteTaskNote,
  formatFileSize,
} from '@/services/taskFilesService';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  X,
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  PaperclipIcon,
  StickyNote,
  Loader2,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTaskId?: string | null;
}

export function TaskModal({ isOpen, onClose, editingTaskId }: TaskModalProps) {
  const { state, addTask, updateTask, getTaskById } = useStudyPlanner();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    subject: '',
    dueDate: '',
    dueTime: '',
    estimate: '',
    reminder: '',
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Note state
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [uploadedNotes, setUploadedNotes] = useState<any[]>([]);

  // Validation state
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingTaskId) {
        const task = getTaskById(editingTaskId);
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
            reminder: task.reminder || '',
          });

          // Load uploaded files and notes for this task
          loadTaskAttachments(editingTaskId);
        }
      } else {
        // Reset form for new task
        resetForm();
      }
    } else {
      // Reset everything when modal closes
      resetForm();
    }
  }, [isOpen, editingTaskId, getTaskById]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      difficulty: 'medium',
      subject: '',
      dueDate: '',
      dueTime: '',
      estimate: '',
      reminder: '',
    });
    setSelectedFiles([]);
    setUploadedFiles([]);
    setNoteContent('');
    setNoteTitle('');
    setUploadedNotes([]);
    setDateError('');
    setTimeError('');
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

  // Validate due time
  const validateDueTime = (time: string, date: string): boolean => {
    if (!time || !date) {
      setTimeError('');
      return true;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only validate time if the date is today
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const selectedDateTime = new Date();
      selectedDateTime.setHours(hours, minutes, 0, 0);

      if (selectedDateTime <= now) {
        setTimeError('Due time must be later than current time');
        return false;
      }
    }

    setTimeError('');
    return true;
  };

  // Handle date change with validation
  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
    validateDueDate(date);
    
    // Re-validate time if it exists
    if (formData.dueTime) {
      validateDueTime(formData.dueTime, date);
    }
  };

  // Handle time change with validation
  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, dueTime: time }));
    validateDueTime(time, formData.dueDate);
  };

  const loadTaskAttachments = async (taskId: string) => {
    try {
      const [files, notes] = await Promise.all([
        getTaskFiles(taskId),
        getTaskNotes(taskId),
      ]);
      setUploadedFiles(files);
      setUploadedNotes(notes);
    } catch (error) {
      console.error('Error loading task attachments:', error);
    }
  };

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    const newFiles: SelectedFile[] = files.map((file) => ({
      file,
      id: uuidv4(),
      status: 'pending',
      progress: 0,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle file removal
  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Upload files to Supabase
  const uploadFilesToSupabase = async (taskId: string): Promise<boolean> => {
    if (!user || selectedFiles.length === 0) return true;

    let successCount = 0;
    let failCount = 0;

    try {
      for (const selectedFile of selectedFiles) {
        if (selectedFile.status === 'success') {
          successCount++;
          continue;
        }

        // Update status to uploading
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === selectedFile.id ? { ...f, status: 'uploading', progress: 0 } : f
          )
        );

        try {
          // Simulate progress
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === selectedFile.id ? { ...f, progress: 50 } : f))
          );

          // Upload file
          const uploadedFile = await uploadTaskFile(user.id, taskId, selectedFile.file);

          if (uploadedFile) {
            // Update status to success
            setSelectedFiles((prev) =>
              prev.map((f) =>
                f.id === selectedFile.id ? { ...f, status: 'success', progress: 100 } : f
              )
            );

            // Add to uploaded files list
            setUploadedFiles((prev) => [uploadedFile, ...prev]);
            successCount++;
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('File upload error:', error);
          failCount++;

          // Update status to error
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === selectedFile.id
                ? {
                    ...f,
                    status: 'error',
                    error: 'Upload failed',
                  }
                : f
            )
          );
        }
      }

      // Show summary toast
      if (successCount > 0 && failCount === 0) {
        toast({
          title: '✅ Upload Complete',
          description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: '⚠️ Partial Upload',
          description: `${successCount} succeeded, ${failCount} failed`,
          variant: 'destructive',
        });
      } else if (failCount > 0) {
        toast({
          title: '❌ Upload Failed',
          description: `Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`,
          variant: 'destructive',
        });
      }

      return failCount === 0;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  };

  // Create note in Supabase
  const createNoteInSupabase = async (taskId: string): Promise<boolean> => {
    if (!user || !noteContent.trim()) return true;

    try {
      const note = await createTaskNote(
        user.id,
        taskId,
        noteTitle.trim() || 'Task Note',
        noteContent.trim()
      );

      if (note) {
        setUploadedNotes((prev) => [note, ...prev]);
        toast({
          title: '✅ Note Saved',
          description: 'Your note has been saved successfully',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Create note error:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to save note',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: '❌ Error',
        description: 'Please enter a task title',
        variant: 'destructive',
      });
      return;
    }

    // Validate date and time before submission
    const isDateValid = validateDueDate(formData.dueDate);
    const isTimeValid = validateDueTime(formData.dueTime, formData.dueDate);

    if (!isDateValid || !isTimeValid) {
      toast({
        title: '❌ Invalid Date/Time',
        description: 'Please fix the date and time errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    // Additional backend-style validation
    if (formData.dueDate && formData.dueTime) {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      const now = new Date();

      if (dueDateTime <= now) {
        toast({
          title: '❌ Invalid Due Date/Time',
          description: 'The due date and time must be in the future',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsUploading(true);

    try {
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
      };

      let taskId: string;

      if (editingTaskId) {
        const existingTask = getTaskById(editingTaskId);
        if (existingTask) {
          taskId = existingTask.id;
          updateTask({
            ...existingTask,
            ...taskData,
          });
        } else {
          throw new Error('Task not found');
        }
      } else {
        // Create new task
        taskId = addTask(taskData);
      }

      // Upload files and create notes
      const filesUploaded = await uploadFilesToSupabase(taskId);
      const noteCreated = await createNoteInSupabase(taskId);

      if (filesUploaded && noteCreated) {
        toast({
          title: '✅ Success',
          description: editingTaskId ? 'Task updated successfully' : 'Task created successfully',
        });
        onClose();
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingTaskId ? 'Edit Task' : 'Create New Task'}
            {(selectedFiles.length > 0 || noteContent.trim() || uploadedFiles.length > 0 || uploadedNotes.length > 0) && (
              <Badge variant="secondary" className="ml-2">
                <PaperclipIcon className="h-3 w-3 mr-1" />
                {selectedFiles.length + uploadedFiles.length + (noteContent.trim() ? 1 : 0) + uploadedNotes.length} attachment(s)
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="files">
              Files ({selectedFiles.length + uploadedFiles.length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notes {(noteContent.trim() || uploadedNotes.length > 0) && '✓'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Title *
                </label>
                <Input
                  placeholder="Task title..."
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                    setFormData((prev) => ({ ...prev, priority: value }))
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
                    setFormData((prev) => ({ ...prev, difficulty: value }))
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Subject</SelectItem>
                    {[
                      'Mathematics',
                      'Computer Science',
                      'Physics',
                      'Chemistry',
                      'Biology',
                      'History',
                      'Literature',
                      'Economics',
                      'Psychology',
                      'Other',
                    ].map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, estimate: value }))}
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

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Due Time
                </label>
                <Input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className={timeError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={!formData.dueDate}
                />
                {timeError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span className="font-bold">⚠</span> {timeError}
                  </p>
                )}
                {!formData.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a due date first
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Description
              </label>
              <Textarea
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Attach Study Materials</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Upload PDFs, images, documents, or presentations related to this task.
              </p>

              <FileUpload
                onFilesSelected={handleFilesSelected}
                selectedFiles={selectedFiles}
                onRemoveFile={handleRemoveFile}
                maxFiles={5}
                disabled={isUploading}
              />
            </div>

            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const fileData = await getTaskFileData(file.id);
                            if (fileData) {
                              window.open(fileData, '_blank');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const fileData = await getTaskFileData(file.id);
                            if (fileData) {
                              downloadFile(fileData, file.file_name);
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const success = await deleteTaskFile(file.id);
                            if (success) {
                              setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
                              toast({
                                title: 'File deleted',
                                description: 'File has been removed from this task.',
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Add a Note</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Write a quick note or study tip for this task.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Note Title (Optional)
                  </label>
                  <Input
                    placeholder="e.g., Study Tips, Important Points..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Note Content
                  </label>
                  <Textarea
                    placeholder="Write your note here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {noteContent.length} characters
                  </p>
                </div>
              </div>
            </div>

            {/* Display uploaded notes */}
            {uploadedNotes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Saved Notes</h3>
                <div className="space-y-2">
                  {uploadedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-medium">{note.title || 'Task Note'}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const success = await deleteTaskNote(note.id);
                            if (success) {
                              setUploadedNotes((prev) => prev.filter((n) => n.id !== note.id));
                              toast({
                                title: 'Note deleted',
                                description: 'Note has been removed from this task.',
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isUploading || !!dateError || !!timeError}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>{editingTaskId ? 'Update Task' : 'Create Task'}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
