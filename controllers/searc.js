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
    if (req.body.length > 0) {
      for (let i = 0; i < req.body.length; i++) {
        const id = decryptaes(req.body[i])
        const userselect = await User.findById(id).select("profilepic isverified fullname username")
        const dp = process.env.URL + userselect.profilepic

        const user = {
          dp, isverified: userselect.isverified, fullname: userselect.fullname, username: userselect.username, id: userselect._id
        }
        users.push(user)
      }
      res.status(200).json({ success: true, users })
    } else {
      res.status(400).json({ success: false, message: "No Recent Searchs!" })
    }
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
}

exports.removeRecentSearchProsite = async (req, res) => {
  try {
    const { sId } = req.body
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    user.recentCommunitySearches = user.recentCommunitySearches.filter(searchId => searchId !== sId);
    await user.save();
    return res.status(200).json({ success: true, message: "Search Prosite removed successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.removeRecentSearchCommunity = async (req, res) => {
  try {
    const { sId } = req.body
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    user.recentCommunitySearches = user.recentCommunitySearches.filter(searchId => searchId !== sId);
    await user.save();
    return res.status(200).json({ success: true, message: "Search Community removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
}


exports.addRecentSearchCommunity = async (req, res) => {
  try {
    const { sId } = req.body;
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    if (!user.recentCommunitySearches.includes(sId)) {
      user.recentCommunitySearches.push(sId);
      await user.save();
      return res.status(201).json({ success: true, message: "Added!" });
    } else {
      return res.status(200).json({ success: true, message: "Already Present!" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
}

exports.addRecentSearchProsite = async (req, res) => {
  try {
    const { sId } = req.body;
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    if (!user.recentPrositeSearches.includes(sId)) {
      user.recentPrositeSearches.push(sId);
      await user.save();
      return res.status(201).json({ success: true, message: "Added!" });
    } else {
      return res.status(200).json({ success: true, message: "Already Present!" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};


exports.mobileSearch = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found!" })
    }
    const recentSearchesProsites = []
    const recentSearchesCommunity = []
    for (let i = 0; i < user.recentPrositeSearches.length; i++) {
      const anotherUsers = await User.findById(user.recentPrositeSearches[i])
      const data = {
        id: anotherUsers?._id,
        fullname: anotherUsers.fullname,
        username: anotherUsers.username,
        dp: process.env.URL + user.profilepic,
      }
      recentSearchesProsites.push(data)
    }
    for (let i = 0; i < user.recentCommunitySearches.length; i++) {
      const anotherCommunity = await Community.findById(user.recentCommunitySearches[i])
      const data = {
        id: anotherCommunity?._id,
        title: anotherCommunity?.title,
        dp: process.env.URL + anotherCommunity.dp
      }
      recentSearchesCommunity.push(data)
    }
    res.status(200).json({ success: true, recentSearchesCommunity, recentSearchesProsites })
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })
  }
}

exports.fetchCom = async (req, res) => {
  try {
    const commun = await Community.find().sort({ memberscount: -1 });
    const communities = commun.slice(0, 10)
    if (communities.length < 0) {
      return res.status(400).json({ success: false, message: "Communities not found" })
    }

    const community = communities.map((d) => {
      return {
        image: process.env.URL + d.dp,
        name: d.title,
        membersCount: d?.memberscount
      }
    })

    console.log(community)

    res.status(200).json({ success: true, community })
  } catch (error) {
    res.status(400).json({ success: false, message: "Something Went Wrong!" })
  }
}

