/**
 * StatusBadge
 * =============
 * Colored badge for assignment status and priority.
 */

const statusStyles = {
  'not started': 'bg-gray-100 text-gray-600 border-gray-200',
  'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'done': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const priorityStyles = {
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
}

export default function StatusBadge({ type = 'status', value }) {
  const styles = type === 'status' ? statusStyles : priorityStyles
  const className = styles[value] || styles['not started']

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${className}`}
    >
      {value}
    </span>
  )
}
