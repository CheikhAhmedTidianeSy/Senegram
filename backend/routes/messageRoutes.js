const router = require("express").Router();
const ctrl   = require("../controllers/messageController");
const auth   = require("../middlewares/auth");

router.use(auth);

router.get   ("/conversation/:id", ctrl.list);
router.post  ("/conversation/:id", ctrl.send);
router.patch ("/:id",              ctrl.edit);
router.delete("/:id",              ctrl.remove);

module.exports = router;
