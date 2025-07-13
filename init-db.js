import { setup } from './setup.js';
import { seed, clearAndReseedTools } from './seed_tools.js';

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
    
    // Always seed with sample data in production and development
    console.log('🌱 Seeding database with sample data...');
    if (process.env.NODE_ENV === 'production' || process.env.RESET_TOOLS === 'true') {
      // In production or when explicitly requested, clear existing tools and reseed
      console.log('🔄 Clearing existing tools and reseeding with fresh data...');
      await clearAndReseedTools();
    } else {
      // In development, use normal seeding (preserves existing data)
      await seed();
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