import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'

interface StudyPlanItem {
  day: string
  topic: string
  tasks: string[]
  duration: string
}

interface StudyPlan {
  title: string
  items: StudyPlanItem[]
}

interface StudyPlannerProps {
  plan: StudyPlan | string
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ plan }) => {
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null)
  const { addScheduleEvent } = useStudyPlanner()

  // Check if plan is a string (markdown content) or object (structured data)
  const isMarkdownContent = typeof plan === 'string'

  // Initialize currentPlan if it's structured data
  React.useEffect(() => {
    if (typeof plan === 'object' && plan !== null) {
      setCurrentPlan(plan as StudyPlan)
    }
  }, [plan])

  const handleEdit = (itemIndex: number, field: string, value: string) => {
    if (!currentPlan) return
    const updatedItems = [...currentPlan.items]
    const itemToUpdate = { ...updatedItems[itemIndex] }
    ;(itemToUpdate as any)[field] = value
    updatedItems[itemIndex] = itemToUpdate
    setCurrentPlan({ ...currentPlan, items: updatedItems })
  }

  const handleTaskEdit = (itemIndex: number, taskIndex: number, value: string) => {
    if (!currentPlan) return
    const updatedItems = [...currentPlan.items]
    const updatedTasks = [...updatedItems[itemIndex].tasks]
    updatedTasks[taskIndex] = value
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], tasks: updatedTasks }
    setCurrentPlan({ ...currentPlan, items: updatedItems })
  }

  const addToSchedule = (item: StudyPlanItem) => {
    addScheduleEvent({
      title: item.topic,
      description: item.tasks.join(', '),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      type: 'study'
    })
  }

  if (isMarkdownContent) {
    // Render markdown content directly
    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Study Plan</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{plan as string}</div>
        </div>
      </div>
    )
  }

  // Render structured content (backward compatibility)
  if (!currentPlan) return null

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{currentPlan.title}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-2">Day</th>
              <th className="p-2">Topic</th>
              <th className="p-2">Tasks</th>
              <th className="p-2">Duration</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPlan.items.map((item, itemIndex) => (
              <tr key={itemIndex} className="border-b">
                <td className="p-2 font-semibold" contentEditable onBlur={(e) => handleEdit(itemIndex, 'day', e.currentTarget.textContent || '')}>{item.day}</td>
                <td className="p-2" contentEditable onBlur={(e) => handleEdit(itemIndex, 'topic', e.currentTarget.textContent || '')}>{item.topic}</td>
                <td className="p-2">
                  <ul className="list-disc list-inside">
                    {item.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} contentEditable onBlur={(e) => handleTaskEdit(itemIndex, taskIndex, e.currentTarget.textContent || '')}>{task}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-2" contentEditable onBlur={(e) => handleEdit(itemIndex, 'duration', e.currentTarget.textContent || '')}>{item.duration}</td>
                <td className="p-2">
                  <Button size="sm" onClick={() => addToSchedule(item)}>
                    <Calendar className="w-4 h-4 mr-1" />
                    Add to Schedule
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}