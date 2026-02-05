// init-database.js -> create all databases if not made
// Landon Lego
// Last updated 2/5/2026

// imports
const Database = require('better-sqlite3');
const path = require('path');

// create / open database
const db = new Database(path.join(__dirname, '../databases/bot.db'));
db.pragma('foreign_keys = ON');

// initialize tables
function initDatabase() {
    // prefixes table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS prefixes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            prefix TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            UNIQUE(guild_id, prefix)
        )
    `).run();

    console.log('✅ Databases initialized successfully');
}

// initialize
initDatabase();

// exports
module.exports = db;