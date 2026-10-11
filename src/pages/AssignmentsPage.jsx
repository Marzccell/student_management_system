import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Download, Columns3, List, Search } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  filterTasks,
  localDate,
  tasksWorkbook,
  downloadBlob,
  TASK_STATUSES,
  statusLabel,
} from '../lib/workspace'
import AssignmentCard from '../components/assignments/AssignmentCard'
import AssignmentForm from '../components/assignments/AssignmentForm'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function AssignmentsPage() {
  const {
    tasks,
    projects,
    loading,
    error,
    enhanced,
    refresh,
    changeStatus,
    deleteTask,
  } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const operation = useRef(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const filters = Object.fromEntries(params)
  const view = filters.view === 'board' ? 'board' : 'list'
  const invalidRange = filters.from && filters.to && filters.from > filters.to
  const filtered = invalidRange ? [] : filterTasks(tasks, filters)
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12))
  const currentPage = Math.min(page, pageCount)
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
    setPage(1)
  }
  async function perform(action, message) {
    if (operation.current) return
    operation.current = true
    setBusy(true)
    setFailure('')
    try {
      await action()
      setNotice(message)
    } catch (err) {
      setFailure(err.message || 'Unable to update task.')
    } finally {
      operation.current = false
      setBusy(false)
    }
  }
  const move = (task, status) => {
    if (task.status !== status)
      perform(
        () => changeStatus(task.id, status),
        `Moved "${task.title}" to ${statusLabel(status)}.`
      )
  }
  const remove = (task) => {
    if (
      window.confirm(
        `Delete "${task.title}" and all its attachments? This cannot be undone.`
      )
    )
      perform(() => deleteTask(task.id), 'Task deleted.')
  }
  const card = (task, draggable = false) => (
    <AssignmentCard
      key={task.id}
      assignment={task}
      project={projectMap.get(task.project_id)}
      onEdit={setEditing}
      onDelete={remove}
      onStatusChange={move}
      updatingStatus={busy}
      draggable={draggable}
    />
  )
  if (loading) return <LoadingSpinner size="lg" text="Loading tasks…" />
  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your assignments, projects, and everyday to-dos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="sf-button-secondary"
            disabled={!filtered.length || !!error}
            onClick={() =>
              downloadBlob(
                new Blob([tasksWorkbook(filtered, projects)], {
                  type: 'application/vnd.ms-excel;charset=utf-8',
                }),
                `studyflow-tasks-${localDate()}.xml`
              )
            }
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            className="sf-button"
            onClick={() => setEditing(null)}
            disabled={!!error}
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </header>
      {!enhanced && !error && (
        <p role="status" className="sf-notice">
          Projects and attachments are not available yet. You can continue
          managing your existing tasks.
        </p>
      )}
      {(error || failure) && (
        <div role="alert" className="sf-error">
          {error || failure}{' '}
          {error && (
            <button className="underline" onClick={refresh}>
              Retry
            </button>
          )}
        </div>
      )}
      <section className="sf-panel space-y-3 p-4" aria-label="Task filters">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-48 flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              aria-label="Search tasks"
              className="sf-input pl-9"
              placeholder="Search title, description, or subject…"
              value={filters.q || ''}
              onChange={(event) => setFilter('q', event.target.value)}
            />
          </div>
          <div className="flex gap-1" aria-label="Task view">
            <button
              aria-pressed={view === 'list'}
              className={view === 'list' ? 'sf-button' : 'sf-button-secondary'}
              onClick={() => setFilter('view', 'list')}
            >
              <List size={16} /> List
            </button>
            <button
              aria-pressed={view === 'board'}
              className={view === 'board' ? 'sf-button' : 'sf-button-secondary'}
              onClick={() => setFilter('view', 'board')}
            >
              <Columns3 size={16} /> Board
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-project" className="sf-label">
              Project
            </label>
            <select
              id="filter-project"
              className="sf-input"
              value={filters.project || ''}
              onChange={(event) => setFilter('project', event.target.value)}
            >
              <option value="">All projects</option>
              <option value="none">No project</option>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="sf-label">
              Status
            </label>
            <select
              id="filter-status"
              className="sf-input"
              value={filters.status || ''}
              onChange={(event) => setFilter('status', event.target.value)}
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-priority" className="sf-label">
              Priority
            </label>
            <select
              id="filter-priority"
              className="sf-input"
              value={filters.priority || ''}
              onChange={(event) => setFilter('priority', event.target.value)}
            >
              <option value="">All priorities</option>
              {['high', 'medium', 'low'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-deadline" className="sf-label">
              Deadline
            </label>
            <select
              id="filter-deadline"
              className="sf-input"
              value={filters.deadline || ''}
              onChange={(event) => setFilter('deadline', event.target.value)}
            >
              <option value="">Any deadline</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="week">Next 7 days</option>
              <option value="none">No deadline</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-from" className="sf-label">
              From
            </label>
            <input
              id="filter-from"
              className="sf-input"
              type="date"
              value={filters.from || ''}
              onChange={(event) => setFilter('from', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filter-to" className="sf-label">
              To
            </label>
            <input
              id="filter-to"
              className="sf-input"
              type="date"
              min={filters.from || undefined}
              value={filters.to || ''}
              onChange={(event) => setFilter('to', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filter-sort" className="sf-label">
              Sort by
            </label>
            <select
              id="filter-sort"
              className="sf-input"
              value={filters.sort || ''}
              onChange={(event) => setFilter('sort', event.target.value)}
            >
              <option value="">Deadline</option>
              <option value="priority">Priority</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
          <button
            className="sf-button-secondary self-end"
            onClick={() => {
              setParams(view === 'board' ? { view: 'board' } : {})
              setPage(1)
            }}
          >
            Clear filters
          </button>
        </div>
        {invalidRange && (
          <p role="alert" className="sf-error">
            The end date must be on or after the start date.
          </p>
        )}
      </section>
      <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filtered.length} of {tasks.length} tasks ·{' '}
          {filtered.filter((t) => t.status === 'done').length} done
        </span>
        <span role="status">{busy ? 'Saving…' : notice}</span>
      </div>
      {view === 'board' ? (
        <>
          <p className="text-xs text-gray-500">
            Drag a task to another column, or use its status menu.
          </p>
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            {TASK_STATUSES.map((status) => {
              const column = filtered.filter((t) => t.status === status)
              return (
                <section
                  key={status}
                  aria-label={`${statusLabel(status)} column`}
                  onDragOver={(event) => {
                    if (!busy) event.preventDefault()
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const task = tasks.find(
                      (t) => t.id === event.dataTransfer.getData('text/plain')
                    )
                    if (task && !busy) move(task, status)
                  }}
                  className="min-h-48 rounded-2xl border border-gray-200 bg-gray-100/60 p-3 dark:border-gray-800 dark:bg-gray-950/50"
                >
                  <h2 className="mb-4 flex justify-between px-1 text-sm font-semibold">
                    {statusLabel(status)}
                    <span className="text-gray-500">{column.length}</span>
                  </h2>
                  <div className="space-y-3">
                    {column.map((t) => card(t, true))}
                    {!column.length && (
                      <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500 dark:border-gray-700">
                        No tasks here
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered
              .slice((currentPage - 1) * 12, currentPage * 12)
              .map((task) => card(task))}
          </div>
          {!filtered.length && !error && (
            <div className="sf-panel p-10 text-center">
              <h2 className="font-semibold">No tasks found</h2>
              <p className="mt-2 text-sm text-gray-500">
                Create a task or adjust your filters.
              </p>
            </div>
          )}
          {pageCount > 1 && (
            <nav
              aria-label="Task pages"
              className="flex items-center justify-center gap-4"
            >
              <button
                className="sf-button-secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="text-sm">
                {currentPage} / {pageCount}
              </span>
              <button
                className="sf-button-secondary"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      {editing !== undefined && (
        <AssignmentForm
          assignment={editing}
          defaultProject={
            projectMap.has(filters.project) ? filters.project : ''
          }
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}
