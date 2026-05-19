/**
 * AssignmentCard
 * =================
 * Displays a single assignment with title, subject, deadline, status, and priority.
 * Shows overdue state with red styling. Includes edit and delete actions.
 */
import { CalendarDays, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'

export default function AssignmentCard({ assignment, onEdit, onDelete, onStatusChange, updatingStatus = false }) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = assignment.deadline < today && assignment.status !== 'done'

  const formattedDate = new Date(assignment.deadline).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in dark:bg-gray-900 ${
        isOverdue ? 'border-red-200 ring-1 ring-red-100 dark:border-red-500/40 dark:ring-red-500/20' : 'border-gray-100 dark:border-gray-800'
      }`}
    >
      {/* Header: title + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          {isOverdue && (
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <h3 className={`font-semibold text-sm leading-tight ${isOverdue ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-100'}`}>
            {assignment.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(assignment)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-500 dark:hover:text-primary-300 dark:hover:bg-primary-500/10 transition-colors"
            aria-label="Edit assignment"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Delete assignment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subject label */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{assignment.subject}</p>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge
          type="status"
          value={assignment.status}
          onClick={() => onStatusChange(assignment)}
          disabled={updatingStatus}
          title="Click to move to the next status"
        />
        <StatusBadge type="priority" value={assignment.priority} />
      </div>

      {/* Deadline */}
      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500 dark:text-red-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
        <CalendarDays className="w-3.5 h-3.5" />
        <span>{isOverdue ? 'Overdue — ' : ''}{formattedDate}</span>
      </div>
    </div>
  )
}
