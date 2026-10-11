import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('migration preserves legacy data and enforces project/file ownership', async () => {
  const db = new PGlite()
  const userA = '11111111-1111-4111-8111-111111111111'
  const userB = '22222222-2222-4222-8222-222222222222'
  const taskA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const taskB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const projectA = 'aaaaaaaa-0000-4000-8000-000000000001'
  const projectB = 'bbbbbbbb-0000-4000-8000-000000000001'
  try {
    await db.exec(`
      CREATE ROLE authenticated; CREATE ROLE anon;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint);
      CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
      CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1] $$;
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public, auth, storage TO authenticated, anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
      INSERT INTO auth.users VALUES ('${userA}'), ('${userB}');
    `)
    await db.exec(
      await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
    )
    await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
      INSERT INTO public.assignments (id,user_id,title,subject,deadline,status) VALUES
      ('${taskA}','${userA}','Original task','Math','2026-10-09','done'),
      ('${taskB}','${userB}','Other user task','Science','2026-10-12','not started');`)
    const before = (
      await db.query(
        'SELECT id,user_id,title,subject,deadline,status,priority,created_at FROM assignments ORDER BY id'
      )
    ).rows
    const migration = await readFile(
      new URL(
        '../supabase/migrations/202610110001_campusflow_features.sql',
        import.meta.url
      ),
      'utf8'
    )
    await db.exec(migration)
    await db.exec(migration) // Re-running the same reviewed SQL is safe.
    const cleanupPermissions = `SELECT
      has_function_privilege('anon', 'public.studyflow_require_file_cleanup()', 'EXECUTE') AS anon,
      has_function_privilege('authenticated', 'public.studyflow_require_file_cleanup()', 'EXECUTE') AS authenticated`
    assert.deepEqual((await db.query(cleanupPermissions)).rows, [
      { anon: false, authenticated: false },
    ])
    // Reproduce the grants left by the earlier upgrade on an existing project.
    await db.exec(
      `GRANT EXECUTE ON FUNCTION public.studyflow_require_file_cleanup() TO anon, authenticated`
    )
    await db.exec(
      await readFile(
        new URL(
          '../supabase/migrations/202610110002_private_cleanup_function.sql',
          import.meta.url
        ),
        'utf8'
      )
    )
    assert.deepEqual((await db.query(cleanupPermissions)).rows, [
      { anon: false, authenticated: false },
    ])
    assert.deepEqual(
      (
        await db.query(
          'SELECT id,user_id,title,subject,deadline,status,priority,created_at FROM assignments ORDER BY id'
        )
      ).rows,
      before
    )
    assert.equal(
      (
        await db.query(
          `SELECT completed_at FROM assignments WHERE id='${taskA}'`
        )
      ).rows[0].completed_at,
      null
    )
    await db.exec(`INSERT INTO projects(id,user_id,name) VALUES ('${projectA}','${userA}','A'),('${projectB}','${userB}','B');
      SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${userA}',false);`)
    assert.equal((await db.query('SELECT * FROM assignments')).rows.length, 1)
    assert.deepEqual((await db.query('SELECT name FROM projects')).rows, [
      { name: 'A' },
    ])
    await assert.rejects(
      db.exec(
        `UPDATE assignments SET project_id='${projectB}' WHERE id='${taskA}'`
      ),
      /foreign key/
    )
    await assert.rejects(
      db.exec(`INSERT INTO projects(user_id,name) VALUES ('${userB}','Spoof')`),
      /row-level security/
    )
    await assert.rejects(
      db.exec(`UPDATE projects SET user_id='${userB}' WHERE id='${projectA}'`),
      /row-level security/
    )
    await db.exec(
      `UPDATE assignments SET project_id='${projectA}', deadline=NULL, status='in progress' WHERE id='${taskA}'`
    )
    await db.exec(`UPDATE assignments SET status='done' WHERE id='${taskA}'`)
    assert.ok(
      (
        await db.query(
          `SELECT completed_at FROM assignments WHERE id='${taskA}'`
        )
      ).rows[0].completed_at
    )
    await db.exec(
      `UPDATE assignments SET status='not started' WHERE id='${taskA}'`
    )
    assert.equal(
      (
        await db.query(
          `SELECT completed_at FROM assignments WHERE id='${taskA}'`
        )
      ).rows[0].completed_at,
      null
    )
    await assert.rejects(
      db.exec(`UPDATE assignments SET title=' ' WHERE id='${taskA}'`),
      /title/
    )
    const path = `${userA}/${taskA}/file.txt`
    await db.query(
      'INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)',
      ['task-attachments', path]
    )
    await assert.rejects(
      db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', [
        'task-attachments',
        `${userA}/${taskB}/spoof.txt`,
      ]),
      /row-level security/
    )
    await assert.rejects(
      db.exec(`DELETE FROM assignments WHERE id='${taskA}'`),
      /attachments/
    )
    await db.exec(`DELETE FROM projects WHERE id='${projectA}'`)
    const kept = (
      await db.query(
        `SELECT project_id,user_id FROM assignments WHERE id='${taskA}'`
      )
    ).rows[0]
    assert.deepEqual(kept, { project_id: null, user_id: userA })
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${userB}',false)`)
    assert.equal(
      (await db.query('SELECT * FROM storage.objects')).rows.length,
      0
    )
    assert.equal(
      (
        await db.query(
          `DELETE FROM storage.objects WHERE name=$1 RETURNING id`,
          [path]
        )
      ).rows.length,
      0
    )
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${userA}',false)`)
    await db.query('DELETE FROM storage.objects WHERE name=$1', [path])
    await db.exec(`DELETE FROM assignments WHERE id='${taskA}'`)
    assert.equal((await db.query('SELECT * FROM assignments')).rows.length, 0)
    await db.exec('RESET ROLE')
    assert.equal((await db.query('SELECT * FROM assignments')).rows.length, 1)
    const bucket = (
      await db.query('SELECT public,file_size_limit FROM storage.buckets')
    ).rows[0]
    assert.equal(bucket.public, false)
    assert.equal(Number(bucket.file_size_limit), 10485760)
  } finally {
    await db.close()
  }
})
