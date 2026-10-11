import { readFile } from 'node:fs/promises'

const config = { ...process.env }
try {
  const file = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of file.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match && !config[match[1]])
      config[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const url = config.VITE_SUPABASE_URL
const key = config.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error(
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
  )
  process.exitCode = 1
} else {
  console.log(
    `Checking schema availability at ${new URL(url).host}; no data will be changed.`
  )
  const checks = [
    [
      'Legacy tasks',
      'assignments?select=id,title,subject,deadline,status,priority&limit=0',
    ],
    ['Projects', 'projects?select=id,name,user_id,status,deadline&limit=0'],
    [
      'Extended task fields',
      'assignments?select=id,project_id,description,completed_at,updated_at&limit=0',
    ],
    ['Study sessions', 'study_sessions?select=id&limit=0'],
  ]
  for (const [label, path] of checks) {
    try {
      const response = await fetch(
        `${url.replace(/\/$/, '')}/rest/v1/${path}`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(15000),
        }
      )
      const body = await response.json()
      if (response.ok)
        console.log(`${label}: available (HTTP ${response.status})`)
      else if (body.code === '42501') {
        console.log(
          `${label}: table exists; authenticated access required (HTTP ${response.status}).`
        )
      } else {
        console.log(
          `${label}: HTTP ${response.status}; ${body.code || 'error'}; ${body.message || 'Unavailable'}`
        )
        process.exitCode = 1
      }
    } catch {
      console.error(`${label}: network request failed.`)
      process.exitCode = 1
    }
  }
}
