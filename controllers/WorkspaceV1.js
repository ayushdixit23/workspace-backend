const Minio = require("minio");
const aesjs = require("aes-js");
const User = require("../models/userAuth");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const Topic = require("../models/topic");
// const Analytics = require("../models/Analytics");
const Community = require("../models/community");
const uuid = require("uuid").v4;
const Post = require("../models/post");
require("dotenv").config();
const Collection = require("../models/Collectionss");
const Product = require("../models/product");
const Order = require("../models/orders");
// const multer = require("multer");
// const Image = require("../models/Image");
// const DevPost = require("../models/DevPost");
// const Color = require("../models/Color");
// const Font = require("../models/Font");
// const Button = require("../models/Button");
// const BackGround = require("../models/BackGround");
// const BackColor = require("../models/BackColor");
// const Temp = require("../models/Temp");
// const Lottie = require("../models/Lottie");
const mongoose = require("mongoose");
const Subscriptions = require("../models/Subscriptions");
// const Prosite = require("../models/prosite");
const Razorpay = require("razorpay");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const fs = require("fs");
require("dotenv").config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const PRODUCT_BUCKET = process.env.PRODUCT_BUCKET;
const POST_BUCKET = process.env.POST_BUCKET;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",
  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

function generateAccessToken(data) {
  const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "1h",
  });
  return access_token;
}


const {
  validatePaymentVerification,
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const Membership = require("../models/membership");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// const instance = new Razorpay({
//   "key_id": "rzp_test_jXDMq8a2wN26Ss",
//   "key_secret": "bxyQhbzS0bHNBnalbBg9QTDo"
// });

function generateRefreshToken(data) {

  const refresh_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "10d",
  });
  return refresh_token;
}

// Function to generate a unique session identifier
function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

// function to generate a presignedurl of minio
async function generatePresignedUrl(bucketName, objectName, expiry = 604800) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
    return presignedUrl;
  } catch (er) {
    console.error(er);
    throw new Error("Failed to generate presigned URL");
  }
}

//function for decryption of data
const decryptaes = async (data) => {
  try {
    const encryptedBytes = aesjs.utils.hex.toBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      JSON.parse(process.env.key),
      new aesjs.Counter(5)
    );
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText;
  } catch (e) {
    console.log(e);
  }
};

//function for encrypting data
const encryptaes = async (data) => {
  try {
    const textBytes = aesjs.utils.utf8.toBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      JSON.parse(process.env.key),
      new aesjs.Counter(5)
    );
    const encryptedBytes = aesCtr.encrypt(textBytes);
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
    return encryptedHex;
  } catch (e) {
    console.log(e);
  }
};

// for checking if user exists
exports.checkid = async (req, res) => {
  try {
    const { phone } = req.body;
    const dphone = await decryptaes(phone);
    const user = await User.findOne({ phone: dphone });
    if (user) {
      const sessionId = generateSessionId();

      const dp =
        process.env.URL + user.profilepic;
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      res.cookie(`excktn${sessionId}`, access_token, {
        httpOnly: true,
        // secure: true,
      });
      res.cookie(`frhktn${sessionId}`, refresh_token, {
        httpOnly: true,
        // secure: true,
      });
      res.cookie(`sessionId_${sessionId}`, sessionId, {
        httpOnly: true,
        // secure: true,
      });

      res.header("Authorization", `Bearer ${access_token}`);
      const dat = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
      }
      const endata = await encryptaes(JSON.stringify(dat));
      res
        .status(200)
        .json({

          dp,
          access_token, refresh_token, endata, sessionId, success: true
        });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Something Went Wrong", success: false });
  }
};

exports.checkqr = async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (user) {
      const sessionId = generateSessionId();
      const dp =
        process.env.URL + user.profilepic;
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);


      res.header("Authorization", `Bearer ${access_token}`);
      const dat = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
      };
      const endata = await encryptaes(JSON.stringify(dat));
      return res
        .status(200)
        .json({ dp, access_token, refresh_token, sessionId, endata, success: true });
    } else {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

// email
exports.checkemail = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email, passw: password });
    if (!user) {
      res
        .status(203)
        .json({ message: "User not found", success: true, userexists: false });
    } else {

      const dp =
        process.env.URL + user.profilepic;
      const sessionId = generateSessionId()
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      res.status(200).json({
        message: "Account exists",
        access_token,
        sessionId,
        refresh_token,
        success: true,
        userexists: true,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Something went wrong...",
      success: false,
    });
  }
};

// refresh and access token generation
exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res
        .status(200)
        .json({ success: false, message: "Refresh token not provided" });
    }
    jwt.verify(
      refresh_token,
      process.env.MY_SECRET_KEY,
      async (err, payload) => {
        try {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid refresh token" });
          }
          const sessionId = payload.sessionId;
          const user = await User.findById(payload.id);
          // const dp = await generatePresignedUrl(
          //   "images",
          //   user.profilepic.toString(),
          //   60 * 60
          // );

          const dp =
            process.env.URL + user.profilepic;
          if (!user) {
            return res
              .status(400)
              .json({ success: false, message: "User not found" });
          }
          const data = {
            dp,
            fullname: user.fullname,
            username: user.username,
            id: user._id.toString(),
            sessionId,
          };
          const access_token = generateAccessToken(data);

          res.status(200).json({ success: true, access_token });
        } catch (err) {
          console.log(err);
          res.status(400).json({ success: true, access_token });
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Internal server error" });
  }
};


// all analytics of Dashboard
exports.analyticsuser = async (req, res) => {
  try {
    const { userid } = req.params;
    const user = await User.findById(userid);
    if (user) {
      // const find = await Analytics.findOne({ userid: user._id.toString() });

      const community = await Community.find({
        creator: user._id.toString(),
      }).populate("topics");

      const dps = await Promise.all(
        community.map(async (d) => {
          const a =
            process.env.URL + d?.dp;
          // const presignedUrl = await generatePresignedUrl(
          //   "images",
          //   dp,
          //   60 * 60
          // );

          return a;
        })
      );

      const commerged = community.map((f, i) => {
        const reversedStats = f?.stats.reverse().slice(0, 8)
        const locationToSend = Object.entries(f.location).map(([state, value]) => ({ state, value }));
        const loc = locationToSend.sort((a, b) => b.value - a.value).slice(0, 5);
        const actualloc = loc.map((d, i) => {
          return {
            state: d?.state,
            value: Math.round((d.value / f.memberscount) * 100)
          }
        })
        const obtainAgeArr = Object.entries(f.demographics.age).map(([age, value]) => ({ age, value }))
        const sendAge = obtainAgeArr.map((d, i) => {
          return {
            age: d.age,
            percent: Math.round((d.value / f.memberscount) * 100)
          }
        })

        return {
          name: f?.title,
          id: f?._id,
          image: dps[i],
          popularity: f?.popularity,
          topic: f?.topics,
          location: actualloc,
          stats: reversedStats,
          totalmembers: f?.memberscount,
          visitors: f?.visitors,
          paidmember: f?.paidmemberscount,
          agerange: sendAge
        };
      });
      const product = await Product.find({ creator: user._id.toString() }).sort({ itemsold: -1 }).limit(5)
      const productdps = await Promise.all(
        product.map(async (f) => {
          const dp =
            process.env.PRODUCT_URL + f?.images[0].content;

          return dp;
        })
      );

      const promerged = product.map((f, i) => {
        return { ...f.toObject(), dps: productdps[i] };
      });

      const pieChart = [{
        name: "sales",
        value: user.salesCount,
      },
      {
        name: "visitors",
        value: user.totalStoreVisit
      }]

      const storeLocationToSend = Object.entries(user.storeLocation).map(([state, value]) => ({ state, value }));
      const locstore = storeLocationToSend.sort((a, b) => b.value - a.value).slice(0, 5);

      const actualStoreLoc = locstore.map((d, i) => {
        return {
          state: d?.state,
          value: Math.round((d?.value / user.salesCount) * 100)
        }
      })

      const posts = await Post.find({ sender: user._id.toString() }).populate(
        "community",
        "title"
      );
      const postsdps = await Promise.all(
        posts.map(async (f) => {
          const dp =
            process.env.POST_URL + f?.post[0].content;
          // const dp = f?.post[0].content?.toString();
          // const presignedUrl = await generatePresignedUrl("posts", dp, 60 * 60);
          return dp;
        })
      );

      // engagement rate
      let eng = []
      await posts.map((p, i) => {
        let final = p.views <= 0 ? 0 : ((parseInt(p?.sharescount) + parseInt(p?.likes) + parseInt(p?.totalcomments)) / parseInt(p?.views)) * 100;
        eng.push(final)
      })

      const postmerged = posts.map((f, i) => {
        return {
          ...f.toObject(),
          dps: postsdps[i],
          engrate: eng[i]
        };
      });
      res
        .status(200)
        .json({ success: true, sales: user.storeStats, storeLocation: actualStoreLoc, pieChart, commerged, promerged, postmerged });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message, success: false });
  }
};

// middleware
exports.authenticateUser = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    const token = authorizationHeader && authorizationHeader.split(" ")[1];
    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Unauthorized: Access token not provided",
      });
    }
    const decodedToken = jwt.verify(token, process.env.MY_SECRET_KEY);
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res
        .status(500)
        .json({ success: false, message: "Unauthorized: User not found" });
    }
    req.user = { id: user._id, fullname: user.fullname };
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid access token" });
  }
};

// get all community
exports.allcoms = async (req, res) => {
  const { id } = req.params;
  try {
    const Co = await Community.find({ creator: id }).populate(
      "creator",
      "fullname"
    );
    const dps = [];
    let avgeng = [];
    for (let i = 0; i < Co.length; i++) {
      const abc =
        process.env.URL + Co[i].dp;
      // const a = await generatePresignedUrl(
      //   "images",
      //   Co[i].dp.toString(),
      //   60 * 60
      // );
      dps.push(abc);
    }
    const Com = Co.reverse();
    for (let i = 0; i < Co.length; i++) {
      const posts = await Post.find({ community: Co[i]._id });

      let eng = []
      await posts.map((p, i) => {
        let final = p.views <= 0 ? 0 : ((parseInt(p?.sharescount) + parseInt(p?.likes) + parseInt(p?.totalcomments)) / parseInt(p?.views)) * 100;
        eng.push(final)
      })
      console.log(eng, "eng")
      let sum = 0
      for (let i = 0; i < eng.length; i++) {
        sum += eng[i]
      }
      let avg = 0
      console.log(sum, "sum")
      if (eng.length > 0) {
        avg = Math.round(sum / eng.length)
      } else {
        avg = 0
      }
      avgeng.push(avg)
    }

    console.log(avgeng, "avgeng")

    dps.reverse();
    const dpdata = dps;
    const comData = Com;
    const avgEngData = avgeng
    const merged = dpdata.map((d, i) => ({
      dps: d,
      c: comData[i],
      avgeng: avgEngData[i]
    }));
    res.status(200).json({ merged, success: true });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.createcom = async (req, res) => {
  const { title, desc, topic, type, price, category, iddata } = req.body;
  const { userId } = req.params;
  const image = req.file;
  const uuidString = uuid();
  if (!image) {
    res.status(400).json({ message: "Please upload an image", success: false });
  } else if (iddata != undefined) {
    try {
      const user = await User.findById(userId);
      // const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      const result = await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: image.buffer,
          ContentType: image.mimetype,
        })
      );
      const community = new Community({
        title,
        creator: userId,
        dp: objectName,
        desc: desc,
        category: category,
      });
      const savedcom = await community.save();
      const topic1 = new Topic({
        title: "Posts",
        creator: userId,
        community: savedcom._id,
      });
      await topic1.save();

      const topic2 = new Topic({
        title: "All",
        creator: userId,
        community: savedcom._id,
      });
      await topic2.save();

      // const topic3 = new Topic({
      // 	title: topic,
      // 	creator: userId,
      // 	community: savedcom._id,
      // 	type: type,
      // 	price: price,
      // });
      // await topic3.save();

      await Community.updateOne(
        { _id: savedcom._id },
        {
          $push: { members: userId, admins: user._id },
          $inc: { memberscount: 1 },
        }
      );

      await Community.updateOne(
        { _id: savedcom._id },
        { $push: { topics: [topic1._id, topic2._id] } }
      );

      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            topicsjoined: [topic1._id, topic2._id],
            communityjoined: savedcom._id,
            communitycreated: savedcom._id,
          },
          $inc: { totaltopics: 3, totalcom: 1 },
        }
      );

      for (let i = 0; i < iddata.length; i++) {
        const topicIdToStore = mongoose.Types.ObjectId(iddata[i]);
        await Community.updateOne(
          { _id: savedcom._id },
          { $push: { topics: topicIdToStore } }
        );
        await User.findByIdAndUpdate(
          { _id: userId },
          { $push: { topicsjoined: topicIdToStore } }
        );
      }
      // await Community.updateMany(
      //   { _id: savedcom._id },
      //   {
      //     $push: { topics: [topic1._id, topic2._id, topic3._id] },
      //     $inc: { totaltopics: 1 },
      //   }
      // );

      // await Topic.updateOne(
      //   { _id: topic1._id },
      //   { $push: { members: user._id }, $inc: { memberscount: 1 } }
      // );
      // await Topic.updateOne(
      //   { _id: topic2._id },
      //   { $push: { members: user._id }, $inc: { memberscount: 1 } }
      // );
      // await Topic.updateOne(
      //   { _id: topic3._id },
      //   { $push: { members: user._id }, $inc: { memberscount: 1 } }
      // );
      // await Topic.updateOne(
      //   { _id: topic1._id },
      //   { $push: { notifications: user._id } }
      // );
      // await Topic.updateOne(
      //   { _id: topic2._id },
      //   { $push: { notifications: user._id } }
      // );
      // await Topic.updateOne(
      //   { _id: topic3._id },
      //   { $push: { notifications: user._id } }
      // );

      // await User.updateMany(
      //   { _id: userId },
      //   {
      //     $push: {
      //       topicsjoined: [topic1._id, topic2._id, topic3._id],
      //       communityjoined: savedcom._id,
      //     },
      //     $inc: { totaltopics: 3, totalcom: 1 },
      //   }
      // );
      res.status(200).json({ community: savedcom, success: true });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: e.message, success: false });
    }
  } else {
    try {
      console.log("first");
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      const result = await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: image.buffer,
          ContentType: image.mimetype,
        })
      );
      const community = new Community({
        title,
        creator: userId,
        dp: objectName,
        desc: desc,
        category: category,
      });
      const savedcom = await community.save();
      const topic1 = new Topic({
        title: "Posts",
        creator: userId,
        community: savedcom._id,
      });
      await topic1.save();
      const topic2 = new Topic({
        title: "All",
        creator: userId,
        community: savedcom._id,
      });
      await topic2.save();

      await Community.updateOne(
        { _id: savedcom._id },
        {
          $push: { members: userId, admins: user._id },
          $inc: { memberscount: 1 },
        }
      );
      await Community.updateMany(
        { _id: savedcom._id },
        { $push: { topics: [topic1._id, topic2._id] } }
      );

      await Topic.updateOne(
        { _id: topic1._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );
      await Topic.updateOne(
        { _id: topic2._id },
        { $push: { members: user._id }, $inc: { memberscount: 1 } }
      );
      await Topic.updateOne(
        { _id: topic1._id },
        { $push: { notifications: user._id } }
      );
      await Topic.updateOne(
        { _id: topic2._id },
        { $push: { notifications: user._id } }
      );

      await User.updateMany(
        { _id: userId },
        {
          $push: {
            topicsjoined: [topic1._id, topic2._id],
            communityjoined: savedcom._id,
          },
          $inc: { totaltopics: 2, totalcom: 1 },
        }
      );
      res.status(200).json({ community: savedcom, success: true });
    } catch (e) {
      res.status(400).json({ message: e.message, success: false });
    }
  }
};



exports.getposts = async (req, res) => {
  try {
    const { id, comid } = req.params;
    const com = await Community.findOne({
      creator: id.toString(),
      _id: comid,
    }).populate("posts");
    if (com && com.posts) {
      const postdetails = com.posts.map((post) => {
        return {
          post,
          // like comment share views already present on post itself
          community: com.title,
          engagementrate: (post.likes + post.views) / 100,
        };
      });
      res.status(200).json({ success: true, postdetails });
    } else {
      res.status(400).json({ success: false, message: "Not found" });
    }
  } catch (err) {
    res.status(400).json({ message: "Cant get following information" });
    console.log(err);
  }
};

// Store API =>
// store registration
exports.registerstore = async (req, res) => {

  try {
    const { userId } = req.params;
    console.log(userId, "id", typeof userId)
    console.log(req.body, "body")

    const {
      buildingno,
      postal,
      landmark,
      gst,
      businesscategory,
      documenttype,
      state,
      city,
    } = req.body;
    if (req.file == undefined) {
      return res.status(400).json({ message: "Please upload a document file" });
    }
    const uuidString = uuid();
    const bucketName = "products";
    const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;

    // await sharp(req.file.buffer)
    //   .jpeg({ quality: 50 })
    //   .toBuffer()
    //   .then(async (data) => {
    //     await minioClient.putObject(bucketName, objectName, data);
    //   })
    //   .catch((err) => {
    //     console.log(err.message, "-error");
    //   });

    const result = await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const user = await User.findById(userId);
    console.log(user, "user")
    let finaladdress;
    if (gst) {
      finaladdress = [{
        buildingno: buildingno,
        city: city,
        state: state,
        postal: postal,
        landmark: landmark,
        gst: gst,
        businesscategory: businesscategory,
        documenttype: documenttype.toString(),
        documentfile: objectName,
      }];
    } else {
      finaladdress = [{
        buildingno: buildingno,
        city: city,
        state: state,
        postal: postal,
        landmark: landmark,
        businesscategory: businesscategory,
        documenttype: documenttype.toString(),
        documentfile: objectName,
      }];
    }

    if (user) {
      user.storeAddress = finaladdress
      await user.save()
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "User Not Found" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

// create collection
exports.createCollection = async (req, res) => {
  try {
    const { name, category } = req.body;
    const { userId } = req.params;
    const user = await User.findById(userId)
    if (req.file) {
      const uuidString = uuid();
      // const bucketName = "products";
      const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
      console.log(objectName);
      // await sharp(req.file.buffer)
      //   .jpeg({ quality: 50 })
      //   .toBuffer()
      //   .then(async (data) => {
      //     await minioClient.putObject(bucketName, objectName, data);
      //   })
      //   .catch((err) => {
      //     console.log(err.message, "-error");
      //   });
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      user.foodLicense = objectName
    }
    const data = {
      name,
      category,
      creator: userId,
    }
    const newCol = new Collection(data);
    await newCol.save();
    // await User.updateOne(
    //   { _id: userId },
    //   { $push: { collectionss: newCol._id } }
    // );
    user.collectionss.push(newCol._id)
    await user.save()
    res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

// delete collection
exports.collectiondelete = async (req, res) => {
  try {
    const { userId, colid } = req.params;
    const collection = await Collection.findById(colid);
    const user = await User.findById(userId);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    } else {
      console.log(collection._id, user.collectionss);
      if (collection.creator.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You can't delete collections of other users" });
      } else {
        await Product.deleteMany({ _id: { $in: collection.products } });
        await User.updateOne(
          { _id: userId },
          { $pull: { collectionss: collection._id } }
        );
        await collection.deleteOne();
        res.status(200).json({ success: true });
      }
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

// fetch Products
exports.fetchProduct = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (user) {
      const collectionsToSend = [];

      for (const collectionId of user.collectionss) {
        const find = await Collection.findById(
          collectionId.toString()
        ).populate("products");

        if (find) {
          const dps = await Promise.all(
            find.products.map(async (product) => {
              const a =
                process.env.PRODUCT_URL + product.images[0].content;

              return a
            })
          );
          const productsWithDps = find.products.map((product, index) => {
            return {
              ...product.toObject(),
              dp: dps[index],
            };
          });
          collectionsToSend.push({
            ...find.toObject(),
            products: productsWithDps,
          });
        }
      }
      res.json({ collections: collectionsToSend, user, success: true });
    } else {
      res.json({ message: "User Not Found" });
    }
  } catch (err) {
    res.status(404).json({ message: err.message, success: false });
    console.log(err);
  }
};

// add a product
exports.createproduct = async (req, res) => {
  const { userId, colid } = req.params;
  const {
    name,
    brandname,
    desc,
    quantity,
    shippingcost,
    price,
    discountedprice,
    sellername,
    totalstars,
    weight,
    type,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(400).json({ message: "User not found", success: false });
  } else {
    if (req.files.length < 1) {
      res.status(400).json({ message: "Must have one image" });
    } else {
      try {
        let pos = [];

        for (let i = 0; i < req?.files?.length; i++) {
          const uuidString = uuid();
          const bucketName = "products";
          const objectName = `${Date.now()}_${uuidString}`;
          await s3.send(
            new PutObjectCommand({
              Bucket: PRODUCT_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
          pos.push({ content: objectName, type: req.files[i].mimetype });
        }


        const p = new Product({
          name,
          brandname,
          desc,
          creator: userId,
          quantity,
          shippingcost,
          price,
          discountedprice,
          sellername,
          totalstars,
          images: pos,
          weight,
          type,
        });
        const data = await p.save();

        const collection = await Collection.findById(colid);
        if (!collection) {
          return res
            .status(404)
            .json({ message: "Collection not found", success: false });
        }

        collection.products.push(data);
        const actualdata = await collection.save();

        res.status(200).json({ actualdata, success: true });
      } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message, success: false });
      }
    }
  }
};

//delete a product
exports.deleteproduct = async (req, res) => {
  const { userId, colid, productId } = req.params;
  try {
    const collection = await Collection.findById(colid)

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.creator.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can't delete products in this collection" });
    }

    const product = collection.products.find(
      (p) => p._id.toString() === productId
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in this collection" });
    }

    await Product.findByIdAndDelete(productId);

    collection.products = collection.products.filter(
      (p) => p._id.toString() !== productId
    );
    await collection.save();

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(400).json(e.message);
  }
};

// get a product
exports.getaproduct = async (req, res) => {
  const { id, productId } = req.params;
  const user = await User.findById(id);
  const product = await Product.findById(productId);
  try {
    if (!product) {
      res.status(404).json({ message: "Product not found", success: false });
    } else {
      const urls = [];
      let isreviewed = false;
      if (product.reviewed.includes(user?._id)) {
        isreviewed = true;
      }
      for (let i = 0; i < product.images.length; i++) {
        if (product.images[i] !== null) {
          const a =
            process.env.PRODUCT_URL + product.images[i].content
          // const a = await generatePresignedUrl(
          //   "products",
          //   product.images[i].content.toString(),
          //   60 * 60
          // );
          urls.push(a);
        }
      }
      res
        .status(200)
        .json({ data: { reviewed: isreviewed, product, urls, success: true } });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

// update product

// have to check again
exports.updateproduct = async (req, res) => {
  try {
    const { name, price, desc, discountedprice, quality, image } = req.body
    const { userId, colid, productId } = req.params;
    let imageArr
    if (typeof image == "string") {
      imageArr = [image];
    } else {
      imageArr = image
    }
    console.log(imageArr)
    let pos = [];
    let im = []
    for (let i = 0; i < imageArr.length; i++) {
      // const s = imageArr[i].split("?")[0].split("/").pop()
      const s = imageArr[i].split("/").pop()
      im.push(s)
    }
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req?.files?.length; i++) {
        const uuidString = uuid();

        const objectName = `${Date.now()}_${uuidString}`;
        const objectId = mongoose.Types.ObjectId();

        // if (req.files[i].fieldname === "video") {
        //   await minioClient.putObject(
        //     bucketName,
        //     objectName,
        //     req.files[i].buffer,
        //     req.files[i].size,
        //     req.files[i].mimetype
        //   );
        //   pos.push({ content: objectName, type: req.files[i].mimetype, _id: objectId });
        // } else {
        //   await sharp(req.files[i].buffer)
        //     .jpeg({ quality: 50 })
        //     .toBuffer()
        //     .then(async (data) => {
        //       await minioClient.putObject(bucketName, objectName, data);
        //     })
        //     .catch((err) => {
        //       console.log(err.message, "-error");
        //     });


        const result = await s3.send(
          new PutObjectCommand({
            Bucket: PRODUCT_BUCKET,
            Key: objectName,
            Body: req.files[i].buffer,
            ContentType: req.files[i].mimetype,
          })
        );

        pos.push({ content: objectName, type: req.files[i].mimetype, _id: objectId });
        // }
      }
    }
    const collection = await Collection.findById(colid);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can't update products in this collection" });
    }

    const productid = collection.products.find(
      (p) => p._id.toString() === productId
    );
    if (!productid) {
      res.status(404).json({ message: "Product not found", success: false });
    } else {

      const product = await Product.findById(productId)
      for (let i = 0; i < product.images.length; i++) {
        for (let j = 0; j < im.length; j++) {
          if (im[j] == product.images[i].content) {
            pos.push(product.images[i])
          }
        }
      }
      product.name = name
      product.price = price
      product.desc = desc
      product.discountedprice = discountedprice
      product.quality = quality
      product.images = pos

      console.log(pos)
      await product.save()
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: e.message, success: false });
  }
};
// orders
//fetch orders
exports.fetchallorders = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      const orders = await Order.find({ sellerId: user._id })
        .populate("productId")
        .populate("buyerId", "fullname")
        .limit(20);

      const pendingOrders = orders.filter(
        (order) => order.currentStatus === "pending"
      );
      const completedOrders = orders.filter(
        (order) => order.currentStatus === "completed"
      );
      const cancelled = orders.filter(
        (order) => order.currentStatus === "cancelled"
      );
      const returned = orders.filter(
        (order) => order.currentStatus === "returned"
      );
      const damaged = orders.filter(
        (order) => order.currentStatus === "damaged"
      );
      const allorders = orders.length;
      const customers = user?.customers?.length;

      let image = await Promise.all(
        orders.map(async (d, i) => {
          if (d?.productId?.length > 0) {
            const l = await Promise.all(
              d?.productId?.map(async (f, il) => {
                const a =
                  process.env.PRODUCT_URL + d?.productId[il]?.images[0]?.content;

                return a
                // generatePresignedUrl(
                //   "products",
                //   d?.productId[il]?.images[0]?.content?.toString(),
                //   60 * 60
                // );
              })
            );
            return l;
          } else {
            return null;
          }
        })
      );

      const mergedOrder = orders.map((d, i) => {
        return {
          ...d.toObject(), image: image[i]
        }
      })

      res.status(200).json({
        pendingOrders,
        completedOrders,
        allorders,
        cancelled,
        returned,
        damaged,
        customers,
        orders,
        mergedOrder,
      });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.profileinfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, username, bio, date } = req.body;
    const fun = async () => {
      const userChange = await User.findOne({
        username,
        phone,
        email,
        _id: { $ne: id },
      });
      if (userChange) {
        return res
          .status(400)
          .json({ message: "Cant Use this details", success: false });
      } else {
        const newUsername = username;
        const newPhone = phone;
        const newEmail = email;
        return [newUsername, newPhone, newEmail];
      }
    };
    const [newUsername, newPhone, newEmail] = await fun();
    const user = await User.findById(id);
    const uuidString = uuid();
    if (user) {
      if (req.file) {
        const bucketName = "images";
        const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
        // await sharp(req.file.buffer)
        //   .jpeg({ quality: 50 })
        //   .toBuffer()
        //   .then(async (data) => {
        //     await minioClient.putObject(bucketName, objectName, data);
        //   })
        //   .catch((err) => {
        //     console.log(err.message, "-Sharp error");
        //   });
        const result = await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        user.profilepic = objectName
      }
      user.fullname = name;
      user.phone = newPhone;
      user.email = newEmail;
      user.username = newUsername;
      user.desc = bio;
      user.DOB = date;
      await user.save();
      const sessionId = generateSessionId()
      const dp =
        process.env.URL + user.profilepic;
      // const dp = await generatePresignedUrl(
      //   "images",
      //   user.profilepic.toString(),
      //   60 * 60
      // );
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId
      };
      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)
      return res.status(200).json({ success: true, sessionId, refresh_token, access_token });
    } else {
      res.status(400).json({ message: "User Not Found", success: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// exports.profileStore = async (req, res) => {
//   console.log(req.body);
//   try {
//     const { id } = req.params;
//     const { storeAddress, city, landmark, state, postalCode } = req.body;

//     const user = await User.findById(id);
//     if (user) {
//       user.storeAddress[0].buildingno = storeAddress;
//       user.storeAddress[0].state = state;
//       user.storeAddress[0].postal = postalCode;
//       user.storeAddress[0].city = city;
//       user.storeAddress[0].landmark = landmark;
//       await user.save();
//       const sessionId = generateSessionId();
//       const dp = await generatePresignedUrl(
//         "images",
//         user.profilepic.toString(),
//         60 * 60
//       );
//       const data = {
//         dp,
//         fullname: user.fullname,
//         username: user.username,
//         id: user._id.toString(),
//         sessionId
//       };
//       const access_token = generateAccessToken(data)
//       return res.status(200).json({ success: true, sessionId, access_token });
//     } else {
//       res.status(400).json({ message: "User Not Found", success: false });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.getprofileinfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      // const dp = await generatePresignedUrl(
      //   "images",
      //   user.profilepic.toString(),
      //   60 * 60
      // );
      const dp =
        process.env.URL + user.profilepic;
      const data = {
        name: user?.fullname,
        email: user?.email,
        phone: user?.phone,
        username: user?.username,
        // storeAddress: user?.storeAddress[0]?.buildingno,
        // city: user?.storeAddress[0]?.city,
        // state: user?.storeAddress[0]?.state,
        // postalCode: user?.storeAddress[0]?.postal,
        // landmark: user?.storeAddress[0]?.landmark,
        image: dp,
        date: user.DOB,
        bio: user.desc
      };
      res.status(200).json({ success: true, data });
    } else {
      res.status(400).json({ success: false, message: "User Not Found" });
    }
  } catch (err) {
    res.status(400).json({ message: "Internal Server Error" });
    console.log(err);
  }
};

// create topic
exports.createtopic = async (req, res) => {
  const { title, message, type, price, comid } = req.body;
  const { userId } = req.params;
  try {
    const topic = new Topic({
      title: title,
      creator: userId,
      message: message,
      type: type,
      price: price,
    });

    await topic.save();

    await Topic.updateOne(
      { _id: topic._id },
      { $push: { members: userId }, $inc: { memberscount: 1 } }
    );
    // await Community.updateOne(
    //   { _id: comId },
    //   {
    //     $push: { topics: topic._id },
    //     $inc: { totaltopics: 1 },
    //   }
    // );
    await User.updateOne(
      { _id: userId },
      { $push: { topicsjoined: topic._id }, $inc: { totaltopics: 1 } }
    );

    if (comid) {
      await Community.findByIdAndUpdate(
        { _id: comid },
        { $push: { topics: topic._id } }
      );
    }
    res.status(200).json({ topic, success: true });
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

// fetchTopic
exports.fetchtopic = async (req, res) => {
  try {
    const { id, comId } = req.params;
    const community = await Community.findById(comId).populate("topics");
    if (!community) {
      res.json({ message: "Community Not Found" });
    } else {
      res.json({ topics: community.topics, success: true });
    }
  } catch (err) {
    res.status(400).json({ message: err.message, success: false });
    console.log(err);
  }
};

//Delete Topic
exports.deletetopic = async (req, res) => {
  const { topicId, userId } = req.params;
  console.log(topicId, "topicid");
  const { idtosend } = req.body;

  console.log(req.body, idtosend, "id");
  const topic = await Topic.findById(topicId);
  try {
    if (!topicId) {
      res.status(400).json({ message: "No topic found", success: false });
    } else if (topic.creator.toString() != userId.toString()) {
      res
        .status(400)
        .json({ message: "Not Authorized - You can't delete others topic" });
    } else {
      await Topic.findByIdAndDelete(topicId);
      console.log("1");
      if (idtosend) {
        console.log("2");
        await Community.findByIdAndUpdate(
          { _id: idtosend },
          { $pull: { topics: topicId } },
          { new: true }
        );
      }
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message });
  }
};

// edit topic
exports.edittopic = async (req, res) => {
  try {
    const { id, topicid } = req.params;
    const topic = await Topic.findById(topicid);
    if (!topic) {
      res.status(400).json({ message: "No topic found", success: false });
    } else if (topic.creator.toString() != id) {
      res
        .status(400)
        .json({ message: "Not Authorized - You can't edit others topic" });
    } else {
      const updatedTopic = await Topic.findOneAndUpdate(
        { _id: topicid },
        req.body,
        { new: true }
      );
      res.status(200).json({ updatedTopic, success: true });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", success: false });
    console.log(err);
  }
};

exports.updatecommunity = async (req, res) => {
  const { comId, userId } = req.params;
  const { category, title, desc, topicId, message, price, topicname, type } =
    req.body;
  const uuidString = uuid();
  try {
    const user = await User.findById(userId);
    const com = await Community.findById(comId);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else if (!com) {
      res.status(404).json({ message: "Community not found", success: false });
    } else {
      if (req.file) {
        const bucketName = "images";
        const objectName = `${Date.now()}${uuidString}${req.file.originalname
          } `;
        a1 = objectName;
        a2 = req.file.mimetype;

        // await sharp(req.file.buffer)
        //   .jpeg({ quality: 50 })
        //   .toBuffer()
        //   .then(async (data) => {
        //     await minioClient.putObject(bucketName, objectName, data);
        //   })
        //   .catch((err) => {
        //     console.log(err.message, "-error");
        //   });
        const result = await s3.send(
          new PutObjectCommand({
            Bucket: POST_BUCKET,
            Key: objectName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        await Community.updateOne(
          { _id: com._id },
          {
            $set: {
              category: category,
              title: title,
              desc: desc,
              dp: objectName,
            },
          }
        );
      }
      const commun = await Community.findByIdAndUpdate(
        { _id: com._id },
        {
          $set: { category: category, title: title, desc: desc },
        },
        {
          new: true,
        }
      );

      if (topicname) {
        await Topic.updateOne(
          { _id: topicId },
          {
            $set: {
              title: topicname,
              message: message,
              price: price,
              type: type,
            },
          }
        );
      }
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.checkStore = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      const store = user.storeAddress.length;
      const foodlic = user.foodLicense
      const foodLicenceExist = foodlic ? true : false
      if (store > 0) {
        return res.status(200).json({ exist: true, q: "collection", foodLicenceExist });
      } else {
        return res.status(200).json({ exist: false, q: "store", foodLicenceExist });
      }
    } else {
      return res.status(400).json({ message: "User Not Found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.earnings = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }
    const earningStats = {
      earnings: user.moneyearned,
      pendingpayments: user.pendingpayments,
      bank: user.bank
    }
    res.status(200).json({ success: true, earningStats })
  } catch (err) {
    console.log(err);
  }
};

exports.deletecom = async (req, res) => {
  const { comid } = req.params;
  try {
    const find = await Community.findByIdAndDelete(comid);
    if (!find) {
      res.status(404).json({ message: "not found", success: false });
    } else {
      res
        .status(200)
        .json({ success: true, message: "Community Successfully Deleted" });
    }
  } catch (e) {
    res.status(500).json({ message: e.message, success: false });
  }
};

exports.membershipbuy = async (req, res) => {
  try {
    const { amount } = req.body
    const { id, memid } = req.params
    const user = await User.findById(id)
    const membership = await Membership.findById(memid)
    const newamount = amount.split("₹")[1]
    const parseAmout = Number(newamount)

    if (!user) {
      return res.status(400).json({ success: false, message: "User Not Found" })
    }
    let oi = Math.floor(Math.random() * 9000000) + 1000000
    const subs = new Subscriptions({
      memid,
      validity: Date.now(),
      paymentMode: 'UPI',
      orderId: oi,
      purchasedby: id, amount: parseAmout
    })
    await subs.save()
    // / creatign a rzp order

    instance.orders.create(
      {
        amount: parseAmout * 100,
        currency: "INR",
        receipt: `receipt-mem#${oi}`,
        notes: {
          oi,
          id,
          memid,
          amount: parseAmout,
        },
      },
      function (err, order) {
        console.log(err, order);
        if (err) {
          res.status(400).json({ err, success: false });
        } else {
          res.status(200).json({
            oid: order.id,
            order: oi,
            orderCreated: order,
            phone: user?.phone,
            email: user?.email,
            success: true,
          });
        }
      }
    );
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message, success: false });
  }
}

exports.memfinalize = async (req, res) => {
  try {
    const { id, orderId } = req.params
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, status, paymentMethod } = req.body
    const user = await User.findById(id)
    const subscription = await Subscriptions.findOne({ orderId: orderId })
    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      "bxyQhbzS0bHNBnalbBg9QTDo"
    );
    if (!subscription) {
      return res.status(400).json({ success: false })
    }
    console.log(paymentMethod)
    if (isValid) {
      if (status) {
        subscription.currentStatus = "completed"
      }
    }
    else {
      if (status == false) {
        subscription.currentStatus = "failed"
      }
    }
    subscription.paymentMode = paymentMethod
    const newSub = await subscription.save()
    user.activeSubscription.push(newSub._id)
    await user.save()
    res.status(200).json({ success: true })
  } catch (error) {
    console.log(error)
  }
}

exports.addbank = async (req, res) => {
  try {
    const { id } = req.params
    const { bankname, branchname, accountno, IFSCcode } = req.body
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ success: false, message: "User Not Found" })
    }
    user.bank.bankname = bankname
    user.bank.branchname = branchname
    user.bank.accountno = accountno
    user.bank.IFSCcode = IFSCcode
    const newuser = await user.save()

    res.status(200).json({ success: true, bank: newuser.bank })
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
}
