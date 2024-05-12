const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const Redis = require("ioredis");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const aesjs = require("aes-js");
const fs = require("fs");
const path = require("path");
const cron = require('node-cron');

//import routes
const userAuth = require("./routes/authRoutes");
const chatRoutes = require("./routes/convRoutes");
const messageRoutes = require("./routes/message");
const communityRoutes = require("./routes/community");
const topicRoutes = require("./routes/topic");
const productRoutes = require("./routes/product");
const postRoutes = require("./routes/post");
// const prositeRoutes = require("./routes/prosite");
const commentRoutes = require("./routes/comment");
const reviewRoutes = require("./routes/review");
const orderRoutes = require("./routes/order");
const webapp = require("./routes/webapp");
const glimpseRoutes = require("./routes/glimpse");
const replyRoutes = require("./routes/reply");
const questionsRoutes = require("./routes/questions");
const searchRoutes = require("./routes/searc");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notification");
const libraryRoutes = require("./routes/library");
const testRoutes = require("./routes/test");
const workRoutes = require("./routes/workspace");
const adRoutes = require("./routes/Ads");
const memRoutes = require("./routes/membership");
const prosRoutes = require("./routes/pros");
const workspacev1 = require("./routes/WorkspaceV1");
const Community = require("./models/community");
// const Order = require("./models/orders");
const User = require("./models/userAuth");
const Advertiser = require("./models/Advertiser");
const Ads = require("./models/Ads");
const Posts = require("./models/post");
const Analytics = require("./models/Analytics");
const Membership = require("./models/membership");
const Post = require("./models/post");

require("dotenv").config();

//middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
// app.use(bodyParser.json());
app.use(cookieParser());
app.use("/api", userAuth);
app.use("/api", webapp);
app.use("/api", chatRoutes);
app.use("/api", messageRoutes);
app.use("/api", communityRoutes);
app.use("/api", topicRoutes);
app.use("/api", productRoutes);
app.use("/api", postRoutes);
// app.use("/api", prositeRoutes);
app.use("/api", commentRoutes);
app.use("/api", reviewRoutes);
app.use("/api", orderRoutes);
app.use("/api", glimpseRoutes);
app.use("/api", replyRoutes);
app.use("/api", questionsRoutes);
app.use("/api", searchRoutes);
app.use("/api", adminRoutes);
app.use("/api", notificationRoutes);
app.use("/api", libraryRoutes);
app.use("/api", testRoutes);
app.use("/api", workRoutes);
app.use("/api", adRoutes);
app.use("/api/v1", workspacev1);
app.use("/api/v1", prosRoutes);

//connect to DB
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.PRODDB).then(() => {
      console.log("DB is connected");
    });
  } catch (err) {
    console.log(err);
  }
};

connectDB();

const connectApp = () => {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};
connectApp();

// const userFInd = async () => {
//   try {
//     const users = await User.find({ fullname: "Ayush Dixit" });

//     for (let i = 0; i < users.length; i++) {
//       console.log(users[i]._id, users[i].username);
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

// userFInd()

const userdelete = async () => {
  try {
    const users = await User.findOne({ fullname: "Ayush Dixit Test" });
    console.log(users.username)
    await users.remove();
  } catch (error) {
    console.log(error);
  }
};

// userdelete()

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



const findUser = async () => {
  try {
    const users = await User.find();
    const reverseusers = users.reverse();

    const onlyseven = reverseusers.slice(0, 20);
    for (let i = 0; i < onlyseven.length; i++) {
      const data = {
        fullname: onlyseven[i].fullname,
        id: onlyseven[i]._id,
        email: onlyseven[i].email,
        phone: onlyseven[i].phone,
        u: onlyseven[i].username,
        gr: onlyseven[i].gr,
        // password: decryptaes(onlyseven[i].passw),
      };
      console.log(data);
    }
  } catch (error) {
    console.log(error);
  }
};

// findUser();

// const deleteAN = async () => {
//   try {
//     const an = await Analytics.find({ id: "65d0f8176a4e4ae4c6e8ff6f" })

//     for (let i = 0; i < an.length; i++) {
//       await an[i].remove()
//     }

//     console.log("donw")
//   } catch (error) {
//     console.log(error)
//   }
// }

// anan()

const deleteCommunity = async () => {
  try {
    const community = await Community.findOne({ title: "ghj" });
    console.log(community.title, community._id);
    for (let i = 0; i < community.posts.length; i++) {
      const post = await Post.findByIdAndDelete(community.posts[i]);
      const ads = await Ads.findOneAndDelete({ postid: community.posts[i] });
    }
    const deletcomm = await Community.findByIdAndDelete(community._id);
    console.log("done");
  } catch (error) {
    console.log(error);
  }
};

const pushId = async () => {
  try {
    // let ids = []
    const user = await User.find();
    for (let i = 0; i < 2000; i++) {
      const community = await Community.find({ creator: user[i]._id });
      const cId = community.map((d) => {
        return d._id;
      });
      user[i].communitycreated = cId;
      await user[i].save();
      console.log(cId);
      // ids.push(cId)
    }

    console.log("done");
  } catch (error) {
    console.log(error);
  }
};

// pushId()
// deleteCommunity()

const usersIds = async () => {
  try {
    const data = [];
    const fullname = [
      "Party Bags",
      "Shiv Bakers",
      "Play paladins",
      "Deep Learning Hub",
      "FREAKY MOVIES",
      "Arnav Mehta",
      "Food Fetchers ",
    ];
    for (let i = 0; i < fullname.length; i++) {
      const users = await User.findOne({ fullname: fullname[i] });
      const com = await Community.findOne({ creator: users?._id });
      const obj = {
        email: users?.email,
        password: users?.passw ? decryptaes(users?.passw) : null,
        comId: com?._id,
        communityName: com?.title,
        userid: users?._id,
        fullname: users?.fullname,
        memberships: users?.memberships,
        isverified: users?.isverified,
      };
      data.push(obj);
    }

    console.log(data, "data");
  } catch (error) {
    console.log(error);
  }
};

// usersIds()

// const uses = async () => {
//   let usr = await User.find()
//   const user = await User.findOne({ email: "watchmovies@gmail.com" });
//   const pass = decryptaes(user.passw);
//   console.log(pass, "pass");
// };

// uses();

function generateUniqueID() {
  let advertiserID;
  advertiserID = Date.now();
  return advertiserID.toString();
}

// const accountCreation = async () => {
//   try {
//     const adver = new Advertiser({
//       firstname: "Willow",
//       lastname: "wave",
//       image: "1705565597580_c0cfad66-2425-4f3c-8ecf-9f99e24a3fd3_a-profile.jpg",
//       userid: "65a8dd9ea9511349abd68ea9",
//       advertiserid: generateUniqueID(),
//       type: "Organization",
//       email: "arnavmehtaoff@gmail.com",
//       password: "arnavmehta"
//     })

//     await adver.save()

//   } catch (error) {
//     console.log(error)
//   }
// }

// cron.schedule('* * * * * *', () => {

//   console.log('running a task every second');
// });


// accountCreation()

const userf = async () => {
  const user = await User.findById("663e8dd2413b2c11427dea31")

  const members = await Membership.findById(user.memberships.membership)
  console.log(members.title)
}

// userf()