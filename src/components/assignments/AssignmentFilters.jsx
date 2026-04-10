/**
 * AssignmentFilters
 * ====================
 * Pill-style status filter buttons for assignments.
 */
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'not started', label: 'Not Started' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function AssignmentFilters({ activeFilter, onFilterChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activeFilter === filter.value
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
