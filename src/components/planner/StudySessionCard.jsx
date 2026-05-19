/**
 * StudySessionCard
 * ====================
 * Displays a single study session with subject, topic, duration, and date.
 */
import { Clock, BookOpen, Pencil, Trash2, CalendarDays } from 'lucide-react'

export default function StudySessionCard({ session, onEdit, onDelete, showDate = false }) {
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const hours = Math.floor(session.duration / 60)
  const mins = session.duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 dark:bg-primary-500/15">
            <BookOpen className="w-5 h-5 text-primary-500 dark:text-primary-300" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">{session.subject}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">{session.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(session)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-500 dark:hover:text-primary-300 dark:hover:bg-primary-500/10 transition-colors"
            aria-label="Edit session"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{durationStr}</span>
        </div>
        {showDate && (
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </div>
  )
}
