const ServiceCategory = require('../models/ServiceCategory');

const categories = [
  {
    name: 'Venues',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Flocation-icon-white-1744282120334.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Flocation-icon-1744282121903.svg",
    whitekey: "gala-images/Flocation-icon-white-1744282120334.svg",
    blackKey: "gala-images/location-icon-1744282121903.svg"
  },
  {
    name: 'Decorations',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FDecoration-icon-white-1744282104717.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FDecoration-icon-1744282106256.svg",
    whitekey: "gala-images/Decoration-icon-white-1744282104717.svg",
    blackKey: "gala-images/Decoration-icon-1744282106256.svg"

  },
  {
    name: 'Catering',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fcatering-icon-white-1744282101483.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fcatering-icon-1744282103109.svg",
    whitekey: "gala-images/catering-icon-white-1744282101483.svg",
    blackKey: "gala-images/catering-icon-1744282103109.svg"

  },
  {
    name: "DJ's",
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fdj-icon-white-1744282107839.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fdj-icon-1744282109420.svg",
    whitekey: "gala-images/dj-icon-white-1744282107839.svg",
    blackKey: "gala-images/dj-icon-1744282109420.svg"

  },
  {
    name: 'Entertainment',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fentertainment-icon-white-1744282110976.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fentertainment-icon-1744282112539.svg",
    whiteKey: "gala-images/entertainment-icon-white-1744282110976.svg",
    blackKey: "gala-images/entertainment-icon-1744282112539.svg"
  },
  {
    name: 'Photography & Videography',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fphotography-icon-white-1744282123453.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fphotography-icon-1744282125011.svg",
    whitekey: "gala-images/photography-icon-white-1744282123453.svg",
    blackKey: "gala-images/photography-icon-1744282125011.svg"

  },
  {
    name: 'Beauty',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fbeauty-icon-white-1744282094571.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fbeauty-icon-1744282096766.svg",
    whitekey: "gala-images/beauty-icon-white-1744282094571.svg",
    blackKey: "gala-images/beauty-icon-1744282096766.svg"

  },
  {
    name: 'Fashion',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FFashion-icon-white-1744282117207.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FFashion-icon-1744282118771.svg",
    whitekey: "gala-images/Fashion-icon-white-1744282117207.svg",
    blackKey: "gala-images/Fashion-icon-1744282118771.svg"
  },
  {
    name: 'Transportation',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FTransportaion-icon-white-1744282129711.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FTransportaion-icon-1744282131336.svg",
    whitekey: "gala-images/Transportaion-icon-white-1744282129711.svg",
    blackKey: "gala-images/Transportaion-icon-1744282131336.svg"

  },
  {
    name: 'Cakes',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fcakes-icon-white-1744282098344.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fcakes-icon-1744282099909.svg",
    whitekey: "gala-images/cakes-icon-white-1744282098344.svg",
    blackKey: "gala-images/cakes-icon-1744282099909.svg"


  },
  {
    name: 'Equipment',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FEquipment-icon-white-1744282114107.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2FEquipment-icon-1744282115663.svg",
    whitekey: "gala-images/Equipment-icon-white-1744282114107.svg",
    blackKey: "gala-images/Equipment-icon-1744282115663.svg"
  },
  {
    name: 'Staff',
    whiteIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fstaff-icon-white-1744282126591.svg",
    blackIcon: "https://demo-automation-storages.s3.us-east-2.amazonaws.com/gala-images%2Fstaff-icon-1744282128162.svg",
    whitekey: "gala-images/staff-icon-white-1744282126591.svg",
    blackKey: "gala-images/staff-icon-1744282128162.svg"
  }
];

const populateServiceCategory = async () => {
  await ServiceCategory.deleteMany({});
  console.log('Existing Services deleted.');

  await ServiceCategory.insertMany(categories);
  console.log('Services added successfully!');
};

module.exports = populateServiceCategory;
