const Ads = require("../models/Ads");
const User = require("../models/userAuth");
const Minio = require("minio");
const Verification = require("../models/Veriification");
const Transaction = require("../models/AdTransactions");
const Order = require("../models/orders")
const Product = require("../models/product")
const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken")
const uuid = require("uuid").v4;
const {
  validatePaymentVerification,
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const sharp = require("sharp");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});
const Advertiser = require("../models/Advertiser");

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
          const advertiser = await Advertiser.findById(payload.advid);
          const sessionId = payload.sessionId;
          if (!advertiser) {
            return res
              .status(400)
              .json({ success: false, message: "advertiser not found" });
          }
          const dp = await generatePresignedUrl(
            "images",
            advertiser.image,
            60 * 60
          );
          // const data = {
          //   id: user._id.toString(),
          //   advid: user.advertiserid.toString(),
          //   dp,
          //   fullname: user.advertiserid.firstname + " " + user.advertiserid.lastname
          // };
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
            // advid: advertiser.advertiserid,
            sessionId
          };
          const access_token = generateAccessToken(data);
          res.status(200).json({ success: true, access_token });
        } catch (err) {
          console.log(err);
          res.status(400).json({ success: true });
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

exports.checkaccount = async (req, res) => {
  const { phone, email, password } = req.body;
  try {
    let advertiser;
    if (email && password) {
      advertiser = await Advertiser.findOne({ email, password });
    } else if (phone) {
      advertiser = await Advertiser.findOne({ phone });
    } else {
      return res.status(400).json({
        message: "Invalid request. Please provide email, password, or phone.",
        success: false,
      });
    }
    if (advertiser) {
      console.log(advertiser)
      const dp = await generatePresignedUrl(
        "images",
        advertiser.image,
        60 * 60
      );
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
        // advid: advertiser.advertiserid,
        sessionId
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
        sessionId,
        success: true,
      });
    } else {

      return res
        .status(404)
        .json({ message: "Advertiser not found", success: false });
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
    const finduser = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });
    if (!finduser) {
      const advid = generateUniqueID();
      const uuidString = uuid();
      const image = req.file;
      const bucketName = "images";
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

      await sharp(image.buffer)
        .jpeg({ quality: 60 })
        .toBuffer()
        .then(async (data) => {
          await minioClient.putObject(bucketName, objectName, data);
        })
        .catch((err) => {
          console.log(err.message, "-error");
        });

      await adv.save();

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
        phone: phone,
        profilepic: objectName,
        desc: "Hi, I am on Grovyo",
        address: finaladdress,
        adid: advid,
      });
      await user.save();

      await Advertiser.updateOne(
        { _id: advid._id },
        {
          $set: { userid: user._id },
        }
      );
    } else {
      const advid = generateUniqueID();
      const uuidString = uuid();
      const image = req.file;
      const bucketName = "images";
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
        userid: finduser._id,
      });

      await sharp(image.buffer)
        .jpeg({ quality: 60 })
        .toBuffer()
        .then(async (data) => {
          await minioClient.putObject(bucketName, objectName, data);
        })
        .catch((err) => {
          console.log(err.message, "-error");
        });

      await adv.save();

      await User.updateOne(
        { _id: finduser._id },
        {
          $set: { adid: adv._id },
        }
      );
    }
    res.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

exports.newad = async (req, res) => {
  const { id } = req.params;
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
    contenttype,
    adid,
    gender,
    advertiserid,
  } = req.body;

  try {
    const user = await Advertiser.findById(id);
    const uuidString = uuid();
    if (!user) {
      res.status(404).json({ message: "No user found!", success: false });
    } else {
      if (contenttype === "image") {
        const image = req.files[0];
        const bucketName = "ads";
        const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;

        await sharp(image.buffer)
          .jpeg({ quality: 60 })
          .toBuffer()
          .then(async (data) => {
            await minioClient.putObject(bucketName, objectName, data);
          })
          .catch((err) => {
            console.log(err.message, "-error");
          });
        const contents = {
          extension: image.mimetype,
          name: objectName,
        };
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
          dailybudget,
          estaudience,
          category,
          content: contents,

          adid: adid,
          gender,
          advertiserid,
        });
        await newAd.save();
        res.status(200).json({ success: true });
      } else {
        const { originalname, buffer, mimetype } = req.files[0];

        const size = buffer.byteLength;
        const bucketName = "ads";
        const objectName = `${Date.now()}_${uuidString}_${originalname}`;
        const contents = {
          extension: mimetype,
          name: objectName,
        };
        await minioClient.putObject(
          bucketName,
          objectName,
          buffer,
          size,
          mimetype
        );
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
          dailybudget,
          estaudience,
          category,
          content: contents,

          adid: adid,
          gender,
          advertiserid,
        });
        await newAd.save();
        res.status(200).json({ success: true });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

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

      // Get the current date
      const currentDate = new Date();

      // Get the current day, month, and year
      const currentDay = currentDate.getDate();
      const currentMonth = currentDate.getMonth() + 1; // Month is zero-based
      const currentYear = currentDate.getFullYear();

      // Calculate the age
      let age = currentYear - birthYear;
      if (
        currentMonth < birthMonth ||
        (currentMonth === birthMonth && currentDay < birthDay)
      ) {
        age--; // Adjust age if birthday hasn't occurred yet this year
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
            from: "users", // Assuming the collection name for users is "users"
            localField: "creator", // Assuming the field storing the creator ObjectId is "creator"
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
            creator: 0, // Exclude the creator field if needed
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

      const ads = await Ads.find({
        advertiserid: user.advertiserid.toString(),
      });

      for (let i = 0; i < ads.length; i++) {
        const a = await generatePresignedUrl(
          "ads",
          ads[i].content.toString(),
          60 * 60
        );
        content.push(a);
      }
      res.status(200).json({ ads, content, success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
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
        // advid: advertiser.advertiserid,
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
      res.status(200).json({ success: true, access_token, refresh_token });
    }
  } catch (e) {
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

      await sharp(image.buffer)
        .jpeg({ quality: 60 })
        .toBuffer()
        .then(async (data) => {
          await minioClient.putObject(bucketName, objectName, data);
        })
        .catch((err) => {
          console.log(err.message, "-error");
        });
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
        amount: amount,
        type: "Wallet",
        transactionid: newid,
      });
      await t.save();

      await Advertiser.updateOne({ _id: id },
        { $push: { transactions: t._id }, }
      );
      const instance = new Razorpay({
        key_id: "rzp_test_jXDMq8a2wN26Ss",
        key_secret: "bxyQhbzS0bHNBnalbBg9QTDo",
      });
      instance.orders.create(
        {
          amount: amount,
          currency: "INR",
          receipt: `receipt#${newid}`,
          notes: {
            type: "Wallet"
          }

        }, function (err, order) {
          console.log(err, order);
          if (err) {
            res.status(400).json({ err, success: false });
          } else {
            res.status(200).json({
              success: true,
              order_id: order.id,
            });
          }
        })

    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//update transaction status
exports.updatetransactionstatus = async (req, res) => {
  const { id } = req.params;
  const { success, tid, amount } = req.body;

  try {
    const user = await Advertiser.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const t = await Transaction.findOne({ transactionid: tid });
      if (!t) {
        res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      } else {
        const isValid = validatePaymentVerification(
          { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
          razorpay_signature,
          "bxyQhbzS0bHNBnalbBg9QTDo"
        );
        console.log(isValid)
        if (isValid) {
          await Transaction.updateOne(
            { _id: t._id },
            {
              $set: {
                status: success,
              },
            }
          );
          await Advertiser.updateOne(
            { _id: id },
            {
              $inc: { currentbalance: amount },
            }
          );
          return res.status(200).json({
            success: true,
          });
        } else {
          res.status(400).json({ success: false })
        }
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

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
    const PointsCategory = [
      {
        name: "Gaming",
        ctr: 0.02,
        audienceByCategory: 0.57,
        points: 5,
        selected: false,
      },
      {
        name: "Technology",
        ctr: 0.018,
        audienceByCategory: 0.5,
        points: 5,
        selected: false,
      },
      {
        name: "Travel",
        ctr: 0.016,
        audienceByCategory: 0.52,
        points: 5,
        selected: false,
      },
      {
        name: "Food",
        ctr: 0.02,
        audienceByCategory: 0.55,
        points: 5,
        selected: false,
      },
      {
        name: "Fashion",
        ctr: 0.019,
        audienceByCategory: 0.54,
        points: 5,
        selected: false,
      },
      {
        name: "Fitness",
        ctr: 0.014,
        audienceByCategory: 0.52,
        points: 5,
        selected: false,
      },
      {
        name: "Lifestyle",
        ctr: 0.016,
        audienceByCategory: 0.45,
        points: 4,
        selected: false,
      },
      {
        name: "Entertainment",
        ctr: 0.015,
        audienceByCategory: 0.49,
        points: 5,
        selected: false,
      },
      {
        name: "Activism",
        ctr: 0.009,
        audienceByCategory: 0.3,
        points: 2,
        selected: false,
      },
      {
        name: "Education",
        ctr: 0.019,
        audienceByCategory: 0.41,
        points: 4,
        selected: false,
      },
      {
        name: "Art",
        ctr: 0.016,
        audienceByCategory: 0.37,
        points: 3,
        selected: false,
      },
      {
        name: "Business",
        ctr: 0.02,
        audienceByCategory: 0.52,
        points: 5,
        selected: false,
      },
      {
        name: "Photography",
        ctr: 0.014,
        audienceByCategory: 0.3,
        points: 3,
        selected: false,
      },
      {
        name: "Literature",
        ctr: 0.009,
        audienceByCategory: 0.35,
        points: 2,
        selected: false,
      },
      {
        name: "Pets",
        ctr: 0.013,
        audienceByCategory: 0.37,
        points: 4,
        selected: false,
      },
      {
        name: "DIY",
        ctr: 0.012,
        audienceByCategory: 0.42,
        points: 4,
        selected: false,
      },
      {
        name: "Community",
        ctr: 0.018,
        audienceByCategory: 0.48,
        points: 5,
        selected: false,
      },
      {
        name: "Sports",
        ctr: 0.02,
        audienceByCategory: 0.55,
        points: 5,
        selected: false,
      },
      {
        name: "Music",
        ctr: 0.019,
        audienceByCategory: 0.5,
        points: 4,
        selected: false,
      },
      {
        name: "Film",
        ctr: 0.018,
        audienceByCategory: 0.47,
        points: 4,
        selected: false,
      },
      {
        name: "Health",
        ctr: 0.016,
        audienceByCategory: 0.45,
        points: 4,
        selected: false,
      },
      {
        name: "Home",
        ctr: 0.01,
        audienceByCategory: 0.25,
        points: 2,
        selected: false,
      },
      {
        name: "Design",
        ctr: 0.011,
        audienceByCategory: 0.35,
        points: 3,
        selected: false,
      },
      {
        name: "Science",
        ctr: 0.018,
        audienceByCategory: 0.5,
        points: 5,
        selected: false,
      },
      {
        name: "History",
        ctr: 0.015,
        audienceByCategory: 0.38,
        points: 3,
        selected: false,
      },
      {
        name: "Interests",
        ctr: 0.012,
        audienceByCategory: 0.35,
        points: 3,
        selected: false,
      },
      {
        name: "Meditation",
        ctr: 0.014,
        audienceByCategory: 0.45,
        points: 4,
        selected: false,
      },
      {
        name: "Charity",
        ctr: 0.012,
        audienceByCategory: 0.35,
        points: 3,
        selected: false,
      },
      {
        name: "Tech",
        ctr: 0.02,
        audienceByCategory: 0.5,
        points: 5,
        selected: false,
      },
      {
        name: "Cars",
        ctr: 0.016,
        audienceByCategory: 0.4,
        points: 3,
        selected: false,
      },
      {
        name: "Motivation",
        ctr: 0.014,
        audienceByCategory: 0.43,
        points: 4,
        selected: false,
      },
      {
        name: "Comedy",
        ctr: 0.017,
        audienceByCategory: 0.47,
        points: 5,
        selected: false,
      },
      {
        name: "Finance",
        ctr: 0.017,
        audienceByCategory: 0.48,
        points: 4,
        selected: false,
      },
      {
        name: "Hiking",
        ctr: 0.009,
        audienceByCategory: 0.35,
        points: 3,
        selected: false,
      },
      {
        name: "Astrology",
        ctr: 0.01,
        audienceByCategory: 0.35,
        points: 1,
        selected: false,
      },
      {
        name: "Spirituality",
        ctr: 0.012,
        audienceByCategory: 0.35,
        points: 3,
        selected: false,
      },
      {
        name: "Language",
        ctr: 0.009,
        audienceByCategory: 0.3,
        points: 2,
        selected: false,
      },
      {
        name: "LGBTQ+",
        ctr: 0.009,
        audienceByCategory: 0.25,
        points: 1,
        selected: false,
      },
      {
        name: "Startups",
        ctr: 0.016,
        audienceByCategory: 0.46,
        points: 5,
        selected: false,
      },
      {
        name: "Virtual Reality",
        ctr: 0.013,
        audienceByCategory: 0.39,
        points: 3,
        selected: false,
      },
      {
        name: "Anime",
        ctr: 0.02,
        audienceByCategory: 0.55,
        points: 5,
        selected: false,
      },
      {
        name: "Cosplay",
        ctr: 0.012,
        audienceByCategory: 0.37,
        points: 3,
        selected: false,
      },
      {
        name: "Cooking",
        ctr: 0.016,
        audienceByCategory: 0.45,
        points: 3,
        selected: false,
      },
    ];

    const myLocation = [
      {
        name: "Mumbai",
        audienceNo: 1200,
        men: 0.54,
        women: 0.46,
      },
      {
        name: "Delhi",
        audienceNo: 1000,
        men: 0.52,
        women: 0.48,
      },
      {
        name: "Banglore",
        audienceNo: 900,
        men: 0.52,
        women: 0.48,
      },
      {
        name: "Hyderabad",
        audienceNo: 800,
        men: 0.51,
        women: 0.49,
      },
      {
        name: "Chennai",
        audienceNo: 100,
        men: 0.503,
        women: 0.497,
      },
      {
        name: "Kolkata",
        audienceNo: 600,
        men: 0.525,
        women: 0.475,
      },
      {
        name: "Pune",
        audienceNo: 500,
        men: 0.52,
        women: 0.48,
      },
      {
        name: "Ahmedabad",
        audienceNo: 400,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Jaipur",
        audienceNo: 300,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Lucknow",
        audienceNo: 2000,
        men: 0.52,
        women: 0.48,
      },
      {
        name: "Kanpur",
        audienceNo: 3000,
        men: 0.54,
        women: 0.46,
      },
      {
        name: "Agra",
        audienceNo: 300,
        men: 0.534,
        women: 0.466,
      },
      {
        name: "Prayagraj",
        audienceNo: 250,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Meerut",
        audienceNo: 200,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Ghaziabad",
        audienceNo: 150,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Noida",
        audienceNo: 700,
        men: 0.55,
        women: 0.45,
      },
      {
        name: "Gorakhpur",
        audienceNo: 50,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Jhansi",
        audienceNo: 40,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Aligarh",
        audienceNo: 30,
        men: 0.53,
        women: 0.47,
      },
      {
        name: "Mathura",
        audienceNo: 10,
        men: 0.532,
        women: 0.468,
      },
    ];

    const datatoSend = {
      NewLocations: myLocation,
      Newcategory: PointsCategory,
    };

    const check = await Adbyloccategory.findOne({});

    if (check) {
      res.json(datatoSend);
    } else {
      const newData = new Adbyloccategory(datatoSend);
      const savedData = await newData.save();
      res.json(savedData);
    }
  } catch (err) {
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
      const instance = new Razorpay({
        key_id: "rzp_test_jXDMq8a2wN26Ss",
        key_secret: "bxyQhbzS0bHNBnalbBg9QTDo",
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

