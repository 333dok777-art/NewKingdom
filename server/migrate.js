import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
for (const file of (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) await pool.query(await fs.readFile(path.join(directory, file), 'utf8'))
console.log('Migrations completed.')
await pool.end()
