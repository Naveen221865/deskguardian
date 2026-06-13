require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const { startWorker } = require('./workers/scheduler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/desks', require('./routes/desks'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`DeskGuard API running on port ${PORT}`));
  startWorker();
}).catch(err => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
