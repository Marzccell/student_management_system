/**
 * TodayStudyPlan
 * =================
 * Shows today's study sessions on the dashboard.
 */
import { Clock, BookOpen } from 'lucide-react'

export default function TodayStudyPlan({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Today&apos;s Study Plan</h3>
        <p className="text-sm text-gray-400 text-center py-6">
          📚 No study sessions planned for today.
        </p>
      </div>
    )
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Study Plan</h3>
        <span className="text-xs text-gray-400">
          {hours > 0 ? `${hours}h ` : ''}{mins > 0 ? `${mins}m` : ''} total
        </span>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{session.subject}</p>
              <p className="text-xs text-gray-400 truncate">{session.topic}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{session.duration}m</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
