const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      roll_no VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'student'
    );

    CREATE TABLE IF NOT EXISTS desks (
      desk_id SERIAL PRIMARY KEY,
      desk_name VARCHAR(20) UNIQUE NOT NULL,
      qr_code VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id SERIAL PRIMARY KEY,
      student_id INT REFERENCES students(id),
      desk_id INT REFERENCES desks(desk_id),
      checkin_time TIMESTAMP DEFAULT NOW(),
      away_start TIMESTAMP,
      last_presence_check TIMESTAMP DEFAULT NOW(),
      status VARCHAR(20) DEFAULT 'active'
    );
  `);
}

module.exports = { pool, initDB };
