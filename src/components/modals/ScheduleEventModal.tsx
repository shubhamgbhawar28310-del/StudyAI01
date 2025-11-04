import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { scheduleEventService } from '@/services/scheduleEventService'

interface ScheduleEventModalProps {
  isOpen: boolean
  onClose: () => void
  editingEventId?: string | null
  defaultDate?: string
  defaultTime?: string
  defaultStartTime?: string
  defaultEndTime?: string
}

export function ScheduleEventModal({ 
  isOpen, 
  onClose, 
  editingEventId,
  defaultDate,
  defaultTime,
  defaultStartTime,
  defaultEndTime
}: ScheduleEventModalProps) {
  const { 
    state, 
    addScheduleEvent, 
    updateScheduleEvent
  } = useStudyPlanner()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'study' as const,
    taskId: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editingEventId) {
      const event = state.scheduleEvents.find(e => e.id === editingEventId)
      if (event) {
        const startDateTime = new Date(event.startTime)
        const endDateTime = new Date(event.endTime)
        
        setFormData({
          title: event.title,
          description: event.description || '',
          startDate: startDateTime.toISOString().split('T')[0],
          startTime: startDateTime.toTimeString().slice(0, 5),
          endDate: endDateTime.toISOString().split('T')[0],
          endTime: endDateTime.toTimeString().slice(0, 5),
          type: event.type,
          taskId: event.taskId || ''
        })
      }
    } else {
      const now = new Date()
      
      // Use provided ISO times if available, otherwise use defaults
      let startDate, startTime, endDate, endTime;
      
      if (defaultStartTime && defaultEndTime) {
        // Parse as local datetime string (not ISO with Z)
        const startDT = new Date(defaultStartTime);
        const endDT = new Date(defaultEndTime);
        
        // Extract date and time in local timezone
        startDate = defaultStartTime.split('T')[0];
        startTime = defaultStartTime.split('T')[1].slice(0, 5);
        endDate = defaultEndTime.split('T')[0];
        endTime = defaultEndTime.split('T')[1].slice(0, 5);
      } else {
        const defaultStartTimeStr = defaultTime || '09:00';
        const calculatedEndTime = new Date(`2000-01-01T${defaultStartTimeStr}:00`);
        calculatedEndTime.setHours(calculatedEndTime.getHours() + 1);
        
        startDate = defaultDate || now.toISOString().split('T')[0];
        startTime = defaultStartTimeStr;
        endDate = defaultDate || now.toISOString().split('T')[0];
        endTime = calculatedEndTime.toTimeString().slice(0, 5);
      }
      
      setFormData({
        title: '',
        description: '',
        startDate,
        startTime,
        endDate,
        endTime,
        type: 'study',
        taskId: ''
      })
    }
  }, [editingEventId, defaultDate, defaultTime, defaultStartTime, defaultEndTime, state.scheduleEvents])

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.startDate || !formData.startTime) return

    try {
      setIsLoading(true)
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`)

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        type: formData.type,
        taskId: formData.taskId || undefined,
        color: getEventColor(formData.type)
      }

      if (editingEventId) {
        // Use the service for updates
        await scheduleEventService.updateEvent(editingEventId, eventData)
        
        // Also update local state
        const existingEvent = state.scheduleEvents.find(e => e.id === editingEventId)
        if (existingEvent) {
          updateScheduleEvent({
            ...existingEvent,
            ...eventData
          })
        }
      } else {
        // Use the service for creation - this saves to Supabase
        const savedEvent = await scheduleEventService.createEvent(eventData)
        
        // Update local state with the actual saved event (with proper ID from Supabase)
        if (savedEvent) {
          addScheduleEvent({
            ...eventData,
            id: savedEvent.id // Use the ID from Supabase to prevent duplicates
          })
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      // Error toast is handled in the service
    } finally {
      setIsLoading(false)
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-500'
      case 'study': return 'bg-green-500'
      case 'break': return 'bg-yellow-500'
      case 'other': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingEventId ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Title *
            </label>
            <Input
              placeholder="Event title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <Textarea
              placeholder="Event description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Type
              </label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'task' | 'study' | 'break' | 'other') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Related Task
              </label>
              <Select 
                value={formData.taskId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, taskId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Task</SelectItem>
                  {state.tasks.filter(t => !t.completed).map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startDate: e.target.value,
                  endDate: e.target.value // Auto-set end date to same day
                }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  const startTime = e.target.value
                  const endTime = new Date(`2000-01-01T${startTime}:00`)
                  endTime.setHours(endTime.getHours() + 1)
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    startTime,
                    endTime: endTime.toTimeString().slice(0, 5)
                  }))
                }}
              />
              {formData.startTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(`2000-01-01T${formData.startTime}`), 'h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                End Date
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                End Time
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
              {formData.endTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(`2000-01-01T${formData.endTime}`), 'h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.startDate || !formData.startTime || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isLoading ? 'Saving...' : (editingEventId ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}