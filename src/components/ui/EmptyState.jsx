/**
 * EmptyState
 * ============
 * Friendly placeholder shown when there's no data to display.
 */
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4 dark:bg-primary-500/15">
        <Icon className="w-8 h-8 text-primary-400 dark:text-primary-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{description}</p>
      {action && action}
    </div>
  )
}
