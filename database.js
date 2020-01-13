// Wrapper function to connection to the database
var mysql = require('mysql')
require('dotenv').config()

// Credentials are stored in .env
var pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'bottimus'
})

module.exports = pool
