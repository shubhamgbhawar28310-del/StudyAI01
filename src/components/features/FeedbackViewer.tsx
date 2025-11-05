import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  getAllFeedback, 
  updateFeedbackStatus, 
  getFeedbackStats,
  Feedback 
} from '@/services/feedbackService'
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  RefreshCw, 
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Archive
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const feedbackTypeConfig = {
  bug: { icon: Bug, label: 'Bug Report', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/20' },
  suggestion: { icon: Lightbulb, label: 'Suggestion', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20' },
  general: { icon: MessageSquare, label: 'General', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' }
}

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  reviewed: { label: 'Reviewed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
}

export function FeedbackViewer() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bug' | 'suggestion' | 'general'>('all')
  const { toast } = useToast()

  const loadFeedback = async () => {
    setIsLoading(true)
    const [feedbackData, statsData] = await Promise.all([
      getAllFeedback(),
      getFeedbackStats()
    ])
    setFeedback(feedbackData)
    setStats(statsData)
    setIsLoading(false)
  }

  useEffect(() => {
    loadFeedback()
  }, [])

  const handleStatusChange = async (feedbackId: string, newStatus: 'new' | 'reviewed' | 'resolved' | 'archived') => {
    const result = await updateFeedbackStatus(feedbackId, newStatus)
    
    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Feedback marked as ${newStatus}`,
      })
      loadFeedback()
    } else {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(f => f.feedback_type === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Feedback</h1>
          <p className="text-muted-foreground">View and manage user feedback, bugs, and suggestions</p>
        </div>
        <Button onClick={loadFeedback} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bug Reports</p>
                  <p className="text-2xl font-bold">{stats.byType.bug}</p>
                </div>
                <Bug className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suggestions</p>
                  <p className="text-2xl font-bold">{stats.byType.suggestion}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Items</p>
                  <p className="text-2xl font-bold">{stats.byStatus.new}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({feedback.length})
        </Button>
        <Button
          variant={filter === 'bug' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('bug')}
        >
          <Bug className="h-4 w-4 mr-1" />
          Bugs ({stats?.byType.bug || 0})
        </Button>
        <Button
          variant={filter === 'suggestion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('suggestion')}
        >
          <Lightbulb className="h-4 w-4 mr-1" />
          Suggestions ({stats?.byType.suggestion || 0})
        </Button>
        <Button
          variant={filter === 'general' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('general')}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          General ({stats?.byType.general || 0})
        </Button>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading feedback...</p>
            </CardContent>
          </Card>
        ) : filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No feedback yet</p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedback.map((item, index) => {
            const typeConfig = feedbackTypeConfig[item.feedback_type]
            const TypeIcon = typeConfig.icon
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {typeConfig.label}
                            </Badge>
                            <Badge className={statusConfig[item.status].color}>
                              {statusConfig[item.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {item.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {item.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'reviewed')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark Reviewed
                          </Button>
                        )}
                        {item.status === 'reviewed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'resolved')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                        {(item.status === 'resolved' || item.status === 'reviewed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'archived')}
                          >
                            <Archive className="h-3 w-3 mr-1" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
