const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  editbio,
  fetchmedia,
  fetchproducts,
  getproduct,
  getcommunities,
  getbio,
  getprosite,
  fetchallglimpse,
  createprosite,
  getlist,
  getdetailprosite,
} = require("../controllers/prosite");

router.post("/edituser/:userId", editbio);
router.get("/fetchmedia/:userId", fetchmedia);
router.get("/fetchproduct/:userId/:mainuserId", fetchproducts);
router.get("/getproduct/:productId", getproduct);
router.get("/getcommunities/:userId", getcommunities);
router.get("/getbio/:userId", getbio);
router.get("/getprosite/:userId", getprosite);
router.get("/fetchallglimpse/:userId", fetchallglimpse);
router.post("/createprosite/:userId", upload.any(), createprosite);
router.get("/getlist/:userId", getlist);
router.get("/getdetailprosite/:userId/:siteId", getdetailprosite);

// exports.base64upload = async (req, res) => {
//   const body = req.body;
//   try {
//     const newImage = await Image.create(body);
//     newImage.save();
//     res
//       .status(201)
//       .json({ message: "new image uploaded", createdPost: newImage });
//   } catch (error) {
//     res.status(409).json({
//       message: error.message,
//     });
//   }
// };

// exports.devpost = async (req, res) => {
//   const body = req.body;
//   try {
//     const newImage = await DevPost.create(body);
//     newImage.save();
//     res
//       .status(201)
//       .json({ message: "new image uploaded", createdPost: newImage });
//   } catch (error) {
//     res.status(409).json({
//       message: error.message,
//     });
//   }
// };

// exports.getDevpost = async (req, res) => {
//   try {
//     const post = await DevPost.find();
//     res.status(200).json(post);
//   } catch (error) {
//     res.status(409).json({
//       message: error.message,
//     });
//   }
// };

// exports.getimage = async (req, res) => {
//   try {
//     const find = await Image.find();
//     if (find) {
//       const reverse = find.reverse();
//       res.json(reverse);
//     } else {
//       res.json({ post: "Not Found" });
//     }
//   } catch (err) {
//     res.json({ message: err.message, success: false });
//     console.log(err);
//   }
// };

// exports.colors = async (req, res) => {
//   const { color } = req.body;
//   try {
//     // console.log(color)
//     const newColor = new Color({
//       bg: color.c1,
//       text: color.c2,
//       button: color.c3,
//       number: color.no,
//     });

//     // console.log(newColor)
//     // Save the new color to your database
//     await newColor.save();

//     res.status(201).json(newColor);
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getColors = async (req, res) => {
//   try {
//     const data = await Color.findOne({});
//     if (data) {
//       // console.log(data)
//       res.json(data);
//     } else {
//       res.json("not found");
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.fonts = async (req, res) => {
//   const { data } = req.body;
//   try {
//     // console.log(data)
//     const newfont = new Font({
//       fontType: data.fontType,
//       fontSize: data.fontSize,
//       fontWeight: data.fontWeight,
//       textShadow: data.textShadow,
//     });
//     // console.log(newfont)
//     // Save the new color to your database
//     await newfont.save();

//     res.status(201).json({ newfont, success: true });
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getFonts = async (req, res) => {
//   try {
//     const data = await Font.find();
//     if (data) {
//       // console.log(data)
//       res.json({ data, success: true });
//     } else {
//       res.json("not found");
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.button = async (req, res) => {
//   const { data } = req.body;
//   try {
//     // console.log(data)
//     const newButton = new Button({
//       backgroundColor: data.backgroundColor,
//       Color: data.Color,
//       borderTop: data.borderTop,
//       borderBottom: data.borderBottom,
//       borderRight: data.borderRight,
//       borderLeft: data.borderLeft,
//       paddingX: data.paddingX,
//       paddingY: data.paddingY,
//       borderRadiusTop: data.borderRadiusTop,
//       borderRadiusBottom: data.borderRadiusBottom,
//       borderRadiusRight: data.borderRadiusRight,
//       borderRadiusLeft: data.borderRadiusLeft,
//       boxShadow: data.boxShadow,
//       fontBold: data.fontBold,
//     });

//     // console.log(newButton)
//     // Save the new color to your database
//     await newButton.save();

//     res.status(201).json({ newButton, success: true });
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getButton = async (req, res) => {
//   try {
//     const data = await Button.find();
//     if (data) {
//       console.log(data);
//       res.json({ data, success: true });
//     } else {
//       res.json("not found");
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.background = async (req, res) => {
//   const body = req.body;
//   try {
//     const newImage = await BackGround.create(body);
//     newImage.save();
//     res
//       .status(201)
//       .json({ message: "new image uploaded", createImage: newImage });
//   } catch (error) {
//     res.status(409).json({
//       message: error.message,
//     });
//   }
// };

// exports.getBackground = async (req, res) => {
//   try {
//     const find = await BackGround.find();
//     if (find) {
//       res.json({ find, success: true });
//     } else {
//       res.json({ message: "Not Found" });
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.backColor = async (req, res) => {
//   try {
//     const body = req.body;
//     const createcolor = new BackColor(body);
//     const savethis = await createcolor.save();
//     res.json(savethis);
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getbackColor = async (req, res) => {
//   try {
//     const find = await BackColor.find();
//     if (find) {
//       res.json(find);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.temp = async (req, res) => {
//   try {
//     const { post, idd, setNm } = req.body;
//     const iddd = await Temp.findOne({ idd });

//     if (!iddd) {
//       const neww = new Temp({ post, idd, setNm });
//       await neww.save();
//       res.status(201).json(neww);
//     } else {
//       await Temp.findOneAndUpdate({ idd }, { post }, { setNm });
//       res.status(200).json({ message: "Temp updated successfully" });
//     }
//   } catch (error) {
//     console.error("Error occurred", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// exports.fetchData = async (req, res) => {
//   try {
//     const mew = await Temp.findOne();
//     res.status(201).json(mew);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Server error", message: error.message });
//   }
// };

// exports.lottie = async (req, res) => {
//   try {
//     const file = req.file;
//     // console.log(req.file)
//     const newLottie = new Lottie({
//       lottieFile: file.buffer,
//     });
//     await newLottie.save();
//     res.json({
//       newLottie,
//       message: "File uploaded successfully",
//       success: true,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getLottie = async (req, res) => {
//   try {
//     const findlottie = await Lottie.find();
//     if (findlottie) {
//       res.json({ findlottie, success: true });
//     } else {
//       res.json({ success: false });
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

// exports.getprositefull = async (req, res) => {
//   try {
//     const { username } = req.body;
//     console.log(username);
//     const atIndex = username.indexOf("@");

//     if (atIndex === -1) {
//       res
//         .status(400)
//         .json({ message: "Invalid username format", success: false });
//       return;
//     }
//     const u = username.substring(atIndex + 1);

//     const user = await User.findOne({ username: u }).populate(
//       "prositeid",
//       "htmlcontent"
//     );
//     if (!user) {
//       res.status(404).json({ message: "User not found", success: false });
//     } else {
//       res
//         .status(200)
//         .json({ success: true, prosite: user?.prositeid?.htmlcontent });
//     }
//   } catch (e) {
//     console.log(e);
//     res
//       .status(500)
//       .json({ message: "Something went wrong...", success: false });
//   }
// };

// exports.prosite = async (req, res) => {
//   try {
//     const { data, id } = req.body;
//     const user = await User.findOne({ _id: id });
//     const prosite = await Prosite.findOne({ creator: id });

//     if (user) {
//       if (prosite) {
//         prosite.htmlcontent = data;
//         await prosite.save();
//         await User.updateOne(
//           { _id: id },
//           { $set: { prositeid: prosite._id } },
//           { new: true }
//         );
//       } else {
//         const newprosite = new Prosite({
//           creator: id,
//           htmlcontent: data,
//         });
//         const saved = await newprosite.save();
//         await User.updateOne(
//           { _id: id },
//           { $set: { prositeid: saved._id } },
//           { new: true }
//         );
//       }
//       res.status(200).json({ success: true });
//     } else {
//       res.status(404).json({ message: "User not found", success: false });
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

module.exports = router;
