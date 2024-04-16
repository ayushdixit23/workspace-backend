const express = require("express");
const router = express.Router();

const multer = require("multer");
const {
  checkid,
  refresh,
  checkemail,
  analyticsuser,
  allcoms,
  createCollection,
  deleteproduct,
  updateproduct,
  fetchProduct,
  collectiondelete,
  registerstore,
  createproduct,
  getaproduct,
  fetchallorders,
  getposts,
  getprofileinfo,
  profileinfo,
  createtopic,
  deletetopic,
  edittopic,
  fetchtopic,
  createcom,
  updatecommunity,
  checkStore,
  checkqr,
  profileStore,
  earnings,
  deletecom,
  membershipbuy,
  memfinalize,
  addbank,
  getallposts,
  fetchwithid,
  fetchMemberShip,
  customMembership,
  errorsDetection,
  fetchCommunityStats,
  monetizationWorkSpace,
  templates,
  editPosts,
  approvalrequestbank,
  removecomwithposts,
  deletepost,
  analyticsuserThirtyDays,
  fetchSingleProduct,
  defaultprositeselector,
  changemont,
  // fetchingprosite,

  // base64upload,
  // getimage,
  // colors,
  // getColors,
  // fonts,
  // getFonts,
  // button,
  // getButton,
  // background,
  // getBackground,
  // backColor,
  // getbackColor,
  // temp,
  // getLottie,
  // fetchData,
  // devpost,
  // lottie,
  // getDevpost,
  // getprositefull,
  // prosite,
} = require("../controllers/WorkspaceV1");
const { middlewareMembership } = require("../helpers/membershipchecker");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/checkid", checkid);
router.post("/checkqr", checkqr);
router.post("/checkemail", checkemail);
router.post("/refresh", refresh);
router.get("/analyticsuser/:userid", analyticsuser);
router.get("/analyticsuserThirtyDays/:userid", analyticsuserThirtyDays);
router.get("/allcoms/:id", allcoms);
router.post("/createcom/:userId", middlewareMembership, upload.single("image"), createcom);
router.post(
  "/createCollection/:userId",
  middlewareMembership,
  upload.single("verfication"),
  createCollection
);
router.get("/fetchProducts/:userId", fetchProduct);
router.delete("/deleteproduct/:userId/:colid/:productId", deleteproduct);
router.post("/updateaproduct/:userId/:colid/:productId",
  upload.any("image"),
  updateproduct);
router.delete("/collectiondelete/:userId/:colid", collectiondelete);
router.post(
  "/registerstore/:userId",
  upload.single("documentfile"),
  registerstore
);
router.post("/createproduct/:userId/:colid", middlewareMembership, upload.any(), createproduct);
router.get("/getaproduct/:id/:productId", getaproduct);
router.get("/fetchallorders/:id", fetchallorders);
router.get("/getposts/:id/:comid", getposts);
router.get("/getallposts/:comid", getallposts);
router.get("/getprofileinfo/:id", getprofileinfo);
router.post("/profileinfo/:id", upload.single("image"), profileinfo);
// router.post("/profilestore/:id", profileStore);
router.post("/createtopic/:userId/:comId", middlewareMembership, createtopic);
router.post("/delete/:comId", deletecom);
router.post("/deletetopic/:userId/:topicId", deletetopic);
router.post("/edittopic/:id/:topicid", edittopic);
router.get("/fetchtopic/:id/:comId", fetchtopic);
router.post(
  "/updatecommunity/:userId/:comId",
  upload.single("image"),
  updatecommunity
);
router.get("/checkstore/:id", checkStore);
router.get("/earnings/:id", earnings);
router.post("/membershipbuy/:id/:memid", membershipbuy)
router.post("/memfinalize/:id/:orderId", memfinalize)
router.post("/addbank/:id", addbank)
router.get("/fetchwithid/:id", fetchwithid)
router.get("/fetchmembership", fetchMemberShip)
router.post("/customMembership/:userId/:orderId", customMembership)
router.post("/errorsDetection", errorsDetection)
router.get("/fetchCommunityStats/:userId", fetchCommunityStats)
router.post("/monetization/:id/:comid", monetizationWorkSpace)
router.post("/editpost/:userId/:postId", upload.any(), editPosts)
// router.get("/getprositedetails/:id", fetchingprosite)
// prosite route
// router.use("/uploadbase64", base64upload);
// router.post("/devpost", devpost);
// router.get("/getDevPost", getDevpost);
// router.get("/getimage", getimage);
// router.post("/colors", colors);
// router.get("/getColors", getColors);
// router.post("/fonts", fonts);
// router.get("/getFonts", getFonts);
// router.post("/button", button);
// router.get("/getButton", getButton);
// router.post("/background", background);
// router.get("/getBackground", getBackground);
// router.post("/backColor", backColor);
// router.get("/getbackColor", getbackColor);
// router.post("/temp", temp);
// router.get("/fetchData", fetchData);
// router.get("/getLottie", getLottie);
// router.post("/lottie", upload.single("lottieFile"), lottie);
// router.post("/getprositefull", getprositefull);
// router.post("/postforprosite", prosite);
router.post("/removecomwithposts/:id/:comId", removecomwithposts)
router.delete("/deletepost/:userId/:postId", deletepost)
router.post("/savemytemplate/:id", templates)
router.get("/fetchSingleProduct/:productId", fetchSingleProduct)
router.post("/defaultprositeselector/:id", defaultprositeselector)
router.post("/changemont/:comid", changemont)
// router.post("/approvalrequestbank/:id", approvalrequestbank)

module.exports = router;
