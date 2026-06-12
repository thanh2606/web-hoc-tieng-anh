import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../chat-history.db')

const SQL = await initSqlJs()

// Load existing DB or create new one
let buffer
if (fs.existsSync(DB_PATH)) {
  buffer = fs.readFileSync(DB_PATH)
}

const rawDb = new SQL.Database(buffer)

// Enable foreign keys
rawDb.run('PRAGMA foreign_keys = ON')

// Initialize schema
rawDb.run(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_user INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv_ts
    ON messages(conversation_id, timestamp);
`)

// Save to disk after first init
persistDb()

// Persist DB to disk
function persistDb() {
  const data = rawDb.export()
  fs.writeFileSync(DB_PATH, data)
}

// Save on exit
process.on('exit', persistDb)
process.on('SIGINT', () => { persistDb(); process.exit(0) })
process.on('SIGTERM', () => { persistDb(); process.exit(0) })

// Wrapper mimicking better-sqlite3 API
const db = {
  prepare(sql) {
    return {
      all(...params) {
        const stmt = rawDb.prepare(sql)
        if (params.length > 0 && params[0] !== undefined) {
          stmt.bind(params)
        }
        const results = []
        while (stmt.step()) {
          results.push(stmt.getAsObject())
        }
        stmt.free()
        return results
      },
      run(...params) {
        if (params.length > 0 && params[0] !== undefined) {
          rawDb.run(sql, params)
        } else {
          rawDb.run(sql)
        }
        persistDb()
        return { changes: rawDb.getRowsModified() }
      },
      get(...params) {
        const stmt = rawDb.prepare(sql)
        if (params.length > 0 && params[0] !== undefined) {
          stmt.bind(params)
        }
        const result = stmt.step() ? stmt.getAsObject() : undefined
        stmt.free()
        return result
      }
    }
  },
  transaction(fn) {
    // sql.js is single-threaded — no concurrent access risk.
    // Run the function directly; each statement persists to disk.
    fn()
  }
}

export { db }
