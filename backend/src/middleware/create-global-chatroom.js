const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function alterChatroomsTable() {
  const alterQuery = `
    ALTER TABLE chatrooms
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `;
  await pool.query(alterQuery);
  console.log('chatrooms table altered to add created_by column');
}

async function createChatroomsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS chatrooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        participants INTEGER NOT NULL DEFAULT 0,
        topic TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(query);
  console.log('chatrooms table ensured');
}

async function insertDefaultRoom() {
  const defaultRoomId = '00000000-0000-0000-0000-000000000000';
  const query = `
    INSERT INTO chatrooms (id, name, description, topic, is_public, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (id) DO NOTHING;
  `;
  
  const defaultCreatorUserId = null; // Or a valid user ID like 1 if you want
  const values = [
    defaultRoomId,
    'Global ChatRoom',
    'Welcome to the global public chat room',
    'General',
    true,
    defaultCreatorUserId
  ];

  const res = await pool.query(query, values);
  if (res.rowCount === 0) {
    console.log('Default room already exists, skipping insertion');
  } else {
    console.log('Default room created');
  }
}

async function main() {
  try {
    await createChatroomsTable();
    await alterChatroomsTable();
    await insertDefaultRoom();
  } catch (err) {
    console.error('Error running chatroom init:', err);
  } finally {
    await pool.end();
  }
}

main();
