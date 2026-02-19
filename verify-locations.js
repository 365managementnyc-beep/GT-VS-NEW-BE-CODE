require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Country = require('./src/models/Country');
const City = require('./src/models/City');

async function verifyLocations() {
  try {
    await connectDB();
    
    console.log('\n📊 LOCATION DATA VERIFICATION\n');
    console.log('═══════════════════════════════════════\n');
    
    // Check United States
    const usa = await Country.findOne({ country: 'United States', isDeleted: false });
    
    if (usa) {
      console.log('✅ COUNTRY: United States');
      console.log('   ID:', usa._id.toString());
      console.log('   Status:', usa.status);
      console.log('   Region:', usa.region);
      console.log('   Currency:', usa.currency);
      console.log('   Coordinates:', usa.latlng);
      console.log('   Available for registration:', usa.status === 'Active' ? 'YES ✓' : 'NO ✗');
      console.log('');
    } else {
      console.log('❌ United States NOT FOUND in database\n');
    }
    
    // Check Brooklyn
    const brooklyn = await City.findOne({ 
      country: 'United States', 
      city: 'Brooklyn',
      isDeleted: false 
    });
    
    if (brooklyn) {
      console.log('✅ CITY: Brooklyn, New York');
      console.log('   ID:', brooklyn._id.toString());
      console.log('   Status:', brooklyn.status);
      console.log('   Province:', brooklyn.province);
      console.log('   City Coordinates:', brooklyn.citylatlng);
      console.log('   Available for registration:', brooklyn.status === 'Active' ? 'YES ✓' : 'NO ✗');
      console.log('');
    } else {
      console.log('❌ Brooklyn NOT FOUND in database\n');
    }
    
    // Get totals
    const totalCountries = await Country.countDocuments({ isDeleted: false, status: 'Active' });
    const totalCities = await City.countDocuments({ isDeleted: false, status: 'Active' });
    
    console.log('═══════════════════════════════════════');
    console.log('📈 DATABASE STATISTICS\n');
    console.log(`   Active Countries: ${totalCountries}`);
    console.log(`   Active Cities: ${totalCities}`);
    console.log('');
    
    // List all active countries
    console.log('═══════════════════════════════════════');
    console.log('🌍 ALL ACTIVE COUNTRIES:\n');
    const allCountries = await Country.find({ isDeleted: false, status: 'Active' }).sort({ country: 1 });
    allCountries.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.country} (${c.region || 'N/A'})`);
    });
    console.log('');
    
    // List all active cities
    console.log('═══════════════════════════════════════');
    console.log('🏙️  ALL ACTIVE CITIES:\n');
    const allCities = await City.find({ isDeleted: false, status: 'Active' }).sort({ country: 1, city: 1 });
    allCities.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.city}, ${c.province} (${c.country})`);
    });
    console.log('');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ REGISTRATION STATUS\n');
    
    if (usa && usa.status === 'Active' && brooklyn && brooklyn.status === 'Active') {
      console.log('🎉 SUCCESS! Users can now register with:');
      console.log('   • Country: United States');
      console.log('   • City: Brooklyn, New York\n');
      console.log('Registration will work for:');
      console.log('   ✓ Regular Users');
      console.log('   ✓ Vendors');
      console.log('   ✓ Staff');
      console.log('   ✓ Admin users\n');
    } else {
      console.log('⚠️  WARNING: Location data incomplete');
      console.log('   Users may not be able to complete registration\n');
    }
    
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

verifyLocations();
