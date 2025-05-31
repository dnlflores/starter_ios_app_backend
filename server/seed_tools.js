const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://iosuser:secret@localhost:5432/iosdb'
});

async function seed() {
  const tools = [
    { name: 'Hammer', price: 25, description: 'Standard claw hammer' },
    { name: 'Screwdriver', price: 10, description: 'Flat head screwdriver' },
    { name: 'Wrench', price: 15, description: 'Adjustable wrench' },
    { name: 'Pliers', price: 12, description: 'Needle nose pliers' },
    { name: 'Saw', price: 20, description: 'Hand saw for wood' },
    { name: 'Drill', price: 80, description: 'Cordless power drill' },
    { name: 'Sander', price: 45, description: 'Electric orbital sander' },
    { name: 'Chisel', price: 18, description: 'Wood chisel set' },
    { name: 'Tape Measure', price: 8, description: '25-foot tape measure' },
    { name: 'Level', price: 14, description: '24-inch bubble level' },
    { name: 'Utility Knife', price: 9, description: 'Retractable utility knife' },
    { name: 'Flashlight', price: 16, description: 'LED work flashlight' },
    { name: 'Ladder', price: 120, description: '6-foot step ladder' },
    { name: 'Crowbar', price: 22, description: 'Heavy duty crowbar' },
    { name: 'Socket Set', price: 55, description: 'Metric socket set' },
    { name: 'Stud Finder', price: 30, description: 'Electronic stud finder' },
    { name: 'Wire Stripper', price: 13, description: 'Automatic wire stripper' },
    { name: 'Paint Brush', price: 7, description: '2-inch paint brush' },
    { name: 'Welding Mask', price: 65, description: 'Auto-darkening welding mask' },
    { name: 'Air Compressor', price: 150, description: 'Portable air compressor' }
  ];

  for (const tool of tools) {
    await pool.query(
      'INSERT INTO tools (name, price, description, owner_id) VALUES ($1, $2, $3, $4)',
      [tool.name, tool.price, tool.description, 1]
    );
  }
}

seed()
  .then(() => {
    console.log('Tools seeded');
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
