const User = require('../models/users/User');
const AppError = require('../utils/appError');

module.exports = (roles) => async (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  console.log('req.user', req.user);

  if (req.user?.adminRole === 'subAdmin') {
    const currentTab = req.headers['x-tab'];
    console.log('currentTab', currentTab);
    if (!currentTab) {
      return res.status(400).json({ message: 'Missing tab context' });
    }
    if (!req?.user?.templateId?.tabPermissions.includes(currentTab)) {
      return res.status(403).json({ message: `User does not have access to tab: ${currentTab}` });
    }
  } else if (req.user?.vendorRole === 'staff') {
    const currentTab = req.headers['x-tab'];
    console.log('currentTab', currentTab);
    if (!currentTab) {
      return res.status(400).json({ message: 'Missing tab context' });
    }
    if (!req?.user?.permissions.includes(currentTab)) {
      return res.status(403).json({ message: `User does not have access to tab: ${currentTab}` });
    }
    const findVendor = await User.findById(req.user.staffOf);
    console.log('findVendor', findVendor);

    if (findVendor && findVendor?.status === 'Delete') {
      return next(new AppError('This account deleted by Admin. Please contact with Admin', 404));
    }

    req.user = findVendor;
  } else if (req.user?.customerRole === 'staff') {
    console.log('req.user', req.user);
    const currentTab = req.headers['x-tab'];
    console.log('currentTab', currentTab);
    if (!currentTab) {
      return res.status(400).json({ message: 'Missing tab context' });
    }
    if (!req?.user?.permissions.includes(currentTab)) {
      return res.status(403).json({ message: `User does not have access to tab: ${currentTab}` });
    }
    const findCustomer = await User.findById(req.user.staffOf);
    if (findCustomer && findCustomer?.status === 'Delete') {
      return next(new AppError('This account deleted by Admin. Please contact with Admin', 404));
    }
    req.user = findCustomer;
  }

  return next();
};
