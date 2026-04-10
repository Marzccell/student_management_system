/**
 * StudySessionForm
 * ====================
 * Modal form for creating and editing study sessions.
 * Fields: subject, topic, duration (minutes), date.
 */
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function StudySessionForm({ session, onSave, onClose, loading }) {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    duration: 30,
    date: new Date().toISOString().split('T')[0],
  })

  // Populate form when editing an existing session
  useEffect(() => {
    if (session) {
      setFormData({
        subject: session.subject || '',
        topic: session.topic || '',
        duration: session.duration || 30,
        date: session.date || new Date().toISOString().split('T')[0],
      })
    }
  }, [session])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) || 0 : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEditing = !!session

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Study Session' : 'New Study Session'}
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
          {/* Subject */}
          <div>
            <label htmlFor="session-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <input
              id="session-subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Physics"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="session-topic" className="block text-sm font-medium text-gray-700 mb-1.5">
              Topic
            </label>
            <input
              id="session-topic"
              name="topic"
              type="text"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g. Newton's Laws of Motion"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Duration & Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="session-duration" className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (min)
              </label>
              <input
                id="session-duration"
                name="duration"
                type="number"
                min="5"
                max="480"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="session-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <input
                id="session-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
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
                isEditing ? 'Save Changes' : 'Create Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
