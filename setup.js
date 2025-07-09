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
        zip TEXT,
        latitude NUMERIC,
        longitude NUMERIC
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        latitude NUMERIC,
        longitude NUMERIC
      );
    `);

    // Table for storing chat messages between sellers and buyers
    console.log('Creating chats table...');
    
    // Drop the existing chats table if it exists to ensure we have the correct structure
    await pool.query(`DROP TABLE IF EXISTS chats;`);
    
    // Create the new chats table with the correct structure
    await pool.query(`
      CREATE TABLE chats (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) NOT NULL,
        recipient_id INTEGER REFERENCES users(id) NOT NULL,
        message TEXT NOT NULL,
        image_url TEXT,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMP
      );
    `);
    console.log('Chats table created successfully');

    // Create index for faster conversation queries (using both sender and recipient)
    console.log('Creating chats indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chats_conversation 
      ON chats(sender_id, recipient_id, created_at);
    `);

    // Create index for faster user-specific queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chats_users 
      ON chats(sender_id, recipient_id);
    `);
    console.log('Chats indexes created successfully');

    // Create device_tokens table for push notifications
    console.log('Creating device_tokens table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        device_token TEXT NOT NULL,
        platform TEXT DEFAULT 'ios',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(user_id, device_token)
      );
    `);

    // Create index for faster device token queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user 
      ON device_tokens(user_id, is_active);
    `);
    console.log('Device tokens table created successfully');

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
