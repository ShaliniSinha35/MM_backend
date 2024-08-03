const mysql = require('mysql');
const { db } = require('./config');

const connection = mysql.createPool({
  host: db.host,
  user: db.user,
  password: db.password,
  database: db.name,
  timezone: db.timezone,
});

function handleDisconnect() {
  connection.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Connected to MySQL');
      connection.release();
    }
  });
}

handleDisconnect();

module.exports = connection;
