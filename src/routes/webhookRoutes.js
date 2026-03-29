const router = require('express').Router();
const ctrl = require('../controllers/webhookController');
router.post('/', ctrl.handleWebhook);
module.exports = router;
