const router = require("express").Router();
const ctrl   = require("../controllers/groupController");
const auth   = require("../middlewares/auth");

router.use(auth);

router.post  ("/",                     ctrl.create);
router.patch ("/:id",                  ctrl.update);
router.post  ("/:id/members",          ctrl.addMembers);
router.delete("/:id/members/:userId",  ctrl.removeMember);
router.post  ("/:id/leave",            ctrl.leave);

module.exports = router;
