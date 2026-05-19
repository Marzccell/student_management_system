/**
 * UpcomingAssignments
 * =====================
 * Shows the next 5 upcoming assignments, sorted by deadline.
 * Highlights overdue assignments with a red indicator.
 */
import { CalendarDays, AlertTriangle } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'

export default function UpcomingAssignments({ assignments }) {
  const today = new Date().toISOString().split('T')[0]

  // Sort by deadline, filter out "done", take first 5
  const upcoming = [...assignments]
    .filter((a) => a.status !== 'done')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Upcoming Assignments</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          🎉 No upcoming assignments! Enjoy your free time.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Upcoming Assignments</h3>
      <div className="space-y-3">
        {upcoming.map((assignment) => {
          const isOverdue = assignment.deadline < today
          return (
            <div
              key={assignment.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isOverdue
                  ? 'border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10'
                  : 'border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isOverdue && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {assignment.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{assignment.subject}</span>
                    <StatusBadge type="priority" value={assignment.priority} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-3">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
