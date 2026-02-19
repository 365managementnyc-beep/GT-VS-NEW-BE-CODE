require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const City = require('./src/models/City');

// Common NYC boroughs and US cities
const cities = [
  // Other NYC Boroughs
  { city: 'Manhattan', province: 'New York', citylatlng: [40.7831, -73.9712] },
  { city: 'Queens', province: 'New York', citylatlng: [40.7282, -73.7949] },
  { city: 'Bronx', province: 'New York', citylatlng: [40.8448, -73.8648] },
  { city: 'Staten Island', province: 'New York', citylatlng: [40.5795, -74.1502] },
  
  // Major US Cities
  { city: 'Los Angeles', province: 'California', citylatlng: [34.0522, -118.2437] },
  { city: 'Chicago', province: 'Illinois', citylatlng: [41.8781, -87.6298] },
  { city: 'Houston', province: 'Texas', citylatlng: [29.7604, -95.3698] },
  { city: 'Phoenix', province: 'Arizona', citylatlng: [33.4484, -112.0740] },
  { city: 'Philadelphia', province: 'Pennsylvania', citylatlng: [39.9526, -75.1652] },
  { city: 'San Antonio', province: 'Texas', citylatlng: [29.4241, -98.4936] },
  { city: 'San Diego', province: 'California', citylatlng: [32.7157, -117.1611] },
  { city: 'Dallas', province: 'Texas', citylatlng: [32.7767, -96.7970] },
  { city: 'San Jose', province: 'California', citylatlng: [37.3382, -121.8863] },
  { city: 'Austin', province: 'Texas', citylatlng: [30.2672, -97.7431] },
  { city: 'Jacksonville', province: 'Florida', citylatlng: [30.3322, -81.6557] },
  { city: 'Fort Worth', province: 'Texas', citylatlng: [32.7555, -97.3308] },
  { city: 'Columbus', province: 'Ohio', citylatlng: [39.9612, -82.9988] },
  { city: 'San Francisco', province: 'California', citylatlng: [37.7749, -122.4194] },
  { city: 'Charlotte', province: 'North Carolina', citylatlng: [35.2271, -80.8431] },
  { city: 'Indianapolis', province: 'Indiana', citylatlng: [39.7684, -86.1581] },
  { city: 'Seattle', province: 'Washington', citylatlng: [47.6062, -122.3321] },
  { city: 'Denver', province: 'Colorado', citylatlng: [39.7392, -104.9903] },
  { city: 'Boston', province: 'Massachusetts', citylatlng: [42.3601, -71.0589] },
  { city: 'Nashville', province: 'Tennessee', citylatlng: [36.1627, -86.7816] },
  { city: 'Las Vegas', province: 'Nevada', citylatlng: [36.1699, -115.1398] },
  { city: 'Miami', province: 'Florida', citylatlng: [25.7617, -80.1918] },
  { city: 'Atlanta', province: 'Georgia', citylatlng: [33.7490, -84.3880] }
];

async function addMoreCities() {
  try {
    await connectDB();
    
    console.log('\n🏙️  Adding Additional US Cities...\n');
    console.log('This script will add common US cities to the database.\n');
    console.log(`Total cities to add: ${cities.length}\n`);
    console.log('═══════════════════════════════════════\n');
    
    let added = 0;
    let skipped = 0;
    
    for (const cityData of cities) {
      const existing = await City.findOne({ 
        country: 'United States', 
        city: cityData.city,
        isDeleted: false 
      });
      
      if (existing) {
        console.log(`⏭️  ${cityData.city}, ${cityData.province} - Already exists`);
        skipped++;
      } else {
        await City.create({
          country: 'United States',
          city: cityData.city,
          province: cityData.province,
          countrylatlng: [37.0902, -95.7129], // US center
          provincelatlng: cityData.citylatlng, // Use city coords for province (simplified)
          citylatlng: cityData.citylatlng,
          status: 'Active',
          isDeleted: false
        });
        console.log(`✅ ${cityData.city}, ${cityData.province} - Added`);
        added++;
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Summary:\n');
    console.log(`   ✅ Added: ${added} cities`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)\n`);
    
    const totalCities = await City.countDocuments({ 
      country: 'United States', 
      isDeleted: false, 
      status: 'Active' 
    });
    
    console.log(`Total US cities in database: ${totalCities}\n`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  addMoreCities();
}

module.exports = { addMoreCities };
