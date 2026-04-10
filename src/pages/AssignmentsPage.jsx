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

  useEffect(() => {
    fetchAssignments()
  }, [])

  /**
   * Fetch all assignments for the current user, sorted by deadline
   */
  const fetchAssignments = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create or update an assignment
   */
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      if (editingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('assignments')
          .update(formData)
          .eq('id', editingAssignment.id)

        if (error) throw error
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('assignments')
          .insert({ ...formData, user_id: user.id })

        if (error) throw error
      }

      // Refresh the list and close form
      await fetchAssignments()
      setShowForm(false)
      setEditingAssignment(null)
    } catch (err) {
      console.error('Error saving assignment:', err)
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

      if (error) throw error
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error deleting assignment:', err)
    }
  }

  /**
   * Open edit form with assignment data
   */
  const handleEdit = (assignment) => {
    setEditingAssignment(assignment)
    setShowForm(true)
  }

  /**
   * Close the form and reset editing state
   */
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAssignment(null)
  }

  // Filter assignments by status
  const filteredAssignments =
    filter === 'all'
      ? assignments
      : assignments.filter((a) => a.status === filter)

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading assignments..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">
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
        />
      )}
    </div>
  )
}
