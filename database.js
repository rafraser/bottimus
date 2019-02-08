// Wrapper function to connection to the database
var mysql = require('mysql');
require('dotenv').config()

// Credentials are stored in .env
var pool = mysql.createPool({
    connectLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'gmod'
});

// Function to get a connection to the database
// This function is what is found when this file is imported
var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};
module.exports = getConnection;