const router = require('express').Router();
const { pool } = require('../db');
const QRCode = require('qrcode');
const { auth, librarianOnly } = require('../middleware/auth');

router.use(auth, librarianOnly);

// Dashboard stats
router.get('/stats', async (req, res) => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status='available') AS available,
      COUNT(*) FILTER (WHERE status='occupied') AS occupied,
      COUNT(*) FILTER (WHERE status='away') AS away,
      COUNT(*) AS total
    FROM desks
  `);
  res.json(result.rows[0]);
});

// All active sessions with student info
router.get('/sessions', async (req, res) => {
  const result = await pool.query(`
    SELECT s.session_id, s.status, s.checkin_time, s.away_start, s.last_presence_check,
           d.desk_name, st.name as student_name, st.roll_no
    FROM sessions s
    JOIN desks d ON s.desk_id=d.desk_id
    JOIN students st ON s.student_id=st.id
    WHERE s.status IN ('active','away')
    ORDER BY s.checkin_time
  `);
  res.json(result.rows);
});

// Abandoned sessions (auto-expired by scheduler)
router.get('/abandoned', async (req, res) => {
  const result = await pool.query(`
    SELECT s.session_id, s.status, s.checkin_time, s.away_start, s.last_presence_check,
           d.desk_name, d.desk_id, st.name as student_name, st.roll_no
    FROM sessions s
    JOIN desks d ON s.desk_id=d.desk_id
    JOIN students st ON s.student_id=st.id
    WHERE s.status='abandoned'
    ORDER BY s.checkin_time DESC
    LIMIT 50
  `);
  res.json(result.rows);
});

// Force checkout any active/away session
router.post('/force-checkout/:session_id', async (req, res) => {
  const s = await pool.query('SELECT * FROM sessions WHERE session_id=$1', [req.params.session_id]);
  if (!s.rows[0]) return res.status(404).json({ error: 'Session not found' });
  await pool.query("UPDATE sessions SET status='forced' WHERE session_id=$1", [req.params.session_id]);
  await pool.query("UPDATE desks SET status='available' WHERE desk_id=$1", [s.rows[0].desk_id]);
  res.json({ message: 'Desk reset' });
});

// Manually reset (acknowledge) an abandoned session
router.post('/reset-abandoned/:session_id', async (req, res) => {
  const s = await pool.query("SELECT * FROM sessions WHERE session_id=$1 AND status='abandoned'", [req.params.session_id]);
  if (!s.rows[0]) return res.status(404).json({ error: 'Abandoned session not found' });
  await pool.query("UPDATE sessions SET status='reset' WHERE session_id=$1", [req.params.session_id]);
  res.json({ message: 'Session acknowledged' });
});

// Add a new desk and generate QR
router.post('/desks', async (req, res) => {
  const { desk_name } = req.body;
  const qr_code = `desk_${desk_name.toLowerCase().replace(/\s/g, '_')}`;
  const qrDataUrl = await QRCode.toDataURL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkin/${qr_code}`);
  const result = await pool.query(
    'INSERT INTO desks (desk_name, qr_code) VALUES ($1,$2) RETURNING *',
    [desk_name, qr_code]
  );
  res.json({ ...result.rows[0], qr_image: qrDataUrl });
});

// Delete a desk
router.delete('/desks/:desk_id', async (req, res) => {
  await pool.query('DELETE FROM desks WHERE desk_id=$1', [req.params.desk_id]);
  res.json({ message: 'Desk deleted' });
});

module.exports = router;
