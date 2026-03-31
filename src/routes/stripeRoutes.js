const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/stripeController');
router.post('/seller/create',    auth, ctrl.createSellerAccount);
router.get('/seller/onboarding', auth, ctrl.getOnboardingLink);
router.get('/seller/status',     auth, ctrl.getStatus);
router.post('/pay',              auth, ctrl.createPayment);
router.post('/verify/identity',  auth, ctrl.createVerification);
module.exports = router;
