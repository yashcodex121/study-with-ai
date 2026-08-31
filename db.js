const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'samadhan.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  password_hash TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS sticky_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  color_bg TEXT NOT NULL,
  color_tape TEXT NOT NULL,
  rotation REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

// Lightweight migration for people who already ran the app before this column existed.
try {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
} catch (e) {
  // column already exists — ignore
}

function createLocalUser({ email, name, passwordHash }) {
  const info = db
    .prepare('INSERT INTO users (provider, provider_id, name, password_hash) VALUES (?,?,?,?)')
    .run('local', email, name || email.split('@')[0], passwordHash);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

function getLocalUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get('local', email);
}

function findOrCreateUser({ provider, providerId, name, avatar }) {
  const existing = db
    .prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?')
    .get(provider, providerId);
  if (existing) return existing;

  const info = db
    .prepare('INSERT INTO users (provider, provider_id, name, avatar) VALUES (?,?,?,?)')
    .run(provider, providerId, name || 'Student', avatar || null);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function addXp(userId, gain) {
  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(gain, userId);
  return db.prepare('SELECT xp FROM users WHERE id = ?').get(userId).xp;
}

function getNotes(userId) {
  return db
    .prepare('SELECT * FROM sticky_notes WHERE user_id = ? ORDER BY id')
    .all(userId);
}

function insertNotes(userId, notes) {
  const insert = db.prepare(
    'INSERT INTO sticky_notes (user_id, text, color_bg, color_tape, rotation) VALUES (?,?,?,?,?)'
  );
  return notes.map(n => {
    const info = insert.run(userId, n.text, n.color.bg, n.color.tape, n.rotation);
    return { id: info.lastInsertRowid, text: n.text, color: n.color, rotation: n.rotation };
  });
}

function deleteNote(userId, noteId) {
  db.prepare('DELETE FROM sticky_notes WHERE id = ? AND user_id = ?').run(noteId, userId);
}

module.exports = {
  db,
  findOrCreateUser,
  createLocalUser,
  getLocalUserByEmail,
  getUserById,
  addXp,
  getNotes,
  insertNotes,
  deleteNote,
};
