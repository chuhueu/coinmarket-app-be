const { requestMessage, verify, authenticate, logout } = require("../controller/authController");

const router = require("express").Router();

router.route('/request-message').post(requestMessage);
router.route('/verify').post(verify);
router.route('/authenticate').post(authenticate);
router.route('/logout').get(logout);

module.exports = router;