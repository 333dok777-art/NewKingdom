import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
const migrationLockId = 71013001

export async function runMigrations() {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1)', [migrationLockId])
    await client.query('BEGIN')
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
    const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
    const applied = []
    for (const filename of files) {
      const existing = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename])
      if (existing.rowCount) continue
      await client.query(await fs.readFile(path.join(directory, filename), 'utf8'))
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
      applied.push(filename)
    }
    await client.query('COMMIT')
    return applied
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [migrationLockId]).catch(() => {})
    client.release()
  }
}
