import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  PROJECT_STATUSES,
  statusLabel,
  formatDate,
  localDate,
} from '../lib/workspace'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function ProjectForm({ project, onClose }) {
  const { saveProject } = useWorkspace()
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline || '',
    status: project?.status || 'planning',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  return (
    <Modal
      title={project ? 'Edit project' : 'New project'}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setBusy(true)
          setError('')
          try {
            await saveProject(form, project?.id)
            onClose()
          } catch (err) {
            setError(err.message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="sf-label">
              Project name
            </label>
            <input
              autoFocus
              id="project-name"
              name="name"
              className="sf-input"
              value={form.name}
              onChange={change}
              required
              maxLength={120}
              placeholder="e.g. BEM event, Final assignment"
            />
          </div>
          <div>
            <label htmlFor="project-description" className="sf-label">
              Description
            </label>
            <textarea
              id="project-description"
              name="description"
              className="sf-input"
              value={form.description}
              onChange={change}
              rows={4}
              maxLength={10000}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="project-deadline" className="sf-label">
                Deadline (optional)
              </label>
              <input
                id="project-deadline"
                type="date"
                name="deadline"
                className="sf-input"
                value={form.deadline}
                onChange={change}
              />
            </div>
            <div>
              <label htmlFor="project-status" className="sf-label">
                Status
              </label>
              <select
                id="project-status"
                name="status"
                className="sf-input"
                value={form.status}
                onChange={change}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p role="alert" className="sf-error">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="sf-button-secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="sf-button" type="submit">
              {busy ? 'Saving…' : 'Save project'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}

function DeleteProject({ project, onClose }) {
  const { tasks, deleteProject, deleteTask, refresh } = useWorkspace()
  const [removeTasks, setRemoveTasks] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const projectTasks = tasks.filter((t) => t.project_id === project.id)
  return (
    <Modal title="Delete project" onClose={onClose} busy={busy}>
      <div className="space-y-4">
        <p className="break-words text-sm">
          Delete <strong>{project.name}</strong>? This project contains{' '}
          {projectTasks.length} tasks.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={removeTasks}
            disabled={busy}
            onChange={(event) => setRemoveTasks(event.target.checked)}
          />
          <span>Also permanently delete its tasks and attachments.</span>
        </label>
        <p className="text-sm text-gray-500">
          {removeTasks
            ? 'Deletion cannot be undone. If a file operation fails, deletion stops and the remaining items are kept.'
            : 'Tasks and attachments will be kept. The tasks will appear under “No project”.'}
        </p>
        {error && (
          <p role="alert" className="sf-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            className="sf-button-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="sf-button bg-red-600 hover:bg-red-700"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                if (removeTasks)
                  for (const task of projectTasks) await deleteTask(task.id)
                await deleteProject(project.id)
                onClose()
              } catch (err) {
                setError(`Deletion stopped: ${err.message}`)
                await refresh()
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Deleting…' : 'Delete project'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ProjectsPage() {
  const { projects, tasks, loading, error, enhanced, refresh } = useWorkspace()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(undefined)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)
  const filtered = projects
    .filter(
      (p) =>
        (!status || p.status === status) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())
    )
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
  const pageCount = Math.max(1, Math.ceil(filtered.length / 9))
  const currentPage = Math.min(page, pageCount)
  if (loading) return <LoadingSpinner size="lg" text="Loading projects…" />
  return (
    <div className="space-y-6 animate-fade-in text-gray-900 dark:text-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Give your tasks a home and track the bigger picture.
          </p>
        </div>
        <button
          className="sf-button"
          disabled={!enhanced || !!error}
          onClick={() => setEditing(null)}
        >
          <Plus size={16} /> New project
        </button>
      </header>
      {error && (
        <div role="alert" className="sf-error">
          {error}{' '}
          <button className="underline" onClick={refresh}>
            Retry
          </button>
        </div>
      )}
      {!enhanced && !error ? (
        <div className="sf-panel space-y-3 p-8">
          <FolderKanban className="text-primary-500" size={32} />
          <h2 className="font-semibold">Projects are not available yet</h2>
          <p className="text-sm text-gray-500">
            Your existing tasks are still available.
          </p>
          <Link to="/assignments" className="sf-button-secondary">
            Go to tasks
          </Link>
        </div>
      ) : (
        <>
          <div className="sf-panel flex flex-wrap gap-3 p-4">
            <input
              className="sf-input min-w-48 flex-1"
              aria-label="Search projects"
              placeholder="Search projects…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
            />
            <select
              className="sf-input sm:w-48"
              aria-label="Filter project status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered
              .slice((currentPage - 1) * 9, currentPage * 9)
              .map((project) => {
                const items = tasks.filter(
                  (task) => task.project_id === project.id
                )
                const completed = items.filter(
                  (task) => task.status === 'done'
                ).length
                const progress = items.length
                  ? Math.round((completed / items.length) * 100)
                  : 0
                const overdue =
                  project.deadline &&
                  project.deadline < localDate() &&
                  project.status !== 'completed'
                return (
                  <article
                    key={project.id}
                    className="sf-panel flex flex-col p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <FolderKanban className="text-primary-500" size={24} />
                      <div className="flex gap-1">
                        <button
                          className="sf-icon-button"
                          aria-label={`Edit ${project.name}`}
                          onClick={() => setEditing(project)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="sf-icon-button text-red-500"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => setDeleting(project)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <Link
                      to={`/assignments?project=${project.id}`}
                      className="break-words font-semibold hover:text-primary-500"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-2 mb-4 line-clamp-3 flex-1 whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400">
                      {project.description || 'No description yet.'}
                    </p>
                    <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs">
                      <span className="rounded-full bg-primary-50 px-2 py-1 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                        {statusLabel(project.status)}
                      </span>
                      <span
                        className={`flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        <CalendarDays size={13} />
                        {formatDate(project.deadline)}
                      </span>
                    </div>
                    <div className="mb-2 flex justify-between text-xs text-gray-500">
                      <span>
                        {completed} / {items.length} tasks completed
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <progress
                      className="sf-progress"
                      max="100"
                      value={progress}
                      aria-label={`${project.name} progress`}
                    />
                    <Link
                      to={`/assignments?project=${project.id}`}
                      className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-300"
                    >
                      View tasks →
                    </Link>
                  </article>
                )
              })}
          </div>
          {!filtered.length && !error && (
            <div className="sf-panel p-10 text-center">
              <h2 className="font-semibold">
                {projects.length
                  ? 'No matching projects'
                  : 'Your next project starts here'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {projects.length
                  ? 'Try a different search or status.'
                  : 'Create a project, then add new tasks or move your existing tasks into it.'}
              </p>
            </div>
          )}
          {pageCount > 1 && (
            <nav
              aria-label="Project pages"
              className="flex items-center justify-center gap-4"
            >
              <button
                className="sf-button-secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
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
        <ProjectForm project={editing} onClose={() => setEditing(undefined)} />
      )}
      {deleting && (
        <DeleteProject project={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}
