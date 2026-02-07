const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new Database(dbPath);

// Initialize Tables
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      reset_token TEXT,
      reset_expires DATETIME
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      password TEXT, -- Added for project security
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      project_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      trade TEXT,
      car_reg TEXT,
      user_type TEXT,
      time_in TEXT NOT NULL,
      time_out TEXT,
      hours REAL,
      reason TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );

    CREATE TABLE IF NOT EXISTS date_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL,
      code TEXT,
      user_name TEXT NOT NULL,
      requested_date TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    -- (Existing CREATE TABLE statements)
    -- (Existing CREATE TABLE statements)

    PRAGMA table_info(admins);
    PRAGMA table_info(projects);
  `);

  // Migration: Add columns if they dont exist
  const adminsInfo = db.prepare("PRAGMA table_info(admins)").all();
  if (!adminsInfo.find(c => c.name === 'reset_token')) {
    db.exec("ALTER TABLE admins ADD COLUMN reset_token TEXT");
    db.exec("ALTER TABLE admins ADD COLUMN reset_expires DATETIME");
  }
  if (!adminsInfo.find(c => c.name === 'first_name')) {
    db.exec("ALTER TABLE admins ADD COLUMN first_name TEXT");
  }
  if (!adminsInfo.find(c => c.name === 'last_name')) {
    db.exec("ALTER TABLE admins ADD COLUMN last_name TEXT");
  }
  if (!adminsInfo.find(c => c.name === 'phone')) {
    db.exec("ALTER TABLE admins ADD COLUMN phone TEXT");
  }
  if (!adminsInfo.find(c => c.name === 'organization')) {
    db.exec("ALTER TABLE admins ADD COLUMN organization TEXT");
  }

  const projectsInfo = db.prepare("PRAGMA table_info(projects)").all();
  if (!projectsInfo.find(c => c.name === 'password')) {
    db.exec("ALTER TABLE projects ADD COLUMN password TEXT");
  }
  if (!projectsInfo.find(c => c.name === 'admin_email')) {
    db.exec("ALTER TABLE projects ADD COLUMN admin_email TEXT");
  }
  if (!projectsInfo.find(c => c.name === 'reset_token')) {
    db.exec("ALTER TABLE projects ADD COLUMN reset_token TEXT");
  }
  if (!projectsInfo.find(c => c.name === 'reset_token_expiry')) {
    db.exec("ALTER TABLE projects ADD COLUMN reset_token_expiry INTEGER");
  }

  // Migration for logs table
  const logsInfo = db.prepare("PRAGMA table_info(logs)").all();
  if (!logsInfo.find(c => c.name === 'trade')) {
    db.exec("ALTER TABLE logs ADD COLUMN trade TEXT");
  }
  if (!logsInfo.find(c => c.name === 'car_reg')) {
    db.exec("ALTER TABLE logs ADD COLUMN car_reg TEXT");
  }
  if (!logsInfo.find(c => c.name === 'user_type')) {
    db.exec("ALTER TABLE logs ADD COLUMN user_type TEXT");
  }

  // Migration for date_requests table
  const requestsInfo = db.prepare("PRAGMA table_info(date_requests)").all();
  if (!requestsInfo.find(c => c.name === 'status')) {
    db.exec("ALTER TABLE date_requests ADD COLUMN status TEXT DEFAULT 'pending'");
  }
  if (!requestsInfo.find(c => c.name === 'created_at')) {
    db.exec("ALTER TABLE date_requests ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  }

  // Create default admin if not exists (admin@example.com / admin123)
  const stmt = db.prepare('SELECT * FROM admins WHERE email = ?');
  const admin = stmt.get('admin@example.com');

  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    const insert = db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)');
    insert.run('admin@example.com', hash);
    console.log('Default admin created: admin@example.com / admin123');
  }

  // Data Seeding for Render (Persistence)
  const seedProjects = () => {
    try {
      const seedPath = path.resolve(__dirname, 'seed_data.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

        // 1. Seed Project
        const checkProj = db.prepare('SELECT id FROM projects WHERE code = ?');
        let project = checkProj.get(seedData.project.code);

        if (!project) {
          console.log('Seeding project:', seedData.project.name);
          const insertProj = db.prepare(`
            INSERT INTO projects (name, code, password, admin_email)
            VALUES (?, ?, ?, ?)
          `);
          const info = insertProj.run(
            seedData.project.name,
            seedData.project.code,
            seedData.project.password,
            seedData.project.admin_email
          );
          project = { id: info.lastInsertRowid };
        }

        // 2. Seed Logs
        const checkLog = db.prepare('SELECT id FROM logs WHERE project_id = ? AND name = ? AND date = ? AND time_in = ?');
        const insertLog = db.prepare(`
          INSERT INTO logs (project_id, name, trade, car_reg, user_type, time_in, time_out, hours, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let logCount = 0;
        seedData.logs.forEach(log => {
          const exists = checkLog.get(project.id, log.name, log.date, log.time_in);
          if (!exists) {
            insertLog.run(
              project.id,
              log.name,
              log.trade,
              log.car_reg,
              log.user_type,
              log.time_in,
              log.time_out,
              log.hours,
              log.date
            );
            logCount++;
          }
        });
        if (logCount > 0) console.log(`Seeded ${logCount} historical logs for ${seedData.project.name}.`);
      }
    } catch (err) {
      console.error('Seeding error:', err);
    }
  };

  seedProjects();
};

initDb();

module.exports = db;
