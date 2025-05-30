const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://iosuser:secret@localhost:5432/iosdb'
});

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      base_experience INTEGER,
      height INTEGER,
      weight INTEGER,
      is_default BOOLEAN,
      order_num INTEGER
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ability (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon_ability (
      pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
      ability_id INTEGER REFERENCES ability(id) ON DELETE CASCADE,
      is_hidden BOOLEAN,
      slot INTEGER,
      PRIMARY KEY (pokemon_id, ability_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS move (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon_move (
      pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
      move_id INTEGER REFERENCES move(id) ON DELETE CASCADE,
      method TEXT,
      level INTEGER,
      PRIMARY KEY (pokemon_id, move_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS type (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon_type (
      pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
      type_id INTEGER REFERENCES type(id) ON DELETE CASCADE,
      slot INTEGER,
      PRIMARY KEY (pokemon_id, type_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stat (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pokemon_stat (
      pokemon_id INTEGER REFERENCES pokemon(id) ON DELETE CASCADE,
      stat_id INTEGER REFERENCES stat(id) ON DELETE CASCADE,
      base_stat INTEGER,
      effort INTEGER,
      PRIMARY KEY (pokemon_id, stat_id)
    );
  `);
}

createTables()
  .then(() => {
    console.log('Tables created');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
