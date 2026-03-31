const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/userController');

router.get('/sellers', ctrl.getSellers);
router.get('/sellers/:id', ctrl.getSellerById);
router.put('/profile', auth, ctrl.updateProfile);
router.delete('/account', auth, ctrl.deleteAccount);

module.exports = router;