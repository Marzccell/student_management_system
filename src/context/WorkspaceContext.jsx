import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { validateTask } from '../lib/workspace'
import { listAttachments, removeAttachments } from '../lib/attachments'

const WorkspaceContext = createContext(null)
export const useWorkspace = () => useContext(WorkspaceContext)

// Supabase caps a response at 1,000 rows by default. Fetch all pages for accurate
// filters, dashboard counts, and exports, using a stable unique ordering.
async function allRows(table, userId) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('id')
      .range(offset, offset + 499)
    if (error) throw error
    rows.push(...data)
    if (data.length < 500) return rows
  }
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [enhanced, setEnhanced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const refresh = useCallback(async () => {
    const token = ++generation.current
    if (!user?.id) return
    try {
      const [taskResult, projectResult] = await Promise.allSettled([
        allRows('assignments', user.id),
        allRows('projects', user.id),
      ])
      if (token !== generation.current) return
      if (taskResult.status === 'rejected') throw taskResult.reason
      setTasks(taskResult.value)
      if (projectResult.status === 'rejected') {
        if (!['42P01', 'PGRST205'].includes(projectResult.reason.code))
          throw projectResult.reason
        setEnhanced(false)
        setProjects([])
      } else {
        setEnhanced(true)
        setProjects(projectResult.value)
      }
      setError('')
    } catch (err) {
      if (token === generation.current)
        setError(err.message || 'Unable to load your workspace.')
    } finally {
      if (token === generation.current) setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    setTasks([])
    setProjects([])
    setEnhanced(false)
    setLoading(true)
    refresh()
    return () => {
      generation.current += 1
    }
  }, [refresh])

  async function saveTask(form, id) {
    validateTask(form, enhanced)
    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      deadline: form.deadline || null,
      status: form.status,
      priority: form.priority,
    }
    if (enhanced)
      Object.assign(payload, {
        description: (form.description || '').trim(),
        project_id: form.project_id || null,
      })
    const query = id
      ? supabase
          .from('assignments')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
      : supabase.from('assignments').insert({ ...payload, user_id: user.id })
    const { data, error: failure } = await query.select().single()
    if (failure) throw failure
    setTasks((current) =>
      id ? current.map((t) => (t.id === id ? data : t)) : [...current, data]
    )
    return data
  }

  async function changeStatus(id, status) {
    const { data, error: failure } = await supabase
      .from('assignments')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (failure) throw failure
    setTasks((current) => current.map((t) => (t.id === id ? data : t)))
  }

  async function deleteTask(id) {
    // Use Storage's API, never DELETE storage.objects: the API removes the bytes.
    // Abort task deletion if cleanup fails so its files remain manageable.
    if (enhanced) {
      const files = await listAttachments(user.id, id)
      await removeAttachments(files.map((f) => f.path))
    }
    const { error: failure } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single()
    if (failure) throw failure
    setTasks((current) => current.filter((t) => t.id !== id))
  }

  async function saveProject(form, id) {
    if (!form.name.trim()) throw new Error('Enter a project name.')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      deadline: form.deadline || null,
      status: form.status,
    }
    const query = id
      ? supabase
          .from('projects')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
      : supabase.from('projects').insert({ ...payload, user_id: user.id })
    const { data, error: failure } = await query.select().single()
    if (failure) throw failure
    setProjects((current) =>
      id ? current.map((p) => (p.id === id ? data : p)) : [...current, data]
    )
  }

  async function deleteProject(id) {
    const { error: failure } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single()
    if (failure) throw failure
    setProjects((current) => current.filter((p) => p.id !== id))
    setTasks((current) =>
      current.map((t) => (t.project_id === id ? { ...t, project_id: null } : t))
    )
  }

  return (
    <WorkspaceContext.Provider
      value={{
        tasks,
        projects,
        enhanced,
        loading,
        error,
        refresh,
        saveTask,
        changeStatus,
        deleteTask,
        saveProject,
        deleteProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
