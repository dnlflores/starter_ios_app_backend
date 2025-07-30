import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://iosuser:secret@localhost:5432/iosdb',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Function to clear existing tools and reseed with fresh data
async function clearAndReseedTools() {
  try {
    console.log('🗑️  Clearing existing tools and chats data...');
    
    // Delete all existing chats first (since they reference tools)
    await pool.query('DELETE FROM chats');
    console.log('✅ Chats data cleared successfully');
    
    // Delete all existing tools
    await pool.query('DELETE FROM tools');
    console.log('✅ Tools data cleared successfully');
    
    // Reset the sequences for both tables
    await pool.query('ALTER SEQUENCE tools_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE chats_id_seq RESTART WITH 1');
    
    console.log('✅ Database sequences reset successfully');
    
    // Now reseed with fresh data
    await seedTools();
    
  } catch (err) {
    console.error('Error clearing and reseeding tools:', err);
    throw err;
  }
}

// Function to seed tools only
async function seedTools() {
  try {
    console.log('🔨 Seeding tools with detailed descriptions...');

    const tools = [
      { 
        name: 'Professional Claw Hammer', 
        price: 25, 
        description: 'Professional-grade 16oz claw hammer with ergonomic fiberglass handle and balanced weight distribution. Features a forged steel head with precision-machined striking surface for consistent nail driving. The curved claw provides excellent leverage for nail removal. Anti-slip grip handle reduces hand fatigue during extended use. Perfect for framing, general construction, and home improvement projects. Meets ANSI safety standards.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Hammer', 
        is_available: true, 
        latitude: 30.2672, 
        longitude: -97.7431 
      },
      { 
        name: 'Precision Flathead Screwdriver', 
        price: 10, 
        description: 'High-quality 6-inch flathead screwdriver with chrome-vanadium steel blade for superior strength and durability. Features a precision-ground tip that resists cam-out and provides excellent torque transfer. The ergonomic handle with textured grip ensures comfortable use even in wet conditions. Magnetic tip holds screws securely during installation. Ideal for electronics, furniture assembly, and precision work. Blade width: 6mm. Handle includes hanging hole for organized storage.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Screwdriver', 
        is_available: true, 
        latitude: 30.2676, 
        longitude: -97.7435 
      },
      { 
        name: 'Adjustable Crescent Wrench', 
        price: 15, 
        description: 'Heavy-duty 10-inch adjustable wrench with smooth jaw action and precise calibration. Forged chrome-vanadium steel construction ensures long-lasting performance under heavy use. The jaw opens to 1-1/4 inches and features laser-etched measurement markings for quick size reference. Comfortable cushioned grip handle reduces hand fatigue. Ideal for plumbing, automotive work, and general maintenance. The angled head design provides better access in tight spaces. Meets professional contractor standards.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Wrench', 
        is_available: true, 
        latitude: 30.2680, 
        longitude: -97.7439 
      },
      { 
        name: 'Professional Needle Nose Pliers', 
        price: 12, 
        description: 'Premium 8-inch needle nose pliers with precision-machined jaws and spring-loaded handles. Features hardened steel construction with corrosion-resistant finish. The long, tapered jaws provide excellent reach into tight spaces while maintaining strong gripping power. Built-in wire cutting edges handle up to 12 AWG wire. Ergonomic handles with non-slip grip coating reduce hand fatigue. Perfect for electrical work, jewelry making, and precision assembly tasks. Includes integrated wire stripping notches.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Pliers', 
        is_available: true, 
        latitude: 30.2684, 
        longitude: -97.7443 
      },
      { 
        name: 'Professional Hand Saw', 
        price: 20, 
        description: 'Professional-grade 20-inch crosscut hand saw with aggressive tooth geometry for fast, clean cuts through hardwood and softwood. Features a tempered steel blade with precision-set teeth that maintain sharpness longer. The ergonomic wooden handle provides comfortable grip and excellent control. Blade thickness: 0.042 inches for reduced binding. 8 TPI (teeth per inch) configuration ideal for general woodworking. Includes protective blade guard. Perfect for trim carpentry, furniture building, and precision woodworking projects.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Saw', 
        is_available: true, 
        latitude: 30.2688, 
        longitude: -97.7447 
      },
      { 
        name: 'Cordless Power Drill Kit', 
        price: 80, 
        description: 'Professional 20V MAX cordless drill/driver kit with brushless motor technology for 50% longer runtime. Includes 1/2-inch single-sleeve ratcheting chuck for superior bit retention. Variable speed trigger (0-450/0-1,500 RPM) with 15 clutch settings for precise torque control. LED work light illuminates dark work areas. Kit includes: drill, two 20V lithium-ion batteries, fast charger, belt clip, and carrying case. Maximum torque: 300 in-lbs. Perfect for drilling, driving screws, and light-duty fastening applications.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Drill', 
        is_available: true, 
        latitude: 30.2692, 
        longitude: -97.7451 
      },
      { 
        name: 'Electric Orbital Sander', 
        price: 45, 
        description: 'Professional-grade 2.4-amp electric orbital sander with 14,000 OPM for fast material removal and smooth finishing. Features a 1/4-sheet sanding pad with efficient dust collection system and micro-filtration. The sealed switch prevents dust contamination for longer tool life. Ergonomic design with soft-grip surfaces reduces vibration and user fatigue. Includes dust collection bag and assorted sandpaper grits (80, 120, 220). Perfect for surface preparation, paint removal, and fine finishing work on wood, metal, and plastic surfaces.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Sander', 
        is_available: true, 
        latitude: 30.2696, 
        longitude: -97.7455 
      },
      { 
        name: 'Wood Chisel Set', 
        price: 18, 
        description: 'Professional 6-piece wood chisel set with high-carbon steel blades for exceptional edge retention. Set includes sizes: 1/4", 3/8", 1/2", 3/4", 1", and 1-1/4". Each chisel features a precision-ground bevel and polished blade for smooth cutting action. Durable hardwood handles with brass ferrules resist splitting under mallet strikes. Includes protective plastic edge guards for safe storage. Perfect for mortising, paring, and detailed woodworking. Blades are honed and ready to use. Comes with storage roll for organized transport.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Chisel', 
        is_available: true, 
        latitude: 30.2700, 
        longitude: -97.7459 
      },
      { 
        name: 'Professional Tape Measure', 
        price: 8, 
        description: 'Heavy-duty 25-foot tape measure with standout up to 7 feet for one-person measuring. Features a durable nylon-coated steel blade with clear, easy-to-read markings in both imperial and metric units. The True Zero end hook moves in and out for inside and outside measurements. Cushioned case design withstands 10-foot drops. Belt clip attachment for convenient carrying. Blade width: 1 inch. Includes fraction markings down to 1/16 inch for precise measurements. Perfect for construction, home improvement, and professional contracting work.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Tape+Measure', 
        is_available: true, 
        latitude: 30.2704, 
        longitude: -97.7463 
      },
      { 
        name: 'Professional Bubble Level', 
        price: 14, 
        description: 'Precision-crafted 24-inch aluminum level with three high-accuracy bubble vials for level, plumb, and 45-degree measurements. Features a durable extruded aluminum frame with protective end caps. The milled working surfaces ensure accuracy within 1/32 inch over 72 inches. High-visibility bubble vials with permanent luminescent rings for easy reading in low light. Magnetic base strip holds level securely to metal surfaces. Perfect for construction, carpentry, and installation work. Includes convenient carrying handle and storage hooks.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Level', 
        is_available: true, 
        latitude: 30.2708, 
        longitude: -97.7467 
      },
      { 
        name: 'Retractable Utility Knife', 
        price: 9, 
        description: 'Professional-grade utility knife with quick-change blade mechanism and secure blade storage. Features a durable metal construction with rubber-grip handle for comfortable use. The blade retracts completely for safe storage and transport. Includes 5 premium carbon steel blades that stay sharp longer. Blade depth adjustment for different material thicknesses. Built-in blade snapper for creating fresh cutting edges. Perfect for cardboard, drywall, carpet, and general cutting tasks. Includes lanyard hole for tethering in professional environments.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Utility+Knife', 
        is_available: true, 
        latitude: 30.2712, 
        longitude: -97.7471 
      },
      { 
        name: 'LED Work Flashlight', 
        price: 16, 
        description: 'Professional-grade LED work flashlight with 800-lumen output and 4-hour runtime. Features a durable aluminum construction with impact-resistant design rated for 6-foot drops. The focusing lens adjusts from wide floodlight to focused spotlight beam. Includes magnetic base and 180-degree rotating clip for hands-free operation. Water-resistant IPX4 rating for outdoor use. Uses 3 AA batteries (included). Multiple modes: high, medium, low, and strobe. Perfect for automotive work, electrical tasks, and emergency situations. Includes wrist strap for secure carrying.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Flashlight', 
        is_available: true, 
        latitude: 30.2716, 
        longitude: -97.7475 
      },
      { 
        name: 'Aluminum Step Ladder', 
        price: 120, 
        description: 'Professional-grade 6-foot aluminum step ladder with 250-pound weight capacity. Features wide, slip-resistant steps with deep grooves for secure footing. The heavy-duty hinges with pin locks provide stability and safety. Includes a large top platform (12" x 16") with tool tray for convenient tool storage. Lightweight aluminum construction (only 18 lbs) with weather-resistant finish. Spreader bars lock automatically when opened. Meets OSHA and ANSI safety standards. Perfect for painting, electrical work, and general maintenance tasks. Folds flat for compact storage.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Ladder', 
        is_available: true, 
        latitude: 30.2720, 
        longitude: -97.7479 
      },
      { 
        name: 'Heavy-Duty Crowbar', 
        price: 22, 
        description: 'Professional 24-inch crowbar forged from high-carbon steel for maximum strength and durability. Features a precision-ground chisel end and curved claw for versatile prying, pulling, and demolition work. The hexagonal shaft design provides better grip and prevents rolling. Heat-treated construction resists bending and breaking under heavy loads. Painted finish resists corrosion and improves visibility. Weight: 3.5 pounds for optimal leverage. Perfect for demolition, nail pulling, board removal, and general construction tasks. Includes hanging hole for organized storage.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Crowbar', 
        is_available: true, 
        latitude: 30.2724, 
        longitude: -97.7483 
      },
      { 
        name: 'Professional Socket Set', 
        price: 55, 
        description: 'Comprehensive 42-piece metric socket set with 1/4" and 3/8" drive ratchets. Includes sockets ranging from 4mm to 19mm in both standard and deep-well configurations. Features premium chrome-vanadium steel construction with mirror-chrome finish for corrosion resistance. The 72-tooth ratchets provide 5-degree swing arc for work in tight spaces. Includes universal joints, extension bars, and spark plug socket. Organized in a durable blow-molded case with clearly marked size indicators. Perfect for automotive, motorcycle, and general mechanical work.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Socket+Set', 
        is_available: true, 
        latitude: 30.2728, 
        longitude: -97.7487 
      },
      { 
        name: 'Advanced Stud Finder', 
        price: 30, 
        description: 'Professional-grade electronic stud finder with advanced edge-finding technology and deep scan capability. Locates wood and metal studs up to 1.5 inches deep with ±1/8 inch accuracy. Features a large LCD display with audible and visual alerts. Includes wire warning detection to avoid electrical hazards. Auto-calibration ensures consistent performance on different wall textures. The pivoting head maintains contact with wall surfaces for accurate readings. Battery life indicator and auto-shutoff preserve battery. Perfect for drywall installation, picture hanging, and wall mounting projects.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Stud+Finder', 
        is_available: true, 
        latitude: 30.2732, 
        longitude: -97.7491 
      },
      { 
        name: 'Automatic Wire Stripper', 
        price: 13, 
        description: 'Professional automatic wire stripper with self-adjusting jaw mechanism that accommodates 10-22 AWG solid and stranded wire. Features precision-ground stripping blades that cut insulation without damaging the conductor. The ergonomic handles with spring-loaded action reduce hand fatigue during repetitive use. Includes built-in wire cutters and loop-making holes. The yellow finish provides high visibility in toolboxes. Calibrated for standard wire gauges with clear markings. Perfect for electrical work, electronics, and automotive applications. Meets professional electrician standards.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Wire+Stripper', 
        is_available: true, 
        latitude: 30.2736, 
        longitude: -97.7495 
      },
      { 
        name: 'Professional Paint Brush', 
        price: 7, 
        description: 'Premium 2-inch angled paint brush with synthetic bristles designed for smooth finish with all paint types. Features a stainless steel ferrule that resists corrosion and maintains bristle alignment. The comfortable wooden handle provides excellent control and balance. Bristles are flagged and tipped for superior paint pickup and smooth application. Perfect for cutting in edges, trim work, and detailed painting. Easy to clean and maintain for long-lasting performance. Suitable for latex, oil-based, and specialty coatings. Includes protective plastic cover for storage.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Paint+Brush', 
        is_available: true, 
        latitude: 30.2740, 
        longitude: -97.7499 
      },
      { 
        name: 'Auto-Darkening Welding Mask', 
        price: 65, 
        description: 'Professional auto-darkening welding helmet with large 3.86" x 1.73" viewing area and shade range 4/9-13. Features advanced light sensors that react in 1/25,000 second for optimal eye protection. The lightweight design (1.2 lbs) reduces neck strain during extended use. Adjustable delay and sensitivity controls adapt to different welding conditions. Solar-powered with backup battery for reliable operation. Includes grinding mode for safe metal preparation. Meets ANSI Z87.1 safety standards. Perfect for MIG, TIG, stick welding, and plasma cutting applications.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Welding+Mask', 
        is_available: true, 
        latitude: 30.2744, 
        longitude: -97.7503 
      },
      { 
        name: 'Portable Air Compressor', 
        price: 150, 
        description: 'Professional-grade portable air compressor with 6-gallon tank capacity and 150 PSI maximum pressure. Features a 1.5 HP motor with thermal overload protection and oil-free pump for low maintenance. Delivers 2.6 CFM at 90 PSI for powering pneumatic tools. Includes dual universal couplers, pressure regulator, and built-in storage compartment. The heavy-duty steel tank with protective shroud ensures durability. Rubber feet and low-profile design provide stability and portability. Perfect for nail guns, spray painting, tire inflation, and general pneumatic applications. Includes 25-foot recoil hose.', 
        image_url: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Air+Compressor', 
        is_available: true, 
        latitude: 30.2748, 
        longitude: -97.7507 
      }
    ];

    // Insert tools (assign to first user - Daniel)
    for (const i = 0; i < tools.length; i++) {
      const tool = tools[i];
      await pool.query(
        `INSERT INTO tools (name, price, description, owner_id, image_url, is_available, latitude, longitude) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tool.name, tool.price, tool.description, i % 2 + 1, tool.image_url, tool.is_available, tool.latitude, tool.longitude]
      );
    }

    console.log('✅ Tools seeded successfully with enhanced descriptions');
    return true;
  } catch (err) {
    console.error('Error seeding tools:', err);
    throw err;
  }
}

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
    console.log('Seeding users...');
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await pool.query(
        `INSERT INTO users (username, password, email, first_name, last_name, phone, address, city, state, zip) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, hash, user.email, user.first_name, user.last_name, user.phone, user.address, user.city, user.state, user.zip]
      );
    }
    console.log('✅ Users seeded successfully');

    // Seed tools with enhanced descriptions
    console.log('Seeding tools...');
    await seedTools();
    console.log('✅ Tools seeded successfully');

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

export { seed, seedTools, clearAndReseedTools };
