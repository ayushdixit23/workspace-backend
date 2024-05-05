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
  feedback,
  promotedposts,
  getAllPosts, createad, fetchingprosite, fetchLocations, loginwithgrovyo, verifyOtp,
  loginwithworkspace,
  loginAdspace,
  addAccount,
  loginforAdspace,
  loginagency
} = require("../controllers/Ads");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/newad/:id/:userId", upload.any(), newad);
router.post("/v1/createad/:id", upload.any(), createad);
router.get("/getad/:id", getad);
router.get("/getallads/:id", getallads);
router.post("/checkadvaccount", loginAdspace)
// router.post("/checkadvaccount", checkaccount),
router.post("/createadvacc", upload.single("image"), createadvacc),

  router.get("/fetchdashboard/:id", fetchdashboard);
router.get("/gettransactions/:id", gettransactions);
router.get("/v1/getData", getData)
router.post("/editcurrentad/:id/:adid", upload.any(), editcurrentad);
router.post("/editadvertiser/:id", upload.any(), editadvertiser);
router.get("/v1/fetchLocation", fetchLocations);
router.post("/v1/addata", addata);
router.get("/v1/audget", audget);
router.post("/verifyadvertiser/:id", upload.any(), verifyadvertiser);
router.post("/addmoneytowallet/:id", addmoneytowallet);
router.post("/updatetransactionstatus/:id/:tid/:amount", updatetransactionstatus);
router.post("/logoutadv/:id", logoutadv);
router.get("/getuser/:id", getuser)
router.post("/refresh", refreshingsAdsTokens);
router.get("/getcommunitiesforAd/:id", getCommunities)
router.post("/promotedposts/:id/:comid", promotedposts)
router.get("/getAllPostsforAd/:id/:comid", getAllPosts)
router.post("/feedback/:advid", feedback)
router.get("/getprositedetails/:id", fetchingprosite)
router.post("/loginwithgrovyo", loginwithgrovyo)
router.post("/verifyotp", verifyOtp)
router.get("/loginwithworkspace/:id/:postid", loginwithworkspace)
router.get("/loginforAdspace/:id", loginforAdspace)
router.post("/addAccount/:agencyuserid/:agencyadvertiserid", upload.any(), addAccount)
router.post("/loginagency/:agencyId", loginagency)

module.exports = router;