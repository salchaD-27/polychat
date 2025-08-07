const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if(!token){return res.status(401).json({ message: ['Missing token'] });}
    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if(err){
            console.error(err);
            return res.status(403).json({ message: ['Invalid or expired token'] });
        }
        req.user = user; // putting decoded payload on request
        next(); // continues to route
    })
}

module.exports = authenticateToken