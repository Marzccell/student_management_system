/**
 * TaskSummaryCard
 * =================
 * A summary card showing a count with an icon and label.
 * Used on the dashboard for total/completed/pending/overdue counts.
 */
export default function TaskSummaryCard({ icon: Icon, label, count, color = 'primary', trend }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    danger: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  }

  const iconBgMap = {
    primary: 'bg-primary-100 dark:bg-primary-500/20',
    success: 'bg-emerald-100 dark:bg-emerald-500/20',
    warning: 'bg-amber-100 dark:bg-amber-500/20',
    danger: 'bg-red-100 dark:bg-red-500/20',
  }

  return (
    <div className={`bg-white rounded-2xl border ${colorMap[color]} p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in dark:bg-gray-900`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{count}</p>
          {trend && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBgMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
