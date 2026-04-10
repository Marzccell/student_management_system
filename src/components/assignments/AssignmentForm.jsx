/**
 * AssignmentForm
 * =================
 * Modal form for creating and editing assignments.
 * Fields: title, subject, deadline, status, priority.
 */
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

const STATUSES = ['not started', 'in progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']

export default function AssignmentForm({ assignment, onSave, onClose, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'not started',
    priority: 'medium',
  })

  // Populate form when editing an existing assignment
  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        subject: assignment.subject || '',
        deadline: assignment.deadline || new Date().toISOString().split('T')[0],
        status: assignment.status || 'not started',
        priority: assignment.priority || 'medium',
      })
    }
  }, [assignment])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEditing = !!assignment

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="assignment-title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <input
              id="assignment-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Math Homework Ch. 5"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="assignment-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <input
              id="assignment-subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="assignment-deadline" className="block text-sm font-medium text-gray-700 mb-1.5">
              Deadline
            </label>
            <input
              id="assignment-deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="assignment-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                id="assignment-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assignment-priority" className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                id="assignment-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-primary-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isEditing ? 'Save Changes' : 'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
