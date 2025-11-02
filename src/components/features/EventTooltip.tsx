import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/types/calendar';
import {
  Calendar,
  Clock,
  Flag,
  FileText,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface EventTooltipProps {
  event: CalendarEvent;
}

export function EventTooltip({ event }: EventTooltipProps) {
  const { task, status, hasAttachments, isAutoScheduled } = event.resource;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'missed':
        return 'Missed';
      default:
        return 'Scheduled';
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
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-50 pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
              {event.title}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" size="sm">
                {getStatusText()}
              </Badge>
              {isAutoScheduled && (
                <Badge variant="secondary" size="sm" className="bg-blue-100 text-blue-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Auto-scheduled
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="h-4 w-4" />
          <span>
            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
          </span>
          <span className="text-xs">
            ({Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))} min)
          </span>
        </div>
        
        {/* Task Details */}
        {task && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(task.priority)} size="sm">
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
              {task.subject && (
                <Badge variant="outline" size="sm">
                  {task.subject}
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            )}
            
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            
            {hasAttachments && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                Has attachments
              </div>
            )}
          </div>
        )}
        
        {/* Description (if no task) */}
        {!task && event.resource.scheduleEvent.description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {event.resource.scheduleEvent.description}
            </p>
          </div>
        )}
        
        {/* Footer hint */}
        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
          Click to edit • Drag to reschedule
        </div>
      </div>
    </motion.div>
  );
}
