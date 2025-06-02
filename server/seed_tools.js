const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Connect to Supabase using environment variables. The service role key is
// preferred so the script can bypass RLS policies if they exist.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
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

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const { error } = await supabase.from('users').insert({
      username: user.username,
      password: hash,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zip: user.zip,
    });
    if (error) throw error;
  }

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
    const { error } = await supabase.from('tools').insert({
      name: tool.name,
      price: tool.price,
      description: tool.description,
      owner_id: 1,
    });
    if (error) throw error;
  }
}

seed()
  .then(() => {
    console.log('Users and tools seeded');
  })
  .catch(err => {
    console.error(err);
  });
