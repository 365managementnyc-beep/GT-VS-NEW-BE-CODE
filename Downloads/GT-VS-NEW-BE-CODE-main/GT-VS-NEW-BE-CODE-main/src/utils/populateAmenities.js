const  {Category, Amenities}= require('../models/Amenities');


// Define the amenity data with categories
const AllAmenities = [
  {
    name: "Venues Amenities",
    categories: [
      { name: "Bridal Suite" },
      { name: "Outdoor" },
      { name: "Microwave" },
      { name: "Fridge" },
      { name: "Buffet Area" },
      { name: "Wheelchair accessible" },
      { name: "Outside alcohol allowed" },
      { name: "Indoor" },
      { name: "Stove" },
      { name: "Kitchen" },
      { name: "Tables & Chairs" },
      { name: "Elevator" },
      { name: "Dressing Room" },
      { name: "Outside food allowed" },
      { name: "Coolers" },
      { name: "Bar" },
      { name: "Stairs" },
      { name: "Ground floor" }
    ]
  },
  {
    name: "Service Availability",
    categories: [
      { name: "Outside food allowed" },
      { name: "All-inclusive" },
      { name: "Outside alcohol allowed" },
      { name: "Space Rental Only" },
      { name: "Clean up included" }
    ]
  }
];

const populateAmenities = async () => {
  try {
    // Clear existing amenities and categories
    await Amenities.deleteMany({});
    console.log('Existing amenities deleted.');

    // Clear existing categories to prevent duplicates
    await Category.deleteMany({});
    console.log('Existing categories deleted.');

    // Process each amenity to create categories and associate them
    for (const amenity of AllAmenities) {
      const categoryIds = [];

      // Create categories and push their IDs into categoryIds array
      for (const category of amenity.categories) {
        const existingCategory = await Category.findOne({ name: category.name });
        if (!existingCategory) {
          // If category doesn't exist, create a new one
          const newCategory = await Category.create({ name: category.name });
          categoryIds.push(newCategory._id);
        } else {
          categoryIds.push(existingCategory._id);
        }
      }

      // Create the amenity with category references
      const newAmenity = await Amenities.create({
        name: amenity.name,
        categories: categoryIds
      });
      console.log(`Amenity '${newAmenity.name}' added successfully!`);
    }

    console.log('All amenities and categories added successfully!');
  } catch (error) {
    console.error('Error populating amenities:', error);
  }
}

module.exports = populateAmenities;

