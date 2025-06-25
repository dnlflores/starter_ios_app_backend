import { setup } from './setup.js';
import { seed } from './seed_tools.js';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Check if we have a DATABASE_URL (production) or skip if local development
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
      console.log('⏭️  Skipping database initialization in local development (no DATABASE_URL found)');
      console.log('💡 Use "npm run setup" and "npm run seed" for local development');
      return;
    }
    
    // First, set up the tables
    console.log('📋 Setting up database tables...');
    await setup();
    
    // Then, seed with sample data (only if not in production or if explicitly requested)
    if (process.env.SEED_DATABASE === 'true' || process.env.NODE_ENV !== 'production') {
      console.log('🌱 Seeding database with sample data...');
      await seed();
    } else {
      console.log('⏭️  Skipping database seeding in production (set SEED_DATABASE=true to enable)');
    }
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // In production, we want to fail hard if DB setup fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Continuing anyway for local development...');
    }
  }
}

initializeDatabase(); 