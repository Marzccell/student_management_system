import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('standalone activation works on a fresh database and reset touches only the chosen account', async () => {
  const db = new PGlite()
  const owner = '11111111-1111-4111-8111-111111111111'
  const other = '22222222-2222-4222-8222-222222222222'
  try {
    await db.exec(`
      CREATE ROLE authenticated; CREATE ROLE anon;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint);
      CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1] $$;
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public, auth, storage TO authenticated, anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
      INSERT INTO auth.users VALUES ('${owner}','owner@example.test'), ('${other}','other@example.test');
    `)
    const setup = await readFile(
      new URL('../supabase/setup_workspace.sql', import.meta.url),
      'utf8'
    )
    await db.exec(setup)
    await db.exec(setup)
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${owner}',false);`
    )
    const project = (
      await db.query(
        `INSERT INTO projects(user_id,name) VALUES ($1,'Fresh project') RETURNING id`,
        [owner]
      )
    ).rows[0].id
    const task = (
      await db.query(
        `INSERT INTO assignments(user_id,title,subject,project_id) VALUES ($1,'Fresh task','General',$2) RETURNING id`,
        [owner, project]
      )
    ).rows[0].id
    await db.exec('RESET ROLE')
    await db.query(
      `INSERT INTO assignments(user_id,title,subject) VALUES ($1,'Keep other account','General')`,
      [other]
    )
    await db.query(
      `INSERT INTO study_sessions(user_id,subject,topic,duration,date) VALUES ($1,'Math','Review',30,CURRENT_DATE),($2,'Science','Review',30,CURRENT_DATE)`,
      [owner, other]
    )
    const resetTemplate = await readFile(
      new URL('../supabase/reset_my_data.sql', import.meta.url),
      'utf8'
    )
    await assert.rejects(db.exec(resetTemplate), /Enter the email/)
    await db.exec('ROLLBACK')
    const reset = resetTemplate.replace(
      'YOUR_STUDYFLOW_LOGIN_EMAIL',
      'owner@example.test'
    )
    await db.query(
      `INSERT INTO storage.objects(bucket_id,name) VALUES ('task-attachments',$1)`,
      [`${owner}/${task}/notes.txt`]
    )
    await assert.rejects(db.exec(reset), /attachments/)
    await db.exec('ROLLBACK')
    assert.equal(
      (await db.query('SELECT count(*)::int AS n FROM assignments')).rows[0].n,
      2
    )
    // Only the in-memory fixture simulates Storage cleanup with SQL. Real files
    // must be removed via the Storage API, never by deleting metadata in SQL.
    await db.exec('DELETE FROM storage.objects')
    await db.exec(reset)
    assert.deepEqual((await db.query('SELECT title FROM assignments')).rows, [
      { title: 'Keep other account' },
    ])
    assert.equal(
      (await db.query('SELECT count(*)::int AS n FROM projects')).rows[0].n,
      0
    )
    assert.deepEqual(
      (await db.query('SELECT user_id FROM study_sessions')).rows,
      [{ user_id: other }]
    )
    assert.equal(
      (await db.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n,
      2
    )
  } finally {
    await db.close()
  }
})
