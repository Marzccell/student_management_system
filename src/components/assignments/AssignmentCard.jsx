import {
  CalendarDays,
  Pencil,
  Trash2,
  AlertTriangle,
  FolderKanban,
  Paperclip,
} from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import {
  formatDate,
  localDate,
  statusLabel,
  TASK_STATUSES,
} from '../../lib/workspace'

export default function AssignmentCard({
  assignment,
  project,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatus = false,
  draggable = false,
}) {
  const overdue =
    assignment.deadline &&
    assignment.deadline < localDate() &&
    assignment.status !== 'done'
  return (
    <article
      draggable={draggable && !updatingStatus}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', assignment.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={`sf-panel p-4 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${overdue ? 'border-red-300 dark:border-red-800' : ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          className="min-w-0 break-words text-left text-sm font-semibold hover:text-primary-600"
          disabled={updatingStatus}
          onClick={() => onEdit(assignment)}
        >
          {overdue && (
            <AlertTriangle className="mr-1 inline text-red-500" size={14} />
          )}
          {assignment.title}
        </button>
        <div className="flex shrink-0">
          <button
            className="sf-icon-button"
            disabled={updatingStatus}
            aria-label={`Edit ${assignment.title}`}
            onClick={() => onEdit(assignment)}
          >
            <Pencil size={15} />
          </button>
          <button
            className="sf-icon-button text-red-500"
            disabled={updatingStatus}
            aria-label={`Delete ${assignment.title}`}
            onClick={() => onDelete(assignment)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {assignment.description && (
        <p className="mb-3 line-clamp-3 whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400">
          {assignment.description}
        </p>
      )}
      <p className="mb-2 break-words text-xs text-gray-500 dark:text-gray-400">
        {assignment.subject}
      </p>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-300">
        <FolderKanban size={13} className="shrink-0" />
        <span className="truncate">{project?.name || 'No project'}</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          aria-label={`Status for ${assignment.title}`}
          disabled={updatingStatus}
          value={assignment.status}
          onChange={(event) => onStatusChange(assignment, event.target.value)}
          className="max-w-36 rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-xs dark:border-gray-700 dark:bg-gray-950"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <StatusBadge type="priority" value={assignment.priority} />
      </div>
      <div
        className={`mt-3 flex items-center justify-between gap-2 text-xs ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {overdue ? 'Overdue · ' : ''}
          {formatDate(assignment.deadline)}
        </span>
        <button
          onClick={() => onEdit(assignment)}
          className="sf-icon-button"
          aria-label={`Open details and attachments for ${assignment.title}`}
          disabled={updatingStatus}
        >
          <Paperclip size={14} />
        </button>
      </div>
    </article>
  )
}
