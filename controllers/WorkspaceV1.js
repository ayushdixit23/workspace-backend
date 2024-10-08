const Minio = require("minio");
const aesjs = require("aes-js");
const User = require("../models/userAuth");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const Topic = require("../models/topic");
const Delivery = require("../models/deliveries")
// const Analytics = require("../models/Analytics");
const Transaction = require("../models/AdTransactions");
const Community = require("../models/community");
const geolib = require("geolib");
const uuid = require("uuid").v4;
const Post = require("../models/post");
require("dotenv").config();
const Collection = require("../models/Collectionss");
const sha256 = require("sha256")
const Font = require("../models/Font");
const Buttonss = require("../models/buttonScema");
const Deluser = require("../models/deluser");
const Product = require("../models/product");
const moment = require("moment");
const Order = require("../models/orders");
const mongoose = require("mongoose");
const Subscriptions = require("../models/Subscriptions");
const SellerOrder = require("../models/SellerOrder");
const WithDrawRequest = require("../models/WithdrawRequest")
const Razorpay = require("razorpay");
const Admin = require("../models/admin")
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const Tag = require("../models/Tag");
const Interest = require("../models/Interest");
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

const {
  validatePaymentVerification,
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const Membership = require("../models/membership");
const Error = require("../models/Error");
const Montenziation = require("../models/Montenziation");
const Request = require("../models/Request");
const Analytics = require("../models/Analytics");
const Approvals = require("../models/Approvals");
const Advertiser = require("../models/Advertiser");
const { default: axios } = require("axios");
const WithdrawRequest = require("../models/WithdrawRequest");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const admin = require("../fireb")

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// const instance = new Razorpay({
//   "key_id": "rzp_test_jXDMq8a2wN26Ss",
//   "key_secret": "bxyQhbzS0bHNBnalbBg9QTDo"
// });

function generateAccessToken(data) {
  const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "5d",
  });
  return access_token;
}
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

    const memberships = await Membership.findById(user.memberships.membership);
    console.log(memberships);
    if (user) {
      const dp = process.env.URL + user.profilepic;
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),

        memberships: memberships.title,
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);

      res.status(200).json({
        dp,
        access_token,
        refresh_token,
        data,
        success: true,
      });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (err) {
    res.status(400).json({ message: "Something Went Wrong", success: false });
  }
};

exports.fetchwithid = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    const memberships = await Membership.findById(user.memberships.membership);
    const sessionId = generateSessionId();
    const dp = process.env.URL + user.profilepic;
    const data = {
      dp,
      fullname: user.fullname,
      username: user.username,
      id: user._id.toString(),
      sessionId,
      memberships: memberships.title,
    };
    console.log(data);
    const access_token = generateAccessToken(data);
    const refresh_token = generateRefreshToken(data);
    res.status(200).json({
      dp,
      access_token,
      refresh_token,
      data,
      sessionId,
      success: true,
      user,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong", success: false });
  }
};

exports.checkqr = async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    const memberships = await Membership.findById(user.memberships.membership);
    if (user) {
      const sessionId = generateSessionId();
      const dp = process.env.URL + user.profilepic;
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId,
        memberships: memberships.title,
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      return res
        .status(200)
        .json({ dp, access_token, refresh_token, data, sessionId, success: true });
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
  const passw = await encryptaes(password);
  try {
    const user = await User.findOne({ email: email, passw: passw });
    if (!user) {
      return res
        .status(203)
        .json({ message: "User not found", success: false, userexists: false });
    } else {
      const memberships = await Membership.findById(
        user.memberships.membership
      );
      const dp = process.env.URL + user.profilepic;
      const sessionId = generateSessionId();
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        sessionId,
        memberships: memberships.title,
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      res.status(200).json({
        message: "Account exists",
        access_token,
        sessionId,
        refresh_token,
        data,
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

          const user = await User.findById(payload.id);
          const memberships = await Membership.findById(
            user.memberships.membership
          );

          const dp = process.env.URL + user.profilepic;
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

            memberships: memberships.title,
          };


          const access_token = generateAccessToken(data);
          const refresh_token = generateRefreshToken(data);

          res.status(200).json({ success: true, access_token, refresh_token });
        } catch (err) {
          res.status(400).json({ success: false });
        }
      }
    );
  } catch (err) {
    res.status(400).json({ success: false, message: "Internal server error" });
  }
};

// all analytics of Dashboard
exports.analyticsuser = async (req, res) => {
  try {
    const { userid } = req.params;
    const user = await User.findById(userid);
    if (user) {
      const community = await Community.find({
        type: "public",
        creator: user._id.toString()
      })
        .populate("topics")
        .lean();

      const dps = await Promise.all(
        community.map(async (d) => {
          const a = process.env.URL + d?.dp;
          return a;
        })
      );

      const storeAnalytics = await Analytics.find({ id: userid })
        .sort({ date: -1 })
        .limit(7);
      const sales = storeAnalytics.map((d) => {
        return {
          Dates: d?.date,
          Sales: d?.Sales,
        };
      });

      let avgeng = [];

      for (let i = 0; i < community.length; i++) {
        const posts = await Post.find({ community: community[i]._id });

        let eng = [];
        await posts.map((p, i) => {
          let final =
            p.views <= 0
              ? 0
              : // (parseInt(p?.sharescount)
              (+parseInt(p?.likes) /
                //  parseInt(p?.totalcomments))
                parseInt(p?.views)) *
              100;
          eng.push(final);
        });

        let sum = 0;
        for (let i = 0; i < eng.length; i++) {
          sum += eng[i];
        }
        let avg = 0;

        if (eng.length > 0) {
          avg = Math.round(sum / eng.length);
        } else {
          avg = 0;
        }
        avgeng.push(avg);
      }
      const endDate = new Date();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const commerged = await Promise.all(
        community.map(async (f, i) => {
          try {
            const anycom = await Analytics.find({
              id: f?._id,
            })
              .sort({ creation: -1 })
              .limit(7);

            const reversedStats = anycom.map((e) => ({
              X: e?.date,
              Y1: e?.Y1,
              Y2: e?.Y2,
              Y3: e?.Y3,
              creation: e?.creation,
              activemembers: e?.activemembers.length || 0,
              newmembers: e?.newmembers.length || 0,
              paidmembers: e?.paidmembers.length || 0,
              newvisitor: e?.newvisitor.length || 0,
              returningvisitor: e?.returningvisitor.length || 0,
            }));

            const locationToSend = Object.entries(f.location).map(
              ([state, value]) => ({
                state,
                value,
              })
            );
            const loc = locationToSend
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            const actualloc = loc.map((d) => ({
              state: d?.state,
              value: Math.round((d.value / f.memberscount) * 100),
            }));

            const obtainAgeArr = Object.entries(f.demographics.age).map(
              ([age, value]) => ({
                age,
                value,
              })
            );

            const sendAge = obtainAgeArr.map((d) => ({
              age: d.age,
              percent: Math.round((d.value / f.memberscount) * 100),
            }));

            return {
              name: f?.title,
              id: f?._id,
              image: dps[i],
              popularity: avgeng[i],
              topic: f?.topics,
              stats: reversedStats,
              location: actualloc,
              totalmembers: f?.memberscount,
              // returningvisitor: f?.returningvisitor,
              // newvisitor: f?.newvisitor,
              // uniquemembers: f?.uniquemembers,
              // activemembers: f?.activemembers,
              // visitors: f?.visitors,
              paidmember: f?.paidmemberscount,
              agerange: sendAge,
            };
          } catch (error) {
            console.error(`Error processing community ${f?._id}: ${error}`);
            // You can decide whether to return a default/fallback value or rethrow the error
            throw error;
          }
        })
      );

      const product = await Product.find({ creator: user._id.toString() })
        .sort({ itemsold: -1 })
        .limit(5);
      const productdps = await Promise.all(
        product.map(async (f) => {
          let dp;
          if (f.isvariant) {
            dp = process.env.PRODUCT_URL + f?.variants[0]?.category[0]?.content;
          } else {
            dp = process.env.PRODUCT_URL + f?.images[0]?.content;
          }

          return dp;
        })
      );

      const promerged = product.map((f, i) => {
        return { ...f.toObject(), dps: productdps[i] };
      });

      const pieChart = [
        {
          name: "sales",
          value: user.salesCount,
        },
        {
          name: "visitors",
          value: user.totalStoreVisit,
        },
      ];

      const storeLocationToSend = Object.entries(user.storeLocation).map(
        ([state, value]) => ({ state, value })
      );
      const locstore = storeLocationToSend
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const actualStoreLoc = locstore.map((d, i) => {
        return {
          state: d?.state,
          value: Math.round((d?.value / user.salesCount) * 100),
        };
      });

      // const posts = await Post.find({ sender: user._id.toString() }).populate(
      //   "community",
      //   "title"
      // );


      const publicCommunityIds = community.map(com => com._id);

      // Fetch posts from public communities created by the user
      const posts = await Post.find({
        sender: user._id.toString(),
        community: { $in: publicCommunityIds }
      }).populate("community", "title");



      let dp;
      let video;
      const postsdps = await Promise.all(
        posts.map(async (f) => {
          if (f?.post.length === 0) {
            console.log("first", f?.title);
            return null;
          }
          if (f?.post[0].type.startsWith("video")) {
            if (!f?.post[0].thumbnail) {
              dp = process.env.POST_URL + f?.post[0]?.content;
              video = true;
            } else {
              dp = process.env.POST_URL + f?.post[0]?.thumbnail;
              video = false;
            }
          } else {
            dp = process.env.POST_URL + f?.post[0]?.content;
            video = false;
          }

          return { dp, video };
        })
      );

      // engagement rate
      let eng = [];
      await posts.map((p, i) => {
        let final =
          p.views <= 0 ? 0 : (parseInt(p?.likes) / parseInt(p?.views)) * 100;
        eng.push(final);
      });

      const postmerged = posts.map((f, i) => {
        return {
          ...f.toObject(),
          dps: postsdps[i]?.dp,
          engrate: eng[i],
          video: postsdps[i]?.video,
        };
      });

      res.status(200).json({
        success: true,
        sales,
        storeLocation: actualStoreLoc,
        pieChart,
        posts: posts.length,
        commerged,
        promerged,
        postmerged,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message, success: false });
  }
};

exports.analyticsuserThirtyDays = async (req, res) => {
  try {
    const { userid } = req.params;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const user = await User.findById(userid);
    if (user) {
      const community = await Community.find({
        type: "public",
        creator: user._id.toString()
      })
        .populate("topics")
        .lean();

      const dps = await Promise.all(
        community.map(async (d) => {
          const a = process.env.URL + d?.dp;
          return a;
        })
      );

      const storeAnalytics = await Analytics.find({ id: userid })
        .sort({ date: -1 })
        .limit(7);
      const sales = storeAnalytics.map((d) => {
        return {
          Dates: d?.date,
          Sales: d?.Sales,
        };
      });

      let avgeng = [];

      for (let i = 0; i < community.length; i++) {
        const posts = await Post.find({ community: community[i]._id });

        let eng = [];
        await posts.map((p, i) => {
          let final =
            p.views <= 0
              ? 0
              : // (parseInt(p?.sharescount)
              (+parseInt(p?.likes) /
                //  parseInt(p?.totalcomments))
                parseInt(p?.views)) *
              100;
          eng.push(final);
        });

        let sum = 0;
        for (let i = 0; i < eng.length; i++) {
          sum += eng[i];
        }
        let avg = 0;

        if (eng.length > 0) {
          avg = Math.round(sum / eng.length);
        } else {
          avg = 0;
        }
        avgeng.push(avg);
      }
      const commerged = await Promise.all(
        community.map(async (f, i) => {
          try {
            const anycom = await Analytics.find({
              id: f?._id,
            })
              .sort({ creation: -1 })
              .limit(30);

            const reversedStats = anycom.map((e) => ({
              X: e?.date,
              Y1: e?.Y1,
              Y2: e?.Y2,
              Y3: e?.Y3,
              creation: e?.creation,
              activemembers: e?.activemembers.length || 0,
              newmembers: e?.newmembers.length || 0,
              paidmembers: e?.paidmembers.length || 0,
              newvisitor: e?.newvisitor.length || 0,
              returningvisitor: e?.returningvisitor.length || 0,
            }));

            const locationToSend = Object.entries(f.location).map(
              ([state, value]) => ({
                state,
                value,
              })
            );
            const loc = locationToSend
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            const actualloc = loc.map((d) => ({
              state: d?.state,
              value: Math.round((d.value / f.memberscount) * 100),
            }));

            const obtainAgeArr = Object.entries(f.demographics.age).map(
              ([age, value]) => ({
                age,
                value,
              })
            );

            const sendAge = obtainAgeArr.map((d) => ({
              age: d.age,
              percent: Math.round((d.value / f.memberscount) * 100),
            }));

            return {
              name: f?.title,
              id: f?._id,
              image: dps[i],
              popularity: avgeng[i],
              topic: f?.topics,
              stats: reversedStats,
              location: actualloc,
              totalmembers: f?.memberscount,
              // returningvisitor: f?.returningvisitor,
              // newvisitor: f?.newvisitor,
              // uniquemembers: f?.uniquemembers,
              // activemembers: f?.activemembers,
              // visitors: f?.visitors,
              paidmember: f?.paidmemberscount,
              agerange: sendAge,
            };
          } catch (error) {
            console.error(`Error processing community ${f?._id}: ${error}`);
            // You can decide whether to return a default/fallback value or rethrow the error
            throw error;
          }
        })
      );

      const product = await Product.find({ creator: user._id.toString() })
        .sort({ itemsold: -1 })
        .limit(5);
      const productdps = await Promise.all(
        product.map(async (f) => {
          let dp;
          if (f.isvariant) {
            dp = process.env.PRODUCT_URL + f?.variants[0]?.category[0]?.content;
          } else {
            dp = process.env.PRODUCT_URL + f?.images[0]?.content;
          }

          return dp;
        })
      );

      const promerged = product.map((f, i) => {
        return { ...f.toObject(), dps: productdps[i] };
      });

      const pieChart = [
        {
          name: "sales",
          value: user.salesCount,
        },
        {
          name: "visitors",
          value: user.totalStoreVisit,
        },
      ];

      const storeLocationToSend = Object.entries(user.storeLocation).map(
        ([state, value]) => ({ state, value })
      );
      const locstore = storeLocationToSend
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const actualStoreLoc = locstore.map((d, i) => {
        return {
          state: d?.state,
          value: Math.round((d?.value / user.salesCount) * 100),
        };
      });

      // const posts = await Post.find({ sender: user._id.toString() }).populate(
      //   "community",
      //   "title"
      // );

      const publicCommunityIds = community.map(com => com._id);

      // Fetch posts from public communities created by the user
      const posts = await Post.find({
        sender: user._id.toString(),
        community: { $in: publicCommunityIds }
      }).populate("community", "title");


      let dp;
      let video;
      const postsdps = await Promise.all(
        posts.map(async (f) => {
          if (f?.post.length === 0) {
            console.log("first", f?.title);
            return null;
          }
          if (f?.post[0].type.startsWith("video")) {
            if (!f?.post[0].thumbnail) {
              dp = process.env.POST_URL + f?.post[0]?.content;
              video = true;
            } else {
              dp = process.env.POST_URL + f?.post[0]?.thumbnail;
              video = false;
            }
          } else {
            dp = process.env.POST_URL + f?.post[0]?.content;
            video = false;
          }

          return { dp, video };
        })
      );

      // engagement rate
      let eng = [];
      await posts.map((p, i) => {
        let final =
          p.views <= 0 ? 0 : (parseInt(p?.likes) / parseInt(p?.views)) * 100;
        eng.push(final);
      });

      const postmerged = posts.map((f, i) => {
        return {
          ...f.toObject(),
          dps: postsdps[i]?.dp,
          engrate: eng[i],
          video: postsdps[i]?.video,
        };
      });

      res.status(200).json({
        success: true,
        sales,
        storeLocation: actualStoreLoc,
        pieChart,
        posts: posts.length,
        commerged,
        promerged,
        postmerged,
      });
    }
  } catch (err) {
    res.status(400).json({ message: err.message, success: false });
  }
};

exports.checkfordefault = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate({
      path: 'recentProsites.fonts.id',
      model: 'Font'
    }).populate({
      path: 'recentProsites.button.id',
      model: 'Buttonss'
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found!" });
    }
    res
      .status(200)
      .json({ success: true, useDefaultProsite: user.useDefaultProsite, recentProsites: user.recentProsites });
  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false, message: error.message });
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
    const topicPost = [];
    let avgeng = [];
    for (let i = 0; i < Co.length; i++) {
      const topic = await Topic.findOne({
        community: Co[i]._id,
        title: "Posts",
      });
      const topicId = { topicid: topic._id };
      topicPost.push(topicId);
      const abc = process.env.URL + Co[i].dp;
      dps.push(abc);
    }

    const Com = Co.reverse();
    for (let i = 0; i < Co.length; i++) {
      const posts = await Post.find({ community: Co[i]._id });

      let eng = [];
      await posts.map((p, i) => {
        let final =
          p.views <= 0 ? 0 : (parseInt(p?.likes) / parseInt(p?.views)) * 100;
        eng.push(final);
      });

      let sum = 0;
      for (let i = 0; i < eng.length; i++) {
        sum += eng[i];
      }
      let avg = 0;

      if (eng.length > 0) {
        avg = Math.round(sum / eng.length);
      } else {
        avg = 0;
      }
      avgeng.push(avg);
    }
    dps.reverse();
    const topicPosts = topicPost.reverse();
    const dpdata = dps;
    const comData = Com;
    const avgEngData = avgeng;
    const merged = dpdata.map((d, i) => ({
      dps: d,
      topicId: topicPosts[i],
      c: comData[i],
      avgeng: avgEngData[i],
    }));
    console.log(dps);
    res.status(200).json({ merged, success: true });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.createcom = async (req, res) => {
  const { title, desc, type, category, iddata } = req.body;
  const { userId } = req.params;
  const image = req.file;
  console.log(type, "type");
  const uuidString = uuid();
  if (req.canCreateCommunity) {
    if (!image) {
      res
        .status(400)
        .json({ message: "Please upload an image", success: false });
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
          type: type,
        });
        const savedcom = await community.save();
        const topic1 = new Topic({
          title: "Posts",
          creator: userId,
          community: savedcom._id,
          nature: "post",
        });
        await topic1.save();

        const topic2 = new Topic({
          title: "All",
          creator: userId,
          community: savedcom._id,
          nature: "chat",
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
          type: type,
          category: category,
        });
        const savedcom = await community.save();
        const topic1 = new Topic({
          title: "Posts",
          creator: userId,
          community: savedcom._id,
          nature: "post",
        });
        await topic1.save();

        const topic2 = new Topic({
          title: "All",
          creator: userId,
          community: savedcom._id,
          nature: "chat",
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
              communitycreated: savedcom._id,
            },
            $inc: { totaltopics: 2, totalcom: 1 },
          }
        );
        res.status(200).json({ community: savedcom, success: true });
      } catch (e) {
        res.status(400).json({ message: e.message, success: false });
      }
    }
  } else {
    res
      .status(203)
      .json({ success: false, message: "Max Community Limit Exceeded" });
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
  }
};

exports.getallposts = async (req, res) => {
  try {
    const { comid } = req.params;
    const community = await Community.findById(comid).populate("posts");
    if (!community) {
      return res
        .status(400)
        .json({ success: false, message: "No Results Found" });
    }
    let postsArr = [];
    for (let i = 0; i < community.posts.length; i++) {
      const postId = community.posts[i];
      const post = await Post.findById(postId);
      if (post.kind !== "poll" || post.kind !== "product") {
        let final =
          post.views <= 0
            ? 0
            : (parseInt(post?.likes) / parseInt(post?.views)) * 100;

        let postdp;
        let video;
        let content;
        let thumbnail;
        if (post.post.length === 0) {
          postdp = null;
        } else {
          if (post.post[0].type.startsWith("video")) {
            if (!post.post[0].thumbnail) {
              postdp = process.env.POST_URL + post.post[0]?.content;
              thumbnail = process.env.POST_URL + post.post[0]?.thumbnail;
              video = true;
            } else {
              postdp = process.env.POST_URL + post.post[0]?.thumbnail;
              content = process.env.POST_URL + post.post[0]?.content;
              video = false;
            }
          } else {
            postdp = process.env.POST_URL + post.post[0]?.content;
            video = false;
          }
        }
        const postswithdp = {
          post,
          postdp,
          engrate: Math.round(final),
          video,
          content,
        };
        postsArr.push(postswithdp);
      } else {
        if (post.kind === "product") {
          let final =
            post.views <= 0
              ? 0
              : (parseInt(post?.likes) / parseInt(post?.views)) * 100;

          let postdp;
          let video;
          let content;
          let thumbnail;
          if (post.post.length === 0) {
            postdp = null;
          } else {
            if (post.post[0].type.startsWith("video")) {
              if (!post.post[0].thumbnail) {
                postdp = process.env.PRODUCT_URL + post.post[0]?.content;
                thumbnail = process.env.PRODUCT_URL + post.post[0]?.thumbnail;
                video = true;
              } else {
                postdp = process.env.PRODUCT_URL + post.post[0]?.thumbnail;
                content = process.env.PRODUCT_URL + post.post[0]?.content;
                video = false;
              }
            } else {
              postdp = process.env.PRODUCT_URL + post.post[0]?.content;
              video = false;
            }
          }
          const postswithdp = {
            post,
            postdp,
            engrate: Math.round(final),
            video,
            content,
          };
          postsArr.push(postswithdp);
        }
      }
    }

    const posts = postsArr.reverse();
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message, success: false });
  }
};

// Store API =>
// store registration
exports.registerstore = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      buildingno,
      postal,
      landmark,
      gst,
      businesscategory,
      documenttype,
      state,
      city,
      latitude,
      longitude,
      altitude,
      accuracy,
    } = req.body;
    if (req.file == undefined) {
      return res.status(400).json({ message: "Please upload a document file" });
    }
    const uuidString = uuid();
    const bucketName = "products";
    const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
    const result = await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const user = await User.findById(userId);

    let finaladdress;
    if (gst) {
      finaladdress = [
        {
          buildingno: buildingno,
          city: city,
          state: state,
          postal: postal,
          landmark: landmark,
          gst: gst,
          businesscategory: businesscategory,
          documenttype: documenttype.toString(),
          documentfile: objectName,
          coordinates: {
            latitude,
            longitude,
            accuracy,
          },
        },
      ];
    } else {
      finaladdress = [
        {
          buildingno: buildingno,
          city: city,
          state: state,
          postal: postal,
          landmark: landmark,
          businesscategory: businesscategory,
          documenttype: documenttype.toString(),
          documentfile: objectName,
          coordinates: {
            latitude,
            longitude,
            accuracy,
          },
        },
      ];
    }

    const data = [];
    const community = await Community.find({ creator: user._id });

    for (let i = 0; i < community.length; i++) {
      const post = await Post.find({ community: community[i]._id });
      data.push({
        community: community[i].title,
        posts: post.length,
      });
    }

    const checkUserv = () => data.some((d) => d.community && d.posts > 0);
    const validToCreateStore = checkUserv();

    console.log(finaladdress, "checking");

    if (user) {
      if (validToCreateStore) {
        user.storeAddress = finaladdress;

        let request = await Request.findOne({ userid: userId });

        if (!request) {
          request = new Request({
            userid: userId,
            type: "store",
            storeDetails: {
              buildingno: buildingno,
              city: city,
              state: state,
              postal: postal,
              landmark: landmark,
              gst: gst ? gst : null,
              businesscategory: businesscategory,
              documenttype: documenttype.toString(),
              documentfile: objectName,
            },
          });
          await request.save();
        }

        request.type = "store";
        request.storeDetails = {
          buildingno: buildingno,
          city: city,
          state: state,
          postal: postal,
          landmark: landmark,
          gst: gst ? gst : null,
          businesscategory: businesscategory,
          documenttype: documenttype.toString(),
          documentfile: objectName,
        };

        await request.save();

        user.isStoreVerified = false;
        await user.save();
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({
          success: false,
          message: "Not Eligable to Create Store Now!",
        });
      }
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
    const user = await User.findById(userId);
    if (req.canCreateCollection) {
      if (req.file) {
        const uuidString = uuid();
        const objectName = `${Date.now()}_${uuidString}_${req.file.originalname
          }`;
        console.log(objectName);
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        user.foodLicense = objectName;
      }
      const data = {
        name,
        category,
        creator: userId,
      };
      const newCol = new Collection(data);
      await newCol.save();
      // await User.updateOne(
      //   { _id: userId },
      //   { $push: { collectionss: newCol._id } }
      // );
      user.collectionss.push(newCol._id);
      await user.save();
      res.status(200).json({ success: true });
    } else {
      res
        .status(203)
        .json({ message: "Collections Limit Exceeded", success: false });
    }
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
              let a;
              if (product.isvariant) {
                a =
                  process.env.PRODUCT_URL +
                  product?.variants[0].category[0].content;
              } else {
                a = process.env.PRODUCT_URL + product?.images[0].content;
              }
              return a;
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
    isvariant,
    size,
    color,
    prices,
    variantquantity,
    variantdiscountedprice,
    isphysical,
    weight,
    type,
  } = req.body;
  if (req.canCreateProduct) {
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found", success: false });
    } else {
      if (isvariant === false || isvariant == "false") {
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
              isphysical,
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
      } else {
        const priceVariant = JSON.parse(prices);
        const variantsize = JSON.parse(size);
        const variantcolor = JSON.parse(color);
        const quantityVariant = JSON.parse(variantquantity);
        const variantdiscounted = JSON.parse(variantdiscountedprice);
        const variants = [];
        const imageArr = [];

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
          imageArr.push(objectName);
        }

        for (let i = 0; i < variantcolor.length; i++) {
          const name = "size";
          const value = variantcolor[i];
          const category = [];

          for (let j = 0; j < variantsize.length; j++) {
            const price = priceVariant[i * variantsize.length + j];
            const quantity = quantityVariant[i * variantsize.length + j];
            const discountedPrice =
              variantdiscounted[i * variantsize.length + j];
            const content = imageArr[i * variantsize.length + j];

            const cateData = {
              name: variantsize[j],
              price,
              discountedprice: discountedPrice,
              quantity,
              content,
            };
            category.push(cateData);
          }

          const data = {
            name,
            value,
            category,
          };
          variants.push(data);
        }

        const p = new Product({
          name,
          brandname,
          desc,
          creator: userId,
          shippingcost,
          sellername,
          totalstars,
          isphysical,
          isvariant: isvariant,
          variants,
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

        // console.log(variants);
        // const abs = variants.map((d) => d?.category);
        // console.log(abs);
        // const a = abs.map((d) => console.log(d));
        res.status(200).json({ success: true });
      }
    }
  } else {
    res.status(203).json({
      success: false,
      message: "Product per Collection Limited Exceeded",
    });
  }
};

//delete a product
exports.deleteproduct = async (req, res) => {
  const { userId, colid, productId } = req.params;
  try {
    const collection = await Collection.findById(colid);

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
          const a = process.env.PRODUCT_URL + product.images[i].content;
          // const a = await generatePresignedUrl(
          //   "products",
          //   product.images[i].content.toString(),
          //   60 * 60
          // );
          urls.push(a);
        }
      }
      res.status(200).json({
        data: {
          reviewed: isreviewed,
          product,
          urls,
          url: process.env.PRODUCT_URL,
          success: true,
        },
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.updateproducvariant = async (req, res) => {
  try {
    const {
      name,
      desc,
      isvariant,
      size,
      color,
      prices,
      variantquantity,
      variantdiscountedprice,
      isphysical,
    } = req.body;
    const { userId, colid, productId } = req.params;

    const imageUrls = [];
    console.log(req.body);
    const priceVariant = JSON.parse(prices);
    const variantsize = JSON.parse(size);
    const variantcolor = JSON.parse(color);
    const quantityVariant = JSON.parse(variantquantity);
    const variantdiscounted = JSON.parse(variantdiscountedprice);
    const product = await Product.findById(productId);

    const variants = [];

    for (let i = 0; i < req?.files?.length; i++) {
      const index = parseInt(req.files[i].fieldname.split("-")[1]);
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
      const obj = {
        images: objectName,
        index,
      };
      imageUrls.push(obj);
    }

    for (let i = 0; i < variantcolor.length; i++) {
      for (let j = 0; j < variantsize.length; j++) {
        const index = i * variantsize.length + j;
        const imagesWithIndex = {
          images: req.body[`variantimageurl${index}`],
          index: index,
        };
        if (req.body[`variantimageurl${index}`]) {
          imageUrls.push(imagesWithIndex);
        }
      }
    }

    imageUrls.sort((a, b) => a.index - b.index);

    for (let i = 0; i < variantcolor.length; i++) {
      const name = "size";
      const value = variantcolor[i];
      const category = [];

      for (let j = 0; j < variantsize.length; j++) {
        const price = priceVariant[i * variantsize.length + j];
        const quantity = quantityVariant[i * variantsize.length + j];
        const discountedPrice = variantdiscounted[i * variantsize.length + j];
        const content = imageUrls[i * variantsize.length + j].images;

        const cateData = {
          name: variantsize[j],
          price,
          discountedprice: discountedPrice,
          quantity,
          content,
        };
        category.push(cateData);
        console.log(cateData, "cateData");
      }

      const data = {
        name,
        value,
        category,
      };
      variants.push(data);
    }
    product.variants = variants;
    product.name = name;
    product.desc = desc;
    await product.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
    console.log(error);
  }
};

// update product
exports.updateproduct = async (req, res) => {
  try {
    const {
      name,
      price,
      desc,
      discountedprice,
      quality,
      image,
      weight,
      isphysical,
    } = req.body;
    const { userId, colid, productId } = req.params;
    let imageArr;

    let pos = [];
    let im = [];
    if (image) {
      if (typeof image == "string") {
        imageArr = [image];
      } else {
        imageArr = image;
      }
      for (let i = 0; i < imageArr.length; i++) {
        // const s = imageArr[i].split("?")[0].split("/").pop()
        const s = imageArr[i].split("/").pop();
        im.push(s);
      }
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

        pos.push({
          content: objectName,
          type: req.files[i].mimetype,
          _id: objectId,
        });
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
      const product = await Product.findById(productId);
      for (let i = 0; i < product.images.length; i++) {
        for (let j = 0; j < im.length; j++) {
          if (im[j] == product.images[i].content) {
            pos.push(product.images[i]);
          }
        }
      }
      product.name = name;
      product.price = price;
      product.desc = desc;
      product.discountedprice = discountedprice;
      product.quality = quality;
      product.images = pos;
      product.isphysical = isphysical;
      product.weight = weight;
      await product.save();
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
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
      const store = user.storeAddress.length;
      const storeexistornot = store > 0 ? true : false;
      const isStoreVerified = user.isStoreVerified;
      const orders = await SellerOrder.find({ sellerId: user._id })
        .populate("productId")
        .populate("buyerId", "fullname")
        .limit(20);

      const pendingOrders = orders.filter(
        (order) => order.currentStatus === "pending"
      );
      const completedOrders = orders.filter(
        (order) => order.currentStatus === "success"
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
      const customers = user?.uniquecustomers?.length;
      const earnings = user.storeearning;

      // let image = await Promise.all(
      //   orders.map(async (d, i) => {
      //     if (d?.productId?.length > 0) {
      //       const l = await Promise.all(
      //         d?.productId?.map(async (f, il) => {
      //           const a =
      //             process.env.PRODUCT_URL + d?.productId[il]?.images[0]?.content;
      //           return a
      //         })
      //       );
      //       return l;
      //     } else {
      //       return null;
      //     }
      //   })
      // );

      let image = await Promise.all(
        orders.map(async (d, i) => {
          if (d?.productId) {
            const l = process.env.PRODUCT_URL + d.productId?.images[0]?.content;
            return l;
          } else {
            return null;
          }
        })
      );

      const reversedmergedOrder = orders.map((d, i) => {
        return {
          ...d.toObject(),
          image: image[i],
        };
      });

      const citydelivery = user.deliveryforcity;
      const countrydelivery = user.deliveryforcountry;

      const mergedOrder = reversedmergedOrder.reverse();
      res.status(200).json({
        pendingOrders,
        completedOrders,
        allorders,
        cancelled,
        returned,
        isStoreVerified,
        storeexistornot,
        damaged,
        citydelivery,
        countrydelivery,

        customers,
        earnings,
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
        const objectName = `${Date.now()}_${uuidString}_${req.file.originalname
          }`;
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
        user.profilepic = objectName;
      }
      user.fullname = name;
      user.phone = 91 + newPhone;
      user.email = newEmail;
      user.username = newUsername;
      user.desc = bio;
      user.DOB = date;
      await user.save();

      const dp = process.env.URL + user.profilepic;

      const memberships = await Membership.findById(
        user.memberships.membership
      );
      const data = {
        dp,
        fullname: user.fullname,
        username: user.username,
        id: user._id.toString(),
        isverified: user?.isverified,
        memberships: memberships.title,
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      return res
        .status(200)
        .json({ success: true, refresh_token, data, access_token });
    } else {
      res.status(400).json({ message: "User Not Found", success: false });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getprofileinfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {

      const dp = process.env.URL + user.profilepic;
      const data = {
        name: user?.fullname,
        email: user?.email,
        phone: user?.phone,
        username: user?.username,

        image: dp,
        date: user.DOB,
        bio: user.desc,
      };
      res.status(200).json({ success: true, data });
    } else {
      res.status(400).json({ success: false, message: "User Not Found" });
    }
  } catch (err) {
    res.status(400).json({ message: "Internal Server Error" });
  }
};

// create topic
exports.createtopic = async (req, res) => {
  const { title, message, type, nature, price } = req.body;
  const { userId, comId } = req.params;
  try {
    // if (req.cancreatetopic) {
    const topic = new Topic({
      title: title,
      creator: userId,
      message: message,
      type: type,
      community: comId,
      nature: nature,
      price: price,
    });

    const topics = await topic.save();

    await Topic.updateOne(
      { _id: topics._id },
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
      { $push: { topicsjoined: topics._id }, $inc: { totaltopics: 1 } }
    );

    if (comId) {
      await Community.findByIdAndUpdate(
        { _id: comId },
        { $push: { topics: topic._id } }
      );
    }
    res.status(200).json({ topic, success: true });
    // } else {
    //   res.status(203).json({ success: false, message: "Topic Creation Limit Exceeded" });
    // }
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
      return res.status(400).json({ message: "Community Not Found" });
    }
    res.status(200).json({ topics: community.topics, success: true });
  } catch (err) {
    res.status(400).json({ message: err.message, success: false });
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
  }
};

exports.updatecommunity = async (req, res) => {
  const { comId, userId } = req.params;
  const { category, title, desc, type } = req.body;
  const uuidString = uuid();

  const image = req.file;
  try {
    const user = await User.findById(userId);
    const com = await Community.findById(comId);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else if (!com) {
      res.status(404).json({ message: "Community not found", success: false });
    } else {
      if (image) {
        //console.log("do")
        const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
        //a = objectName;
        const result = await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: image.buffer,
            ContentType: image.mimetype,
          })
        );
        await Community.updateOne(
          { _id: com._id },
          {
            $set: {
              category: category,
              title: title,
              desc: desc,
              type: type,
              dp: objectName,
            },
          }
        );
      }
      await Community.updateOne(
        { _id: com._id },
        {
          $set: {
            category: category,
            title: title,
            desc: desc,
            type: type,
          },
        }
      );

      // if (topicname) {
      //   await Topic.updateOne(
      //     { _id: topicId },
      //     {
      //       $set: {
      //         title: topicname,
      //         message: message,
      //         price: price,
      //         type: type,
      //       },
      //     }
      //   );
      // }
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
      const data = [];

      const community = await Community.find({
        type: "public",
        creator: user._id.toString()
      })
        .lean();


      for (let i = 0; i < community.length; i++) {
        const post = await Post.find({ community: community[i]._id });
        data.push({
          community: community.length,
          posts: post.length,
        });
      }

      const publicCommunityIds = community.map(com => com._id);

      // Fetch posts from public communities created by the user
      const post = await Post.find({
        sender: user._id.toString(),
        community: { $in: publicCommunityIds }
      }).populate("community", "title");


      const checkUser = () => data.some((d) => d.community && d.posts > 0);
      const validToCreateStore = checkUser();

      const store = user.storeAddress.length;
      const foodlic = user.foodLicense;
      const foodLicenceExist = foodlic ? true : false;
      if (store > 0) {
        return res.status(200).json({
          exist: true,
          q: "collection",
          foodLicenceExist,
          validToCreateStore,
          community: community.length,
          posts: post.length,
          isverified: user.isStoreVerified,
        });
      } else {
        return res.status(200).json({
          exist: false,
          q: "store",
          foodLicenceExist,
          validToCreateStore,
          community: community.length,
          posts: post.length,
          isverified: user.isStoreVerified,
        });
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
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const prd = await Product.find({ creator: user._id });
    const bankapp = await Approvals.findOne({ id: user._id, type: "bank" });

    const checkValidity = () => {
      if (
        user.bank.IFSCcode &&
        user.bank.accountno &&
        user.bank.personname &&
        user.bank.bankname &&
        user.bank.branchname &&
        bankapp.status === "approved"
      ) {
        return "approved";
      } else if (
        user.bank.IFSCcode &&
        user.bank.accountno &&
        user.bank.personname &&
        user.bank.bankname &&
        user.bank.branchname &&
        bankapp.status === "pending"
      ) {
        return "pending";
      } else if (
        user.bank.IFSCcode &&
        user.bank.accountno &&
        user.bank.personname &&
        user.bank.bankname &&
        user.bank.branchname &&
        bankapp.status === "rejected"
      ) {
        return "rejected";
      } else {
        return "nothing";
      }
    };

    const final = prd.sort((item1, item2) => {
      return item2?.itemsold - item1?.itemsold;
    });
    const earningStats = {
      earnings: user.storeearning + user.topicearning + user.adsearning,
      adsearning: user.adsearning,
      topicearning: user.topicearning,
      storeearning: user.storeearning,
      pendingpayments: user.pendingpayments,
      bank: user.bank,
      final,
      isbankverified: checkValidity(),
    };
    res.status(200).json({ success: true, earningStats, length: prd.length });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.deletecom = async (req, res) => {
  const { comId } = req.params;
  try {
    const find = await Community.findByIdAndDelete(comId);
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

// razorpay

// exports.membershipbuy = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     console.log(amount);
//     const { id, memid } = req.params;
//     const user = await User.findById(id);

//     if (user.ismembershipactive) {
//       const membership = await Membership.findById(user.memberships.membership);
//       if (membership.title !== "Free") {
//         const currentTime = new Date();
//         const endingTime = new Date(user.memberships.ending);

//         if (endingTime > currentTime) {
//           return res.status(203).json({
//             success: false,
//             message: "You already have an active membership.",
//           });
//         }
//       }
//     }
//     const membership = await Membership.findById(memid);
//     const newamount = amount.split("₹")[1];
//     const parseAmout = Number(newamount);

//     if (!user) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User Not Found" });
//     }
//     let oi = Math.floor(Math.random() * 9000000) + 1000000;
//     const subs = new Subscriptions({
//       memid,
//       validity: Date.now(),
//       paymentMode: "UPI",
//       orderId: oi,
//       purchasedby: id,
//       amount: parseAmout,
//     });
//     await subs.save();
//     // / creatign a rzp order

//     instance.orders.create(
//       {
//         amount: parseAmout * 100,
//         currency: "INR",
//         receipt: `receipt-mem#${oi}`,
//         notes: {
//           oi,
//           id,
//           memid,
//           amount: parseAmout,
//         },
//       },
//       function (err, order) {
//         console.log(err, order);
//         if (err) {
//           res.status(400).json({ err, success: false });
//         } else {
//           res.status(200).json({
//             oid: order.id,
//             order: oi,
//             memid: memid,
//             orderCreated: order,
//             phone: user?.phone,
//             email: user?.email,
//             success: true,
//           });
//         }
//       }
//     );
//   } catch (error) {

//     res.status(500).json({ message: error.message, success: false });
//   }
// };

// exports.memfinalize = async (req, res) => {
//   try {
//     const { id, orderId } = req.params;
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       status,
//       paymentMethod,
//       memid,
//       dm,
//       tagging,
//       deliverylimitcity,
//       deliverylimitcountry,
//       period,
//     } = req.body;
//     const user = await User.findById(id);
//     const subscription = await Subscriptions.findOne({ orderId: orderId });
//     const isValid = validatePaymentVerification(
//       { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
//       razorpay_signature,
//       "bxyQhbzS0bHNBnalbBg9QTDo"
//     );
//     if (!subscription) {
//       return res.status(400).json({ success: false });
//     }
//     if (isValid) {
//       if (status) {
//         subscription.currentStatus = "completed";
//       }
//     } else {
//       if (status == false) {
//         subscription.currentStatus = "failed";
//       }
//     }
//     const currentDate = new Date();
//     let endDate;
//     if (period == "year") {
//       endDate = new Date(currentDate.getTime() + 13 * 30.4375 * 24 * 60 * 60 * 1000);
//     } else {
//       endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
//     }

//     subscription.paymentMode = "Card";
//     const newSub = await subscription.save();
//     user.activeSubscription.push(newSub._id);
//     user.ismembershipactive = true;
//     user.tagging = tagging
//     user.dm = dm
//     user.memberships = {
//       membership: memid,
//       status: true,
//       ending: endDate,
//       paymentdetails: { mode: "online", amount: subscription.amount },
//     };

//     const membershiphist = {
//       id: memid,
//       date: Date.now()
//     };

//     // Ensure membershipHistory array exists
//     if (!Array.isArray(user.membershipHistory)) {
//       user.membershipHistory = [];
//     }
//     // Add the new membership history entry
//     user.membershipHistory.push(membershiphist);

//     user.deliveryforcity = deliverylimitcity;
//     user.deliveryforcountry = deliverylimitcountry;
//     const membership = await Membership.findById(memid);
//     user.isverified = true;
//     const saveduser = await user.save();

//     const dp = process.env.URL + saveduser.profilepic;

//     if (saveduser.membershipHistory.length === 1) {
//       const advertiser = await Advertiser.findById(saveduser.advertiserid)
//       if (advertiser) {
//         const newid = Date.now();
//         advertiser.currentbalance = advertiser.currentbalance + 500
//         const savedOldAdvertiser = await advertiser.save()
//         const transactions = new Transaction({
//           transactionid: newid,
//           amount: 500,
//           type: "Credits",
//           status: "completed",
//           advertiserid: savedOldAdvertiser._id,
//         })
//         const tId = await transactions.save()
//         if (!Array.isArray(savedOldAdvertiser.transactions)) {
//           savedOldAdvertiser.transactions = [];
//         }
//         savedOldAdvertiser.transactions.push(tId)
//         await savedOldAdvertiser.save()

//       } else {
//         const firstname = saveduser.fullname.split(" ")[0];
//         const lastname = saveduser.fullname.split(" ")[1];
//         function generateUniqueID() {
//           let advertiserID;
//           advertiserID = Date.now();
//           return advertiserID.toString();
//         }

//         const advertisernew = new Advertiser({
//           firstname,
//           lastname,
//           image: saveduser.profilepic,
//           password: await decryptaes(saveduser.passw),
//           phone: saveduser.phone ? saveduser.phone : undefined,
//           email: saveduser.email,
//           address: saveduser.address.streetaddress,
//           city: saveduser.address.city,
//           currentbalance: 500,
//           state: saveduser.address.state,
//           pincode: saveduser.address.pincode,
//           landmark: saveduser.address.landmark,
//           userid: saveduser._id,
//           advertiserid: generateUniqueID(),
//         });
//         const newid = Date.now();
//         const savedAdvertiser = await advertisernew.save();

//         const transactions = new Transaction({
//           transactionid: newid,
//           amount: 500,
//           type: "Credits",
//           status: "completed",
//           advertiserid: savedAdvertiser._id,
//         })

//         const tId = await transactions.save()
//         if (!Array.isArray(savedAdvertiser.transactions)) {
//           savedAdvertiser.transactions = [];
//         }
//         savedAdvertiser.transactions.push(tId)
//         await savedAdvertiser.save()

//         await User.updateOne(
//           { _id: saveduser._id },
//           { $set: { advertiserid: savedAdvertiser._id } }
//         );
//       }
//     }

//     const data = {
//       dp,
//       fullname: saveduser.fullname,
//       username: saveduser.username,
//       id: saveduser._id.toString(),
//       memberships: membership.title,
//     };
//     const access_token = generateAccessToken(data);
//     const refresh_token = generateRefreshToken(data);
//     res
//       .status(200)
//       .json({ success: true, refresh_token, access_token });
//   } catch (error) {
//     res.status(400).json({ success: false, message: "Something Went Wrong!" })
//     console.log(error)
//   }
// };


// phone pe

exports.membershipbuy = async (req, res) => {
  try {
    const { amount, dm, tagging, deliverylimitcity, deliverylimitcountry, period } = req.body;

    const { id, memid } = req.params;
    const user = await User.findById(id);

    if (user.ismembershipactive) {
      const membership = await Membership.findById(user.memberships.membership);
      if (membership.title !== "Free") {
        const currentTime = new Date();
        const endingTime = new Date(user.memberships.ending);

        if (endingTime > currentTime) {
          return res.status(203).json({
            success: false,
            message: "You already have an active membership.",
          });
        }
      }
    }
    const membership = await Membership.findById(memid);
    const newamount = amount.split("₹")[1];
    const parseAmout = Number(newamount);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    let oi = Math.floor(Math.random() * 9000000) + 1000000;
    const subs = new Subscriptions({
      memid,
      validity: Date.now(),
      paymentMode: "UPI",
      orderId: oi,
      purchasedby: id,
      amount: parseAmout,
    });

    const newsub = await subs.save();
    // / creatign a rzp order

    let payload = {
      merchantId: process.env.WORKSPACE_MERCHANT_ID,
      merchantTransactionId: newsub._id.toString(),
      merchantUserId: user._id,
      amount: parseAmout * 100,
      redirectUrl: "https://workspace.grovyo.com/main/dashboard?membership=true",
      redirectMode: "REDIRECT",
      callbackUrl: `https://work.grovyo.xyz/api/v1/memfinalize/${id}/${newsub.orderId}/${memid}/${dm}/${tagging}/${deliverylimitcity}/${deliverylimitcountry}/${period}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },

    };

    let bufferObj = Buffer.from(JSON.stringify(payload), "utf8");

    let base64string = bufferObj.toString("base64");

    let string = base64string + "/pg/v1/pay" + process.env.WORKSPACE_PHONE_PAY_KEY;
    let shaString = sha256(string);

    let checkSum = shaString + "###" + process.env.keyIndex;

    await axios
      .post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",

        { request: base64string },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checkSum,
            accept: "application/json",
          },
        }
      )
      .then((response) => {

        res.status(200).json({
          success: true,
          url: response.data.data.instrumentResponse.redirectInfo.url,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status({ success: false, message: err.message });
      });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message, success: false });
  }
};

exports.fetchdetails = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const dp = process.env.URL + user.profilepic;
    const memberships = await Membership.findById(user.memberships.membership);
    const data = {
      dp,
      fullname: user.fullname,
      username: user.username,
      id: user._id.toString(),

      memberships: memberships.title,
    };
    const access_token = generateAccessToken(data);
    const refresh_token = generateRefreshToken(data);

    res.status(200).json({

      access_token,
      refresh_token,
      data,
      success: true,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })
    console.log(error)
  }
}

exports.memfinalize = async (req, res) => {

  try {
    const { id, orderId, memid,
      dm,
      tagging,
      deliverylimitcity,
      deliverylimitcountry,
      period } = req.params;

    const user = await User.findById(id);
    const subscription = await Subscriptions.findOne({ orderId: orderId });

    if (!subscription) {
      console.log("first")
      return res.status(400).json({ success: false });
    }

    function generateChecksum(
      merchantId,
      merchantTransactionId,
      saltKey,
      saltIndex
    ) {
      const stringToHash =
        `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
      const shaHash = sha256(stringToHash).toString();
      const checksum = shaHash + "###" + saltIndex;

      return checksum;
    }

    const checksum = generateChecksum(
      process.env.WORKSPACE_MERCHANT_ID,
      subscription._id.toString(),
      process.env.WORKSPACE_PHONE_PAY_KEY,
      process.env.keyIndex
    );


    const response = await axios.get(
      `https://api.phonepe.com/apis/hermes/pg/v1/status/${process.env.WORKSPACE_MERCHANT_ID}/${subscription._id.toString()}`,

      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": process.env.WORKSPACE_MERCHANT_ID,
        },
      }
    );
    if (response.data.code === "PAYMENT_SUCCESS") {
      console.log("Payment Successful");

      subscription.currentStatus = "completed";

      const currentDate = new Date();
      let endDate;
      if (period == "year") {
        endDate = new Date(currentDate.getTime() + 13 * 30.4375 * 24 * 60 * 60 * 1000);
      } else {
        endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      subscription.paymentMode = "Card";
      const newSub = await subscription.save();
      user.activeSubscription.push(newSub._id);
      user.ismembershipactive = true;
      user.tagging = tagging
      user.dm = dm
      user.memberships = {
        membership: memid,
        status: true,
        ending: endDate,
        paymentdetails: { mode: "online", amount: subscription.amount },
      };

      const membershiphist = {
        id: memid,
        date: Date.now()
      };

      // Ensure membershipHistory array exists
      if (!Array.isArray(user.membershipHistory)) {
        user.membershipHistory = [];
      }
      // Add the new membership history entry
      user.membershipHistory.push(membershiphist);

      user.deliveryforcity = deliverylimitcity;
      user.deliveryforcountry = deliverylimitcountry;
      const membership = await Membership.findById(memid);
      user.isverified = true;
      const saveduser = await user.save();

      const dp = process.env.URL + saveduser.profilepic;

      if (saveduser.membershipHistory.length === 1) {
        const advertiser = await Advertiser.findById(saveduser.advertiserid)
        if (advertiser) {
          const newid = Date.now();
          advertiser.currentbalance = advertiser.currentbalance + 500
          const savedOldAdvertiser = await advertiser.save()
          const transactions = new Transaction({
            transactionid: newid,
            amount: 500,
            type: "Credits",
            status: "completed",
            advertiserid: savedOldAdvertiser._id,
          })
          const tId = await transactions.save()
          if (!Array.isArray(savedOldAdvertiser.transactions)) {
            savedOldAdvertiser.transactions = [];
          }
          savedOldAdvertiser.transactions.push(tId)
          await savedOldAdvertiser.save()

        } else {
          const firstname = saveduser.fullname.split(" ")[0];
          const lastname = saveduser.fullname.split(" ")[1];
          function generateUniqueID() {
            let advertiserID;
            advertiserID = Date.now();
            return advertiserID.toString();
          }

          const advertisernew = new Advertiser({
            firstname,
            lastname,
            image: saveduser.profilepic,
            password: await decryptaes(saveduser.passw),
            phone: saveduser.phone ? saveduser.phone : undefined,
            email: saveduser.email,
            address: saveduser.address.streetaddress,
            city: saveduser.address.city,
            currentbalance: 500,
            state: saveduser.address.state,
            pincode: saveduser.address.pincode,
            landmark: saveduser.address.landmark,
            userid: saveduser._id,
            advertiserid: generateUniqueID(),
          });
          const newid = Date.now();
          const savedAdvertiser = await advertisernew.save();

          const transactions = new Transaction({
            transactionid: newid,
            amount: 500,
            type: "Credits",
            status: "completed",
            advertiserid: savedAdvertiser._id,
          })

          const tId = await transactions.save()
          if (!Array.isArray(savedAdvertiser.transactions)) {
            savedAdvertiser.transactions = [];
          }
          savedAdvertiser.transactions.push(tId)
          await savedAdvertiser.save()

          await User.updateOne(
            { _id: saveduser._id },
            { $set: { advertiserid: savedAdvertiser._id } }
          );
        }
      }

      const data = {
        dp,
        fullname: saveduser.fullname,
        username: saveduser.username,
        id: saveduser._id.toString(),
        memberships: membership.title,
      };
      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      res
        .status(200)
        .json({ success: true, refresh_token, access_token, data });

    } else if (response.data.code === "PAYMENT_ERROR") {
      console.log("Payment Failed");

      subscription.currentStatus = "failed";

      res.status(200).json({ success: false, message: "Payment Failed!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })
    console.log(error)
  }
};

exports.addbank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankname, branchname, accountno, IFSCcode, personname } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    let approval = await Approvals.findOne({ id, type: "bank" });
    if (!approval) {
      approval = await Approvals({
        id,
        type: "bank",
        bank: {
          bankname,
          personname,
          branchname,
          accountno,
          IFSCcode,
        },
      });
      await approval.save();
    } else {
      const bank = {
        bankname,
        personname,
        branchname,
        accountno,
        IFSCcode,
      };
      approval.bank = bank;
      await approval.save();
    }
    user.isbankverified = false;
    user.bank.bankname = bankname;
    user.bank.branchname = branchname;
    user.bank.personname = personname;
    user.bank.accountno = accountno;
    user.bank.IFSCcode = IFSCcode;
    const newuser = await user.save();

    res.status(200).json({
      success: true,
      bank: newuser.bank,
      isverified: newuser.isbankverified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

exports.fetchingprosite = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ username: id }).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }

    const community = [];
    const com = await Community.find({ creator: user._id, type: "public" });
    for (let i = 0; i < com.length; i++) {
      const id = com[i];
      let comm = await Community.findById(id).populate("members", "dp").populate("posts");
      community.push(comm);
    }

    const communityDps = await Promise.all(
      community.map((d) => {
        const imageforCommunity = process.env.URL + d.dp;

        return imageforCommunity;
      })
    );

    const communityWithPosts = await Promise.all(

      community.map(async (d) => {
        const id = d?.posts
        const data = []
        const posts = await Post.find({ _id: id }).sort({ likes: -1 }).limit(5);

        for (let i = 0; i < posts.length; i++) {
          const obj = {
            id: posts[i]?._id,
            title: posts[i].title,
            dp: process.env.POST_URL + posts[i]?.post[0]?.content,
            type: posts[i].post[0]?.type
          }
          data.push(obj)
        }
        return data
      })
    );

    const membersdp = await Promise.all(
      community.map(async (d) => {
        const dps = await Promise.all(
          d.members.map(async (userId) => {
            const member = await User.findById(userId);
            const dp = process.env.URL + member.profilepic;
            return dp;
          })
        );
        return dps;
      })
    );

    const communitywithDps = community.map((f, i) => {
      return { ...f.toObject(), dps: communityDps[i], membersdp: membersdp[i], communityWithPosts: communityWithPosts[i] };
    });

    const products = await Product.find({ creator: user._id });

    const productdps = await Promise.all(
      products.map(async (product) => {
        let a
        if (product.isvariant) {
          a = process.env.PRODUCT_URL + product?.variants[0]?.category[0]?.content;
        } else {
          a = process.env.PRODUCT_URL + product?.images[0]?.content;
        }
        return a;
      })
    );

    const productsWithDps = products.map((product, index) => {
      return {
        ...product.toObject(),
        dp: productdps[index],
      };
    });

    const userDetails = {
      bio: user.desc,
      id: user?._id,
      phone: user.phone,
      username: user.username,
      isverified: user.isverified,
      showContact: user?.showContact,
      fullname: user.fullname,
      dp: process.env.URL + user.profilepic,
      isStore: user.showStoreSection,
      useDefaultProsite: user.useDefaultProsite,
      isAbout: user.showAboutSection,
      isCommunity: user.showCommunitySection,
      location: user.address,
      temp: user.prositeweb_template,
      temp1: user.prositemob_template,
      email: user.email,
      links: {
        insta: user.insta,
        snap: user.snap,
        x: user.x,
        yt: user.yt,
        linkdin: user.linkdin,
      },
    };
    const data = {
      communitywithDps,
      productsWithDps,

      userDetails,
    };

    res.status(200).json({ success: true, data, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message, success: false });
  }
};

exports.fetchMemberShip = async (req, res) => {
  try {
    const memberships = await Membership.find();
    if (!memberships) {
      return res
        .status(400)
        .json({ success: false, message: "Membership Id Not Found" });
    }

    const ids = {
      free: "65671e5204b7d0d07ef0e796",
      pro: "65671ded04b7d0d07ef0e794",
      premium: "65671e6004b7d0d07ef0e798",
    };

    res.status(200).json({ success: true, memberships, ids });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something Went Wrong!" });
  }
};

exports.customMembership = async (req, res) => {
  try {
    const {
      productlimit,
      topiclimit,
      isverified,
      communitylimit,
      collectionlimit,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status,
      memid,
    } = req.body;
    const { userId, orderId } = req.params;
    console.log(req.body);
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    const subscription = await Subscriptions.findOne({ orderId: orderId });
    const isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      "bxyQhbzS0bHNBnalbBg9QTDo"
    );
    const membership = await Membership.findById(memid);
    membership.broughtby.push(userId);
    const membershipsForTitle = await membership.save();
    if (!subscription) {
      return res.status(400).json({ success: false });
    }

    if (isValid) {
      if (status) {
        subscription.currentStatus = "completed";
      }
    } else {
      if (status == false) {
        subscription.currentStatus = "failed";
      }
    }
    const currentDate = new Date();
    const endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (isverified) {
      user.isverified = isverified;
    }
    // subscription.paymentMode = "Card"
    const newSub = await subscription.save();
    user.activeSubscription.push(newSub._id);
    user.ismembershipactive = true;
    user.memberships = {
      membership: memid,
      status: true,
      ending: endDate,
      paymentdetails: { mode: "online", amount: subscription.amount },
    };
    user.limits = {
      productlimit,
      topiclimit,
      communitylimit,
      collectionlimit,
    };
    const saveduser = await user.save();
    const sessionId = generateSessionId();
    const dp = process.env.URL + saveduser.profilepic;

    const data = {
      dp,
      fullname: saveduser.fullname,
      username: saveduser.username,
      id: saveduser._id.toString(),
      sessionId,
      memberships: membershipsForTitle.title,
    };
    const access_token = generateAccessToken(data);
    const refresh_token = generateRefreshToken(data);
    res
      .status(200)
      .json({ success: true, access_token, sessionId, refresh_token });
  } catch (error) { }
};

exports.errorsDetection = async (req, res) => {
  try {
    const { causedBy, causedIn } = req.body;
    const data = {
      causedBy,
      causedIn,
    };
    let err = await Error.findOne();

    if (!err) {
      err = new Error({
        error: [data],
      });
    } else {
      err.error.push(data);
    }
    await err.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.fetchCommunityStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    const monetization = await Montenziation.find({ creator: userId });
    const community = await Community.find({ creator: userId });
    if (!community) {
      return res
        .status(400)
        .json({ success: false, message: "Community Not Found" });
    }

    let topic = [];
    for (let i = 0; i < community.length; i++) {
      const top = (await Topic.find({ community: community[i]._id })).filter(
        (d) => {
          return d.type.toLowerCase() === "paid";
        }
      );
      const topics = top.map((d) => {
        return {
          title: d?.title,
          earnings: d?.earnings,
          type: d?.type,
          members: d?.memberscount,
        };
      });
      topic.push(topics);
    }

    let avgeng = [];

    for (let i = 0; i < community.length; i++) {
      const posts = await Post.find({ community: community[i]._id });

      let eng = [];
      await posts.map((p, i) => {
        let final =
          p.views <= 0 ? 0 : (parseInt(p?.likes) / parseInt(p?.views)) * 100;
        eng.push(final);
      });

      let sum = 0;
      for (let i = 0; i < eng.length; i++) {
        sum += eng[i];
      }
      let avg = 0;

      if (eng.length > 0) {
        avg = Math.round(sum / eng.length);
      } else {
        avg = 0;
      }
      avgeng.push(avg);
    }

    const communities = community.map((d, i) => {
      const monStatus = monetization.find(
        (f) => f.community.toString() === d?._id.toString()
      );

      return {
        id: d?._id,
        topics: d?.topics.length,
        ismonetized: d?.ismonetized || false,
        post: d?.posts.length,
        topic: topic[i],
        monstatus: monStatus ? monStatus.status : null,
        reason: monStatus ? monStatus.text : null,
        reapplydate: monStatus ? monStatus.reapplydate : null,
        name: d?.title,
        desc: d?.desc,
        category: d?.category,
        dps: process.env.URL + d?.dp,
        members: d?.memberscount,
        type: d?.type,
        engagementrate: avgeng[i],
        impressions: d?.impressions,
        cpc: d?.cpc,
        cpm: d?.cpm,
      };
    });

    const store = user.storeAddress.length > 0 ? true : false;

    const verified = user.isStoreVerified;

    res.status(200).json({ success: true, communities, store, verified });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.monetizationWorkSpace = async (req, res) => {
  try {
    const { id, comid } = req.params;
    if (!id && !comid) {
      return res
        .status(400)
        .json({ success: false, message: "User Or Communnity Not Found" });
    }
    let monetization = await Montenziation.findOne({ community: comid });
    if (!monetization) {
      monetization = new Montenziation({
        creator: id,
        community: comid,
        status: "pending",
      });
      await monetization.save();
    } else {
      monetization.status = "pending";
      await monetization.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

exports.templates = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    const { curr_template1, curr_template2, webt } = req.body;
    console.log(webt);

    if (user) {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            prositeweb_template: curr_template1,
            prositemob_template: curr_template2,
            recentTempPics: webt,
          },
        }
      );

      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(409).json({
      message: e.message,
      success: false,
    });
  }
};

exports.editPosts = async (req, res) => {
  try {
    const { userId, postId } = req.params;
    if (req.fileValidationError) {
      return res.status(400).json({
        message: "File size limit exceeded",
        success: false,
      });
    }
    const { title, desc, tags, image, video, thumbnail, thumbnailImage } =
      req.body;

    console.log(req.body, req.files);

    if (thumbnail == "false") {
      let videoArr;
      if (typeof video == "string") {
        videoArr = [video];
      } else {
        videoArr = video || [];
      }

      let imageArr;
      if (typeof image == "string") {
        imageArr = [image];
      } else {
        imageArr = image || [];
      }
      let pos = [];
      let img = [];
      let vid = [];
      for (let i = 0; i < imageArr.length; i++) {
        const s = imageArr[i].split(".net/").pop();
        img.push(s);
      }
      for (let i = 0; i < videoArr.length; i++) {
        const s = videoArr[i].split(".net/").pop();
        vid.push(s);
      }

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req?.files?.length; i++) {
          const uuidString = uuid();

          const objectName = `${Date.now()}_${uuidString}_${req.files[i].originalname
            }`;
          const objectId = mongoose.Types.ObjectId();
          const result = await s3.send(
            new PutObjectCommand({
              Bucket: POST_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );

          pos.push({
            content: objectName,
            type: req.files[i].mimetype,
            _id: objectId,
          });
        }
      }
      const post = await Post.findById(postId);
      for (let i = 0; i < post.post.length; i++) {
        if (post.post[i].type.startsWith("video")) {
          for (let j = 0; j < vid.length; j++) {
            if (vid[j] == post.post[i].content) {
              pos.push(post.post[i]);
            }
          }
        } else if (post.post[i].type.startsWith("image")) {
          for (let j = 0; j < img.length; j++) {
            if (img[j] == post.post[i].content) {
              pos.push(post.post[i]);
            }
          }
        }
      }
      post.title = title;
      post.desc = desc;
      post.tags = tags;
      post.post = pos;
      await post.save();

      res.status(200).json({ success: true });
    } else {
      let myVideo;
      if (typeof video == "string") {
        myVideo = video.split(".net/").pop();
      }
      let myThumbnail;
      if (typeof thumbnailImage == "string") {
        myThumbnail = thumbnailImage.split(".net/").pop();
      }
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req?.files?.length; i++) {
          const uuidString = uuid();

          const objectName = `${Date.now()}_${uuidString}_${req.files[i].originalname
            }`;

          const result = await s3.send(
            new PutObjectCommand({
              Bucket: POST_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );

          if (req.files[i].fieldname === "thumbnailImage") {
            myThumbnail = objectName;
          } else {
            myVideo = objectName;
          }
        }
      }
      const post = await Post.findById(postId);
      post.post = [
        {
          content: myVideo,
          type: "video/mp4",
          thumbnail: myThumbnail,
        },
      ];
      post.title = title;
      post.desc = desc;
      post.tags = tags;
      await post.save();

      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(409).json({
      message: error.message,
      success: false,
    });
  }
};

exports.deletepost = async (req, res) => {
  const { userId, postId } = req.params;
  try {
    const post = await Post.findById(postId).populate("community", "category");
    if (!post) {
      res.status(404).json({ message: "Post not found" });
    } else if (post.sender.toString() !== userId) {
      res.status(400).json({ message: "You can't delete others post" });
    } else {
      await Community.updateOne(
        { _id: post.community },
        { $inc: { totalposts: -1 }, $pull: { posts: post?._id } }
      );
      const int = await Interest.findOne({ title: post.community.category });

      for (let i = 0; i < post.tags?.length; i++) {
        const t = await Tag.findOne({ title: post.tags[i].toLowerCase() });

        if (t) {
          await Tag.updateOne(
            { _id: t._id },
            { $inc: { count: -1 }, $pull: { post: post._id } }
          );
          if (int) {
            await Interest.updateOne(
              { _id: int._id },
              { $inc: { count: -1 }, $pull: { post: post._id, tags: t._id } }
            );
          }
        }
      }
      const topic = await Topic.findOne({
        community: post.community,
        nature: "post",
        title: "Posts",
      });
      await Topic.updateOne(
        { _id: topic._id },
        { $pull: { posts: post._id }, $inc: { postcount: -1 } }
      );
      for (let j = 0; j < post.post.length; j++) {
        const result = await s3.send(
          new DeleteObjectCommand({
            Bucket: POST_BUCKET,
            Key: post.post[j].content,
          })
        );
      }

      await Post.findByIdAndDelete(postId);

      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(404).json({ message: "Something went wrong", success: false });
  }
};

exports.removecomwithposts = async (req, res) => {
  try {
    const { id, comId } = req.params;
    const user = await User.findById(id);
    if (user) {
      const community = await Community.findById(comId);
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: community.dp,
      });
      if (community) {
        for (let i = 0; i < community.posts.length; i++) {
          const post = await Post.findById(community.posts[i]);
          if (post) {
            for (let j = 0; j < post.post.length; j++) {
              const result = await s3.send(
                new DeleteObjectCommand({
                  Bucket: POST_BUCKET,
                  Key: post.post[j].content,
                })
              );
            }
            post.remove();
          }
        }
        //remove all topics of community
        const topics = await Topic.find({ community: community._id });
        if (topics?.length > 0) {
          for (let i = 0; i < topics.length; i++) {
            await User.findByIdAndUpdate(
              { _id: user._id },
              { $pull: { topicsjoined: topics[i]._id } }
            );
            topics[i].remove();
          }
        }

        await User.findByIdAndUpdate(
          { _id: user._id },
          {
            $pull: {
              communityjoined: community?._id,
              communitycreated: community?._id,
            },
            $inc: { totaltopics: -topics?.length, totalcom: 1 },
          }
        );

        community.remove();
      }
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found!", success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

exports.fetchSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, product, url: process.env.PRODUCT_URL });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

exports.defaultprositeselector = async (req, res) => {
  try {
    const { id } = req.params;
    const { checked } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });
    }
    user.useDefaultProsite = checked;
    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
    console.log(error);
  }
};

exports.changemont = async (req, res) => {
  try {
    const { comid } = req.params;
    const { ismonetized } = req.body;
    console.log(ismonetized);
    const community = await Community.findById(comid);

    if (!community) {
      return res
        .status(400)
        .json({ success: false, message: "Community Not Found!" });
    }

    community.ismonetized = ismonetized;
    await community.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
    console.log(error);
  }
};

exports.deleteRecentProsites = async (req, res) => {
  try {
    const { userId, prositeId } = req.params

    const user = await User.findById(userId)

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });
    }

    const updateProsite = user.recentProsites.filter((d) => d?._id.toString() !== prositeId.toString())

    user.recentProsites = updateProsite
    await user.save()

    res.status(200).json({ success: true })

  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })

  }
}

// exports.createwithdrawRequest = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { amount } = req.body
//     const user = await User.findById(id)
//     if (!user) {
//       return res.status(400).json({ success: false, message: "User Not Found!" })
//     }

//     const firstwithdraw = await WithDrawRequest.find({ userid: user?._id })
//     if (firstwithdraw.length > 0) {

//       let usercreateWithdrawRequest = true

//       for (let i = 0; i < firstwithdraw.length; i++) {
//         if (firstwithdraw[i].status !== "completed") {
//           usercreateWithdrawRequest = false;
//           break;
//         }
//       }

//       if (usercreateWithdrawRequest) {
//         const withdraw = new WithDrawRequest({
//           userid: user._id,
//           bank: user.bank,
//           amount
//         })
//         await withdraw.save()
//       } else {
//         return res.status(200).json({ success: true, message: "You already have a pending withdraw request." })
//       }

//     } else {
//       const withdraw = new WithDrawRequest({
//         userid: user._id,
//         bank: user.bank,
//         amount
//       })
//       await withdraw.save()
//     }
//   } catch (error) {
//     res.status(400).json({ success: false, message: "Something Went Wrong!" })
//     console.log(error)
//   }
// }


function generateRandom10DigitNumber() {
  let randomNumber = '';
  for (let i = 0; i < 10; i++) {
    randomNumber += Math.floor(Math.random() * 10).toString();
  }
  return parseInt(randomNumber, 10);
}

exports.createWithdrawRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;


    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User Not Found!" });
    }

    const firstWithdraw = await WithDrawRequest.find({ userid: user._id });

    let userCreateWithdrawRequest = true;
    for (let i = 0; i < firstWithdraw.length; i++) {
      if (firstWithdraw[i].status !== "completed") {
        userCreateWithdrawRequest = false;
        break;
      }
    }

    if (userCreateWithdrawRequest) {
      const withdraw = new WithDrawRequest({
        userid: user._id,
        bank: user.bank,
        amount,
        transcationId: generateRandom10DigitNumber()
      });
      await withdraw.save();
      return res.status(200).json({ success: true, message: "Withdraw request created successfully!" });
    } else {
      return res.status(200).json({ success: true, message: "You already have a pending withdraw request." });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
    console.error(error);
  }
};

function calculateTotalDistance(coordinates) {
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const coord1 = coordinates[i - 1];
    const coord2 = coordinates[i];
    totalDistance += geolib.getDistance(coord1, coord2);
  }

  return totalDistance / 1000;
}

const credeli = async ({ id, storeids, oid, total, instant }) => {
  try {
    const user = await User.findById(id);
    const order = await Order.findOne({ orderId: oid });

    let coordinates = [];
    for (let storeid of storeids) {
      const mainstore = await User.findById(storeid);
      let stores = mainstore.storeAddress[0];
      const store = {
        streetaddress: stores.buildingno,
        state: stores.state,
        city: stores.city,
        landmark: stores.landmark,
        pincode: stores.postal,
        country: "India",
        coordinates: stores.coordinates,
      };

      coordinates.push({
        latitude: store?.coordinates?.latitude,
        longitude: store?.coordinates?.longitude,
        address: store,
        id: mainstore._id,
      });
    }

    const sortedCoordinates = geolib.orderByDistance(
      {
        latitude: user.address.coordinates.latitude,
        longitude: user.address.coordinates.longitude,
      },
      coordinates
    );

    let partners = [];

    const deliverypartners = await Deluser.find({
      accounttype: "partner",
      primaryloc: user.address.city,
    });

    for (let deliverypartner of deliverypartners) {
      if (
        deliverypartner &&
        deliverypartner.accstatus !== "banned" &&
        deliverypartner.accstatus !== "review" &&
        deliverypartner.deliveries?.length < 21 &&
        deliverypartner.totalbalance < 3000
      ) {
        partners.push({
          latitude: deliverypartner.currentlocation?.latitude,
          longitude: deliverypartner.currentlocation?.longitude,
          id: deliverypartner?._id,
        });
      }
    }

    let eligiblepartner = geolib.findNearest(
      sortedCoordinates[sortedCoordinates.length - 1],
      partners
    );

    if (eligiblepartner) {
      const driver = await Deluser.findById(eligiblepartner.id);

      const finalcoordinates = [
        {
          latitude: user.address.coordinates.latitude,
          longitude: user.address.coordinates.longitude,
        },
        ...sortedCoordinates.map(coord => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
        })),
        {
          latitude: eligiblepartner.latitude,
          longitude: eligiblepartner.longitude,
        },
      ];

      const totalDistance = calculateTotalDistance(finalcoordinates);
      const earning = totalDistance * foodadmount;

      let marks = [
        {
          latitude: eligiblepartner.latitude,
          longitude: eligiblepartner.longitude,
          done: true,
        },
      ];

      for (let final of sortedCoordinates) {
        marks.push({
          latitude: final.latitude,
          longitude: final.longitude,
          done: false,
          address: final.address,
        });
      }

      marks.push({
        latitude: user.address.coordinates.latitude,
        longitude: user.address.coordinates.longitude,
        done: false,
        address: user.address,
      });

      const newDeliveries = new Delivery({
        title: user.fullname,
        amount: total,
        orderId: oid,
        pickupaddress: sortedCoordinates[0].address,
        partner: driver._id,
        droppingaddress: user.address,
        phonenumber: user.phone,
        mode: order.paymentMode || "Cash",
        marks: marks,
        earning: earning > 150 ? 150 : earning,
        where: "customer",
        data: order.data,
      });
      await newDeliveries.save();

      await Deluser.updateOne(
        { _id: driver._id },
        { $push: { deliveries: newDeliveries._id } }
      );

      const msg = {
        notification: {
          title: "A new delivery has arrived.",
          body: `From ${user.fullname} OrderId #${oid}`,
        },
        data: {},
        tokens: [driver.notificationtoken],
      };

      // await admin
      //   .messaging()
      //   .sendEachForMulticast(msg)
      //   .then((response) => {
      //     console.log("Successfully sent message");
      //   })
      //   .catch((error) => {
      //     console.log("Error sending message:", error);
      //   });
    } else {
      console.log("No drivers available at the moment!");
    }
  } catch (error) {
    console.error("Error in delivery creation:", error);
  }
};


exports.fetchwithdrawrequest = async (req, res) => {
  try {
    const { id } = req.params

    const withdraw = await WithdrawRequest.find({ userid: id })

    const data = withdraw.reverse()

    res.status(200).json({ success: true, data })

  } catch (error) {
    res.status(400).json({ success: false, message: "Internal Server Error" })
    console.log(error)
  }
}

exports.createrzporder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, deliverycharges, productId, total, path } = req.body;

    const ordern = await Order.countDocuments();
    const user = await User.findById(id);
    const products = await Product.find({ _id: { $in: productId } })
      .populate("creator", "storeAddress")
      .populate("collectionss", "category");

    let oi = Math.floor(Math.random() * 9000000) + 1000000;

    let fast = [];
    let slow = [];

    if (!user || products.length <= 0) {
      return res.status(404).json({ message: "User or Product not found" });
    } else {
      for (let product of products) {
        // Separating food and grocery
        if (
          product.collectionss &&
          product.collectionss.category === "Food and Grocery"
        ) {
          fast.push(product._id);
        } else {
          slow.push(product._id);
        }
      }

      // Generating msgId
      function msgid() {
        return Math.floor(100000 + Math.random() * 900000);
      }

      let finalmaindata = [];

      // For Food & Grocery
      if (fast.length > 0) {
        let sellers = [];
        let maindata = [];
        let qty = [];
        let prices = [];

        // Checking for products in fast
        let matchedObjects = [];
        user.cart.forEach((obj1) => {
          let matchingObj = fast.find(
            (obj2) => obj2?.toString() === obj1.product?.toString()
          );

          if (matchingObj) {
            matchedObjects.push(obj1);
          }
        });

        for (let i = 0; i < matchedObjects.length; i++) {
          const product = await Product.findById(
            matchedObjects[i].product
          ).populate("creator", "storeAddress");
          prices.push(product?.discountedprice);
          sellers.push(product?.creator?._id);
          qty.push(matchedObjects[i].quantity);
          maindata.push({
            product: product._id,
            seller: product?.creator?._id,
            price: product?.discountedprice,
            qty: matchedObjects[i].quantity,
          });

          finalmaindata.push({
            product: product._id,
            seller: product?.creator?._id,
            price: product?.discountedprice,
            qty: matchedObjects[i].quantity,
          });
        }

        let finalqty = sumArray(qty);
        let finalamount = sumArray(prices);

        // A new order is created
        const order = new Order({
          buyerId: user._id,
          productId: fast,
          quantity: finalqty === 0 ? 1 : finalqty,
          total: finalamount,
          orderId: oi,
          paymentMode: "UPI",
          currentStatus: "pending",
          deliverycharges: deliverycharges,
          timing: "Arriving Soon!",
          orderno: ordern + 1,
          data: maindata,
          sellerId: sellers,
        });
        await order.save();

        // Updating order in customer's purchase history
        await User.updateOne(
          { _id: user._id },
          { $push: { puchase_history: order._id } }
        );
      }

      // For Usual
      if (slow.length > 0) {
        let sellers = [];
        let maindata = [];
        let qty = [];
        let prices = [];

        // Checking for products in slow
        let matchedObjects = [];
        user.cart.forEach((obj1) => {
          let matchingObj = slow.find(
            (obj2) => obj2?.toString() === obj1.product?.toString()
          );

          if (matchingObj) {
            matchedObjects.push(obj1);
          }
        });

        for (let i = 0; i < matchedObjects.length; i++) {
          const product = await Product.findById(
            matchedObjects[i].product
          ).populate("creator", "storeAddress");
          prices.push(product?.discountedprice);
          sellers.push(product?.creator?._id);
          qty.push(matchedObjects[i].quantity);
          maindata.push({
            product: product._id,
            seller: product?.creator?._id,
            price: product?.discountedprice,
            qty: matchedObjects[i].quantity,
          });

          finalmaindata.push({
            product: product._id,
            seller: product?.creator?._id,
            price: product?.discountedprice,
            qty: matchedObjects[i].quantity,
          });
        }

        let finalqty = sumArray(qty);
        let finalamount = sumArray(prices);


        // A new order is created
        const order = new Order({
          buyerId: user._id,
          productId: slow,
          quantity: finalqty === 0 ? 1 : finalqty,
          total: finalamount,
          orderId: oi,
          paymentMode: "UPI",
          currentStatus: "pending",
          deliverycharges: deliverycharges,
          timing: "Tomorrow, by 7:00 pm",
          orderno: ordern + 1,
          data: maindata,
          sellerId: sellers,
        });
        await order.save();

        // Updating order in customer's purchase history
        await User.updateOne(
          { _id: user._id },
          { $push: { puchase_history: order._id } }
        );
      }
    }

    let pids = JSON.stringify(productId);

    console.log(oi, "orderId")

    let payload = {
      merchantId: process.env.WEBAPP_MERCHANT_ID,
      merchantTransactionId: oi.toString(),
      merchantUserId: user._id,
      amount: parseInt(total),
      redirectUrl: `https://grovyo.com/${path}`,
      // redirectUrl: `https://grovyo.com/${path}`,
      redirectMode: "REDIRECT",
      // callbackUrl: `http://192.168.1.6:7190/api/v1/finaliseorder/${user._id}/${oi}`,
      callbackUrl: `https://work.grovyo.xyz/api/v1/finaliseorder/${user._id}/${oi}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    let bufferObj = Buffer.from(JSON.stringify(payload), "utf8");

    let base64string = bufferObj.toString("base64");

    let string = base64string + "/pg/v1/pay" + process.env.WEBAPP_PHONE_PAY_KEY;
    let shaString = sha256(string);

    let checkSum = shaString + "###" + process.env.keyIndex;

    await axios
      .post(
        "https://api.phonepe.com/apis/hermes/pg/v1/pay",
        // `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay`,

        { request: base64string },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checkSum,
            accept: "application/json",
          },
        }
      )
      .then((response) => {
        console.log(
          response.data,
          response.data.data.instrumentResponse.redirectInfo.url
        );
        res.status(200).json({
          success: true,
          url: response.data.data.instrumentResponse.redirectInfo.url,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status({ success: false, message: err.message });
      });

  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

// Helper function to sum an array
function sumArray(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

exports.finaliseorder = async (req, res) => {
  try {
    const { id, ordId } = req.params;
    console.log(ordId, "ordId", typeof ordId, ordId.toString())

    const user = await User.findById(id).populate({
      path: "cart",
      populate: {
        path: "product",
        model: "Product",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User or Product not found" });
    }

    function generateChecksum(
      merchantId,
      merchantTransactionId,
      saltKey,
      saltIndex
    ) {
      const stringToHash =
        `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
      const shaHash = sha256(stringToHash)?.toString();
      const checksum = shaHash + "###" + saltIndex;

      return checksum;
    }

    const checksum = generateChecksum(
      process.env.WEBAPP_MERCHANT_ID,
      ordId,
      process.env.WEBAPP_PHONE_PAY_KEY,
      process.env.keyIndex
    );
    const response = await axios.get(
      `https://api.phonepe.com/apis/hermes/pg/v1/status/${process.env.WEBAPP_MERCHANT_ID}/${ordId.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": process.env.WEBAPP_MERCHANT_ID,
        },
      }
    );
    if (response.data.code === "PAYMENT_SUCCESS") {
      console.log("Payment Successful");
      await Order.updateMany(
        { orderId: ordId },
        { $set: { currentStatus: "processing", onlineorderid: ordId } }
      );

      await User.updateOne(
        { _id: user._id },
        { $unset: { cart: [], cartproducts: [] } }
      );

      const order = await Order.findOne({ orderId: ordId });

      for (let item of user.cart) {
        const sellerOrder = new SellerOrder({
          buyerId: order.buyerId,
          productId: item.product._id,
          quantity: item.quantity,
          total: item.total,
          orderId: ordId,
          paymentMode: "Cash",
          currentStatus: "processing",
          deliverycharges: order.deliverycharges,
          sellerId: item.product.creator._id,
          orderno: parseInt(await Order.countDocuments() + 1),
        });
        await sellerOrder.save();

        const product = await Product.findById(item.product._id).populate("creator", "storeAddress ismembershipactive memberships");

        let deduction = 0;
        if (product.creator.ismembershipactive === false ||
          product.creator.memberships.membership?.toString() === "65671e5204b7d0d07ef0e796") {
          deduction = product.discountedprice * 0.1;
        }

        let today = new Date();
        let formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

        if (deduction > 0) {
          const earned = {
            how: "Sales Commission",
            amount: deduction,
            when: Date.now(),
            id: order._id,
          };

          await Admin.updateOne(
            { date: formattedDate },
            {
              $inc: { todayearning: deduction },
              $push: { earningtype: earned },
            }
          );
        }

        const storeearning = product.discountedprice - deduction;
        const earning = { how: "product", when: Date.now() };

        await User.updateOne(
          { _id: product.creator._id },
          {
            $addToSet: { customers: user._id, earningtype: earning },
            $inc: { storeearning: storeearning },
          }
        );

        await Product.updateOne(
          { _id: product._id },
          { $inc: { itemsold: 1 } }
        );
      }

      const sendMessage = async (sender, receiver, message) => {
        const conversation = await Conversation.findOne({ members: { $all: [sender._id, receiver._id] } }) || new Conversation({ members: [sender._id, receiver._id] });
        if (!conversation._id) await conversation.save();

        const msgId = Math.floor(100000 + Math.random() * 900000);
        const timestamp = new Date();
        const senderPic = process.env.URL + sender.profilepic;
        const receiverPic = process.env.URL + receiver.profilepic;

        const data = {
          conversationId: conversation._id,
          sender: sender._id,
          text: message,
          mesId: msgId,
        };

        const msg = new Message(data);
        await msg.save();

        if (receiver.notificationtoken) {
          const notification = {
            notification: {
              title: sender.fullname,
              body: message,
            },
            data: {
              screen: "Conversation",
              sender_fullname: sender.fullname,
              sender_id: sender._id,
              text: message,
              convId: conversation._id?.toString(),
              createdAt: timestamp?.toString(),
              mesId: msgId.toString(),
              typ: "message",
              senderuname: sender.username,
              senderverification: sender.isverified.toString(),
              senderpic: senderPic,
              reciever_fullname: receiver.fullname,
              reciever_username: receiver.username,
              reciever_isverified: receiver.isverified.toString(),
              reciever_pic: receiverPic,
              reciever_id: receiver._id.toString(),
            },
            token: receiver.notificationtoken,
          };

          // await admin.messaging().send(notification).catch(console.error);
        }
      };

      const workspace = await User.findById("65f5539d09dbe77dea51400d");
      const sellers = user.cart.map(item => item.product.creator._id);

      for (const sellerId of sellers) {
        const seller = await User.findById(sellerId);
        await sendMessage(workspace, seller, `A new order with orderId #${order.orderId} has arrived.`);
      }

      const flash = await User.findById("655e189fb919c70bf6895485");
      const mainUser = await User.findById("65314cd99db37d9109914f3f");
      await sendMessage(flash, mainUser, `A new order with orderId ${ordId} has arrived.`);
      let today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

      for (let sellerId of order.sellerId) {
        let sellerUser = await User.findById(sellerId);

        let analytics = await Analytics.findOne({ date: formattedDate, id: sellerUser._id });
        if (analytics) {
          await Analytics.updateOne(
            { _id: analytics._id },
            { $inc: { Sales: 1 } }
          );
        } else {
          const newAnalytics = new Analytics({
            date: formattedDate,
            id: sellerUser._id,
            Sales: 1,
          });
          await newAnalytics.save();
        }
      }

      const finalOrders = await Order.find({ orderId: ordId })
      for (let order of finalOrders) {
        credeli({
          oid: order.orderId,
          id: user._id,
          storeids: sellers,
          total: order.total,
          instant: order?.collectionss ? order?.collectionss?.category === "Food & Grocery" : false,
        });
      }

      res.status(200).json({ success: true });
    } else if (response.data.code === "PAYMENT_ERROR") {
      console.log("payment failed")

      await Order.updateOne(
        { orderId: ordId },
        { $set: { currentStatus: "failed", onlineorderid: ordId } }
      );

      res.status(200).json({ success: false });
    }

  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false });
  }
};
