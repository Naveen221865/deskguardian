const cron = require('node-cron');
const { pool } = require('../db');
require('dotenv').config();

const AWAY_LIMIT = parseInt(process.env.AWAY_LIMIT_MINUTES || 20);
const PRESENCE_HOURS = parseInt(process.env.PRESENCE_CHECK_HOURS || 2);

async function releaseStaleSessions() {
  // Away sessions past the 20-minute limit → abandoned
  const awayExpired = await pool.query(`
    UPDATE sessions SET status='abandoned'
    WHERE status='away'
      AND away_start < NOW() - INTERVAL '${AWAY_LIMIT} minutes'
    RETURNING desk_id
  `);
  for (const row of awayExpired.rows) {
    await pool.query("UPDATE desks SET status='available' WHERE desk_id=$1", [row.desk_id]);
  }

  // Active sessions with no presence confirmation past 2 hours → abandoned
  const presenceFailed = await pool.query(`
    UPDATE sessions SET status='abandoned'
    WHERE status='active'
      AND last_presence_check < NOW() - INTERVAL '${PRESENCE_HOURS} hours'
    RETURNING desk_id
  `);
  for (const row of presenceFailed.rows) {
    await pool.query("UPDATE desks SET status='available' WHERE desk_id=$1", [row.desk_id]);
  }

  const total = awayExpired.rows.length + presenceFailed.rows.length;
  if (total) console.log(`[Worker] Abandoned ${total} session(s) (${awayExpired.rows.length} away-expired, ${presenceFailed.rows.length} presence-failed)`);
}

function startWorker() {
  cron.schedule('* * * * *', releaseStaleSessions);
  console.log('[Worker] Background scheduler started');
}

module.exports = { startWorker };
