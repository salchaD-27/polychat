const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
console.log(process.env.DATABASE_URL)
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
})();
