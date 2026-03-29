const router = require('express').Router();
const controller = require('../controllers/webhookController');

router.post('/', controller.handleWebhook);

module.exports = router;
