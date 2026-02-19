require('dotenv').config();
const mongoose = require('mongoose');
const Country = require('./src/models/Country');

// List of countries to seed
const countries = [
  {
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    latlng: [37.09024, -95.712891],
    status: 'Active',
    isDeleted: false
  },
  {
    country: 'Canada',
    region: 'North America',
    currency: 'CAD',
    latlng: [56.1304, -106.3468],
    status: 'Active',
    isDeleted: false
  },
  {
    country: 'United Kingdom',
    region: 'Europe',
    currency: 'GBP',
    latlng: [55.3781, -3.4360],
    status: 'Active',
    isDeleted: false
  },
  {
    country: 'Australia',
    region: 'Oceania',
    currency: 'AUD',
    latlng: [-25.2744, 133.7751],
    status: 'Active',
    isDeleted: false
  }
];

async function seedCountries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');

    // Check if countries already exist
    for (const countryData of countries) {
      // Check for existing country (including deleted ones)
      const existingCountry = await Country.findOne({ 
        country: countryData.country
      });

      if (existingCountry) {
        // If exists but is deleted, restore it
        if (existingCountry.isDeleted) {
          existingCountry.isDeleted = false;
          existingCountry.status = 'Active';
          await existingCountry.save();
          console.log(`✓ Restored country: ${existingCountry.country} (ID: ${existingCountry._id})`);
        } else {
          console.log(`Country "${countryData.country}" already exists and is active. Skipping...`);
        }
      } else {
        const newCountry = await Country.create(countryData);
        console.log(`✓ Added country: ${newCountry.country} (ID: ${newCountry._id})`);
      }
    }

    console.log('\n✓ Country seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding countries:', error);
    process.exit(1);
  }
}

seedCountries();
