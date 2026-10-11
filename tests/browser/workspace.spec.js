import { test, expect } from '@playwright/test'

const uid = '11111111-1111-4111-8111-111111111111'
const projectId = 'aaaaaaaa-0000-4000-8000-000000000001'
const taskId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

async function mockWorkspace(
  page,
  { legacy = false, failStatus = false, many = false } = {}
) {
  const user = {
    id: uid,
    email: 'test@example.test',
    aud: 'authenticated',
    role: 'authenticated',
  }
  const state = {
    projects: [
      {
        id: projectId,
        user_id: uid,
        name: 'Campus event',
        description: 'Plan our event',
        status: 'active',
        deadline: '2026-12-01',
        updated_at: '2026-10-10T12:00:00Z',
      },
    ],
    assignments: [
      {
        id: taskId,
        user_id: uid,
        title: 'Existing homework',
        subject: 'Math',
        description: '',
        project_id: null,
        status: 'not started',
        priority: 'high',
        deadline: '2026-10-09',
        created_at: '2026-10-01T12:00:00Z',
      },
    ],
    study_sessions: [],
    files: [],
  }
  if (many)
    state.assignments.push(
      ...Array.from({ length: 1004 }, (_, i) => ({
        ...state.assignments[0],
        id: `task-${String(i).padStart(4, '0')}`,
        title: `Task ${i}`,
      }))
    )
  await page.addInitScript(
    ({ user }) => {
      localStorage.setItem(
        'sb-studyflow-test-auth-token',
        JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          token_type: 'bearer',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        })
      )
    },
    { user }
  )
  // Fail closed: this suite cannot call a real Supabase project or external API.
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (url.hostname !== 'studyflow-test.supabase.co') return route.abort()
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    if (url.pathname.startsWith('/auth/')) return json(user)
    if (url.pathname.startsWith('/storage/')) {
      const body = req.postDataJSON?.bind(req)
      if (url.pathname.includes('/object/list/')) {
        const { prefix, offset = 0, limit = 100 } = body()
        return json(
          state.files
            .filter((f) => f.path.startsWith(prefix + '/'))
            .slice(offset, offset + limit)
            .map((f) => ({
              id: f.id,
              name: f.path.split('/').at(-1),
              metadata: { size: 12 },
            }))
        )
      }
      if (req.method() === 'DELETE') {
        const { prefixes } = body()
        state.files = state.files.filter(
          (file) => !prefixes.includes(file.path)
        )
        return json([])
      }
      if (req.method() === 'POST') {
        const path = decodeURIComponent(
          url.pathname.split('/task-attachments/')[1]
        )
        state.files.push({ id: crypto.randomUUID(), path })
        return json({ Key: `task-attachments/${path}` })
      }
      return route.fulfill({
        contentType: 'application/octet-stream',
        body: 'file contents',
      })
    }
    const table = url.pathname.split('/').at(-1)
    if (!Object.hasOwn(state, table))
      return json({ message: 'Unexpected table' }, 400)
    if (table === 'projects' && legacy)
      return json({ code: 'PGRST205', message: 'Table not found' }, 404)
    let rows = state[table]
    const id = url.searchParams.get('id')?.replace('eq.', '')
    if (req.method() === 'POST') {
      const row = {
        id: crypto.randomUUID(),
        ...req.postDataJSON(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      state[table].push(row)
      return json(row, 201)
    }
    if (req.method() === 'PATCH') {
      if (failStatus) return json({ message: 'Simulated write failure' }, 500)
      const row = rows.find((r) => r.id === id)
      Object.assign(row, req.postDataJSON())
      return json(row)
    }
    if (req.method() === 'DELETE') {
      state[table] = rows.filter((r) => r.id !== id)
      if (table === 'projects')
        state.assignments.forEach((task) => {
          if (task.project_id === id) task.project_id = null
        })
      return json({ id })
    }
    if (id) rows = rows.filter((r) => r.id === id)
    const start = Number(url.searchParams.get('offset') || 0)
    const limit = Number(url.searchParams.get('limit') || 1000)
    return json(rows.slice(start, start + limit))
  })
  return state
}

test('projects, task editing, no deadline, filters, Kanban and export', async ({
  page,
}) => {
  const state = await mockWorkspace(page)
  await page.goto('/projects')
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name').fill('BEM launch')
  await page.getByLabel('Description', { exact: true }).fill('Launch planning')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(
    page.getByRole('link', { name: 'BEM launch', exact: true })
  ).toBeVisible()
  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await page
    .getByRole('button', { name: 'Edit Existing homework', exact: true })
    .click()
  await page
    .getByLabel('Description', { exact: true })
    .fill('Prepare the venue')
  await page
    .getByRole('dialog')
    .getByLabel('Project', { exact: true })
    .selectOption(projectId)
  await page.getByLabel('Deadline (optional)').fill('')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Task saved.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByLabel('Search tasks').fill('venue')
  await page.locator('#filter-deadline').selectOption('none')
  await expect(page.locator('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Board', exact: true }).click()
  await page
    .locator('article')
    .dragTo(page.getByRole('region', { name: 'Done column', exact: true }))
  await expect(page.getByLabel('Status for Existing homework')).toHaveValue(
    'done'
  )
  expect(state.assignments[0].status).toBe('done')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Excel' }).click()
  expect((await downloading).suggestedFilename()).toMatch(
    /studyflow-tasks-.*\.xml$/
  )
  await page.screenshot({
    path: 'test-results/board-desktop.png',
    fullPage: true,
  })
})

test('attachment upload, download, delete, and keeping tasks when deleting project', async ({
  page,
}) => {
  const state = await mockWorkspace(page)
  state.assignments[0].project_id = projectId
  await page.goto('/assignments')
  await page
    .getByRole('button', { name: 'Edit Existing homework', exact: true })
    .click()
  await page.getByLabel('Add files').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello world'),
  })
  await page.getByRole('button', { name: 'Upload files' }).click()
  await expect(
    page.getByRole('button', { name: 'Download notes.txt' })
  ).toBeVisible()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download notes.txt' }).click()
  expect((await downloading).suggestedFilename()).toBe('notes.txt')
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete notes.txt' }).click()
  await expect(
    page.getByRole('button', { name: 'Download notes.txt' })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('link', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Delete Campus event' }).click()
  await page
    .getByRole('button', { name: 'Delete project', exact: true })
    .click()
  expect(state.assignments).toHaveLength(1)
  expect(state.assignments[0].project_id).toBeNull()
})

test('legacy schema works and failed status writes leave the task unchanged', async ({
  page,
}) => {
  await mockWorkspace(page, { legacy: true, failStatus: true })
  await page.goto('/assignments')
  await expect(
    page.getByRole('button', { name: 'Existing homework', exact: true })
  ).toBeVisible()
  await page.getByLabel('Status for Existing homework').selectOption('done')
  await expect(page.getByRole('alert')).toContainText('Simulated write failure')
  await expect(page.getByLabel('Status for Existing homework')).toHaveValue(
    'not started'
  )
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  await expect(page.locator('#task-deadline')).toHaveAttribute('required', '')
  await expect(page.locator('#task-project')).toHaveCount(0)
})

test('loads over 1000 tasks and paginates the full result', async ({
  page,
}) => {
  await mockWorkspace(page, { many: true })
  await page.goto('/assignments')
  await expect(page.getByText('1005 of 1005 tasks')).toBeVisible()
  await expect(page.locator('article')).toHaveCount(12)
  await page.getByLabel('Search tasks').fill('Task 1003')
  await expect(page.locator('article')).toHaveCount(1)
})

test('dashboard includes project progress and preserves study planner navigation', async ({
  page,
}) => {
  const state = await mockWorkspace(page)
  state.assignments[0].project_id = projectId
  state.assignments[0].deadline = null
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Project progress' })
  ).toBeVisible()
  await expect(page.getByText('0 / 1 tasks done · 0%')).toBeVisible()
  await expect(page.getByText('Active Tasks', { exact: true })).toBeVisible()
  await page.screenshot({
    path: 'test-results/dashboard-desktop.png',
    animations: 'disabled',
    fullPage: true,
  })
  await page.getByRole('link', { name: 'Study Planner', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Study Planner', exact: true })
  ).toBeVisible()
  await expect(page.getByText('No sessions planned')).toBeVisible()
})

test('permanent project deletion cleans files and tasks only for the selected project', async ({
  page,
}) => {
  const state = await mockWorkspace(page)
  state.assignments[0].project_id = projectId
  state.files.push({ id: 'file', path: `${uid}/${taskId}/notes.txt` })
  state.assignments.push({
    ...state.assignments[0],
    id: 'separate-task',
    title: 'Keep me',
    project_id: null,
  })
  await page.goto('/projects')
  await page.getByRole('button', { name: 'Delete Campus event' }).click()
  await page.getByRole('checkbox').check()
  await page
    .getByRole('button', { name: 'Delete project', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.projects).toHaveLength(0)
  expect(state.files).toHaveLength(0)
  expect(state.assignments.map((task) => task.title)).toEqual(['Keep me'])
})

test('mobile layout, dialog, and dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockWorkspace(page)
  await page.goto('/assignments')
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .last()
    .click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/tasks-mobile-dark.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Title', { exact: true }).fill('New mobile task')
  await page.getByLabel('Subject / category').fill('Personal')
  await page.getByRole('button', { name: 'Create task', exact: true }).click()
  await expect(page.getByText('Task saved.', { exact: false })).toBeVisible()
  await page.screenshot({
    path: 'test-results/task-dialog-mobile.png',
    fullPage: true,
  })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
