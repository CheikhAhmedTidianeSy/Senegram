const router = require("express").Router();
const auth   = require("../middlewares/auth");
const upload = require("../config/multer");
const ctrl   = require("../controllers/uploadController");

router.use(auth);

// Un fichier quelconque (image, video, audio, document)
router.post("/file", upload.single("file"), ctrl.uploadSingle);

// Avatar de profil
router.post(
  "/avatar",
  (req, _res, next) => { req.uploadType = "avatar"; next(); },
  upload.single("file"),
  ctrl.uploadAvatar,
);

module.exports = router;
