const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function getDb() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await getDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'boolean',
      target_date TEXT,
      target_number REAL,
      color TEXT DEFAULT 'bg-blue-500'
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      frequency INTEGER DEFAULT 7,
      specific_days TEXT, 
      color_theme TEXT DEFAULT 'emerald',
      measure_type TEXT DEFAULT 'boolean', -- boolean, quantity, time
      target_value REAL,
      unit TEXT, -- min, km, etc.
      FOREIGN KEY (goal_id) REFERENCES goals (id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      value REAL DEFAULT 0, -- Store quantity/time here
      UNIQUE(habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits (id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      title TEXT,
      content TEXT,
      folder TEXT DEFAULT 'Diario'
    )
  `);
}

module.exports = { getDb, initDb };
