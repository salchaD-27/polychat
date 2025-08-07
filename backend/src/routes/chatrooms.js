const express = require('express')
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const {Pool} = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = express.Router()

router.get('/', authenticateToken, async (req, res)=>{
    try{
        // const { search = '' } = req.query;
        // const rooms = await pool.query(
        //     `SELECT id, name, description, topic, participants, is_public
        //     FROM chatrooms
        //     WHERE (LOWER(name) LIKE $1 OR LOWER(topic) LIKE $1)`,
        //     [`%${search.toLowerCase()}%`]
        // );
        const rooms = await pool.query(
            `SELECT id, name, description, topic, participants, is_public
            FROM chatrooms`
        );
        res.json(rooms.rows);
    }catch(err){console.error(err);}
})

router.post('/:roomId/join', authenticateToken, async (req, res)=>{
    const userId = req.user.id; // Assuming authenticateToken attaches user info to req.user
    const { roomId } = req.params;
    try {
        // Ensure the room_members table exists (idempotent)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS room_members (
                user_id INTEGER NOT NULL,
                room_id UUID NOT NULL,
                joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, room_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES chatrooms(id) ON DELETE CASCADE
                );

        `);
        // 1. Check if room exists
        const roomResult = await pool.query('SELECT id FROM chatrooms WHERE id = $1', [roomId]);
        if (roomResult.rowCount === 0){return res.status(404).json({ error: 'Chat room not found' });}
        // 2. Insert user-room membership if not already exists
        // Assuming you have a room_members table: user_id, room_id, joined_at
        await pool.query(
        `INSERT INTO room_members (user_id, room_id, joined_at) VALUES ($1, $2, NOW()) 
            ON CONFLICT DO NOTHING`, // This avoids duplication if user already joined
            [userId, roomId]
        );
        // Optionally update participants count in room table (if you keep count)
        await pool.query(`UPDATE chatrooms SET participants = participants + 1 WHERE id = $1`,[roomId]);
        // 3. Return success response
        return res.status(200).json({ message: 'Joined room successfully' });
    } catch (err) {
        console.error('Error joining room:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
})


router.get('/:roomId/messages', authenticateToken, async (req, res)=>{
    const { roomId } = req.params;
    try{
        await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                room_id UUID NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                FOREIGN KEY (room_id) REFERENCES chatrooms(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

        `);

        // Fetch messages for the room, ordered by timestamp ascending (oldest first)
        const result = await pool.query(
        `SELECT 
            m.id,
            m.content,
            m.created_at,
            u.id as sender_id,
            u.username as sender_username
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at ASC
        LIMIT 100`,   // adjust limit as needed
        [roomId]
        );
        // Transform rows into desired response format
        const messages = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        timestamp: row.created_at,
        sender: {
            id: row.sender_id,
            username: row.sender_username,
        },
        }));
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:roomId/members', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  try {
    // Query room members joined with user info
    const result = await pool.query(
      `SELECT u.id, u.username
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1`,
      [roomId]
    );
    // Optional: Add presence status if available from your presence service
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching room members:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create', authenticateToken, async (req, res) => {
  const { name, description = '', topic = '', isPublic = true } = req.body;
  const createdBy = req.user.id;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Room name is required' });
  }

  try {
    // Ensure chatrooms table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chatrooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        topic TEXT,
        is_public BOOLEAN NOT NULL DEFAULT true,
        participants INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const result = await pool.query(
      `INSERT INTO chatrooms (name, description, topic, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, is_public`,
      [name, description, topic, isPublic, createdBy]
    );

    const newRoom = result.rows[0];
    res.status(201).json({
      message: 'Room created successfully',
      room: newRoom
    });
  } catch (err) {
    console.error('Error creating chatroom:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/mine', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT id, name, description, topic, is_public, participants, created_at
      FROM chatrooms
      WHERE created_by = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user chatrooms:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router