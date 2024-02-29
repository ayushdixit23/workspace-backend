const express = require("express");
const router = express.Router();
const multer = require("multer");
const { searchnow, searchcoms, searchpros, recentSearch } = require("../controllers/searc");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//search posts
router.post("/searchnow", searchnow);

//search communities
router.post("/searchcoms", searchcoms);

//search communities
router.post("/searchpros", searchpros);
router.post("/recentSearch", recentSearch);

module.exports = router;
