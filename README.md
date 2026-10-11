# StudyFlow

React + Vite + Supabase student task and project management. Existing assignment
IDs, ownership, subjects, priorities, deadlines, and status values are retained.

## CampusFlow features

- Projects: name, description, optional deadline, Planning / Active / On Hold /
  Completed status, search, status filter, pagination, and task progress.
- Tasks: optional project, description, optional deadline, priority, subject,
  completion timestamp, and CRUD. Existing tasks remain under **No project**.
- Combined search, project/status/priority filters, overdue/today/next-seven-days/
  no-deadline presets, inclusive date ranges, sorting, and list pagination.
- Kanban with drag-and-drop between statuses. Status menus provide the same action
  for keyboard and touch users. Filters also apply to the board.
- Private attachments: up to five files per upload, 10 MB per file, authenticated
  download, and deletion. File operations are saved immediately, independently of
  task form edits. Save a new task before uploading files. Failed partial uploads
  keep successful files and let you retry the remaining files without duplication.
- Excel export of **all filtered tasks**, including tasks outside the visible page.
  The file is an Excel XML Spreadsheet (`.xml`), opened with Excel or LibreOffice;
  text cells preserve user input safely without evaluating formulas. CampusFlow's
  HTML-with-`.xls` export is replaced by a structured SpreadsheetML workbook.
- Dashboard project counts, active task counts, project progress, overdue tasks,
  and overall completion; Study Planner and dark mode remain available.
- Remember-me checkbox. Unchecked sessions use browser session storage; checked
  sessions use local storage. Existing Supabase sessions remain readable.
- Supabase Auth handles login, signup, token refresh, and configured auth rate
  limits. Laravel session/CSRF middleware is not copied into this token-based app.

Deleting a project keeps its tasks and files by default. The confirmation dialog
also offers permanent deletion of all its tasks and attachments. File deletions
and task deletions cannot share a database transaction: if an operation fails,
processing stops, successful deletions remain applied, and the remaining items
stay visible for retry. A database trigger prevents deleting tasks while files
still exist. Project ownership is enforced by a composite foreign key and RLS.

## Local development

Use Node 22.12+ and install dependencies with `npm install`. Set these values in
an ignored `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use a development Supabase project for interactive writes. Never place a service
role key in a `VITE_` variable. Start with `npm run dev`; build with `npm run build`.

## Database activation — not applied automatically

Run `npm run prepare:supabase` to prepare `supabase/setup_workspace.sql`. In
Supabase Dashboard, open the StudyFlow project, choose **SQL Editor → New query**,
paste the whole file, and run it. This script works with a fresh database or the
original StudyFlow base schema, creates missing tables, applies the workspace
migration, and grants the authenticated permissions required by the app.
`npm run check:backend` diagnoses missing tables and columns without reading task
contents or changing data. A permission response from an unauthenticated project
check is expected; project reads require a signed-in user.

If the account owner chooses to start over, use `supabase/reset_my_data.sql` after
activation. Replace its email placeholder with the StudyFlow login email. The
reset deletes only that account's assignments, study sessions, and projects,
while preserving the login account and every other user's records. It stops
without changes if attachment files remain; remove those files through Storage's
API or Dashboard first. Preparing SQL files does not run them.

The repository contains the upgrade in
`supabase/migrations/202610110001_campusflow_features.sql`. No build or startup
command runs SQL. The production database and Vercel deployment are separate from
these local changes.

For an existing database, first compare its actual schema with `supabase/schema.sql`
and take a backup. Apply **only the migration** to a test copy first. Do not rerun
the base schema or the historical repair script against your current data.
For a fresh development database, run `supabase/schema.sql` followed by migrations
in filename order. The migration requires PostgreSQL 15+ and the Supabase Auth and
Storage schemas. It runs inside a transaction and can be rerun.

The upgrade adds `projects`, optional project links, task descriptions and
timestamps, and the private `task-attachments` Storage bucket. It preserves all
existing task rows and allows deadlines to be blank on new/edited tasks. Historical
completed tasks keep an unknown (`NULL`) completion timestamp rather than an
invented completion date. Existing ownership policies remain, with an additional
restrictive guard for assignments and for files in the new bucket.

Before migration, the UI detects a missing `projects` table and continues to read,
create, edit, and delete legacy tasks without sending new database fields. Project
and attachment controls become available after the migration and a reload.

Before a later production rollout, verify backup/restore, the actual database
schema, bucket upload/download/delete with two separate users, and preview
environment variables. Keep preview connected to a test database. Apply the
reviewed migration before deploying the new UI. Reset account data only when the
owner explicitly requests it, using the scoped reset above. Rolling
back the UI does not roll back the database; old UIs do not understand tasks with
blank deadlines or attachments. Prefer a forward fix after new data is created.

## Verification

```sh
npm test
npm run test:browser
npm run build
```

Unit tests cover filter combinations, dates, legacy data, export escaping, file
limits, and session persistence. Migration tests execute real PostgreSQL through
PGlite in memory, with minimal Auth/Storage fixtures: they verify preserved data,
idempotence, cross-user RLS, project ownership, completion timestamps, and file
cleanup guards. They do not replace a Supabase Storage API integration test.

Browser tests use fake Supabase responses and block external requests, so they
cannot modify production. They cover task/project flows, Kanban, files, errors,
legacy schema, pagination beyond 1,000 records, mobile layouts, and dark mode.
Windows uses installed Microsoft Edge; on other platforms run
`npx playwright install chromium` once before browser tests. Screenshots and traces
are written to ignored `test-results/`.
