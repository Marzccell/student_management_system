import { supabase } from './supabase'
import { validateFiles } from './workspace'

const BUCKET = 'task-attachments'
const bucket = () => supabase.storage.from(BUCKET)
const folder = (userId, taskId) => `${userId}/${taskId}`

export async function listAttachments(userId, taskId) {
  const files = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket().list(folder(userId, taskId), {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    files.push(
      ...data
        .filter((file) => file.id)
        .map((file) => ({
          ...file,
          path: `${folder(userId, taskId)}/${file.name}`,
          displayName: file.name.replace(/^[0-9a-f-]{36}_/, ''),
        }))
    )
    if (data.length < 100) return files
  }
}

export async function uploadAttachments(userId, taskId, files, onUploaded) {
  validateFiles(files)
  for (const file of files) {
    const name =
      file.name
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9._ -]/g, '_')
        .slice(-160) || 'attachment'
    const path = `${folder(userId, taskId)}/${crypto.randomUUID()}_${name}`
    const { error } = await bucket().upload(path, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
    if (error)
      throw new Error(
        `Could not upload ${file.name}: ${error.message}. Files already uploaded have been kept.`
      )
    onUploaded?.(file)
  }
}

export async function removeAttachments(paths) {
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await bucket().remove(paths.slice(offset, offset + 100))
    if (error) throw error
  }
}

export async function downloadAttachment(path) {
  const { data, error } = await bucket().download(path)
  if (error) throw error
  return data
}
