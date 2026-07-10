const router = require("express").Router();
const ctrl   = require("../controllers/conversationController");
const auth   = require("../middlewares/auth");

router.use(auth);

router.get ("/",               ctrl.list);
router.post("/private",        ctrl.openPrivate);
router.get ("/:id",            ctrl.getOne);

module.exports = router;
