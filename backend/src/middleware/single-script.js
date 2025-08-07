const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixChatroomIdDefault() {
  await pool.query(`
    ALTER TABLE chatrooms
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);
  console.log('chatrooms.id column set to default gen_random_uuid()');
}

async function main() {
  try {
    await fixChatroomIdDefault();
  } catch (err) {
    console.error('Error running chatroom init:', err);
  } finally {
    await pool.end();
  }
}
main();