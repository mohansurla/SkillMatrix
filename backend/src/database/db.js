const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('../config');

const dbPath = path.resolve(config.database.path);
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database:', dbPath);
});

// Enable WAL mode and foreign keys
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
});

// Promisified helpers
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

// Schema creation
const initSchema = async () => {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','mentor','admin')),
    avatar_url TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    skill_id INTEGER NOT NULL,
    mentor_id INTEGER,
    max_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS mentor_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL UNIQUE,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('pending','submitted','evaluated')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (module_id) REFERENCES modules(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL UNIQUE,
    mentor_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
    feedback TEXT,
    evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS progress_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    completion_percentage REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system' CHECK(type IN ('feedback','assignment','system')),
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
};

// Seed data
const seedData = async () => {
  const existing = await get('SELECT id FROM users WHERE email = ?', ['admin@skillmatrix.com']);
  if (existing) return; // Already seeded

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const mentorHash = await bcrypt.hash('Mentor@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  // Users
  const admin = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Admin User', 'admin@skillmatrix.com', adminHash, 'admin']
  );
  const mentor1 = await run(
    'INSERT INTO users (name, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?)',
    ['Sarah Mitchell', 'mentor@skillmatrix.com', mentorHash, 'mentor', 'Senior Full-Stack Developer with 8 years of experience']
  );
  const mentor2 = await run(
    'INSERT INTO users (name, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?)',
    ['James Chen', 'james@skillmatrix.com', mentorHash, 'mentor', 'Data Science and ML expert']
  );
  const student1 = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Alex Johnson', 'student@skillmatrix.com', studentHash, 'student']
  );
  const student2 = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Priya Sharma', 'priya@skillmatrix.com', studentHash, 'student']
  );
  const student3 = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Marcus Lee', 'marcus@skillmatrix.com', studentHash, 'student']
  );

  // Skills
  const skill1 = await run(
    'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
    ['JavaScript', 'Modern JavaScript including ES6+ features', 'Programming', admin.lastID]
  );
  const skill2 = await run(
    'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
    ['React.js', 'Component-based UI development with React', 'Frontend', admin.lastID]
  );
  const skill3 = await run(
    'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
    ['Node.js', 'Server-side JavaScript with Node and Express', 'Backend', admin.lastID]
  );
  const skill4 = await run(
    'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
    ['Data Science', 'Python-based data analysis and visualization', 'Data', admin.lastID]
  );
  const skill5 = await run(
    'INSERT INTO skills (name, description, category, created_by) VALUES (?, ?, ?, ?)',
    ['SQL & Databases', 'Relational databases, queries and optimization', 'Database', admin.lastID]
  );

  // Modules
  const mod1 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['JS Fundamentals', 'Variables, functions, loops, and closures', skill1.lastID, mentor1.lastID, 100]
  );
  const mod2 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['Async JavaScript', 'Promises, async/await, and the event loop', skill1.lastID, mentor1.lastID, 100]
  );
  const mod3 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['React Basics', 'Components, props, state, and hooks', skill2.lastID, mentor1.lastID, 100]
  );
  const mod4 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['React Advanced', 'Context, custom hooks, and performance', skill2.lastID, mentor1.lastID, 100]
  );
  const mod5 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['REST APIs with Express', 'Building RESTful APIs using Node.js and Express', skill3.lastID, mentor1.lastID, 100]
  );
  const mod6 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['Python for Data Science', 'NumPy, Pandas and data manipulation', skill4.lastID, mentor2.lastID, 100]
  );
  const mod7 = await run(
    'INSERT INTO modules (title, description, skill_id, mentor_id, max_score) VALUES (?, ?, ?, ?, ?)',
    ['SQL Fundamentals', 'SELECT, JOIN, GROUP BY and aggregate functions', skill5.lastID, mentor2.lastID, 100]
  );

  // Mentor-student assignments
  await run('INSERT INTO mentor_students (mentor_id, student_id) VALUES (?, ?)', [mentor1.lastID, student1.lastID]);
  await run('INSERT INTO mentor_students (mentor_id, student_id) VALUES (?, ?)', [mentor1.lastID, student2.lastID]);
  await run('INSERT INTO mentor_students (mentor_id, student_id) VALUES (?, ?)', [mentor2.lastID, student3.lastID]);

  // Assignments for student1
  const a1 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student1.lastID, mod1.lastID, 'JS Fundamentals Assignment', 'Implemented closures and HOF examples', 'evaluated']
  );
  const a2 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student1.lastID, mod2.lastID, 'Async JS Assignment', 'Built a promise-based data fetcher', 'evaluated']
  );
  const a3 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student1.lastID, mod3.lastID, 'React Basics Assignment', 'Created a todo app with hooks', 'submitted']
  );

  // Assignments for student2
  const a4 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student2.lastID, mod1.lastID, 'JS Fundamentals Assignment', 'Completed all exercises', 'evaluated']
  );

  // Assignments for student3
  const a5 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student3.lastID, mod6.lastID, 'Python Data Science', 'Pandas data analysis project', 'evaluated']
  );
  const a6 = await run(
    'INSERT INTO assignments (student_id, module_id, title, description, status) VALUES (?, ?, ?, ?, ?)',
    [student3.lastID, mod7.lastID, 'SQL Fundamentals', 'Complex query exercises', 'submitted']
  );

  // Evaluations
  await run(
    'INSERT INTO evaluations (assignment_id, mentor_id, score, feedback) VALUES (?, ?, ?, ?)',
    [a1.lastID, mentor1.lastID, 88, 'Excellent understanding of closures. Consider exploring generator functions next.']
  );
  await run(
    'INSERT INTO evaluations (assignment_id, mentor_id, score, feedback) VALUES (?, ?, ?, ?)',
    [a2.lastID, mentor1.lastID, 92, 'Great async patterns! The error handling could be more robust.']
  );
  await run(
    'INSERT INTO evaluations (assignment_id, mentor_id, score, feedback) VALUES (?, ?, ?, ?)',
    [a4.lastID, mentor1.lastID, 75, 'Good fundamentals. Work on understanding scope and hoisting better.']
  );
  await run(
    'INSERT INTO evaluations (assignment_id, mentor_id, score, feedback) VALUES (?, ?, ?, ?)',
    [a5.lastID, mentor2.lastID, 95, 'Outstanding data manipulation skills! Ready for ML concepts.']
  );

  // Progress tracking
  await run(
    'INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
    [student1.lastID, skill1.lastID, 66.7]
  );
  await run(
    'INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
    [student1.lastID, skill2.lastID, 25]
  );
  await run(
    'INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
    [student2.lastID, skill1.lastID, 33.3]
  );
  await run(
    'INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
    [student3.lastID, skill4.lastID, 50]
  );
  await run(
    'INSERT INTO progress_tracking (student_id, skill_id, completion_percentage) VALUES (?, ?, ?)',
    [student3.lastID, skill5.lastID, 50]
  );

  // Notifications
  await run(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [student1.lastID, 'Your JS Fundamentals assignment has been evaluated. Score: 88/100', 'feedback']
  );
  await run(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [student1.lastID, 'Your Async JavaScript assignment has been evaluated. Score: 92/100', 'feedback']
  );
  await run(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [student2.lastID, 'Your JS Fundamentals assignment has been evaluated. Score: 75/100', 'feedback']
  );
  await run(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [student3.lastID, 'Your Python Data Science assignment has been evaluated. Score: 95/100', 'feedback']
  );
  await run(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [student1.lastID, 'Welcome to SkillMatrix! Your learning journey begins.', 'system']
  );

  console.log('✅ Database seeded successfully');
};

const initDatabase = async () => {
  await initSchema();
  await seedData();
};

module.exports = { db, run, get, all, initDatabase };
