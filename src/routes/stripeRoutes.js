const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/stripeController');

router.post('/pay', auth, ctrl.createPayment);
router.post('/paquete', auth, ctrl.createPaquete);
router.post('/retirar', auth, ctrl.retirarGanancias);
router.post('/account', auth, ctrl.createSellerAccount);
router.get('/onboarding-link', auth, ctrl.getOnboardingLink);
router.get('/status', auth, ctrl.getStatus);
router.post('/verify/identity', auth, ctrl.createVerification);

module.exports = router;