const express = require("express");
const {
  newad,
  getad,
  getallads,
  checkaccount,
  createadvacc,
  fetchdashboard,
  editcurrentad,
  editadvertiser,
  verifyadvertiser,
  logoutadv,
  gettransactions,
  addmoneytowallet,
  updatetransactionstatus,
  addata,
  getData,
  audget,
  getuser,
  refreshingsAdsTokens,
  getCommunities,
  promotedposts,
  getAllPosts, createad, fetchingprosite
} = require("../controllers/Ads");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/newad/:id/:userId", upload.any(), newad);
router.post("/v1/createad/:id", upload.any(), createad);
router.get("/getad/:id", getad);
router.get("/getallads/:id", getallads);
router.post("/checkadvaccount", checkaccount),
  router.post("/createadvacc", upload.single("image"), createadvacc),

  router.get("/fetchdashboard/:id", fetchdashboard);
router.get("/gettransactions/:id", gettransactions);
router.get("/v1/getData", getData)
router.post("/editcurrentad/:id/:adid", upload.any(), editcurrentad);
router.post("/editadvertiser/:id", upload.any(), editadvertiser);
router.post("/v1/addata", addata);
router.get("/v1/audget", audget);
router.post("/verifyadvertiser/:id", upload.any(), verifyadvertiser);
router.post("/addmoneytowallet/:id", addmoneytowallet);
router.post("/updatetransactionstatus/:id", updatetransactionstatus);
router.post("/logoutadv/:id", logoutadv);
router.get("/getuser/:id", getuser)
router.post("/refresh", refreshingsAdsTokens);
router.get("/getcommunitiesforAd/:id", getCommunities)
router.post("/promotedposts/:id/:comid", promotedposts)
router.get("/getAllPostsforAd/:id/:comid", getAllPosts)
router.get("/getprositedetails/:id", fetchingprosite)

module.exports = router;