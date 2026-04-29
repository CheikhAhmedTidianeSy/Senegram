const router = require("express").Router();
const auth   = require("../middlewares/auth");
const ctrl   = require("../controllers/callController");

router.use(auth);

router.get ("/conversation/:id", ctrl.history);
router.post("/",                 ctrl.start);
router.post("/:id/end",          ctrl.end);

module.exports = router;
