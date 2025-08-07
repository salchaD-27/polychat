const express = require('express');
const app = express();
const cors = require('cors');
const authjs = require('./routes/auth.js')
const refreshtokenjs = require('./routes/refresh-token.js')
const chatroomsjs = require('./routes/chatrooms.js')

const dotenv = require('dotenv')
dotenv.config()

// frontend - localhost:3000
// backend - localhost:3001
const PORT = 3001

// allowing reqs from frontend origin
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // if using cookies or auth headers
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
// allowing all origins during development
// app.use(cors());

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST /api/auth -> auth.js (user auth login)
app.use('/api/auth', authjs)
// POST /api/refresh-token -> refresh-token.js
app.use('/api/refresh-token', refreshtokenjs)

// GET /api/chatrooms -> chatrooms.js
// POST /api/chatrooms/[roomId]/join -> chatrooms.js
// GET /api/chatrooms/[roomId]/messages -> chatrooms.js
// GET /api/chatrooms/[roomId]/members -> chatrooms.js
// POST /api/chatrooms/create -> chatrooms.js
// GET /api/chatrooms/mine
app.use('/api/chatrooms', chatroomsjs)


app.listen(PORT, ()=>{console.log(`backend server running at http://localhost:${PORT}`)})