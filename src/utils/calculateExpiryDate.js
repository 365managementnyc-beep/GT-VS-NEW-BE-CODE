const calculateExpiryDate = (duration) => {
  const date = new Date();
  switch (duration) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semiAnnual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'biennial':
      date.setFullYear(date.getFullYear() + 2);
      break;
    default:
      throw new Error('Invalid plan duration');
  }
  return date;
};

module.exports = calculateExpiryDate;
