const Gadgets = require('../models/ServiceGadgets');

const gadgets = [
  { name: 'Lightning' },
  { name: 'Sound' },
  { name: 'A/v' },
  { name: 'Fridge' },
  { name: 'Buffet Area' },
  { name: 'Progressive house' },
  { name: 'MC' },
  { name: 'Wireless Mic' },
  { name: 'Sparklers' }
];

const populateServiceGadgets = async () => {
  await Gadgets.deleteMany({});
  console.log('Existing gadgets deleted.');

  await Gadgets.insertMany(gadgets);
  console.log('Gadgets added successfully!');
};

module.exports = populateServiceGadgets;
