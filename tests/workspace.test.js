import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterTasks,
  localDate,
  tasksWorkbook,
  validateFiles,
  validateTask,
} from '../src/lib/workspace.js'

const tasks = [
  {
    id: 'old',
    title: 'Legacy homework',
    subject: 'Math',
    status: 'not started',
    priority: 'high',
    deadline: '2026-10-09',
  },
  {
    id: 'today',
    title: 'Event',
    description: 'Book a room',
    project_id: 'p1',
    status: 'in progress',
    priority: 'medium',
    deadline: '2026-10-10',
  },
  {
    id: 'done',
    title: 'Finished',
    project_id: 'p1',
    status: 'done',
    priority: 'low',
    deadline: '2026-10-08',
  },
  {
    id: 'none',
    title: 'Someday',
    status: 'not started',
    priority: 'low',
    deadline: null,
  },
  {
    id: 'week',
    title: 'Next week',
    project_id: 'p2',
    status: 'not started',
    priority: 'medium',
    deadline: '2026-10-17',
  },
  {
    id: 'later',
    title: 'Later',
    status: 'not started',
    priority: 'medium',
    deadline: '2026-10-18',
  },
]
const ids = (filters) =>
  filterTasks(tasks, filters, '2026-10-10').map((t) => t.id)

test('legacy tasks without project/description stay visible', () => {
  assert.equal(ids({}).length, tasks.length)
  assert.deepEqual(ids({ project: 'none', q: 'MATH' }), ['old'])
})
test('search and project/status/priority filters intersect', () => {
  assert.deepEqual(
    ids({
      q: 'room',
      project: 'p1',
      status: 'in progress',
      priority: 'medium',
    }),
    ['today']
  )
  assert.deepEqual(ids({ q: 'room', project: 'p2' }), [])
})
test('deadline presets exclude nulls and completed overdue tasks', () => {
  assert.deepEqual(ids({ deadline: 'overdue' }), ['old'])
  assert.deepEqual(ids({ deadline: 'today' }), ['today'])
  assert.deepEqual(ids({ deadline: 'week' }), ['today', 'week'])
  assert.deepEqual(ids({ deadline: 'none' }), ['none'])
})
test('date ranges are inclusive and completed tasks sort last', () => {
  assert.deepEqual(ids({ from: '2026-10-08', to: '2026-10-10' }), [
    'old',
    'today',
    'done',
  ])
  assert.equal(ids({}).at(-1), 'done')
})
test('calendar date uses local components at midnight', () => {
  assert.equal(localDate(new Date(2026, 9, 11, 0, 15)), '2026-10-11')
})
test('workbook escapes markup, removes invalid XML, and keeps formulas as text', () => {
  const xml = tasksWorkbook(
    [
      {
        title: '=HYPERLINK("bad")<x>&\u0000',
        status: 'done',
        project_id: 'p1',
      },
    ],
    [{ id: 'p1', name: 'BEM' }]
  )
  assert.ok(
    xml.includes('ss:Type="String">=HYPERLINK(&quot;bad&quot;)&lt;x&gt;&amp;')
  )
  assert.ok(xml.includes('>BEM</Data>'))
  assert.ok(!xml.includes('ss:Formula'))
  assert.ok(!xml.includes('\u0000'))
})
test('uploads reject oversized, empty, and more than five files', () => {
  assert.throws(
    () => validateFiles(Array(6).fill({ name: 'a', size: 1 })),
    /5 files/
  )
  assert.throws(
    () => validateFiles([{ name: 'huge', size: 10485761 }]),
    /10 MB/
  )
  assert.throws(() => validateFiles([{ name: 'empty', size: 0 }]), /empty/)
  assert.doesNotThrow(() => validateFiles([{ name: 'limit', size: 10485760 }]))
})
test('legacy schema still requires deadline; upgraded schema allows no deadline', () => {
  const data = {
    title: 'Task',
    subject: 'General',
    status: 'not started',
    priority: 'medium',
    deadline: '',
  }
  assert.throws(() => validateTask(data, false), /deadline/)
  assert.doesNotThrow(() => validateTask(data, true))
  assert.throws(() => validateTask({ ...data, title: '  ' }), /title/)
})
