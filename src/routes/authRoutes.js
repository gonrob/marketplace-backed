// authRoutes.js
const authRouter = require('express').Router();
const auth = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
authRouter.post('/register', authCtrl.register);
authRouter.post('/login', authCtrl.login);
authRouter.get('/me', auth, authCtrl.me);
module.exports = authRouter;
