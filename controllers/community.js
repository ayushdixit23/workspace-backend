const Community = require("../models/community");
const User = require("../models/userAuth");
const uuid = require("uuid").v4;
const Minio = require("minio");
const Topic = require("../models/topic");
const sharp = require("sharp");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Message = require("../models/message");

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

//creating a community
exports.createa = async (req, res) => {
  const { title, desc, topic, type, price, category } = req.body;
  const { userId } = req.params;
  const image = req.file;
  const uuidString = uuid();

  if (!image) {
    res.status(400).json({ message: "Please upload an image", success: false });
  } else if (topic) {
    try {
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
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

      const topic3 = new Topic({
        title: topic,
        creator: userId,
        community: savedcom._id,
        type: type,
        price: price,
      });
      await topic3.save();

      await Community.updateOne(
        { _id: savedcom._id },
        {
          $push: { members: userId, admins: user._id },
          $inc: { memberscount: 1 },
        }
      );

      await Community.updateMany(
        { _id: savedcom._id },
        {
          $push: { topics: [topic1._id, topic2._id, topic3._id] },
          $inc: { totaltopics: 1 },
        }
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
        { _id: topic3._id },
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
      await Topic.updateOne(
        { _id: topic3._id },
        { $push: { notifications: user._id } }
      );

      await User.updateMany(
        { _id: userId },
        {
          $push: {
            topicsjoined: [topic1._id, topic2._id, topic3._id],
            communityjoined: savedcom._id,
          },
          $inc: { totaltopics: 3, totalcom: 1 },
        }
      );
      res.status(200).json({ community: savedcom, success: true });
    } catch (e) {
      res.status(400).json({ message: e.message, success: false });
    }
  } else {
    try {
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
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

//community join
exports.joinmember = async (req, res) => {
  const { userId, comId } = req.params;
  const user = await User.findById(userId);
  const community = await Community.findById(comId);
  if (!community) {
    res.status(400).json({ message: "Community not found" });
  } else {
    let publictopic = [];
    for (let i = 0; i < community.topics.length; i++) {
      const topic = await Topic.findById({ _id: community.topics[i] });

      if (topic.type === "free") {
        publictopic.push(topic);
      }
    }

    try {
      const isOwner = community.creator.equals(user._id);
      const isSubscriber = community.members.includes(user._id);
      if (isOwner) {
        res.status(201).json({
          message: "You already have joined your own community!",
          success: false,
        });
      } else if (isSubscriber) {
        res
          .status(201)
          .json({ message: "Already Subscriber", success: false, publictopic });
      } else if (community.type === "public") {
        //members count increase
        let today = new Date();

        let year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, "0");
        let day = String(today.getDate()).padStart(2, "0");

        let formattedDate = `${day}/${month}/${year}`;

        //visitor count
        if (
          community?.stats?.length > 0 &&
          community.stats[0]?.X === formattedDate
        ) {
          await Community.updateOne(
            { _id: community._id, "stats.X": formattedDate },
            {
              $inc: {
                "stats.$.Y1": 1,
              },
            }
          );
        } else {
          let d = {
            X: formattedDate,
            Y1: 1,
          };
          await Community.updateOne(
            { _id: community._id },
            {
              $push: {
                stats: d,
              },
            }
          );
        }

        const birthdateString = user.DOB;
        const birthdate = new Date(
          birthdateString.split("/").reverse().join("/")
        );

        const currentDate = new Date(); // Current date

        // Calculate age
        let age = currentDate.getFullYear() - birthdate.getFullYear();

        // Adjust age based on the birthdate and current date
        if (
          currentDate.getMonth() < birthdate.getMonth() ||
          (currentDate.getMonth() === birthdate.getMonth() &&
            currentDate.getDate() < birthdate.getDate())
        ) {
          age--;
        }

        // Update age range & Update gender
        if (user.gender === "Male") {
          if (age >= 18 && age <= 24) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.male": 1,
                  "demographics.age.18-24": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 25 && age <= 34) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.male": 1,
                  "demographics.age.25-34": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 35 && age <= 44) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.male": 1,
                  "demographics.age.35-44": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 45 && age <= 64) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.male": 1,
                  "demographics.age.45-64": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 65) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.male": 1,
                  "demographics.age.65+": 1,
                },
              },
              {
                new: true,
              }
            );
          }
        } else if (user.gender === "Female") {
          if (age >= 18 && age <= 24) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.female": 1,
                  "demographics.age.18-24": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 25 && age <= 34) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.female": 1,
                  "demographics.age.25-34": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 35 && age <= 44) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.female": 1,
                  "demographics.age.35-44": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 45 && age <= 64) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.female": 1,
                  "demographics.age.45-64": 1,
                },
              },
              {
                new: true,
              }
            );
          } else if (age >= 65) {
            await Community.updateOne(
              { _id: community._id },
              {
                $inc: {
                  "demographics.gender.female": 1,
                  "demographics.age.65+": 1,
                },
              },
              {
                new: true,
              }
            );
          }
        }

        //member count inc per day

        if (
          community?.stats?.length > 0 &&
          community.stats[0]?.X === formattedDate
        ) {
          await Community.updateOne(
            { _id: community._id, "stats.X": formattedDate },
            {
              $inc: {
                "stats.$.Y1": 1,
              },
            }
          );
        } else {
          let d = {
            X: formattedDate,
            Y1: 1,
            Y2: 0,
          };
          await Community.updateOne(
            { _id: community._id },
            {
              $push: {
                stats: d,
              },
            }
          );
        }

        //other updations
        let notif = { id: user._id, muted: false };

        await Community.updateOne(
          { _id: comId },
          {
            $push: { members: user._id, notifications: notif },
            $inc: { memberscount: 1 },
          }
        );
        await User.updateOne(
          { _id: userId },
          { $push: { communityjoined: community._id }, $inc: { totalcom: 1 } }
        );

        const topicIds = publictopic.map((topic) => topic._id);

        await Topic.updateMany(
          { _id: { $in: topicIds } },
          {
            $push: { members: user._id, notifications: notif },
            $inc: { memberscount: 1 },
          }
        );

        await User.updateMany(
          { _id: userId },
          {
            $push: { topicsjoined: topicIds },
            $inc: { totaltopics: 2 },
          }
        );

        res.status(200).json({ success: true });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: e.message, success: false });
    }
  }
};

//community unjoin
exports.unjoinmember = async (req, res) => {
  const { userId, comId } = req.params;
  const user = await User.findById(userId);
  const community = await Community.findById(comId);

  const isOwner = community.creator.equals(user._id);
  const isSubscriber = community.members.includes(user._id);
  try {
    let publictopic = [];
    for (let i = 0; i < community.topics.length; i++) {
      const topic = await Topic.findById({ _id: community.topics[i] });
      if (topic.title === "Posts" || topic.title === "All") {
        publictopic.push(topic);
      }
    }

    if (isOwner) {
      res.status(201).json({
        message: "You can't unjoin your own community!",
        success: false,
      });
    } else if (!isSubscriber) {
      res.status(201).json({ message: "Not Subscribed", success: false });
    } else {
      await Community.updateOne(
        { _id: comId },
        { $pull: { members: user._id }, $inc: { memberscount: -1 } }
      );
      await User.updateOne(
        { _id: userId },
        { $pull: { communityjoined: community._id }, $inc: { totalcom: -1 } }
      );

      await Topic.updateOne(
        { _id: publictopic[0]._id },
        { $pull: { members: user._id }, $inc: { memberscount: -1 } }
      );
      await Topic.updateOne(
        { _id: publictopic[0]._id },
        { $pull: { notifications: user._id } }
      );
      await Topic.updateOne(
        { _id: publictopic[1]._id },
        { $pull: { notifications: user._id } }
      );
      await Topic.updateOne(
        { _id: publictopic[1]._id },
        { $pull: { members: user._id }, $inc: { memberscount: -1 } }
      );

      await User.updateMany(
        { _id: userId },
        {
          $pull: { topicsjoined: [publictopic[0]._id, publictopic[1]._id] },
          $inc: { totaltopics: -2 },
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//get community
exports.getcommunity = async (req, res) => {
  const { comId, id } = req.params;
  const community = await Community.findById(comId).populate(
    "topics",
    "title type price"
  );
  const user = await User.findById(id);
  try {
    if (!community) {
      res.status(404).json({ message: "No community found", success: false });
    } else if (!user) {
      res.status(404).json({ message: "No User found", success: false });
    } else {
      const subs =
        community.admins.includes(user._id) ||
        community.moderators.includes(user._id) ||
        community.members.includes(user._id);
      const canedit =
        community.admins.includes(user._id) ||
        community.moderators.includes(user._id);

      const dp = await generatePresignedUrl(
        "images",
        community.dp.toString(),
        60 * 60
      );

      res.status(200).json({ dp, community, subs, canedit, success: true });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//get a topic
exports.addTopic = async (req, res) => {
  const { userId, comId } = req.params;
  const { title, message, type, price } = req.body;
  const user = await User.findById(userId);
  try {
    const topic1 = new Topic({
      title: title,
      message: message,
      type: type,
      creator: userId,
      price,
      price,
      community: comId,
    });
    await topic1.save();
    await Topic.updateOne(
      { _id: topic1._id },
      { $push: { members: userId }, $inc: { memberscount: 1 } }
    );
    await Topic.updateOne(
      { _id: topic1._id },
      { $push: { notifications: user?.notificationtoken } }
    );

    await User.updateOne(
      { _id: userId },
      { $push: { topicsjoined: topic1._id }, $inc: { totaltopics: 1 } }
    );

    await Community.findByIdAndUpdate(
      { _id: comId },
      { $push: { topics: [topic1._id] }, $inc: { totaltopics: 1 } }
    );
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(400).json(e.message);
  }
};

//update community
exports.udpatecommunity = async (req, res) => {
  const { comId, userId } = req.params;
  const { category, name, desc, topicId, message, price, topicname, type } =
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
        const objectName = `${Date.now()}${uuidString}${req.file.originalname}`;
        a1 = objectName;
        a2 = req.file.mimetype;

        await sharp(req.file.buffer)
          .jpeg({ quality: 50 })
          .toBuffer()
          .then(async (data) => {
            await minioClient.putObject(bucketName, objectName, data);
          })
          .catch((err) => {
            console.log(err.message, "-error");
          });
        await Community.updateOne(
          { _id: com._id },
          {
            $set: {
              category: category,
              title: name,
              desc: desc,
              dp: objectName,
            },
          }
        );
      }

      await Community.updateOne(
        { _id: com._id },
        {
          $set: { category: category, title: name, desc: desc },
        }
      );
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
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};

//new community post feed
exports.compostfeed = async (req, res) => {
  try {
    const { id, comId } = req.params;
    const { postId } = req.body;
    const user = await User.findById(id);
    const community = await Community.findById(comId)
      .populate("topics", "title type price")
      .populate("creator", "fullname username profilepic isverified");

    if (user && community) {
      //creator data
      const creatordp = await generatePresignedUrl(
        "images",
        community.creator.profilepic.toString(),
        60 * 60
      );

      //community data
      const subs =
        community.admins.includes(user._id) ||
        community.moderators.includes(user._id) ||
        community.members.includes(user._id);

      //can edit topics
      const canedit =
        (community.admins.includes(user._id) ||
          community.moderators.includes(user._id)) &&
        community?.memberscount > 100;

      //can post
      const canpost =
        community.admins.includes(user._id) ||
        community.moderators.includes(user._id);

      const dp = await generatePresignedUrl(
        "images",
        community.dp.toString(),
        60 * 60
      );

      //post data
      const posts = await Post.find({ community: community._id }).populate(
        "sender",
        "fullname profilepic username isverified"
      );
      let index = -1;
      posts.reverse();
      //index of post that appears first
      for (let i = 0; i < posts.length; i++) {
        if (posts[i]._id.toString() === postId) {
          index = i;
          break;
        }
      }

      if (!postId) {
        index = 0;
      }

      //comments
      const comments = [];
      for (let i = 0; i < posts.length; i++) {
        const comment = await Comment.find({ postId: posts[i]._id.toString() })
          .limit(1)
          .sort({ createdAt: -1 });

        if (comment.length > 0) {
          comments.push(comment);
        } else {
          comments.push("no comment");
        }
      }

      const liked = [];
      const dps = [];
      const tc = [];
      let urls = [];

      //total comments of each post
      for (let i = 0; i < posts.length; i++) {
        const totalcomments = await Comment.find({ postId: posts[i]._id });
        tc.push(totalcomments.length);
      }

      //likes
      for (let i = 0; i < posts.length; i++) {
        if (
          posts[i].likedby?.some((id) => id.toString() === user._id.toString())
        ) {
          liked.push(true);
        } else {
          liked.push(false);
        }
      }

      //post content
      let ur = [];
      for (let i = 0; i < posts?.length; i++) {
        for (let j = 0; j < posts[i]?.post?.length; j++) {
          const a = await generatePresignedUrl(
            "posts",
            posts[i].post[j].content?.toString(),
            60 * 60
          );
          ur.push({ content: a, type: posts[i].post[j]?.type });
        }
        urls.push(ur);
        ur = [];
      }

      //dp of the sender
      for (let i = 0; i < posts.length; i++) {
        const a = await generatePresignedUrl(
          "images",
          posts[i].sender.profilepic.toString(),
          60 * 60
        );
        dps.push(a);
      }

      //mergeing all the data
      const urlData = urls;
      const postData = posts;
      const likeData = liked;
      const dpsdata = dps;
      const commentscount = tc;
      const commentdata = comments;

      const mergedData = urlData.map((u, i) => ({
        dpdata: dpsdata[i],
        urls: u,
        liked: likeData[i],
        posts: postData[i],
        totalcomments: commentscount[i],
        comments: commentdata[i],
      }));

      res.status(200).json({
        mergedData,
        index,
        dp,
        community,
        creatordp,
        subs,
        canedit,
        canpost,
        success: true,
      });
    } else {
      res.status(404).json({ message: "User or Community not found" });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//get topic messages
exports.gettopicmessages = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const user = await User.findById(id);
    const topic = await Topic.findById(topicId);
    const community = await Community.find({ topics: { $in: [topic._id] } });
    if (community && topic && user) {
      const msg = await Message.find({ topicId: topicId })
        .limit(20)
        .sort({ createdAt: -1 })
        .populate("sender", "profilepic fullname isverified");

      const messages = msg.reverse();
      if (!community[0].members.includes(user._id)) {
        res.status(203).json({
          message: "You are not the member of the Community",
          success: true,
          topicjoined: false,
        });
      } else {
        if (
          topic.type === "paid" &&
          topic.members.some((id) => id.toString() === user._id.toString())
        ) {
          let topicdetail = {
            id: topic?._id,
            price: topic?.price,
            desc: topic?.message,
            members: topic?.memberscount,
            name: topic?.title,
          };
          res.status(203).json({
            message: "You need to join the topic first",
            success: true,
            topicjoined: false,
            topic: topicdetail,
          });
        } else {
          res.status(200).json({
            messages,
            success: true,
            topicjoined: true,
          });
        }
      }
    } else {
      res.status(404).json({ message: "Somthing not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//load more messages of a topic
exports.loadmoremessages = async (req, res) => {
  try {
    const { id, topicId, sequence } = req.params;

    const user = await User.findById(id);
    const topic = await Topic.findById(topicId);
    const community = await Community.find({ topics: { $in: [topic._id] } });
    if (community && topic && user) {
      let gt = parseInt(sequence) - 1;
      let lt = gt - 10;

      const messages = await Message.find({
        topicId: topicId,
        sequence: { $gte: lt, $lte: gt },
      })
        .limit(20)
        .sort({ sequence: 1 })
        .populate("sender", "profilepic fullname isverified");

      if (!community[0].members.includes(user._id)) {
        res.status(203).json({
          message: "You are not the member of the Community",
          success: true,
          topicjoined: false,
        });
      } else {
        if (
          topic.type === "paid" &&
          topic.members.some((id) => id.toString() === user._id.toString())
        ) {
          res.status(203).json({
            message: "You need to join the topic first",
            success: true,
            topicjoined: false,
            id: topic?._id,
            price: topic?.price,
            desc: topic?.message,
            members: topic?.memberscount,
          });
        } else {
          res.status(200).json({
            messages,
            success: true,
            topicjoined: true,
          });
        }
      }
    } else {
      res.status(404).json({ message: "Somthing not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

exports.create = async (req, res) => {
  const { title, desc, topic, type, price, category, iddata } = req.body;
  const { userId } = req.params;
  const image = req.file;
  const uuidString = uuid();
  if (!image) {
    res.status(400).json({ message: "Please upload an image", success: false });
  } else if (iddata != undefined) {
    try {
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
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
      //   title: topic,
      //   creator: userId,
      //   community: savedcom._id,
      //   type: type,
      //   price: price,
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
      const user = await User.findById(userId);
      const bucketName = "images";
      const objectName = `${Date.now()}_${uuidString}_${image.originalname}`;
      a = objectName;
      await minioClient.putObject(
        bucketName,
        objectName,
        image.buffer,
        image.buffer.length
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

//get all members
exports.getallmembers = async (req, res) => {
  try {
    const { id, comId } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else {
      const community = await Community.findById(comId).populate({
        path: "members",
        select: "fullname pic isverified username profilepic",
        options: { limit: 150 },
      });
      if (!community) {
        res
          .status(404)
          .json({ message: "Community not found", success: false });
      } else {
        const dps = [];

        for (let j = 0; j < community?.members?.length; j++) {
          const a = await generatePresignedUrl(
            "images",
            community.members[j].profilepic.toString(),
            60 * 60
          );
          dps.push(a);
        }
        const members = community.members?.map((c, i) => ({
          c,
          dp: dps[i],
        }));
        res.status(200).json({ success: true, members });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: e.message, success: false });
  }
};
