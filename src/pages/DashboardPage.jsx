/**
 * DashboardPage
 * ================
 * Main dashboard showing task summaries, progress, upcoming assignments,
 * and today's study plan.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../context/WorkspaceContext'
import { localDate, statusLabel } from '../lib/workspace'
import { Link } from 'react-router-dom'
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
  FolderKanban,
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const {
    tasks: assignments,
    projects,
    loading: workspaceLoading,
    error: workspaceError,
    refresh,
  } = useWorkspace()
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = localDate()

  useEffect(() => {
    fetchData()
  }, [user.id, today])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch today's study sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true })

      if (sessionError) throw sessionError
      setTodaySessions(sessionData || [])
    } catch (err) {
      setError(err.message || 'Unable to load your study plan.')
    } finally {
      setLoading(false)
    }
  }

  if (loading || workspaceLoading) {
    return <LoadingSpinner size="lg" text="Loading your dashboard..." />
  }

  // Compute stats
  const total = assignments.length
  const completed = assignments.filter((a) => a.status === 'done').length
  const inProgress = assignments.filter(
    (a) => a.status === 'in progress'
  ).length
  const overdue = assignments.filter(
    (a) => a.deadline && a.deadline < today && a.status !== 'done'
  ).length

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s your study overview for today
        </p>
      </div>

      {(error || workspaceError) && (
        <div role="alert" className="sf-error">
          {error || workspaceError}{' '}
          <button
            className="underline"
            onClick={() => {
              refresh()
              fetchData()
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <TaskSummaryCard
          icon={FolderKanban}
          label="Projects"
          count={projects.length}
          color="primary"
          trend={`${projects.filter((p) => p.status === 'active').length} active`}
        />
        <TaskSummaryCard
          icon={ClipboardList}
          label="Total Tasks"
          count={total}
          color="primary"
        />
        <TaskSummaryCard
          icon={ClipboardList}
          label="Active Tasks"
          count={total - completed}
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

      {projects.length > 0 && (
        <section className="sf-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Project progress</h2>
            <Link
              to="/projects"
              className="text-xs text-primary-600 dark:text-primary-300"
            >
              All projects →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...projects]
              .sort((a, b) =>
                (b.updated_at || '').localeCompare(a.updated_at || '')
              )
              .slice(0, 4)
              .map((project) => {
                const items = assignments.filter(
                  (task) => task.project_id === project.id
                )
                const done = items.filter(
                  (task) => task.status === 'done'
                ).length
                const percent = items.length
                  ? Math.round((done / items.length) * 100)
                  : 0
                return (
                  <Link
                    key={project.id}
                    to={`/assignments?project=${project.id}`}
                    className="rounded-xl border border-gray-100 p-3 hover:border-primary-300 dark:border-gray-800"
                  >
                    <div className="mb-2 flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">
                        {project.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {statusLabel(project.status)}
                      </span>
                    </div>
                    <progress
                      className="sf-progress"
                      max="100"
                      value={percent}
                      aria-label={`${project.name} completion`}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {done} / {items.length} tasks done · {percent}%
                    </p>
                  </Link>
                )
              })}
          </div>
        </section>
      )}

      {/* Two-column layout for upcoming + study plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingAssignments assignments={assignments} />
        <TodayStudyPlan sessions={todaySessions} />
      </div>
    </div>
  )
}
