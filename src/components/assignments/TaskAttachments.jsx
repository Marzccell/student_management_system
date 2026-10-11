import { useEffect, useState } from 'react'
import { Download, Paperclip, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  downloadAttachment,
  listAttachments,
  removeAttachments,
  uploadAttachments,
} from '../../lib/attachments'
import { downloadBlob, validateFiles } from '../../lib/workspace'

export default function TaskAttachments({ taskId, onBusyChange }) {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [pending, setPending] = useState([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [inputKey, setInputKey] = useState(0)
  async function load() {
    setFiles(await listAttachments(user.id, taskId))
  }
  useEffect(() => {
    let active = true
    listAttachments(user.id, taskId)
      .then((data) => {
        if (active) setFiles(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.id, taskId])
  async function act(action) {
    setBusy(true)
    onBusyChange(true)
    setError('')
    setMessage('')
    try {
      await action()
    } catch (err) {
      setError(err.message || 'Unable to update attachments.')
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }
  return (
    <section
      className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800"
      aria-label="Task attachments"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip size={16} /> Private attachments
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Up to 5 files per upload, 10 MB each. File changes are saved
        immediately.
      </p>
      {loading ? (
        <p className="text-sm">Loading files…</p>
      ) : (
        files.length === 0 && (
          <p className="text-sm text-gray-500">No attachments yet.</p>
        )
      )}
      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.path}
            className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-950"
          >
            <span className="min-w-0 flex-1 break-all text-xs">
              {file.displayName}
              <span className="ml-2 text-gray-500">
                {Math.ceil((file.metadata?.size || 0) / 1024)} KB
              </span>
            </span>
            <button
              type="button"
              disabled={busy}
              aria-label={`Download ${file.displayName}`}
              className="sf-icon-button"
              onClick={() =>
                act(async () =>
                  downloadBlob(
                    await downloadAttachment(file.path),
                    file.displayName
                  )
                )
              }
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label={`Delete ${file.displayName}`}
              className="sf-icon-button text-red-600"
              onClick={() => {
                if (window.confirm(`Delete attachment "${file.displayName}"?`))
                  act(async () => {
                    await removeAttachments([file.path])
                    await load()
                  })
              }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <label className="sf-label" htmlFor="task-files">
        Add files
      </label>
      <input
        key={inputKey}
        id="task-files"
        type="file"
        multiple
        disabled={busy || loading}
        className="sf-input"
        onChange={(event) => {
          setError('')
          const selected = Array.from(event.target.files || [])
          try {
            validateFiles(selected)
            setPending(selected)
          } catch (err) {
            setError(err.message)
            setPending([])
            event.target.value = ''
          }
        }}
      />
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Ready: {pending.map((f) => f.name).join(', ')}
          </p>
          <button
            type="button"
            className="sf-button-secondary"
            disabled={busy}
            onClick={() =>
              act(async () => {
                try {
                  await uploadAttachments(
                    user.id,
                    taskId,
                    pending,
                    (uploaded) =>
                      setPending((current) =>
                        current.filter((file) => file !== uploaded)
                      )
                  )
                  setInputKey((key) => key + 1)
                  setMessage('Files uploaded.')
                } finally {
                  await load()
                }
              })
            }
          >
            {busy ? 'Uploading…' : 'Upload files'}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="sf-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-600">
          {message}
        </p>
      )}
    </section>
  )
}
