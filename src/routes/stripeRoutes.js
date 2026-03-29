const router = require('express').Router();
const controller = require('../controllers/stripeController');
const auth = require('../middleware/auth');

router.post('/seller/create',    auth, controller.createSellerAccount);
router.get('/seller/onboarding', auth, controller.getOnboardingLink);
router.get('/seller/status',     auth, controller.getStatus);
router.post('/pay',              auth, controller.createPayment);

module.exports = router;
