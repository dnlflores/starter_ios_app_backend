const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://iosuser:secret@localhost:5432/iosdb'
});

async function setup() {
  await pool.query('DROP TABLE IF EXISTS pokemon_stat CASCADE');
  await pool.query('DROP TABLE IF EXISTS pokemon_type CASCADE');
  await pool.query('DROP TABLE IF EXISTS pokemon_move CASCADE');
  await pool.query('DROP TABLE IF EXISTS pokemon_ability CASCADE');
  await pool.query('DROP TABLE IF EXISTS pokemon CASCADE');
  await pool.query('DROP TABLE IF EXISTS stat CASCADE');
  await pool.query('DROP TABLE IF EXISTS type CASCADE');
  await pool.query('DROP TABLE IF EXISTS move CASCADE');
  await pool.query('DROP TABLE IF EXISTS ability CASCADE');
  await pool.query('DROP TABLE IF EXISTS chats CASCADE');
  await pool.query('DROP TABLE IF EXISTS tools CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');

  // Create basic users table used for authentication
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // Tools no longer enforce unique names and now reference the users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tools (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC,
      description TEXT,
      owner_id INTEGER REFERENCES users(id)
    );
  `);

  // Table for storing chat messages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

setup()
  .then(() => {
    console.log('Tables updated');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
