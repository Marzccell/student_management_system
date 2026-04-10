/**
 * ProgressIndicator
 * ====================
 * Animated progress bar showing the percentage of completed tasks.
 */
export default function ProgressIndicator({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Overall Progress</h3>
        <span className="text-sm font-bold text-primary-600">{percentage}%</span>
      </div>

      {/* Progress bar background */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Animated fill */}
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {completed} of {total} assignments completed
      </p>
    </div>
  )
}
