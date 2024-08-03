const mysql = require('mysql');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'dragonpaydb.cv4sk0iecdmp.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Jlc31Louie',
    database: 'transactions',
    port: 3306 // default MySQL port
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to the MySQL database');
});

module.exports = db;
