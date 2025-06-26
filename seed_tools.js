import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://iosuser:secret@localhost:5432/iosdb',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function seed() {
  try {
    console.log('Seeding database with sample data...');

    const users = [
      {
        username: 'daniel',
        first_name: 'Daniel',
        last_name: 'Flores',
        email: 'daniel@example.com',
        password: 'password',
        phone: '555-0100',
        address: '1 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '73301'
      },
      {
        username: 'alice',
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        password: 'password',
        phone: '555-0101',
        address: '2 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        zip: '75201'
      },
      {
        username: 'bob',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        password: 'password',
        phone: '555-0102',
        address: '3 Pine Rd',
        city: 'Houston',
        state: 'TX',
        zip: '77001'
      },
      {
        username: 'carol',
        first_name: 'Carol',
        last_name: 'Williams',
        email: 'carol@example.com',
        password: 'password',
        phone: '555-0103',
        address: '4 Maple Dr',
        city: 'San Antonio',
        state: 'TX',
        zip: '78205'
      },
      {
        username: 'eve',
        first_name: 'Eve',
        last_name: 'Davis',
        email: 'eve@example.com',
        password: 'password',
        phone: '555-0104',
        address: '5 Cedar Ln',
        city: 'El Paso',
        state: 'TX',
        zip: '79901'
      }
    ];

    // Insert users
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await pool.query(
        `INSERT INTO users (username, password, email, first_name, last_name, phone, address, city, state, zip) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, hash, user.email, user.first_name, user.last_name, user.phone, user.address, user.city, user.state, user.zip]
      );
    }

    const tools = [
      { name: 'Hammer', price: 25, description: 'Standard claw hammer', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Hammer', is_available: true, latitude: 30.2672, longitude: -97.7431 },
      { name: 'Screwdriver', price: 10, description: 'Flat head screwdriver', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Screwdriver', is_available: true, latitude: 30.2676, longitude: -97.7435 },
      { name: 'Wrench', price: 15, description: 'Adjustable wrench', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Wrench', is_available: true, latitude: 30.2680, longitude: -97.7439 },
      { name: 'Pliers', price: 12, description: 'Needle nose pliers', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Pliers', is_available: true, latitude: 30.2684, longitude: -97.7443 },
      { name: 'Saw', price: 20, description: 'Hand saw for wood', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Saw', is_available: true, latitude: 30.2688, longitude: -97.7447 },
      { name: 'Drill', price: 80, description: 'Cordless power drill', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Drill', is_available: true, latitude: 30.2692, longitude: -97.7451 },
      { name: 'Sander', price: 45, description: 'Electric orbital sander', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Sander', is_available: true, latitude: 30.2696, longitude: -97.7455 },
      { name: 'Chisel', price: 18, description: 'Wood chisel set', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Chisel', is_available: true, latitude: 30.2700, longitude: -97.7459 },
      { name: 'Tape Measure', price: 8, description: '25-foot tape measure', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Tape+Measure', is_available: true, latitude: 30.2704, longitude: -97.7463 },
      { name: 'Level', price: 14, description: '24-inch bubble level', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Level', is_available: true, latitude: 30.2708, longitude: -97.7467 },
      { name: 'Utility Knife', price: 9, description: 'Retractable utility knife', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Utility+Knife', is_available: true, latitude: 30.2712, longitude: -97.7471 },
      { name: 'Flashlight', price: 16, description: 'LED work flashlight', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Flashlight', is_available: true, latitude: 30.2716, longitude: -97.7475 },
      { name: 'Ladder', price: 120, description: '6-foot step ladder', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Ladder', is_available: true, latitude: 30.2720, longitude: -97.7479 },
      { name: 'Crowbar', price: 22, description: 'Heavy duty crowbar', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Crowbar', is_available: true, latitude: 30.2724, longitude: -97.7483 },
      { name: 'Socket Set', price: 55, description: 'Metric socket set', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Socket+Set', is_available: true, latitude: 30.2728, longitude: -97.7487 },
      { name: 'Stud Finder', price: 30, description: 'Electronic stud finder', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Stud+Finder', is_available: true, latitude: 30.2732, longitude: -97.7491 },
      { name: 'Wire Stripper', price: 13, description: 'Automatic wire stripper', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Wire+Stripper', is_available: true, latitude: 30.2736, longitude: -97.7495 },
      { name: 'Paint Brush', price: 7, description: '2-inch paint brush', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Paint+Brush', is_available: true, latitude: 30.2740, longitude: -97.7499 },
      { name: 'Welding Mask', price: 65, description: 'Auto-darkening welding mask', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Welding+Mask', is_available: true, latitude: 30.2744, longitude: -97.7503 },
      { name: 'Air Compressor', price: 150, description: 'Portable air compressor', image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Air+Compressor', is_available: true, latitude: 30.2748, longitude: -97.7507 }
    ];

    // Insert tools (assign to first user - Daniel)
    for (const tool of tools) {
      await pool.query(
        `INSERT INTO tools (name, price, description, owner_id, image_url, is_available, latitude, longitude) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tool.name, tool.price, tool.description, 1, tool.image_url, tool.is_available, tool.latitude, tool.longitude]
      );
    }

    console.log('Database seeded successfully');
    return true;
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

// Only run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

export { seed };
