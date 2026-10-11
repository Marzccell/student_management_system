export const TASK_STATUSES = ['not started', 'in progress', 'done']
export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed']
export const statusLabel = (value) =>
  ({
    'not started': 'To-do',
    'in progress': 'In progress',
    done: 'Done',
    planning: 'Planning',
    active: 'Active',
    on_hold: 'On hold',
    completed: 'Completed',
  })[value] || value

// Date-only fields are calendar dates in the user's timezone, never UTC timestamps.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatDate(value) {
  return value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline'
}

export function filterTasks(tasks, filters, today = localDate()) {
  const weekEnd = new Date(`${today}T12:00:00`)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const term = (filters.q || '').trim().toLowerCase()
  return tasks
    .filter((task) => {
      if (
        term &&
        !`${task.title} ${task.description || ''} ${task.subject || ''}`
          .toLowerCase()
          .includes(term)
      )
        return false
      if (filters.project === 'none' && task.project_id) return false
      if (
        filters.project &&
        filters.project !== 'none' &&
        task.project_id !== filters.project
      )
        return false
      if (filters.status && task.status !== filters.status) return false
      if (filters.priority && task.priority !== filters.priority) return false
      if (filters.from && (!task.deadline || task.deadline < filters.from))
        return false
      if (filters.to && (!task.deadline || task.deadline > filters.to))
        return false
      if (
        filters.deadline === 'overdue' &&
        (!task.deadline || task.deadline >= today || task.status === 'done')
      )
        return false
      if (filters.deadline === 'today' && task.deadline !== today) return false
      if (
        filters.deadline === 'week' &&
        (!task.deadline ||
          task.deadline < today ||
          task.deadline > localDate(weekEnd))
      )
        return false
      if (filters.deadline === 'none' && task.deadline) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'newest')
        return (b.created_at || '').localeCompare(a.created_at || '')
      if (filters.sort === 'priority') {
        const rank = { high: 0, medium: 1, low: 2 }
        const difference = rank[a.priority] - rank[b.priority]
        if (difference) return difference
      }
      return (
        Number(a.status === 'done') - Number(b.status === 'done') ||
        (a.deadline || '9999').localeCompare(b.deadline || '9999') ||
        (a.position || 0) - (b.position || 0) ||
        (a.created_at || '').localeCompare(b.created_at || '')
      )
    })
}

export function validateFiles(files) {
  if (files.length > 5) throw new Error('Choose up to 5 files per upload.')
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024)
      throw new Error(`${file.name} exceeds the 10 MB limit.`)
    if (!file.size) throw new Error(`${file.name} is empty.`)
  }
}

export function validateTask(data, enhanced = true) {
  if (!data.title?.trim()) throw new Error('Enter a task title.')
  if (data.title.trim().length > 200)
    throw new Error('Keep the title under 200 characters.')
  if (!data.subject?.trim()) throw new Error('Enter a subject or category.')
  if (!enhanced && !data.deadline)
    throw new Error(
      'A deadline is required until the workspace update is available.'
    )
  if (!TASK_STATUSES.includes(data.status))
    throw new Error('Choose a valid task status.')
  if (!['low', 'medium', 'high'].includes(data.priority))
    throw new Error('Choose a valid priority.')
}

const xmlEscape = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&apos;',
        })[c]
    )

// Explicit String cells keep user-entered formulas inert in Excel.
export function tasksWorkbook(tasks, projects) {
  const names = new Map(projects.map((p) => [p.id, p.name]))
  const rows = [
    [
      'Title',
      'Description',
      'Project',
      'Subject',
      'Status',
      'Priority',
      'Deadline',
      'Completed at',
    ],
    ...tasks.map((t) => [
      t.title,
      t.description,
      names.get(t.project_id) || 'No project',
      t.subject,
      statusLabel(t.status),
      t.priority,
      t.deadline,
      t.completed_at,
    ]),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Tasks"><Table>${rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
