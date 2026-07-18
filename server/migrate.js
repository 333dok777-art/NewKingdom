import 'dotenv/config'
import { pool } from './db.js'
import { runMigrations } from './migrations.js'

const applied = await runMigrations()
console.log(`Migrations completed. Applied: ${applied.length}`)
await pool.end()
