const Ads = require("../models/Ads");
const User = require("../models/userAuth");
const Minio = require("minio");
const Verification = require("../models/Veriification");
const Transaction = require("../models/AdTransactions");
const Order = require("../models/orders")
const Community = require("../models/community")
const Product = require("../models/product")
const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken")
const aesjs = require("aes-js");
const Adbyloccategory = require("../models/Adbyloccategory")
require("dotenv").config();
const uuid = require("uuid").v4;
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const {
  validatePaymentVerification,
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const sharp = require("sharp");
const admin = require("../fireb")
const LocationData = require("../models/Data")
const sha256 = require("sha256")

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});
const Advertiser = require("../models/Advertiser");
const Post = require("../models/post");
const Topic = require("../models/topic");
const Approvals = require("../models/Approvals");
const Analytics = require("../models/Analytics");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const { default: axios } = require("axios");

function generateSessionId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

//function to generate a presignedurl of minio
async function generatePresignedUrl(bucketName, objectName, expiry = 604800) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
    return presignedUrl;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate presigned URL");
  }
}

const encryptaes = (data) => {
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

const decryptaes = (data) => {
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

const BUCKET_NAME = process.env.BUCKET_NAME;
const PRODUCT_BUCKET = process.env.PRODUCT_BUCKET;
const POST_BUCKET = process.env.POST_BUCKET;
const AD_BUCKET = process.env.AD_BUCKET;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


function generateAccessToken(data) {
  const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "1h",
  });
  return access_token;
}

function generateRefreshToken(data) {
  const refresh_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "10d",
  });
  return refresh_token;
}

// refresh and access token generation
exports.refreshingsAdsTokens = async (req, res) => {
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
          const advertiser = await Advertiser.findById(payload.advid);

          if (!advertiser) {
            return res
              .status(400)
              .json({ success: false, message: "advertiser not found" });
          }
          // const dp = await generatePresignedUrl(
          //   "images",
          //   advertiser.image,
          //   60 * 60
          // );
          const dp = process.env.URL + advertiser.image

          const data = {
            userid: advertiser.userid,
            advid: advertiser._id,
            image: dp,
            firstname: advertiser.firstname,
            lastname: advertiser.lastname,
            country: advertiser.country,
            city: advertiser.city,
            address: advertiser.address,
            accounttype: advertiser.type,
            taxinfo: advertiser.taxinfo,
            email: advertiser.email,
            advertiserid: advertiser.advertiserid,

          };
          const access_token = generateAccessToken(data);
          res.status(200).json({ success: true, access_token });
        } catch (err) {
          console.log(err);
          res.status(400).json({ success: false });
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Internal server error" });
  }
};

//genrate a random id
function generateUniqueID() {
  let advertiserID;
  advertiserID = Date.now();
  return advertiserID.toString();
}

// exports.checkaccount = async (req, res) => {
//   const { phone, email, password } = req.body;
//   try {
//     let advertiser;
//     if (email && password) {
//       advertiser = await Advertiser.findOne({ email, password });
//     } else if (phone) {
//       advertiser = await Advertiser.findOne({ phone });
//     } else {
//       return res.status(400).json({
//         message: "Invalid request. Please provide email, password, or phone.",
//         success: false,
//       });
//     }
//     if (advertiser) {

//       const dp = process.env.URL + advertiser.image
//       const sessionId = generateSessionId();
//       const newEditCount = {
//         login: Date.now().toString(),
//       };
//       await Advertiser.updateOne(
//         { _id: advertiser._id },
//         {
//           $push: { logs: newEditCount },
//         }
//       );
//       const data = {
//         userid: advertiser.userid,
//         advid: advertiser._id,
//         image: dp,
//         firstname: advertiser.firstname,
//         lastname: advertiser.lastname,
//         country: advertiser.country,
//         city: advertiser.city,
//         address: advertiser.address,
//         accounttype: advertiser.type,
//         taxinfo: advertiser.taxinfo,
//         email: advertiser.email,
//         advertiserid: advertiser.advertiserid,
//         sessionId
//       };

//       const access_token = generateAccessToken(data)
//       const refresh_token = generateRefreshToken(data)
//       return res.status(200).json({
//         message: "Advertiser exists",
//         advertiser,
//         access_token,
//         refresh_token,
//         userid: advertiser.userid,
//         dp,
//         sessionId,
//         success: true,
//       });
//     } else {

//       return res
//         .status(404)
//         .json({ message: "Advertiser not found", success: false });
//     }
//   } catch (e) {
//     console.log(e)
//     res.status(400).json({ message: "Something went wrong", success: false });
//   }
// };

exports.loginAdspace = async (req, res) => {
  const { phone, email, password } = req.body;
  try {
    let advertiser;
    if (email && password) {
      advertiser = await Advertiser.findOne({ email, password });
    } else if (phone) {
      advertiser = await Advertiser.findOne({ phone: "91" + phone });
    } else {
      return res.status(400).json({
        message: "Invalid request. Please provide email, password, or phone.",
        success: false,
      });
    }
    if (advertiser) {

      const dp = process.env.URL + advertiser.image

      const newEditCount = {
        login: Date.now().toString(),
      };
      await Advertiser.updateOne(
        { _id: advertiser._id },
        {
          $push: { logs: newEditCount },
        }
      );
      const data = {
        userid: advertiser?.userid,
        advid: advertiser?._id,
        image: dp,
        firstname: advertiser?.firstname,
        lastname: advertiser?.lastname,
        country: advertiser?.country,
        city: advertiser?.city,
        address: advertiser?.address,
        accounttype: advertiser?.type,
        taxinfo: advertiser?.taxinfo,
        email: advertiser?.email,
        advertiserid: advertiser?.advertiserid,

      };

      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)
      return res.status(200).json({
        message: "Advertiser exists",
        advertiser,
        access_token,
        refresh_token,
        userid: advertiser.userid,
        dp,
        success: true,
      });
    } else {
      let user
      if (email && password) {
        const enpas = encryptaes(password)
        user = await User.findOne({ email, passw: enpas });
      } else if (phone) {
        user = await User.findOne({ phone: "91" + phone });
      } else {
        return res.status(400).json({
          message: "Invalid request. Please provide email, password, or phone.",
          success: false,
          accountexist: false
        });
      }

      if (!user) {
        return res.status(200).json({ success: false, accountexist: false, message: "User not found!" })
      }

      const firstname = user.fullname.split(" ")[0]
      const lastname = user.fullname.split(" ")[1]
      const dp = process.env.URL + user.profilepic

      const advertisernew = new Advertiser({
        firstname,
        lastname,
        image: user?.profilepic,
        phone: user?.phone,
        email: user?.email,
        address: user?.address.streetaddress,
        password: decryptaes(user.passw),
        city: user?.address.city,
        state: user?.address.state,
        pincode: user?.address.pincode,
        landmark: user?.address.landmark,
        userid: user?._id,
        advertiserid: generateUniqueID()
      })

      const savedAdvertiser = await advertisernew.save()

      user.advertiserid = savedAdvertiser._id
      await user.save()

      const data = {
        userid: savedAdvertiser.userid,
        advid: savedAdvertiser._id,
        image: dp,
        firstname: savedAdvertiser.firstname,
        lastname: savedAdvertiser.lastname,
        country: savedAdvertiser.country,
        city: savedAdvertiser.city,
        address: savedAdvertiser.address,
        accounttype: savedAdvertiser.type,
        taxinfo: savedAdvertiser.taxinfo,
        email: savedAdvertiser.email,
        advertiserid: savedAdvertiser.advertiserid,
      };

      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)

      res.status(203).json({ success: true, message: "Account Created", access_token, refresh_token })
    }
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//create adv account !!missing password hashing
exports.createadvacc = async (req, res) => {
  const {
    firstname,
    lastname,
    city,
    state,
    landmark,
    email,
    phone,
    type,
    pincode,
    address,
    organizationname,
    pan,
    gst,
    password,
    retypepassword,
  } = req.body;

  try {
    const advertiser = await Advertiser.findOne({
      $or: [{ email: email }, { phone: phone }],
    })
    const user = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    })
    console.log(user.fullname, phone, email)
    let savedAdv
    console.log(advertiser)
    console.log(!advertiser && !user)
    console.log(!advertiser && user)
    if (!advertiser && !user) {

      const advid = generateUniqueID();
      const uuidString = uuid();
      const image = req.file;

      console.log("first")

      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      const adv = new Advertiser({
        firstname,
        lastname,
        city,
        state,
        landmark,
        email,
        phone,
        type,
        pincode,
        address,
        advertiserid: advid,
        image: objectName,
        organizationname,
        pan,
        gst,
        password,
        retypepassword,
      });

      console.log("runnded not user not advertiser")
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: image.buffer,
          ContentType: image.mimetype,
        })
      );

      savedAdv = await adv.save();

      //generate random username
      const generateRandomUsername = () => {
        const min = 100;
        const max = 999;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        const usernam = `${firstname + lastname.replace(/\s/g, "").toLowerCase()
          }_${randomNumber}`;
        return usernam;
      };

      let username = generateRandomUsername();

      //address
      const finaladdress = {
        buildingno: address,
        city: city,
        state: state,

        landmark: landmark,
        gst: gst,
      };

      //creating a user account
      const user = new User({
        fullname: firstname + " " + lastname,
        username: username,
        email: email,
        passw: encryptaes(password),
        phone: phone,
        profilepic: objectName,
        desc: "Hi, I am on Grovyo",
        address: finaladdress,
        adid: advid,
        advertiserid: savedAdv._id
      });
      const thisScopeUser = await user.save();

      await Advertiser.updateOne(
        { _id: savedAdv._id },
        {
          $set: { userid: thisScopeUser._id },
        }
      );
    } else if (!advertiser && user) {
      console.log("second")
      const advid = generateUniqueID();
      const uuidString = uuid();
      const image = req.file;

      let objectName = `${Date.now()}_${uuidString}_${image.originalname}`;

      const adv = new Advertiser({
        firstname,
        lastname,
        city,
        state,
        landmark,
        email,
        phone,
        type,
        pincode,
        address,
        advertiserid: advid,
        image: objectName,
        organizationname,
        pan,
        gst,
        password,
        retypepassword,
        userid: user._id,
      })

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: image.buffer,
          ContentType: image.mimetype,
        })
      );

      savedAdv = await adv.save();

      await User.updateOne(
        { _id: user._id },
        {
          $set: { adid: advid, advertiserid: savedAdv._id },
        }
      );
    }


    console.log(savedAdv, "savedAdv")

    const data = {
      userid: savedAdv?.userid,
      advid: savedAdv?._id,
      image: process.env.URL + savedAdv?.image,
      firstname: savedAdv?.firstname,
      lastname: savedAdv?.lastname,
      country: savedAdv?.country,
      city: savedAdv?.city,
      address: savedAdv?.address,
      accounttype: savedAdv?.type,
      taxinfo: savedAdv?.taxinfo,
      email: savedAdv?.email,
      advertiserid: savedAdv?.advertiserid,
    };

    console.log(data)

    const access_token = generateAccessToken(data)
    const refresh_token = generateRefreshToken(data)
    res.status(200).json({
      success: true, access_token,
      refresh_token
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

exports.newad = async (req, res) => {
  const { id, userId } = req.params;
  const {
    adname,
    startdate,
    enddate,
    cta,
    ctalink,
    goal,
    headline,
    desc,
    preferedsection,
    tags,
    location,
    agerange,
    maxage,
    minage,
    totalbudget,
    dailybudget,
    estaudience,
    category,
    age,
    adid,
    gender,
    advertiserid,
    communityName,
    communityDesc,
    communityCategory,
  } = req.body;

  try {
    const user = await Advertiser.findById(id);
    const userauth = await User.findById(userId)

    let pos = [];

    const uuidString = uuid();
    if (!user) {
      res.status(404).json({ message: "No user found!", success: false });
    } else {

      //community dp and creation of community
      let objectName
      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i].fieldname === "communityImage") {
          objectName = `${Date.now()}_${uuidString}_${req.files[i].originalname}`;
          a = objectName;
          const result = await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
        }
      }


      const community = new Community({
        title: communityName,
        creator: userId,
        dp: objectName,
        desc: communityDesc,
        category: communityCategory,
        type: "public"
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
          $push: { members: userId, admins: userauth._id },
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
            communitycreated: savedcom._id
          },
          $inc: { totaltopics: 3, totalcom: 1 },
        }
      );

      let contents
      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i].fieldname === "file") {
          objectName = `${Date.now()}_${uuidString}_${req.files[i].originalname}`;
          a = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: AD_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
          await s3.send(
            new PutObjectCommand({
              Bucket: POST_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
          contents = {
            extension: req.files[i].mimetype,
            name: objectName,
          };


          //for post
          pos.push({ content: objectName, type: req.files[i].mimetype });
        }
      }
      const newAd = new Ads({
        adname,
        startdate,
        enddate,
        cta,
        ctalink,
        goal,
        headline,
        desc,
        preferedsection,
        tags,
        location,
        agerange,
        maxage,
        minage,
        totalbudget,
        age,
        dailybudget,
        estaudience,
        category,
        content: contents,
        adid: adid,
        gender,
        advertiserid,
      });
      const adSaved = await newAd.save();
      user.ads.push(adSaved._id)
      await user.save()


      //creating a post of ad
      const topic = await Topic.find({ community: community._id }).find({
        title: "Posts",
      });

      const post = new Post({
        title: headline,
        desc: desc,
        community: community._id,
        sender: userId,
        topicId: topic[0]._id,
        post: pos,
        tags: community.category,
        kind: "ad",
        promoid: adSaved._id,
        isPromoted: true
      });
      const savedpost = await post.save();

      const approve = new Approvals({
        id: adSaved._id,
        type: "ad"
      })

      await approve.save()
      await Community.updateOne(
        { _id: community._id },
        { $push: { posts: savedpost._id }, $inc: { totalposts: 1 } }
      );

      await Topic.updateOne(
        { _id: topic[0]._id.toString() },
        { $push: { posts: savedpost._id }, $inc: { postcount: 1 } }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.createad = async (req, res) => {
  const { id } = req.params
  const {
    adname,
    startdate,
    enddate,
    cta,
    ctalink,
    goal,
    headline,
    desc,
    age,
    tags,
    location,
    agerange,
    maxage,
    minage,
    totalbudget,
    dailybudget,
    type,
    estaudience,
    category,
    adid,
    gender,
    file,
    contenttype,
    advertiserid,
    postid,
    comid
  } = req.body;
  try {

    console.log(req.files, req.body)

    const user = await Advertiser.findById(id)
    const pos = []
    const uuidString = uuid();
    const community = await Community.findById(comid)
    let contents
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i].fieldname === "file") {
          objectName = `${Date.now()}_${uuidString}_${req.files[i].originalname}`;
          a = objectName;
          await s3.send(
            new PutObjectCommand({
              Bucket: AD_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
          await s3.send(
            new PutObjectCommand({
              Bucket: POST_BUCKET,
              Key: objectName,
              Body: req.files[i].buffer,
              ContentType: req.files[i].mimetype,
            })
          );
          contents = {
            extension: req.files[i].mimetype,
            name: objectName,
          };
          //for post
          pos.push({ content: objectName, type: req.files[i].mimetype });
        }
      }

    } else {
      const cont = file.split(".net/")[1]
      const extensionss = cont.split(".").pop()
      let objectMedia = `${Date.now()}_${uuidString}_${cont}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: AD_BUCKET,
          Key: objectMedia,
        })
      );

      contents = {
        extension: `${contenttype}/${extensionss}`,
        name: objectMedia,
      };
    }

    const newAd = new Ads({
      adname,
      startdate,
      enddate,
      cta,
      ctalink,
      goal,
      type,
      headline,
      desc,
      tags,
      location,
      agerange,
      type,
      maxage,
      minage,
      age,
      totalbudget,
      dailybudget,
      estaudience,
      category,
      content: contents,
      creation: Date.now(),
      adid: adid,
      gender,
      advertiserid,
    });
    const adSaved = await newAd.save();
    user.ads.push(adSaved._id)
    await user.save()

    const topic = await Topic.find({ community: comid }).find({
      title: "Posts",
    });


    let idofad

    if (!postid) {

      const post = new Post({
        title: headline,
        desc: desc,
        community: comid,
        sender: user.userid,
        post: pos,
        topicId: topic[0]._id,
        tags: community.category,
        kind: "ad",
        isPromoted: true,
        cta,
        ctalink,
        adtype: type,
        promoid: adSaved._id
      });
      const savedpost = await post.save();
      const ads = await Ads.findById(adSaved._id)
      ads.postid = savedpost._id

      idofad = await ads.save()
      await Community.updateOne(
        { _id: comid },
        { $push: { posts: savedpost._id }, $inc: { totalposts: 1 } }
      );

      await Topic.updateOne(
        { _id: topic[0]._id.toString() },
        { $push: { posts: savedpost._id }, $inc: { postcount: 1 } }
      );

    }

    const post = await Post.findById(postid)
    post.kind = "ad"
    isPromoted = true
    post.cta = cta
    post.ctalink = ctalink
    post.adtype = type
    post.promoid = adSaved._id

    const savedpost = await post.save()

    const findad = await Ads.findById(adSaved._id)
    findad.postid = savedpost._id
    idofad = await findad.save()

    const approve = new Approvals({
      id: idofad._id,
      type: "ad"
    })

    await approve.save()
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
    console.log(error)
  }
}

exports.getCommunities = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ message: "User Not Found", success: false })
    }
    // let com = []
    const com = await Community.find({ creator: id });
    // for (let i = 0; i < user.communitycreated.length; i++) {

    //   // const c = await Community.findById(user.communitycreated[i].toString())
    //   com.push(c)
    // }

    const communitywithDps = await Promise.all(
      com.map(async (communityId) => {
        const community = await Community.findById(communityId)
        // .populate("promotedPosts");

        if (community) {
          const dps = process.env.URL + community.dp;
          return { ...community.toObject(), dps };
        }

        return null;
      })
    );

    const filteredCommunities = communitywithDps.filter((community) => community !== null);
    console.log(filteredCommunities)
    res.status(200).json({ communitywithDps: filteredCommunities, success: true })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Errors", success: false })
    console.log(error)
  }
}

exports.promotedposts = async (req, res) => {
  try {
    const { id, comid } = req.params
    const { postid } = req.body
    const user = await User.findById(id)
    const post = await Post.findById(postid)
    if (!post) {
      return res.status(400).json({ success: false, message: "Post Not found" })
    }
    if (!user) {
      return res.status(400).json({ message: "User not Found", success: false })
    }
    const community = await Community.findById(comid)
    if (!community) {
      return res.status(400).json({ message: "Community not Found", success: false })
    }
    if (community && user) {
      user.promotedPosts.push(postid)
      post.isPromoted = true
      await post.save()
      await user.save()
      community.promotedPosts.push(postid)
      await community.save()
    }
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" })
    console.log(error)
  }
}

exports.getAllPosts = async (req, res) => {
  try {
    const { comid } = req.params
    const community = await Community.findById(comid).populate("promotedPosts posts")
    if (!community) {
      return res.status(400).json({ success: false, message: "Community Not Found" })
    }
    let posts = []
    for (let i = 0; i < community.posts.length; i++) {

      if (community.posts[i].isPromoted === false) {
        posts.push(community.posts[i])
      }
    }

    let eng = []
    await posts.map((p, i) => {
      let final = p.views <= 0 ? 0 : ((parseInt(p?.sharescount) + parseInt(p?.likes) + parseInt(p?.totalcomments)) / parseInt(p?.views)) * 100;
      eng.push(final)
    })

    const postsToSend = posts.map((f, i) => {
      const postdps = process.env.POST_URL + f.post[0].content

      return ({
        ...f.toObject(),
        image: postdps,
        engrate: eng[i]
      });
    });

    let engpromoted = []
    await posts.map((p, i) => {
      let final = p.views <= 0 ? 0 : ((parseInt(p?.sharescount) + parseInt(p?.likes) + parseInt(p?.totalcomments)) / parseInt(p?.views)) * 100;
      engpromoted.push(final)
    })

    const postsToSendpromoted = community.promotedPosts.map((f, i) => {
      const postdps = process.env.POST_URL + f.post[0].content

      return ({
        ...f.toObject(),
        image: postdps,
        engrate: engpromoted[i]
      });
    });

    res.status(200).json({ success: true, posts: postsToSend, promotedposts: postsToSendpromoted })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

exports.getad = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "No user found!", success: false });
    } else {
      const birthdateString = user.DOB;
      const [birthDay, birthMonth, birthYear] = birthdateString
        .split("/")
        .map(Number);
      const currentDate = new Date();
      const currentDay = currentDate.getDate();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      let age = currentYear - birthYear;
      if (
        currentMonth < birthMonth ||
        (currentMonth === birthMonth && currentDay < birthDay)
      ) {
        age--;
      }
      const ads = [];
      const ad = await Ads.aggregate([
        {
          $match: {
            tags: { $in: user.interest },
            // location: { $eq: user.location },
            status: { $eq: "Active" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "_id",
            as: "creator",
          },
        },
        {
          $addFields: {
            creatorName: { $arrayElemAt: ["$creator.fullname", 0] },
            creatorProfilePic: { $arrayElemAt: ["$creator.profilepic", 0] },
            isverified: { $arrayElemAt: ["$creator.isverified", 0] },
          },
        },
        {
          $project: {
            creator: 0,
          },
        },
        { $sample: { size: 1 } },
      ]);
      for (let i = 0; i < ad.length; i++) {
        if (ad[i].ageup > age && ad[i].agedown < age) {
          ads.push(ad[i]);
        }
      }
      const content = [];
      for (let i = 0; i < ads.length; i++) {
        const dp = await generatePresignedUrl(
          "ads",
          ads[i].content.toString(),
          60 * 60
        );
        content.push(dp);
      }
      const dps = [];
      for (let i = 0; i < ads.length; i++) {
        const dp = await generatePresignedUrl(
          "images",
          ads[i].creatorProfilePic.toString(),
          60 * 60
        );
        dps.push(dp);
      }
      res.status(200).json({ ads, content, dps, success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.getallads = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Advertiser.findById(id);
    if (user) {
      const content = [];
      let ads = []
      for (let i = 0; i < user.ads.length; i++) {
        const id = user.ads[i].toString()
        const h = await Ads.findById(id)
        if (h) {
          const analytics = await Analytics.find({ id: id }).sort({ date: -1 }).limit(7);
          const views = h?.views
          const clicks = h?.clicks
          const totalSpent = h?.totalspent
          const conversion = (clicks / views) * 100
          const popularity = ((clicks / views) / totalSpent) * 100
          const adsToPush = {
            h, analytics, conversion, popularity
          }
          ads.push(adsToPush)
        }
      }
      // for (let i = 0; i < ads.length; i++) {
      //   const a = await generatePresignedUrl(
      //     "ads",
      //     ads[i]?.content[0]?.name ? ads[i]?.content[0]?.name : "",
      //     60 * 60
      //   );
      //   content.push(a);
      // }
      const adsreversed = ads.reverse()
      res.status(200).json({ ads: adsreversed, content, success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: e.message, success: false });
  }
};

//fetch dashboard details
exports.fetchdashboard = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Advertiser.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      res.status(200).json({ success: true, user });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//edit ad status
exports.editcurrentad = async (req, res) => {
  const { id, adid } = req.params;
  const {
    adname,
    startdate,
    enddate,
    cta,
    ctalink,
    goal,
    headline,
    desc,
    preferedsection,
    tags,
    location,
    agerange,
    maxage,
    minage,
    totalbudget,
    dailybudget,
    estaudience,
    category,
    content,
    contenttype,
  } = req.body;

  try {
    const user = await Advertiser.findById(id);
    const Ad = await Ads.findById(adid);
    const uuidString = uuid();
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else if (!Ad) {
      res.status(404).json({ success: false, message: "Ad not found" });
    } else {
      if (contenttype === "image") {
        const image = req.files[0];
        const bucketName = "ads";
        const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
        const newEditCount = {
          date: Date.now().toString(),
          number: 1,
        };
        await sharp(image.buffer)
          .jpeg({ quality: 60 })
          .toBuffer()
          .then(async (data) => {
            await minioClient.putObject(bucketName, objectName, data);
          })
          .catch((err) => {
            console.log(err.message, "-error");
          });

        await Ads.updateOne(
          { _id: adid },
          {
            $set: {
              adname,
              startdate,
              enddate,
              status: "review",
              cta,
              ctalink,
              goal,
              headline,
              desc,
              preferedsection,
              tags,
              location,
              agerange,
              maxage,
              minage,
              totalbudget,
              dailybudget,
              estaudience,
              category,
              content: objectName,
            },
            $push: { editcount: newEditCount },
          }
        );
        res.status(200).json({ success: true });
      } else {
        const { originalname, buffer, mimetype } = req.files[0];

        const size = buffer.byteLength;
        const bucketName = "ads";
        const objectName = `${Date.now()}_${uuidString}_${originalname}`;

        await minioClient.putObject(
          bucketName,
          objectName,
          buffer,
          size,
          mimetype
        );
        await Ads.updateOne(
          { _id: adid },
          {
            $set: {
              adname,
              startdate,
              enddate,
              status: "review",
              cta,
              ctalink,
              goal,
              headline,
              desc,
              preferedsection,
              tags,
              location,
              agerange,
              maxage,
              minage,
              totalbudget,
              dailybudget,
              estaudience,
              category,
              content: objectName,
            },
            $push: { editcount: newEditCount },
          }
        );
        res.status(200).json({ success: true });
      }
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//edit advertiser details
exports.editadvertiser = async (req, res) => {
  const { id } = req.params;
  const {
    firstname,
    lastname,
    state,
    country,
    taxinfo,
    city,
    address,
    accounttype,
  } = req.body;
  try {
    const advertiser = await Advertiser.findById(id);
    if (!advertiser) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const sessionId = generateSessionId()
      const dp = process.env.URL + advertiser.image
      const data = {
        userid: advertiser.userid,
        advid: advertiser._id,
        image: dp,
        firstname: advertiser.firstname,
        lastname: advertiser.lastname,
        country: advertiser.country,
        city: advertiser.city,
        address: advertiser.address,
        accounttype: advertiser.type,
        taxinfo: advertiser.taxinfo,
        email: advertiser.email,
        advertiserid: advertiser.advertiserid,
        sessionId
      };
      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)
      const newEditCount = {
        date: Date.now().toString(),
        number: 1,
      };
      await Advertiser.updateOne(
        { _id: id },
        {
          $set: {
            firstname: firstname,
            lastname: lastname,
            state: state,
            country: country,
            taxinfo: taxinfo,
            city: city,
            address: address,
            type: accounttype,
          },
          $push: { editcount: newEditCount },
        }
      );
      res.status(200).json({ success: true, access_token, refresh_token, sessionId });
    }
  } catch (e) {
    console.log(e)
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//verification of advertiser
exports.verifyadvertiser = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const user = await Advertiser.findById(id);
    const uuidString = uuid();
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const image = req.files[0];
      const bucketName = "imp";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;

      // await sharp(image.buffer)
      //   .jpeg({ quality: 60 })
      //   .toBuffer()
      //   .then(async (data) => {
      //     await minioClient.putObject(bucketName, objectName, data);
      //   })
      //   .catch((err) => {
      //     console.log(err.message, "-error");
      //   });
      const v = new Verification({
        name: name,
        file: objectName,
        status: "review",
        id: id,
      });
      await v.save();
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//logout from adspace
exports.logoutadv = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Advertiser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const newEditCount = {
        logout: Date.now().toString(),
      };
      await Advertiser.updateOne(
        { _id: id },
        {
          $push: { logs: newEditCount },
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//fetching adv payments and balance
exports.gettransactions = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Advertiser.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const transaction = [];
      let amount = user.currentbalance;
      for (let i = 0; i < user.transactions.length; i++) {
        const t = await Transaction.findById(user.transactions[i]);
        transaction.push(t);
      }
      transaction.reverse();
      res.status(200).json({ success: true, transaction, amount });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//addmoney to wallet
exports.addmoneytowallet = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    const user = await Advertiser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const newid = Date.now();
      const t = new Transaction({
        amount: amount / 100,
        type: "Wallet",
        transactionid: newid,
      });
      const tId = await t.save();

      await Advertiser.updateOne({ _id: id },
        { $push: { transactions: tId._id }, }
      );

      let payload = {
        "merchantId": process.env.MERCHANT_ID,
        "merchantTransactionId": tId._id,
        "merchantUserId": user._id,
        "amount": amount,
        "redirectUrl": "https://ads.grovyo.com/main/wallet",
        "redirectMode": "REDIRECT",
        "callbackUrl": `https://work.grovyo.xyz/api/updatetransactionstatus/${id}/${tId._id}/${amount}`,
        "paymentInstrument": {
          "type": "PAY_PAGE"
        }
      }
      let bufferObj = Buffer.from(JSON.stringify(payload), "utf8")

      let base64string = bufferObj.toString("base64")

      let string = base64string + "/pg/v1/pay" + process.env.PHONE_PAY_KEY
      let shaString = sha256(string)

      let checkSum = shaString + "###" + process.env.keyIndex

      axios.post("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", { "request": base64string }, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checkSum,
          "accept": "application/json"
        }
      }).then((response) => {
        console.log(response.data, response.data.data.instrumentResponse.redirectInfo.url)
        res.status(200).json({ success: true, url: response.data.data.instrumentResponse.redirectInfo.url })

      }).catch((err) => {
        console.log(err)
        return res.status({ success: false, message: err.message })
      })
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

exports.updatetransactionstatus = async (req, res) => {
  try {
    const { id, tid, amount } = req.params;
    const user = await Advertiser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    }
    function generateChecksum(merchantId, merchantTransactionId, saltKey, saltIndex) {
      const stringToHash = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
      const shaHash = sha256(stringToHash).toString();
      const checksum = shaHash + "###" + saltIndex;

      return checksum;
    }

    const checksum = generateChecksum(process.env.MERCHANT_ID, tid, process.env.PHONE_PAY_KEY, process.env.keyIndex);
    const t = await Transaction.findById(tid);
    const response = await axios.get(`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${process.env.MERCHANT_ID}/${tid}`, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": process.env.MERCHANT_ID
      }
    })
    if (response.data.code === "PAYMENT_SUCCESS") {
      console.log("Payment Successful")
      await Transaction.updateOne(
        { _id: t._id },
        {
          $set: {
            status: "completed",
          },
        }
      );

      await Advertiser.updateOne(
        { _id: id },
        {
          $inc: { currentbalance: amount * 0.01 },
        }
      );
      return res.status(200).json({
        success: true,
      });
    } else if (response.data.code === "PAYMENT_ERROR") {
      console.log("Payment Failed")
      await Transaction.updateOne(
        { _id: t._id },
        {
          $set: {
            status: "failed",
          },
        }
      );
      res.status(400).json({ success: false })
    }

  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false, message: "Something went wrong", })
  }
}

//update transaction status
// exports.updatetransactionstatus = async (req, res) => {
//   const { id } = req.params;
//   const { success, tid, amount, order_id, payment_id, razorpay_signature } = req.body;
//   console.log(req.body)

//   try {
//     const user = await Advertiser.findById(id);
//     if (!user) {
//       res.status(404).json({ success: false, message: "User not found" });
//     } else {
//       const t = await Transaction.findById(tid);
//       console.log(t)
//       if (!t) {
//         res
//           .status(404)
//           .json({ success: false, message: "Transaction not found" });
//       } else {
//         const isValid = validatePaymentVerification(
//           { order_id: order_id, payment_id: payment_id },
//           razorpay_signature,
//           "bxyQhbzS0bHNBnalbBg9QTDo"
//         );
//         console.log(isValid)
//         if (isValid) {
//           await Transaction.updateOne(
//             { _id: t._id },
//             {
//               $set: {
//                 status: "completed",
//               },
//             }
//           );
//           await Advertiser.updateOne(
//             { _id: id },
//             {
//               $inc: { currentbalance: amount },
//             }
//           );
//           return res.status(200).json({
//             success: true,
//           });
//         } else {
//           await Transaction.updateOne(
//             { _id: t._id },
//             {
//               $set: {
//                 status: "failed",
//               },
//             }
//           );
//           res.status(400).json({ success: false })
//         }
//       }
//     }
//   } catch (e) {
//     console.log(e);
//     res.status(400).json({ message: "Something went wrong", success: false });
//   }
// };

exports.addata = async (req, res) => {
  try {
    let {
      locations,
      tagss,
      types,
      myAdPoints,
      categorys,
      myAge,
      myAudience,
      totalmen,
      totalwomen,
      mygender,
      advid,
    } = req.body;
    console.log(
      locations,
      tagss,
      types,
      myAdPoints,
      categorys,
      myAge,
      myAudience,
      totalmen,
      totalwomen,
      mygender,
      advid
    );

    let myArray = types;
    let myTags = tagss;

    // cost calcualation for category using points
    const perCost = 0.1;
    let costPoints = perCost * myAdPoints;

    // locations
    const fetchLLocation = locations;
    // console.log(fetchLLocation)

    // location by audience
    let locwithAudience = myAudience;
    console.log(locwithAudience);

    // sum of audience
    let totalAudience = 0;
    for (let i = 0; i < locwithAudience.length; i++) {
      totalAudience += locwithAudience[i];
    }

    console.log(totalAudience);

    //   men audience by location start
    let locwithMenAudience = totalmen;
    console.log(locwithAudience);

    let totalMenAudience = 0;
    let avgMen;
    for (let i = 0; i < locwithMenAudience.length; i++) {
      totalMenAudience += locwithMenAudience[i];
    }
    avgMen = (totalMenAudience / locwithMenAudience.length).toFixed(2);
    console.log(totalMenAudience);
    console.log(avgMen);

    //   men audience by location end

    //   women audience by location start
    let locwithWomenAudience = totalwomen;
    console.log(locwithWomenAudience);

    let totalWomenAudience = 0;
    let avgwomen;
    for (let i = 0; i < locwithWomenAudience.length; i++) {
      totalWomenAudience += locwithWomenAudience[i];
    }
    avgwomen = (totalWomenAudience / locwithWomenAudience.length).toFixed(2);
    console.log(totalWomenAudience);
    console.log(avgwomen);

    //   women audience by location end

    // calculation according to gender age start
    let AudienceByGender;
    let AudiencebyAge;
    if (mygender === "Men") {
      AudienceByGender = Math.ceil(avgMen * totalAudience);
      if (myAge === "12-18") {
        AudiencebyAge = Math.ceil(AudienceByGender * (20 / 100));
      } else if (myAge === "19-40") {
        AudiencebyAge = Math.ceil(AudienceByGender * (60 / 100));
      } else if (myAge === "41-65") {
        AudiencebyAge = Math.ceil(AudienceByGender * (20 / 100));
      } else {
        AudiencebyAge = AudienceByGender;
      }
    } else if (mygender === "Women") {
      AudienceByGender = avgwomen * totalAudience;
      if (myAge === "12-18") {
        AudiencebyAge = Math.ceil(AudienceByGender * (20 / 100));
      } else if (myAge === "19-40") {
        AudiencebyAge = Math.ceil(AudienceByGender * (60 / 100));
      } else if (myAge === "41-65") {
        AudiencebyAge = Math.ceil(AudienceByGender * (20 / 100));
      } else {
        AudiencebyAge = AudienceByGender;
      }
    } else {
      AudienceByGender = totalAudience;
      if (myAge === "12-18") {
        AudiencebyAge = AudienceByGender * (20 / 100);
      } else if (myAge === "19-40") {
        AudiencebyAge = AudienceByGender * (60 / 100);
      } else if (myAge === "41-65") {
        AudiencebyAge = AudienceByGender * (20 / 100);
      } else {
        AudiencebyAge = AudienceByGender;
      }
    }

    console.log(AudiencebyAge);

    // calculation according to gender age end

    // calculations for ad type (search ads) start
    const elementMappings = {
      infeed: 0.5,
      search: 0.2,
      videoads: 0.4,
    };

    const newArray = myArray.map((element) => {
      if (element in elementMappings) {
        return elementMappings[element];
      }
      return element;
    });

    let sum = 0;

    for (let i of newArray) {
      sum += i;
    }
    // console.log(sum)
    // calculations for ad type (search ads) end

    // calculations for ad tags (search ads) start
    const tagsMapping = {
      [myTags[0]]: Number((0.1 + Math.random() * 0.1).toFixed(2)),
      [myTags[1]]: Number((0.1 + Math.random() * 0.1).toFixed(2)),
      [myTags[2]]: Number((0.1 + Math.random() * 0.1).toFixed(2)),
      [myTags[3]]: Number((0.1 + Math.random() * 0.1).toFixed(2)),
      [myTags[4]]: Number((0.1 + Math.random() * 0.1).toFixed(2)),
    };

    const newTags = myTags.map((element) => {
      if (element in tagsMapping) {
        return tagsMapping[element];
      }

      return element;
    });

    // console.log(newTags);

    let sumtags = 0;
    let average;

    for (let i of newTags) {
      sumtags += i;
    }
    average = sumtags / newTags.length;

    // calculations for ad tags (search ads) end

    // total cost type + tags + categgory
    let totalCost = sum + average + costPoints;
    // console.log(sum, average, costPoints)
    // console.log(totalCost)
    // console.log(
    // 	totalCost)

    let totalPrice = totalCost * AudiencebyAge;
    console.log(totalPrice);

    const datatoSend = {
      Locations: locations,
      Tags: tagss,
      type: types,
      category: categorys,
      audience: AudiencebyAge,
      AdID: advid,
    };
    const newData = new Ad(datatoSend);
    await newData.save();
    res.json({ success: "ok" });
  } catch (err) {
    console.log(err);
  }
};

exports.getData = async (req, res) => {
  try {
    // const PointsCategory = [
    //   {
    //     name: "Gaming",
    //     ctr: 0.02,
    //     audienceByCategory: 0.57,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Technology",
    //     ctr: 0.018,
    //     audienceByCategory: 0.5,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Travel",
    //     ctr: 0.016,
    //     audienceByCategory: 0.52,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Food",
    //     ctr: 0.02,
    //     audienceByCategory: 0.55,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Fashion",
    //     ctr: 0.019,
    //     audienceByCategory: 0.54,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Fitness",
    //     ctr: 0.014,
    //     audienceByCategory: 0.52,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Lifestyle",
    //     ctr: 0.016,
    //     audienceByCategory: 0.45,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Entertainment",
    //     ctr: 0.015,
    //     audienceByCategory: 0.49,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Activism",
    //     ctr: 0.009,
    //     audienceByCategory: 0.3,
    //     points: 2,
    //     selected: false,
    //   },
    //   {
    //     name: "Education",
    //     ctr: 0.019,
    //     audienceByCategory: 0.41,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Art",
    //     ctr: 0.016,
    //     audienceByCategory: 0.37,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Business",
    //     ctr: 0.02,
    //     audienceByCategory: 0.52,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Photography",
    //     ctr: 0.014,
    //     audienceByCategory: 0.3,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Literature",
    //     ctr: 0.009,
    //     audienceByCategory: 0.35,
    //     points: 2,
    //     selected: false,
    //   },
    //   {
    //     name: "Pets",
    //     ctr: 0.013,
    //     audienceByCategory: 0.37,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "DIY",
    //     ctr: 0.012,
    //     audienceByCategory: 0.42,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Community",
    //     ctr: 0.018,
    //     audienceByCategory: 0.48,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Sports",
    //     ctr: 0.02,
    //     audienceByCategory: 0.55,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Music",
    //     ctr: 0.019,
    //     audienceByCategory: 0.5,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Film",
    //     ctr: 0.018,
    //     audienceByCategory: 0.47,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Health",
    //     ctr: 0.016,
    //     audienceByCategory: 0.45,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Home",
    //     ctr: 0.01,
    //     audienceByCategory: 0.25,
    //     points: 2,
    //     selected: false,
    //   },
    //   {
    //     name: "Design",
    //     ctr: 0.011,
    //     audienceByCategory: 0.35,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Science",
    //     ctr: 0.018,
    //     audienceByCategory: 0.5,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "History",
    //     ctr: 0.015,
    //     audienceByCategory: 0.38,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Interests",
    //     ctr: 0.012,
    //     audienceByCategory: 0.35,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Meditation",
    //     ctr: 0.014,
    //     audienceByCategory: 0.45,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Charity",
    //     ctr: 0.012,
    //     audienceByCategory: 0.35,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Tech",
    //     ctr: 0.02,
    //     audienceByCategory: 0.5,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Cars",
    //     ctr: 0.016,
    //     audienceByCategory: 0.4,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Motivation",
    //     ctr: 0.014,
    //     audienceByCategory: 0.43,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Comedy",
    //     ctr: 0.017,
    //     audienceByCategory: 0.47,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Finance",
    //     ctr: 0.017,
    //     audienceByCategory: 0.48,
    //     points: 4,
    //     selected: false,
    //   },
    //   {
    //     name: "Hiking",
    //     ctr: 0.009,
    //     audienceByCategory: 0.35,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Astrology",
    //     ctr: 0.01,
    //     audienceByCategory: 0.35,
    //     points: 1,
    //     selected: false,
    //   },
    //   {
    //     name: "Spirituality",
    //     ctr: 0.012,
    //     audienceByCategory: 0.35,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Language",
    //     ctr: 0.009,
    //     audienceByCategory: 0.3,
    //     points: 2,
    //     selected: false,
    //   },
    //   {
    //     name: "LGBTQ+",
    //     ctr: 0.009,
    //     audienceByCategory: 0.25,
    //     points: 1,
    //     selected: false,
    //   },
    //   {
    //     name: "Startups",
    //     ctr: 0.016,
    //     audienceByCategory: 0.46,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Virtual Reality",
    //     ctr: 0.013,
    //     audienceByCategory: 0.39,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Anime",
    //     ctr: 0.02,
    //     audienceByCategory: 0.55,
    //     points: 5,
    //     selected: false,
    //   },
    //   {
    //     name: "Cosplay",
    //     ctr: 0.012,
    //     audienceByCategory: 0.37,
    //     points: 3,
    //     selected: false,
    //   },
    //   {
    //     name: "Cooking",
    //     ctr: 0.016,
    //     audienceByCategory: 0.45,
    //     points: 3,
    //     selected: false,
    //   },
    // ];

    // const myLocation = [
    //   {
    //     name: "Mumbai",
    //     audienceNo: 1200,
    //     men: 0.54,
    //     women: 0.46,
    //   },
    //   {
    //     name: "Delhi",
    //     audienceNo: 1000,
    //     men: 0.52,
    //     women: 0.48,
    //   },
    //   {
    //     name: "Banglore",
    //     audienceNo: 900,
    //     men: 0.52,
    //     women: 0.48,
    //   },
    //   {
    //     name: "Hyderabad",
    //     audienceNo: 800,
    //     men: 0.51,
    //     women: 0.49,
    //   },
    //   {
    //     name: "Chennai",
    //     audienceNo: 100,
    //     men: 0.503,
    //     women: 0.497,
    //   },
    //   {
    //     name: "Kolkata",
    //     audienceNo: 600,
    //     men: 0.525,
    //     women: 0.475,
    //   },
    //   {
    //     name: "Pune",
    //     audienceNo: 500,
    //     men: 0.52,
    //     women: 0.48,
    //   },
    //   {
    //     name: "Ahmedabad",
    //     audienceNo: 400,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Jaipur",
    //     audienceNo: 300,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Lucknow",
    //     audienceNo: 2000,
    //     men: 0.52,
    //     women: 0.48,
    //   },
    //   {
    //     name: "Kanpur",
    //     audienceNo: 3000,
    //     men: 0.54,
    //     women: 0.46,
    //   },
    //   {
    //     name: "Agra",
    //     audienceNo: 300,
    //     men: 0.534,
    //     women: 0.466,
    //   },
    //   {
    //     name: "Prayagraj",
    //     audienceNo: 250,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Meerut",
    //     audienceNo: 200,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Ghaziabad",
    //     audienceNo: 150,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Noida",
    //     audienceNo: 700,
    //     men: 0.55,
    //     women: 0.45,
    //   },
    //   {
    //     name: "Gorakhpur",
    //     audienceNo: 50,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Jhansi",
    //     audienceNo: 40,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Aligarh",
    //     audienceNo: 30,
    //     men: 0.53,
    //     women: 0.47,
    //   },
    //   {
    //     name: "Mathura",
    //     audienceNo: 10,
    //     men: 0.532,
    //     women: 0.468,
    //   },
    // ];

    // const datatoSend = {
    //   NewLocations: myLocation,
    //   Newcategory: PointsCategory,
    // };

    const check = await Adbyloccategory.findById("65227169cf69893a9474e73e");
    console.log(check)
    if (check) {
      res.status(200).json(check);
    }
  } catch (err) {
    res.status(500).json({ message: "galaat chla" })
    console.log(err);
  }
};

exports.audget = async (req, res) => {
  try {
    const audNo = await Ad.find();
    if (audNo) {
      res.status(200).json(audNo);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getuser = async (req, res) => {
  console.log("runnded")
  const { id } = req.params
  console.log(id)
  try {
    const user = await User.findById(id)
    console.log(user)
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" })
    } else {
      res.status(200).json({ user, success: true })
    }

  } catch (error) {
    res.status(500).json({ message: "internal server error", success: false })
  }
}

//create a new product order(UPI)
exports.createrzporder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, deliverycharges, productId, total } = req.body;
    const user = await User.findById(id);
    const product = await Product.findById(productId).populate(
      "creator",
      "storeAddress"
    );
    let oi = Math.floor(Math.random() * 9000000) + 1000000;

    if (!user && !product) {
      return res.status(404).json({ message: "User or Product not found" });
    } else {
      //a new order is created
      const ord = new Order({
        buyerId: id,
        productId: productId,
        quantity: quantity,
        total: total,
        orderId: oi,
        paymentMode: "UPI",
        currentStatus: "pending",
        deliverycharges: deliverycharges,
        timing: "Tommorow, by 7:00 pm",
      });
      await ord.save();

      //upating order in customers purchase history
      await User.updateOne(
        { _id: id },
        { $push: { puchase_history: ord._id } }
      );
      //  await User.updateOne({ _id: user._id }, { $unset: { cart: [] } });
      let pids = JSON.stringify(productId);
      //creatign a rzp order
      // const instance = new Razorpay({
      //   key_id: "rzp_test_jXDMq8a2wN26Ss",
      //   key_secret: "bxyQhbzS0bHNBnalbBg9QTDo",
      // });
      const instance = new Razorpay({
        key_id: "rzp_live_Ms5I8V8VffSpYq",
        key_secret: "Sy04bmraRqV9RjLRj81MX0g7",
      });
      instance.orders.create(
        {
          amount: parseInt(total),
          currency: "INR",
          receipt: `receipt#${oi}`,
          notes: {
            total,
            quantity,
            deliverycharges,
            pids,
            total,
          },
        }, function (err, order) {
          console.log(err, order);
          if (err) {
            res.status(400).json({ err, success: false });
          } else {
            res.status(200).json({
              oid: order.id,
              order: ord._id,
              phone: user?.phone,
              email: user?.email,
              success: true,
            });
          }
        }
      );
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

//finalising the product order(UPI)
exports.finaliseorder = async (req, res) => {
  try {
    const { id, ordId } = req.params;
    const {
      oid,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User or Product not found" });
    } else {
      const isValid = validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        "bxyQhbzS0bHNBnalbBg9QTDo"
      );

      if (isValid) {
        await Order.updateOne(
          { _id: ordId },
          { $set: { currentStatus: status, onlineorderid: oid } }
        );
        await User.updateOne(
          { _id: user._id },
          { $unset: { cart: [], cartproducts: [] } }
        );

        res.status(200).json({ success: true });
      } else {
        await Order.updateOne(
          { _id: ordId },
          { $set: { currentStatus: status, onlineorderid: oid } }
        );

        res.status(200).json({ success: true });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

exports.fetchingprosite = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ success: false, message: "User Not Found" })
    }
    const community = []
    for (let i = 0; i < user.communitycreated.length; i++) {
      const id = user.communitycreated[i]
      comm = await Community.findById(id).populate("members", "dp")
      community.push(comm)
    }

    const communityDps = await Promise.all(
      community.map((d) => {
        const imageforCommunity =
          process.env.URL + d.dp;

        return imageforCommunity;
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

    console.log(membersdp)

    const communitywithDps = community.map((f, i) => {
      return { ...f.toObject(), dps: communityDps[i], membersdp: membersdp[i] };
    });

    const products = await Product.find({ creator: id })

    const productdps = await Promise.all(
      products.map(async (product) => {
        const a =
          process.env.PRODUCT_URL + product.images[0].content;
        return a
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
      phone: user.phone,
      username: user.username,
      fullname: user.fullname,
      dp: process.env.URL + user.profilepic,
      temp: user.prosite_template,
      email: user.email,
      links: {
        insta: user.insta,
        snap: user.snap,
        x: user.x,
        yt: user.yt,
        linkdin: user.linkdin
      }
    }
    const data = {
      communitywithDps, productsWithDps, userDetails
    }

    res.status(200).json({ success: true, data, user })
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
    console.log(error)
  }
}

exports.feedback = async (req, res) => {
  try {
    const { advid } = req.params
    const { msg } = req.body
    const advertiser = await Advertiser.findById(advid)
    advertiser.message.push(msg)
    await advertiser.save()
    res.status(200).json({ success: true })
  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false })
  }
}

const locationofUsers = async () => {
  try {
    const location = [
      { name: "andra pradesh", total: 0, male: 0, female: 0 },
      { name: "arunachal pradesh", total: 0, male: 0, female: 0 },
      { name: "assam", total: 0, male: 0, female: 0 },
      { name: "bihar", total: 0, male: 0, female: 0 },
      { name: "chhattisgarh", total: 0, male: 0, female: 0 },
      { name: "goa", total: 0, male: 0, female: 0 },
      { name: "gujarat", total: 0, male: 0, female: 0 },
      { name: "haryana", total: 0, male: 0, female: 0 },
      { name: "himachal pradesh", total: 0, male: 0, female: 0 },
      { name: "maharashtra", total: 0, male: 0, female: 0 },
      { name: "manipur", total: 0, male: 0, female: 0 },
      { name: "meghalaya", total: 0, male: 0, female: 0 },
      { name: "jharkhand", total: 0, male: 0, female: 0 },
      { name: "karnataka", total: 0, male: 0, female: 0 },
      { name: "madya pradesh", total: 0, male: 0, female: 0 },
      { name: "kerala", total: 0, male: 0, female: 0 },
      { name: "mizoram", total: 0, male: 0, female: 0 },
      { name: "nagaland", total: 0, male: 0, female: 0 },
      { name: "odisha", total: 0, male: 0, female: 0 },
      { name: "punjab", total: 0, male: 0, female: 0 },
      { name: "rajasthan", total: 0, male: 0, female: 0 },
      { name: "sikkim", total: 0, male: 0, female: 0 },
      { name: "tamil nadu", total: 0, male: 0, female: 0 },
      { name: "telangana", total: 0, male: 0, female: 0 },
      { name: "tripura", total: 0, male: 0, female: 0 },
      { name: "uttar pradesh", total: 0, male: 0, female: 0 },
      { name: "uttarakhand", total: 0, male: 0, female: 0 },
      { name: "west bengal", total: 0, male: 0, female: 0 },
    ]

    const users = await User.find({ gr: 1 });
    console.log(users.length);

    const aggregatedData = location.map(loc => ({
      name: loc.name,
      total: loc.total,
      male: loc.male,
      female: loc.female,
    }));

    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < aggregatedData.length; j++) {
        if (users[i].address.state.toLowerCase().trim() === aggregatedData[j].name.toLowerCase().trim()) {
          if (users[i].gender === "male") {
            aggregatedData[j].male++;
          } else {
            aggregatedData[j].female++;
          }
          aggregatedData[j].total++;
        }
      }
    }

    // Create a new document
    const newLocationData = new LocationData({
      location: aggregatedData,
    });

    // Save the new document
    await newLocationData.save();

    console.log('New document saved:', newLocationData);
  } catch (error) {
    console.log(error);
  }
};
exports.fetchLocations = async (req, res) => {
  try {
    const locationfetc = await LocationData.findById("65eee94e9fc272dcee912fe2")

    const location = locationfetc.location.map((d) => {

      const random = Math.floor(Math.random() * (300 - 200 + 1)) + 200;
      return ({
        name: d.name,
        total: d?.total * random,
        male: d?.male * random,
        female: d?.female * random,
      })

    })
    console.log(location)
    res.status(200).json({ success: true, loc: location })
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong" })
  }
}

// locationofUsers()

exports.loginwithgrovyo = async (req, res) => {
  console.log("first", req.body)
  try {
    const { email, phone } = req.body
    let logwithidentity;
    let value
    let user
    if (email && !phone) {
      user = await User.findOne({ email })
      logwithidentity = "email"
      value = email
    }
    if (phone && !email) {
      let f = 91 + phone
      user = await User.findOne({ phone: f })
      logwithidentity = "phone"
      value = f
    }
    if (!user) {

      return res.status(404).json({ success: false, message: "User not Found" })
    }

    function generateOTP() {
      let otp = Math.floor(100000 + Math.random() * 900000);
      return otp;
    }

    function msgid() {
      return Math.floor(100000 + Math.random() * 900000);
    }
    let otp = generateOTP();
    user.otp = otp
    await user.save()

    const gid = "65a666a3e953a4573e6c7ecf"
    const grovyo = await User.findById(gid)
    const convs = await Conversation.findOne({
      members: { $all: [user._id, gid] },
    });
    const senderpic = process.env.URL + grovyo.profilepic;
    const recpic = process.env.URL + user.profilepic;
    const timestamp = new Date()
    const mesId = msgid();

    if (convs) {
      let data = {
        conversationId: convs._id,
        sender: grovyo._id,
        text: `Your one-time password (OTP) for login is: ${otp}.`,
        mesId: mesId,
      };
      const m = new Message(data);
      await m.save();
      if (user.notificationtoken) {
        const msg = {
          notification: {
            title: "Grovyo",
            body: `Your one-time password (OTP) for login is: ${otp}.`,
          },
          data: {
            screen: "Conversation",
            sender_fullname: `${grovyo?.fullname}`,
            sender_id: `${grovyo?._id}`,
            text: `Your one-time password (OTP) for login is: ${otp}.`,
            convId: `${convs?._id}`,
            createdAt: `${timestamp}`,
            mesId: `${mesId}`,
            typ: 'message',
            senderuname: `${grovyo?.username}`,
            senderverification: `${grovyo.isverified}`,
            senderpic: `${senderpic}`,
            reciever_fullname: `${user.fullname}`,
            reciever_username: `${user.username}`,
            reciever_isverified: `${user.isverified}`,
            reciever_pic: `${recpic}`,
            reciever_id: `${user._id}`,
          },
          token: user?.notificationtoken,
        };

        await admin
          .messaging()
          .send(msg)
          .then((response) => {
            console.log("Successfully sent message");
          })
          .catch((error) => {
            console.log("Error sending message:", error);
          });
      }
    } else {
      const conv = new Conversation({
        members: [grovyo._id, user._id],
      });
      const savedconv = await conv.save();
      let data = {
        conversationId: conv._id,
        sender: grovyo._id,
        text: `Your one-time password (OTP) for login is: ${otp}.`,
        mesId: mesId,
      };
      await User.updateOne(
        { _id: grovyo._id },
        {
          $addToSet: {
            conversations: savedconv?._id,
          },
        }
      );
      await User.updateOne(
        { _id: user._id },
        {
          $addToSet: {
            conversations: savedconv?._id,
          },
        }
      );

      const m = new Message(data);
      await m.save();

      if (user.notificationtoken) {
        const msg = {
          notification: {
            title: "Grovyo",
            body: `Your one-time password (OTP) for login is: ${otp}.`,
          },
          data: {
            screen: "Conversation",
            sender_fullname: `${user?.fullname}`,
            sender_id: `${user?._id}`,
            text: `Your one-time password (OTP) for login is: ${otp}.`,
            convId: `${convs?._id}`,
            createdAt: `${timestamp}`,
            mesId: `${mesId}`,
            typ: 'message',
            senderuname: `${user?.username}`,
            senderverification: `${user.isverified}`,
            senderpic: `${recpic}`,
            reciever_fullname: `${grovyo.fullname}`,
            reciever_username: `${grovyo.username}`,
            reciever_isverified: `${grovyo.isverified}`,
            reciever_pic: `${senderpic}`,
            reciever_id: `${grovyo._id}`,
          },
          token: user?.notificationtoken,
        };

        await admin
          .messaging()
          .send(msg)
          .then((response) => {
            console.log("Successfully sent message");
          })
          .catch((error) => {
            console.log("Error sending message:", error);
          });
      }
    }

    res.status(200).json({ success: true, logwithidentity, value })
  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false, message: "Something Went Wrong" })
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { otp, type, value } = req.body
    console.log(req.body)
    let user
    if (type == "email") {
      user = await User.findOne({ email: value })
    }
    if (type == "phone") {
      user = await User.findOne({ phone: value })
    }
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }
    if (user.otp === otp) {
      const advertiser = await Advertiser.findOne({ userid: user._id })
      if (advertiser) {
        const dp = process.env.URL + advertiser.image
        const sessionId = generateSessionId();
        const newEditCount = {
          login: Date.now().toString(),
        };
        await Advertiser.updateOne(
          { _id: advertiser._id },
          {
            $push: { logs: newEditCount },
          }
        );
        const data = {
          userid: advertiser.userid,
          advid: advertiser._id,
          image: dp,
          firstname: advertiser.firstname,
          lastname: advertiser.lastname,
          country: advertiser.country,
          city: advertiser.city,
          address: advertiser.address,
          accounttype: advertiser.type,
          taxinfo: advertiser.taxinfo,
          email: advertiser.email,
          advertiserid: advertiser.advertiserid,
          sessionId
        };

        user.otp = undefined
        await user.save()
        const access_token = generateAccessToken(data)
        const refresh_token = generateRefreshToken(data)
        return res.status(200).json({
          advertiser,
          access_token,
          refresh_token,
          accountexist: true,
          userid: advertiser.userid,
          dp,
          sessionId,
          success: true,
        });
      } else {
        const firstname = user.fullname.split(" ")[0]
        const lastname = user.fullname.split(" ")[1]
        const dp = process.env.URL + user.profilepic
        const phoneNumber = user.phone.substring(2)
        const data = {
          dp,
          firstname,
          lastname,
          phone: phoneNumber,
          email: user.email,
          address: user.address.streetaddress,
          city: user.address.city,
          state: user.address.state,
          pincode: user.address.pincode,
          landmark: user.address.landmark,
        }
        res.status(203).json({ success: true, accountexist: false, data })
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid otp" })
    }
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })
  }
}

// exports.paybyphonepay = async (req, res) => {
//   try {

//   } catch (error) {
//     res.status(400).json({ success: false, message: "Something Went Wrong" })
//   }
// }

exports.loginwithworkspace = async (req, res) => {
  try {
    const { id, postid } = req.params

    const user = await User.findById(id)

    if (!user) {
      return res.status(400).json({ success: false, message: "User Not Found" })
    }

    const post = await Post.findById(postid).populate("community", "title dp")

    if (!post) {
      return res.status(400).json({ success: false, message: "Post not found!" })
    }

    const postData = {
      title: post.title,
      desc: post.desc,
      media: post.post,
      communityId: post.community._id,
      communityName: post.community.title,
      dp: process.env.URL + post.community.dp
    }

    let advertiser = ""
    if (user?.advertiserid) {
      advertiser = await Advertiser.findById(user?.advertiserid.toString())
    }

    if (advertiser) {
      const dp = process.env.URL + advertiser.image
      const newEditCount = {
        login: Date.now().toString(),
      };
      await Advertiser.updateOne(
        { _id: advertiser._id },
        {
          $push: { logs: newEditCount },
        }
      );
      const data = {
        userid: advertiser.userid,
        advid: advertiser._id,
        image: dp,
        firstname: advertiser.firstname,
        lastname: advertiser.lastname,
        country: advertiser.country,
        city: advertiser.city,
        address: advertiser.address,
        accounttype: advertiser.type,
        taxinfo: advertiser.taxinfo,
        email: advertiser.email,
        advertiserid: advertiser.advertiserid,
      };

      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)

      return res.status(200).json({
        message: "Advertiser exists",
        advertiser,
        access_token,
        refresh_token,
        userid: advertiser.userid,
        dp,
        postData,
        success: true,
      });
    } else {
      const firstname = user.fullname.split(" ")[0]
      const lastname = user.fullname.split(" ")[1]
      const dp = process.env.URL + user.profilepic

      const advertisernew = new Advertiser({
        firstname,
        lastname,
        image: user.profilepic,
        password: decryptaes(user.passw),
        phone: user.phone,
        email: user.email,
        address: user.address.streetaddress,
        city: user.address.city,
        state: user.address.state,
        pincode: user.address.pincode,
        landmark: user.address.landmark,
        userid: user._id,
        advertiserid: generateUniqueID()
      })

      const savedAdvertiser = await advertisernew.save()

      user.advertiserid = savedAdvertiser._id
      await user.save()

      const data = {
        userid: savedAdvertiser.userid,
        advid: savedAdvertiser._id,
        image: dp,
        firstname: savedAdvertiser.firstname,
        lastname: savedAdvertiser.lastname,
        country: savedAdvertiser.country,
        city: savedAdvertiser.city,
        address: savedAdvertiser.address,
        accounttype: savedAdvertiser.type,
        taxinfo: savedAdvertiser.taxinfo,
        email: savedAdvertiser.email,
        advertiserid: savedAdvertiser.advertiserid,
      };
      
      const access_token = generateAccessToken(data)
      const refresh_token = generateRefreshToken(data)

      res.status(203).json({ success: true, message: "Account Created", access_token, refresh_token, postData })
    }

  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false, message: "Something Went Wrong" })
  }
}