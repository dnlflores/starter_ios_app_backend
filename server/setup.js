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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tools (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price NUMERIC,
      description TEXT,
      owner_id INTEGER
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
