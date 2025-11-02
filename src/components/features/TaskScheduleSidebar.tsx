import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Task } from '@/contexts/StudyPlannerContext';
import {
  Search,
  Calendar,
  Flag,
  Clock,
  AlertCircle,
  GripVertical
} from 'lucide-react';

interface TaskScheduleSidebarProps {
  tasks: Task[];
  onTaskSchedule: (task: Task, slot: { start: Date; end: Date }) => void;
}

export function TaskScheduleSidebar({ tasks, onTaskSchedule }: TaskScheduleSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
  
  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Unscheduled Tasks</span>
          <Badge variant="secondary">{filteredTasks.length}</Badge>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No tasks match your search
                </p>
              </>
            ) : (
              <>
                <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium mb-1">All tasks scheduled! 🎉</p>
                <p className="text-xs text-muted-foreground">
                  Create new tasks to schedule them
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <GripVertical className="h-3 w-3" />
              Drag tasks to calendar to schedule
            </div>
            
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                className={`
                  p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-all
                  ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                  ${isOverdue(task.dueDate) ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}
                `}
              >
                {/* Priority Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getPriorityColor(task.priority)} size="sm">
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                  {isOverdue(task.dueDate) && (
                    <Badge variant="destructive" size="sm">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
                
                {/* Task Title */}
                <p className="text-sm font-medium mb-1 line-clamp-2">
                  {task.title}
                </p>
                
                {/* Task Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.subject && (
                    <span className="flex items-center gap-1">
                      📚 {task.subject}
                    </span>
                  )}
                  {task.estimate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.estimate}
                    </span>
                  )}
                </div>
                
                {/* Due Date */}
                {task.dueDate && (
                  <div className={`
                    mt-2 text-xs flex items-center gap-1
                    ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-muted-foreground'}
                  `}>
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.dueDate)}
                  </div>
                )}
                
                {/* Drag Indicator */}
                <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-center text-xs text-muted-foreground">
                  <GripVertical className="h-3 w-3 mr-1" />
                  Drag to schedule
                </div>
              </motion.div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
