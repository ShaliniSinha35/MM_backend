require('dotenv').config();

module.exports = {
  port: process.env.PORT  ,
  
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    timezone: process.env.DB_TIMEZONE || 'Asia/Kolkata',
  },
  jwtSecret: process.env.JWT_SECRET,
};
