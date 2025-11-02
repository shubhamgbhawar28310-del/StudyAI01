import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task } from '@/contexts/StudyPlannerContext';
import { useStudyPlanner } from '@/contexts/StudyPlannerContext';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedTimeSlots, formatTimeSlot } from '@/contexts/TaskPlannerIntegration';
import {
  Sparkles,
  Calendar,
  Clock,
  Flag,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AutoScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unscheduledTasks: Task[];
}

interface ScheduleSuggestion {
  task: Task;
  suggestedSlot: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  };
  selected: boolean;
}

export function AutoScheduleDialog({
  isOpen,
  onClose,
  unscheduledTasks
}: AutoScheduleDialogProps) {
  const { state, addScheduleEvent } = useStudyPlanner();
  const { toast } = useToast();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  
  // Generate suggestions when dialog opens
  React.useEffect(() => {
    if (isOpen && unscheduledTasks.length > 0) {
      generateSuggestions();
    }
  }, [isOpen, unscheduledTasks]);
  
  const generateSuggestions = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const newSuggestions = unscheduledTasks
        .slice(0, 10) // Limit to 10 tasks
        .map(task => {
          const slots = getSuggestedTimeSlots(task, state.scheduleEvents, 1);
          const slot = slots[0];
          
          return {
            task,
            suggestedSlot: slot || {
              date: new Date().toISOString().split('T')[0],
              startTime: '09:00',
              endTime: '10:00',
              reason: 'Default slot'
            },
            selected: true // Auto-select all by default
          };
        });
      
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }, 1500);
  };
  
  const toggleSuggestion = (index: number) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };
  
  const selectAll = () => {
    setSuggestions(prev => prev.map(s => ({ ...s, selected: true })));
  };
  
  const deselectAll = () => {
    setSuggestions(prev => prev.map(s => ({ ...s, selected: false })));
  };
  
  const handleSchedule = async () => {
    const selectedSuggestions = suggestions.filter(s => s.selected);
    
    if (selectedSuggestions.length === 0) {
      toast({
        title: '⚠️ No Tasks Selected',
        description: 'Please select at least one task to schedule',
        variant: 'destructive'
      });
      return;
    }
    
    setIsScheduling(true);
    
    try {
      // Schedule each selected task
      for (const suggestion of selectedSuggestions) {
        const { task, suggestedSlot } = suggestion;
        
        const startDateTime = new Date(`${suggestedSlot.date}T${suggestedSlot.startTime}:00`);
        const endDateTime = new Date(`${suggestedSlot.date}T${suggestedSlot.endTime}:00`);
        
        addScheduleEvent({
          title: task.title,
          description: task.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: 'task',
          taskId: task.id,
          status: 'scheduled',
          color: 'bg-blue-500' // Mark as auto-scheduled
        });
        
        // Small delay between each schedule
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast({
        title: '✅ Auto-Schedule Complete!',
        description: `Successfully scheduled ${selectedSuggestions.length} task${selectedSuggestions.length > 1 ? 's' : ''}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Auto-schedule error:', error);
      toast({
        title: '❌ Scheduling Failed',
        description: 'An error occurred while scheduling tasks',
        variant: 'destructive'
      });
    } finally {
      setIsScheduling(false);
    }
  };
  
  const selectedCount = suggestions.filter(s => s.selected).length;
  
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Auto-Schedule
          </DialogTitle>
          <DialogDescription>
            Our AI analyzed your tasks and found optimal time slots based on priority, due dates, and your schedule.
          </DialogDescription>
        </DialogHeader>
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-12 w-12 text-purple-500" />
            </motion.div>
            <p className="mt-4 text-sm text-muted-foreground">
              Analyzing your schedule and finding optimal time slots...
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No unscheduled tasks to auto-schedule
            </p>
          </div>
        ) : (
          <>
            {/* Selection Controls */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {selectedCount} of {suggestions.length} tasks selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            {/* Suggestions List */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-4 border rounded-lg transition-all
                        ${suggestion.selected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <Checkbox
                          checked={suggestion.selected}
                          onCheckedChange={() => toggleSuggestion(index)}
                          className="mt-1"
                        />
                        
                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(suggestion.task.priority)} size="sm">
                              <Flag className="h-3 w-3 mr-1" />
                              {suggestion.task.priority}
                            </Badge>
                            {suggestion.task.subject && (
                              <Badge variant="outline" size="sm">
                                {suggestion.task.subject}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="font-medium mb-1">{suggestion.task.title}</p>
                          
                          {suggestion.task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {suggestion.task.description}
                            </p>
                          )}
                          
                          {/* Suggested Time */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                              <Calendar className="h-4 w-4" />
                              {formatTimeSlot({
                                id: '',
                                date: suggestion.suggestedSlot.date,
                                startTime: suggestion.suggestedSlot.startTime,
                                endTime: suggestion.suggestedSlot.endTime,
                                isAvailable: true
                              })}
                            </div>
                            <Badge variant="secondary" size="sm">
                              {suggestion.suggestedSlot.reason}
                            </Badge>
                          </div>
                          
                          {suggestion.task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              Due: {new Date(suggestion.task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isScheduling}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={isAnalyzing || isScheduling || selectedCount === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            {isScheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Schedule {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
