/**
 * StatusBadge
 * =============
 * Colored badge for assignment status and priority.
 */

const statusStyles = {
  'not started': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  'in progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  'done': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
}

const priorityStyles = {
  low: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
}

export default function StatusBadge({ type = 'status', value, onClick, disabled = false, title }) {
  const styles = type === 'status' ? statusStyles : priorityStyles
  const className = styles[value] || styles['not started']
  const baseClassName = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${className}`

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`${baseClassName} transition-all hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:cursor-wait disabled:opacity-60`}
      >
        {value}
      </button>
    )
  }

  return (
    <span
      className={baseClassName}
    >
      {value}
    </span>
  )
}
