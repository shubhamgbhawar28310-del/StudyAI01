import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { ResizeHandle } from './ResizeHandle';

interface EventBlockProps {
  event: any;
  style: React.CSSProperties;
  onResizeStart: (e: React.MouseEvent, event: any, handle: 'top' | 'bottom') => void;
  onDragStart: (e: React.DragEvent, event: any) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isResizing: boolean;
  isDragging: boolean;
  getEventColor: (type: string) => string;
  getStatusColor: (status: string) => string;
}

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  style,
  onResizeStart,
  onDragStart,
  onDragEnd,
  onClick,
  onEdit,
  onDelete,
  isResizing,
  isDragging,
  getEventColor,
  getStatusColor
}) => {
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'h:mm a');
  };

  return (
    <div
      style={style}
      className={`event-block text-xs p-2 rounded text-white ${getEventColor(event.type)} ${
        isResizing ? 'resizing' : ''
      } ${isDragging ? 'dragging' : ''} group transition-all duration-200 shadow-sm`}
      draggable
      onDragStart={(e) => onDragStart(e, event)}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <ResizeHandle 
        position="top" 
        onMouseDown={(e) => onResizeStart(e, event, 'top')}
      />
      
      <div className="event-content flex-1 flex flex-col justify-between min-h-0">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{event.title}</p>
            <p className="opacity-90 text-[10px]">{formatTime(event.startTime)}</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status || 'scheduled')} flex-shrink-0`} />
        </div>
        
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-5 w-5 p-0 text-white hover:text-blue-300"
            title="Edit"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-5 w-5 p-0 text-white hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <ResizeHandle 
        position="bottom" 
        onMouseDown={(e) => onResizeStart(e, event, 'bottom')}
      />
    </div>
  );
};
