const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/sellers', ctrl.getSellers);
router.get('/sellers/:id', ctrl.getSellerById);
router.put('/profile', auth, ctrl.updateProfile);
router.delete('/account', auth, ctrl.deleteAccount);
router.delete('/admin/:id', auth, ctrl.deleteAccountAdmin);
router.post('/sellers/:id/valorar', auth, ctrl.valorar);
router.get('/buyers', auth, ctrl.getBuyers);
router.post('/email-masivo', auth, ctrl.emailMasivo);

module.exports = router;
