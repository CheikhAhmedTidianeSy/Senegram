const router = require("express").Router();
const ctrl   = require("../controllers/authController");
const auth   = require("../middlewares/auth");

router.post("/register", ctrl.register);
router.post("/login",    ctrl.login);
router.get ("/me",       auth, ctrl.me);
router.post("/logout",   auth, ctrl.logout);

module.exports = router;
