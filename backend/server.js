require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb().catch(err => {
  console.error("Error initializing DB:", err);
});

// METAS
app.get('/api/goals', async (req, res) => {
  const db = await getDb();
  const goals = await db.all('SELECT * FROM goals');
  res.json(goals);
});

app.get('/api/goals/:id', async (req, res) => {
  const db = await getDb();
  const goal = await db.get('SELECT * FROM goals WHERE id = ?', [req.params.id]);
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  const habits = await db.all('SELECT * FROM habits WHERE goal_id = ?', [goal.id]);
  res.json({ ...goal, habits });
});

app.post('/api/goals', async (req, res) => {
  const { title, type, target_date, target_number, color } = req.body;
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO goals (title, type, target_date, target_number, color) VALUES (?, ?, ?, ?, ?)',
    [title, type || 'generic', target_date, target_number, color || 'bg-blue-500']
  );
  const newGoal = await db.get('SELECT * FROM goals WHERE id = ?', [result.lastID]);
  res.json(newGoal);
});

app.delete('/api/goals/:id', async (req, res) => {
  const db = await getDb();
  await db.run('UPDATE habits SET goal_id = NULL WHERE goal_id = ?', [req.params.id]);
  await db.run('DELETE FROM goals WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// HÁBITOS
app.get('/api/habits', async (req, res) => {
  const db = await getDb();
  const habits = await db.all('SELECT * FROM habits');
  res.json(habits);
});

app.get('/api/habits/:id', async (req, res) => {
  const db = await getDb();
  const habit = await db.get('SELECT * FROM habits WHERE id = ?', [req.params.id]);
  if (!habit) return res.status(404).json({ error: "Habit not found" });
  const logs = await db.all('SELECT * FROM habit_logs WHERE habit_id = ?', [habit.id]);
  res.json({ ...habit, logs });
});

app.post('/api/habits', async (req, res) => {
  const { goal_id, title, description, frequency, specific_days, color_theme } = req.body;
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO habits (goal_id, title, description, frequency, specific_days, color_theme) VALUES (?, ?, ?, ?, ?, ?)',
    [goal_id || null, title, description, frequency || 7, specific_days || null, color_theme || 'emerald']
  );
  const newHabit = await db.get('SELECT * FROM habits WHERE id = ?', [result.lastID]);
  res.json(newHabit);
});

app.delete('/api/habits/:id', async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM habit_logs WHERE habit_id = ?', [req.params.id]);
  await db.run('DELETE FROM habits WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// LOGS
app.get('/api/habit_logs', async (req, res) => {
  const db = await getDb();
  const logs = await db.all('SELECT * FROM habit_logs');
  res.json(logs);
});

app.post('/api/habit_logs/toggle', async (req, res) => {
  const { habit_id, date, completed } = req.body;
  const db = await getDb();
  await db.run(`
    INSERT INTO habit_logs (habit_id, date, completed)
    VALUES (?, ?, ?)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
  `, [habit_id, date, completed ? 1 : 0]);
  res.json({ success: true });
});

// NOTAS
app.get('/api/notes', async (req, res) => {
  const { date } = req.query;
  const db = await getDb();
  if (date) {
    const note = await db.get('SELECT * FROM notes WHERE date = ?', [date]);
    return res.json(note || { content: '', title: '' });
  }
  const notes = await db.all('SELECT * FROM notes ORDER BY date DESC');
  res.json(notes);
});

app.post('/api/notes', async (req, res) => {
  const { date, content, title } = req.body;
  const db = await getDb();
  await db.run(`
    INSERT INTO notes (date, content, title)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET content = excluded.content, title = excluded.title
  `, [date, content, title]);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
