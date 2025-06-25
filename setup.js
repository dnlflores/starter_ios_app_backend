import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://iosuser:secret@localhost:5432/iosdb',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function setup() {
  try {
    console.log('Setting up database tables...');
    
    // Drop existing tables in correct order (respecting foreign key constraints)
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
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_seller BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT
      );
    `);

    // Tools table that references the users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    console.log('Database tables created successfully');
    return true;
  } catch (err) {
    console.error('Error setting up database:', err);
    throw err;
  }
}

// Only run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

export { setup, pool };
