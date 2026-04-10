/**
 * DashboardPage
 * ================
 * Main dashboard showing task summaries, progress, upcoming assignments,
 * and today's study plan.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TaskSummaryCard from '../components/dashboard/TaskSummaryCard'
import ProgressIndicator from '../components/dashboard/ProgressIndicator'
import UpcomingAssignments from '../components/dashboard/UpcomingAssignments'
import TodayStudyPlan from '../components/dashboard/TodayStudyPlan'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all assignments for the user
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })

      // Fetch today's study sessions
      const { data: sessionData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true })

      setAssignments(assignmentData || [])
      setTodaySessions(sessionData || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your dashboard..." />
  }

  // Compute stats
  const total = assignments.length
  const completed = assignments.filter((a) => a.status === 'done').length
  const inProgress = assignments.filter((a) => a.status === 'in progress').length
  const overdue = assignments.filter(
    (a) => a.deadline < today && a.status !== 'done'
  ).length

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s your study overview for today
        </p>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TaskSummaryCard
          icon={ClipboardList}
          label="Total Assignments"
          count={total}
          color="primary"
        />
        <TaskSummaryCard
          icon={CheckCircle2}
          label="Completed"
          count={completed}
          color="success"
        />
        <TaskSummaryCard
          icon={Clock}
          label="In Progress"
          count={inProgress}
          color="warning"
        />
        <TaskSummaryCard
          icon={AlertTriangle}
          label="Overdue"
          count={overdue}
          color="danger"
        />
      </div>

      {/* Progress bar */}
      <ProgressIndicator completed={completed} total={total} />

      {/* Two-column layout for upcoming + study plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingAssignments assignments={assignments} />
        <TodayStudyPlan sessions={todaySessions} />
      </div>
    </div>
  )
}
