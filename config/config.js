require('dotenv').config();

module.exports = {
  port: process.env.PORT  ,
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'mahilamediplex',
    timezone: process.env.DB_TIMEZONE || 'Asia/Kolkata',
  },
  jwtSecret: process.env.JWT_SECRET,
};
