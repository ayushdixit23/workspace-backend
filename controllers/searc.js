const Post = require("../models/post");
const Community = require("../models/community");
const User = require("../models/userAuth");
const Minio = require("minio");
const aesjs = require("aes-js");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

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

//function for encrypting data
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

//search posts
exports.searchnow = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) {
      res.status(400).json({ success: false });
    } else {
      const posts = await Post.find({
        title: { $regex: `.*${query}.*`, $options: "i" },
      }).exec();
      res.status(200).json(posts);
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//search communities
exports.searchcoms = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) {
      res.status(400).json({ success: false });
    } else {
      const dps = [];
      const creatordps = [];
      const coms = await Community.find({
        title: { $regex: `.*${query}.*`, $options: "i" },
      })
        .populate("creator", "fullname username profilepic isverified")
        .exec();
      for (let i = 0; i < coms.length; i++) {
        const a = await generatePresignedUrl(
          "images",
          coms[i].dp.toString(),
          60 * 60
        );
        dps.push(a);
      }
      for (let i = 0; i < coms.length; i++) {
        const a = await generatePresignedUrl(
          "images",
          coms[i].creator.profilepic.toString(),
          60 * 60
        );
        creatordps.push(a);
      }
      res.status(200).json({ data: { coms, dps, creatordps }, success: true });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//search prosites

exports.searchpros = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) {
      res.status(400).json({ success: false });
    } else {
      const dps = [];
      const pros = await User.find({
        fullname: { $regex: `.*${query}.*`, $options: "i" },
      }).exec();
      for (let i = 0; i < pros.length; i++) {
        const a = await generatePresignedUrl(
          "images",
          pros[i].profilepic.toString(),
          60 * 60
        );
        dps.push(a);
      }
      res.status(200).json({ data: { pros, dps, success: true } });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

exports.recentSearch = async (req, res) => {
  try {
    const users = [];
    if (req.body.length > 0) {
      for (let i = 0; i < req.body.length; i++) {
        const id = decryptaes(req.body[i])
        const userselect = await User.findById(id).select("profilepic fullname username")
        const dp = process.env.URL + userselect.profilepic

        const user = {
          dp, fullname: userselect.fullname, username: userselect.username, id: userselect._id
        }
        users.push(user)
      }

      res.status(200).json({ success: true, users })
    } else {
      res.status(400).json({ success: false, message: "No Recent Searchs!" })
    }
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
    console.log(error)
  }
}