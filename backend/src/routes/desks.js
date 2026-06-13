const router = require('express').Router();
const { pool } = require('../db');
const redis = require('../redis');
const { auth } = require('../middleware/auth');

// GET all desks with status
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT desk_id, desk_name, qr_code, status FROM desks ORDER BY desk_name');
  res.json(result.rows);
});

// GET desk by QR code
router.get('/qr/:qr', async (req, res) => {
  const result = await pool.query('SELECT * FROM desks WHERE qr_code=$1', [req.params.qr]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Desk not found' });
  res.json(result.rows[0]);
});

// POST check-in
router.post('/checkin', auth, async (req, res) => {
  const { desk_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const desk = await client.query('SELECT status FROM desks WHERE desk_id=$1 FOR UPDATE', [desk_id]);
    if (!desk.rows[0]) return res.status(404).json({ error: 'Desk not found' });
    if (desk.rows[0].status !== 'available') return res.status(409).json({ error: 'Desk not available' });

    // Check if student already has an active session
    const existing = await client.query(
      "SELECT session_id FROM sessions WHERE student_id=$1 AND status IN ('active','away')",
      [req.user.id]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'You already have an active session' });

    await client.query('UPDATE desks SET status=$1 WHERE desk_id=$2', ['occupied', desk_id]);
    const session = await client.query(
      'INSERT INTO sessions (student_id, desk_id) VALUES ($1,$2) RETURNING *',
      [req.user.id, desk_id]
    );
    await client.query('COMMIT');

    await redis.set(`session:${session.rows[0].session_id}`, JSON.stringify(session.rows[0]));
    res.json(session.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// POST checkout
router.post('/checkout', auth, async (req, res) => {
  const session = await pool.query(
    "SELECT * FROM sessions WHERE student_id=$1 AND status IN ('active','away') ORDER BY checkin_time DESC LIMIT 1",
    [req.user.id]
  );
  if (!session.rows[0]) return res.status(404).json({ error: 'No active session' });
  const s = session.rows[0];
  await pool.query("UPDATE sessions SET status='completed' WHERE session_id=$1", [s.session_id]);
  await pool.query("UPDATE desks SET status='available' WHERE desk_id=$1", [s.desk_id]);
  await redis.del(`session:${s.session_id}`);
  res.json({ message: 'Checked out' });
});

// POST away
router.post('/away', auth, async (req, res) => {
  const session = await pool.query(
    "SELECT * FROM sessions WHERE student_id=$1 AND status='active' ORDER BY checkin_time DESC LIMIT 1",
    [req.user.id]
  );
  if (!session.rows[0]) return res.status(404).json({ error: 'No active session' });
  const s = session.rows[0];
  await pool.query("UPDATE sessions SET status='away', away_start=NOW() WHERE session_id=$1", [s.session_id]);
  await pool.query("UPDATE desks SET status='away' WHERE desk_id=$1", [s.desk_id]);
  res.json({ message: 'Away mode started', away_start: new Date() });
});

// POST resume
router.post('/resume', auth, async (req, res) => {
  const session = await pool.query(
    "SELECT * FROM sessions WHERE student_id=$1 AND status='away' ORDER BY checkin_time DESC LIMIT 1",
    [req.user.id]
  );
  if (!session.rows[0]) return res.status(404).json({ error: 'No away session' });
  const s = session.rows[0];
  await pool.query("UPDATE sessions SET status='active', away_start=NULL WHERE session_id=$1", [s.session_id]);
  await pool.query("UPDATE desks SET status='occupied' WHERE desk_id=$1", [s.desk_id]);
  res.json({ message: 'Session resumed' });
});

// POST confirm presence
router.post('/presence', auth, async (req, res) => {
  const result = await pool.query(
    "UPDATE sessions SET last_presence_check=NOW() WHERE student_id=$1 AND status='active' RETURNING session_id",
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'No active session' });
  res.json({ message: 'Presence confirmed' });
});

// GET current session for logged-in student
router.get('/my-session', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.*, d.desk_name, d.status as desk_status
     FROM sessions s JOIN desks d ON s.desk_id=d.desk_id
     WHERE s.student_id=$1 AND s.status IN ('active','away')
     ORDER BY s.checkin_time DESC LIMIT 1`,
    [req.user.id]
  );
  res.json(result.rows[0] || null);
});

module.exports = router;
