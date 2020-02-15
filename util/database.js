// Wrapper function to connection to the database
const mysql = require('mysql')
require('dotenv').config()

// Credentials are stored in .env
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'bottimus'
})

module.exports = pool
