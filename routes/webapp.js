
const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000000000 } });
const { checkid, joinmember, unjoinmember, postanythings3, newfetchfeeds3, joinedcomnews3, fetchallchatsnew, fetchconvs, compostfeed, fetchallposts, gettopicmessages, searchcoms, searchpros, checkemail, loadmorechatmsgs, sendchatfile, fetchcart, fetchorders, mobileSearch, addRecentSearchCommunity, addRecentSearchProsite, removeRecentSearchProsite, removeRecentSearchCommunity, fetchmoredata, fetchallsubscriptions, updatequantity, removecartorder, hideconvmsg, unhideconvmsg, fetchhiddenconv, fetchmorehiddenconv, deletemessages, blockpeople, reporting, fetchallmsgreqs, acceptorrejectmesgreq, likepost, createtopicporder, finalisetopicorder } = require("../controllers/webapp");

router.post("/webapplogin", checkid)
router.post("/webcheckemail", checkemail)
router.post("/joinmember/:userId/:comId", joinmember)
router.post("/unjoinmember/:userId/:comId", unjoinmember)
router.post("/postanythings3/:userId/:comId/:topicId", postanythings3)
router.get("/newfetchfeeds3/:userId", newfetchfeeds3)
router.get("/joinedcomnews3/:userId", joinedcomnews3)
router.get("/fetchallchatsnew/:id", fetchallchatsnew)
router.post("/fetchallposts/:id/:comId", fetchallposts)
router.post("/sendchatfile", upload.any(), sendchatfile)
router.post("/loadmorechatmsg/:id", loadmorechatmsgs)
router.get("/fetchconvs/:id/:otherid/:convId", fetchconvs)
router.get("/compostfeed/:id/:comId", compostfeed)
router.get("/fetchallposts/:id/:comId", fetchallposts)
router.get("/gettopicmessages/:id/:topicId", gettopicmessages)
router.post("/searchcoms/:id", searchcoms)
router.post("/searchpros", searchpros)
router.get("/fetchcart/:userId", fetchcart)
router.post("/removecartweb/:id/:cartId/:productId", removecartorder)
router.get("/fetchorders/:userId", fetchorders)
router.get("/webmobileSearch/:id", mobileSearch)
router.post("/addRecentCommunity/:id", addRecentSearchCommunity)
router.post("/addRecentProsite/:id", addRecentSearchProsite)
router.post("/removeRecentSrcProsite/:id", removeRecentSearchProsite)
router.post("/removeRecentSrcCommunity/:id", removeRecentSearchCommunity)
router.get("/fetchallsubscriptions/:id", fetchallsubscriptions)
router.get("/fetchmorefeeddata/:userId", fetchmoredata)
router.post("/updatequantityweb/:userId/:cartId", updatequantity)
router.post("/hideconvmsg/:id", hideconvmsg)
router.post("/unhideconvmsg/:id", unhideconvmsg)
router.get("/fetchhiddenconv/:id/:convId", fetchhiddenconv)
router.get("/fetchmorehiddenconv/:id", fetchmorehiddenconv)
router.post("/deletemessages/:id", deletemessages)
router.post("/blockpeople/:id", blockpeople)
router.post("/web/reporting/:userid", reporting)

router.get("/fetchallmsgreqs/:id", fetchallmsgreqs)
router.post("/acceptorrejectmesgreq", acceptorrejectmesgreq)
router.post("/likepost/:userId/:postId", likepost)

//create topic order new
router.post("/v1/createtopicporder/:id/:topicId", createtopicporder);

//finalisetopicorder new
router.post("/v1/finalisetopicorder/:id/:ordId/:topicId", finalisetopicorder);


module.exports = router;
