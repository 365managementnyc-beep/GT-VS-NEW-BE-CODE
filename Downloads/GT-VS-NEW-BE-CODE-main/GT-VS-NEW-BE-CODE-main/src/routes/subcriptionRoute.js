const express = require('express');
const {
  upgradeSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  rewardPremium,
  checkPremiumAccess,
  checkSubscription,
  buySubscription,
  handleCheckoutSession,
  cancelSubscriptionPurchase
} = require('../controllers/subscriptionController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.post('/upgrade', requireAuth, upgradeSubscription);
router.post('/buy', requireAuth, buySubscription);
router.get('/success', requireAuth, handleCheckoutSession);
router.get('/cancel', cancelSubscriptionPurchase);
router.post('/status', requireAuth, getSubscriptionStatus);
router.post('/cancel-subscription', requireAuth, cancelSubscription);
router.post('/reward', requireAuth, rewardPremium);
router.get('/check-premium-access', requireAuth, checkPremiumAccess);
router.get('/check-subscription', requireAuth, checkSubscription);

module.exports = router;
