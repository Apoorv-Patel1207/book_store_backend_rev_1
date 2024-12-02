const { Pool } = require("pg");

// Create a PostgreSQL database connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bookstore_db",
  password: "password",
  port: 5432,
});

module.exports = pool;
