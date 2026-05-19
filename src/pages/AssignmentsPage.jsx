/**
 * AssignmentsPage
 * ==================
 * Full CRUD page for managing assignments.
 * Features: create, edit, delete, filter by status, sort by deadline.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AssignmentCard from '../components/assignments/AssignmentCard'
import AssignmentForm from '../components/assignments/AssignmentForm'
import AssignmentFilters from '../components/assignments/AssignmentFilters'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { Plus, ClipboardList } from 'lucide-react'

export default function AssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [filter, setFilter] = useState('all')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchAssignments()
    }
  }, [user?.id])

  /**
   * Fetch all assignments for the current user, sorted by deadline
   */
  const fetchAssignments = async () => {
    if (!user?.id) return

    setLoading(true)
    setErrorMessage('')
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })

      if (error) throw error
      setAssignments(data || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setErrorMessage(err.message || 'Unable to load assignments.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create or update an assignment
   */
  const handleSave = async (formData) => {
    if (!user?.id) {
      setErrorMessage('You must be signed in to save assignments.')
      return
    }

    const payload = {
      title: formData.title.trim(),
      subject: formData.subject.trim(),
      deadline: formData.deadline,
      status: formData.status,
      priority: formData.priority,
    }

    if (!payload.title || !payload.subject) {
      setErrorMessage('Title and subject are required.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    try {
      if (editingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('assignments')
          .update(payload)
          .eq('id', editingAssignment.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('assignments')
          .insert([{ ...payload, user_id: user.id }])

        if (error) throw error
      }

      // Refresh the list and close form after a successful write.
      await fetchAssignments()
      setShowForm(false)
      setEditingAssignment(null)
    } catch (err) {
      console.error('Error saving assignment:', err)
      setErrorMessage(err.message || 'Unable to save assignment.')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Delete an assignment by ID
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error deleting assignment:', err)
      setErrorMessage(err.message || 'Unable to delete assignment.')
    }
  }

  /**
   * Open edit form with assignment data
   */
  const handleEdit = (assignment) => {
    setErrorMessage('')
    setEditingAssignment(assignment)
    setShowForm(true)
  }

  /**
   * Close the form and reset editing state
   */
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAssignment(null)
    setErrorMessage('')
  }

  // Filter assignments by status
  const filteredAssignments =
    filter === 'all'
      ? assignments
      : assignments.filter((a) => a.status === filter)

  const nextStatus = (status) => {
    const statuses = ['not started', 'in progress', 'done']
    const currentIndex = statuses.indexOf(status)
    return statuses[(currentIndex + 1) % statuses.length]
  }

  const handleStatusChange = async (assignment) => {
    if (!user?.id) return

    const status = nextStatus(assignment.status)
    const previousAssignments = assignments

    setErrorMessage('')
    setSaving(true)
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignment.id ? { ...item, status } : item
      )
    )

    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status })
        .eq('id', assignment.id)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (err) {
      console.error('Error updating assignment status:', err)
      setAssignments(previousAssignments)
      setErrorMessage(err.message || 'Unable to update assignment status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading assignments..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all your assignments
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      {/* Filters */}
      <AssignmentFilters activeFilter={filter} onFilterChange={setFilter} />

      {errorMessage && !showForm && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Assignment grid */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
          description={
            filter === 'all'
              ? 'Create your first assignment to get started.'
              : 'Try changing the filter to see more results.'
          }
          action={
            filter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Assignment
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              updatingStatus={saving}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <AssignmentForm
          assignment={editingAssignment}
          onSave={handleSave}
          onClose={handleCloseForm}
          loading={saving}
          error={errorMessage}
        />
      )}
    </div>
  )
}
