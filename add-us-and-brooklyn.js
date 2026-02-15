require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Country = require('./src/models/Country');
const City = require('./src/models/City');

async function addUSAndBrooklyn() {
  try {
    await connectDB();
    
    console.log('\n🌎 Adding United States and Brooklyn...\n');
    console.log('═══════════════════════════════════════\n');
    
    // Step 1: Add United States as a country
    console.log('Step 1: Adding United States...');
    
    let usaCountry = await Country.findOne({ country: 'United States', isDeleted: false });
    
    if (usaCountry) {
      console.log('  ℹ️  United States already exists');
      
      // Update to Active status if it exists
      if (usaCountry.status !== 'Active') {
        usaCountry.status = 'Active';
        await usaCountry.save();
        console.log('  ✅ Updated United States status to Active');
      } else {
        console.log('  ✅ United States is already Active');
      }
    } else {
      usaCountry = await Country.create({
        country: 'United States',
        region: 'Americas',
        currency: 'USD',
        latlng: [37.0902, -95.7129], // Center of continental US
        status: 'Active',
        isDeleted: false
      });
      console.log('  ✅ United States created successfully');
    }
    
    console.log(`  Country ID: ${usaCountry._id}`);
    console.log(`  Status: ${usaCountry.status}`);
    console.log(`  Region: ${usaCountry.region}`);
    console.log(`  Currency: ${usaCountry.currency}\n`);
    
    // Step 2: Add Brooklyn, New York
    console.log('Step 2: Adding Brooklyn, New York...');
    
    let brooklyn = await City.findOne({ 
      country: 'United States', 
      city: 'Brooklyn',
      isDeleted: false 
    });
    
    if (brooklyn) {
      console.log('  ℹ️  Brooklyn already exists');
      
      // Update to Active status if it exists
      if (brooklyn.status !== 'Active') {
        brooklyn.status = 'Active';
        await brooklyn.save();
        console.log('  ✅ Updated Brooklyn status to Active');
      } else {
        console.log('  ✅ Brooklyn is already Active');
      }
    } else {
      brooklyn = await City.create({
        country: 'United States',
        city: 'Brooklyn',
        province: 'New York',
        countrylatlng: [37.0902, -95.7129], // US center
        provincelatlng: [40.7580, -73.9855], // New York state
        citylatlng: [40.6782, -73.9442], // Brooklyn coordinates
        status: 'Active',
        isDeleted: false
      });
      console.log('  ✅ Brooklyn created successfully');
    }
    
    console.log(`  City ID: ${brooklyn._id}`);
    console.log(`  Status: ${brooklyn.status}`);
    console.log(`  Province: ${brooklyn.province}`);
    console.log(`  Coordinates: ${brooklyn.citylatlng}`);
    
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 SUCCESS! Location setup complete!\n');
    
    console.log('📝 Summary:');
    console.log('  ✓ Country: United States (Active)');
    console.log('  ✓ City: Brooklyn, New York (Active)\n');
    
    console.log('Users, vendors, and staff can now:');
    console.log('  • Select "United States" as their country');
    console.log('  • Select "Brooklyn" as their city');
    console.log('  • Complete registration successfully\n');
    
    // Verify by counting
    const activeCountries = await Country.countDocuments({ isDeleted: false, status: 'Active' });
    const activeCities = await City.countDocuments({ isDeleted: false, status: 'Active' });
    
    console.log('Database Status:');
    console.log(`  Total Active Countries: ${activeCountries}`);
    console.log(`  Total Active Cities: ${activeCities}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

addUSAndBrooklyn();
