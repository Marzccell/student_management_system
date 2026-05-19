/**
 * PlannerPage
 * ==============
 * Study planner page with CRUD for study sessions.
 * Features: create, edit, delete sessions, date navigation, today highlight.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import StudySessionCard from '../components/planner/StudySessionCard'
import StudySessionForm from '../components/planner/StudySessionForm'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Plus, BookOpen, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export default function PlannerPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)

  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  useEffect(() => {
    fetchSessions()
  }, [selectedDate])

  /**
   * Fetch study sessions for the selected date
   */
  const fetchSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create or update a session
   */
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      if (editingSession) {
        const { error } = await supabase
          .from('study_sessions')
          .update(formData)
          .eq('id', editingSession.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('study_sessions')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      await fetchSessions()
      setShowForm(false)
      setEditingSession(null)
    } catch (err) {
      console.error('Error saving session:', err)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Delete a session by ID
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study session?')) return

    try {
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  const handleEdit = (session) => {
    setEditingSession(session)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSession(null)
  }

  /**
   * Navigate to previous or next day
   */
  const navigateDate = (direction) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Total study time for the day
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Planner</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Plan and organize your study sessions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Date navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">{formattedSelectedDate}</span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium dark:bg-primary-500/15 dark:text-primary-300">
                  Today
                </span>
              )}
            </div>
            {totalMinutes > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {hours > 0 ? `${hours}h ` : ''}{mins > 0 ? `${mins}m` : ''} of study planned
              </p>
            )}
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Quick jump to today */}
        {!isToday && (
          <div className="text-center mt-3">
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Jump to today →
            </button>
          </div>
        )}
      </div>

      {/* Sessions list */}
      {loading ? (
        <LoadingSpinner text="Loading study sessions..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No sessions planned"
          description={`You don't have any study sessions for ${isToday ? 'today' : 'this day'} yet.`}
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Plan a Session
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <StudySessionCard
              key={session.id}
              session={session}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <StudySessionForm
          session={editingSession}
          onSave={handleSave}
          onClose={handleCloseForm}
          loading={saving}
        />
      )}
    </div>
  )
}
