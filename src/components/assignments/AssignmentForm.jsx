import { useState } from 'react'
import Modal from '../ui/Modal'
import TaskAttachments from './TaskAttachments'
import { useWorkspace } from '../../context/WorkspaceContext'
import { TASK_STATUSES, localDate, statusLabel } from '../../lib/workspace'

export default function AssignmentForm({
  assignment,
  defaultProject = '',
  onClose,
}) {
  const { projects, enhanced, saveTask } = useWorkspace()
  const [record, setRecord] = useState(assignment)
  const [data, setData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    subject: assignment?.subject || '',
    deadline: assignment ? assignment.deadline || '' : localDate(),
    status: assignment?.status || 'not started',
    priority: assignment?.priority || 'medium',
    project_id: assignment?.project_id || defaultProject,
  })
  const [saving, setSaving] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const busy = saving || fileBusy
  const change = (event) => {
    setData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
    setMessage('')
  }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await saveTask(data, record?.id)
      setRecord(saved)
      setMessage(
        'Task saved. You can manage its attachments below or close this window.'
      )
      if (!enhanced) onClose()
    } catch (err) {
      setError(err.message || 'Unable to save this task.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal
      title={record ? 'Edit task' : 'New task'}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <div>
            <label className="sf-label" htmlFor="task-title">
              Title
            </label>
            <input
              autoFocus
              id="task-title"
              className="sf-input"
              name="title"
              value={data.title}
              onChange={change}
              required
              maxLength={200}
              placeholder="What needs to get done?"
            />
          </div>
          {enhanced && (
            <>
              <div>
                <label className="sf-label" htmlFor="task-description">
                  Description
                </label>
                <textarea
                  id="task-description"
                  className="sf-input"
                  name="description"
                  value={data.description}
                  onChange={change}
                  rows={3}
                  maxLength={10000}
                  placeholder="Notes, details, or next steps"
                />
              </div>
              <div>
                <label className="sf-label" htmlFor="task-project">
                  Project
                </label>
                <select
                  id="task-project"
                  className="sf-input"
                  name="project_id"
                  value={data.project_id}
                  onChange={change}
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="sf-label" htmlFor="task-subject">
                Subject / category
              </label>
              <input
                id="task-subject"
                className="sf-input"
                name="subject"
                value={data.subject}
                onChange={change}
                required
                maxLength={200}
                placeholder="e.g. Mathematics, Personal"
              />
            </div>
            <div>
              <label className="sf-label" htmlFor="task-deadline">
                Deadline {enhanced && '(optional)'}
              </label>
              <input
                id="task-deadline"
                className="sf-input"
                type="date"
                name="deadline"
                value={data.deadline}
                onChange={change}
                required={!enhanced}
              />
            </div>
            <div>
              <label className="sf-label" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                className="sf-input"
                name="status"
                value={data.status}
                onChange={change}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="sf-label" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="sf-input"
                name="priority"
                value={data.priority}
                onChange={change}
              >
                {['low', 'medium', 'high'].map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
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
          {message && (
            <p
              role="status"
              className="text-sm text-emerald-700 dark:text-emerald-400"
            >
              {message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="sf-button-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button className="sf-button" type="submit">
              {saving ? 'Saving…' : record ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </fieldset>
      </form>
      {enhanced && (
        <div className="mt-5">
          {record ? (
            <fieldset disabled={saving}>
              <TaskAttachments taskId={record.id} onBusyChange={setFileBusy} />
            </fieldset>
          ) : (
            <p className="text-xs text-gray-500">
              Create this task to add private attachments.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
