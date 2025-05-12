// db.js - Database connection setup
const mysql = require('mysql2');

// Create a connection pool with explicit error handling
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'quiz_system',
    waitForConnections: true,
});

// Add global error handler for the pool
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
    // Attempt to recreate the pool if it encounters a fatal error
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
        console.error('Connection lost, attempting to reconnect...');
        // In a real app, you might want to implement reconnection logic here
    }
});

// Test the connection when the app starts
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused');
        }
        return;
    }
    
    console.log('Connected to the database!');
    connection.release(); // Always release connections when done with them
});

module.exports = pool;