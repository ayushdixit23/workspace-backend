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
const Request = require("./models/Request");
const Analytics = require("./models/Analytics");
const Membership = require("./models/membership");
const Post = require("./models/post");
const Order = require("./models/orders");
const Interest = require("./models/Interest");

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

// const a = decryptaes("3d1d4236f6cb257a2e")
// console.log(a)

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
    const community = await Community.findOne({ title: "" });
    console.log(community.title, community._id, community.memberscount);
    // for (let i = 0; i < community.posts.length; i++) {
    //   const post = await Post.findByIdAndDelete(community.posts[i]);
    //   const ads = await Ads.findOneAndDelete({ postid: community.posts[i] });
    // }
    // const deletcomm = await Community.findByIdAndDelete(community._id);
    // console.log("done");
  } catch (error) {
    console.log(error);
  }
};
// deleteCommunity()

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

const communityofUsers = async () => {
  console.log("first")
  try {
    const communities = []
    const users = await User.find({ gr: 1 })
    console.log(users.length)
    for (let i = 0; i < users.length; i++) {
      console.log(i)
      const community = await Community.find({ creator: users[i]._id })

      if (community && community.length > 0) {
        const mapcom = community.map((d) => d?.title)
        communities.push(mapcom)
      }
    }

    console.log(communities)

  } catch (error) {
    console.log(error)
  }
}

// communityofUsers()

const communityofUsersr = async () => {
  console.log("secc")
  try {
    const communities = []
    const users = await User.find({ gr: 0 })
    for (let i = 0; i < users.length; i++) {
      const community = await Community.find({ creator: users[i]._id })

      if (community && community.length > 0) {
        const mapcom = community.map((d) => d?.title)
        communities.push(mapcom)
      }
    }

    console.log(communities)

  } catch (error) {
    console.log(error)
  }
}

// communityofUsersr()

// usersIds()

const uses = async () => {

  const user = await User.findOne({ username: "secretdesires" });
  // const user = await User.findOne({ email: "grovyoinc@gmail.com" });
  // const user = await User.findOne({ username: "anilgiftstore_131" });
  const pass = decryptaes(user.passw);
  console.log(pass, "pass", user.email);
};

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
// const com = async () => {
//   try {
//     // Find the community by ID

//     const likedBy = [
//     ]

//     const user = await User.find()
//     for (let i = 5050; i < 5057; i++) {
//       likedBy.push(user[i]._id)
//     }


//     const post = await Post.findById("66422d07854b03c29736ef73");
//     if (!post) {
//       throw new Error('Post not found');
//     }

//     // Log the post title
//     console.log(post.title);

//     // Combine existing likes with the new likes and remove duplicates
//     const likesSet = new Set([...post.likedby, ...likedBy]);
//     const uniqueLikes = Array.from(likesSet);

//     // Update the post's likedby field and save
//     post.likedby = uniqueLikes;

//     await post.save();

//     // Log the combined likes and their count
//     console.log(uniqueLikes);
//     console.log(uniqueLikes.length);

//     console.log('Post likes updated successfully');
//     // await post.save()


//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// };

// Call the function
// com();

const addressChange = async () => {
  try {
    const shreyansh = await User.findById("64a7bd59c9aab1a5960083e0")
    console.log(shreyansh.address)
    const partyBags = await User.findById("654fdd2a787d1b672bf37231")
    partyBags.address = shreyansh.address
    await partyBags.save()
    console.log("done")
  } catch (error) {
    console.log(error)
  }
}

// addressChange()


const freeMembership = async () => {
  try {


    const id = "65b68725750001cd4dc81483"
    const memid = "65671e5204b7d0d07ef0e796"
    const membership = await Membership.findById(memid)

    const user = await User.findById(id)
    user.memberships = {
      membership: memid,
      status: true,
      ending: "infinite",
    };

    user.isverified = true;
    await user.save();

    console.log("done", user.fullname)
  } catch (error) {
    console.log(error)
  }
}
// 
// freeMembership()

const giveMembership = async () => {
  try {
    const currentDate = new Date();
    // let endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    let endDate = new Date(currentDate.getTime() + 12 * 30.4375 * 24 * 60 * 60 * 1000);

    const id = "65b68725750001cd4dc81483"
    const memid = "65671e6004b7d0d07ef0e798"
    const membership = await Membership.findById(memid)

    const user = await User.findById(id)
    user.memberships = {
      membership: memid,
      status: true,
      ending: endDate,
      paymentdetails: { mode: "online", amount: 3499 },
    };
    user.dm = membership.dms
    user.tagging = membership.tagging
    user.isverified = true;
    await user.save();

    console.log("done", user.fullname)
  } catch (error) {
    console.log(error)
  }
}

// giveMembership()

const changeStoreAddress = async () => {
  try {
    const id = ""
    const user = await User.findById(id);
    if (user) {
      user.storeAddress[0].buildingno = "";
      user.storeAddress[0].state = "";
      user.storeAddress[0].postal = "";
      user.storeAddress[0].city = "";
      user.storeAddress[0].landmark = "";
      user.coordinates = {
        latitude: "",
        longitude: "",
        altitude: "",
        provider: "",//string
        accuracy: "",
        bearing: "",
      },
        await user.save();
    }

    console.log("done")
  } catch (error) {
    console.log(error)
  }
}

const LastUser = async () => {

  const user = await User.find()
  const rever = user.reverse()

  // const users = await User.findOne({
  //   fullname
  //     : "Shiva soni"
  // })

  const users = await User.findById(rever[0]._id)
  // const timestamp = users?.activity[users?.activity.length - 1].deviceinfo[0][0].lastupdatetime;
  // console.log(users?.activity[users?.activity.length - 1].deviceinfo[0][0].lastupdatetime)
  // const date = new Date(timestamp);
  // const options = { timeZone: 'Asia/Kolkata', timeZoneName: 'short' };
  // const istDate = date.toLocaleString('en-IN', options);
  // console.log(istDate);

  const data = {
    fullname: users.fullname,
    activity: users?.activity[users?.activity.length - 1].deviceinfo[0],
    length: users?.activity.length
  }
  console.log(data)
}

const pass = async () => {
  try {
    // const user = await User.findOne({ email: "arnavmehtaoff@gmail.com" })
    // const user = await User.findOne({ fullname: "Rajan Pilla" })
    // const user = await User.findOne({ fullname: "Kamalesh Kakkar" })
    const user = await User.findOne({ email: "grovyoinc@gmail.com" })
    if (user) {
      console.log(decryptaes(user.passw), user.email)
    }

  } catch (error) {
    console.log(error)
  }
}

// pass()

function generateUniqueID() {
  let advertiserID;
  advertiserID = Date.now();
  return advertiserID.toString();
}

const organisation = async () => {
  try {
    const org = new Advertiser({
      email: "arnavmehtaoff@gmail.com",
      password: "arnavmehta",
      firstname: "Willow",
      lastname: "Wave",
      currentbalance: 100000,
      type: "Organization",
      organizationname: "Willow Wave",
      image: "willowwave",
      userid: "65a8dd9ea9511349abd68ea9",
      image: "willowwave.png",
      advertiserid: generateUniqueID()
    })

    const organ = await org.save()

    const user = await User.findById("65a8dd9ea9511349abd68ea9")
    user.advertiserid = organ._id
    user.adid = organ.advertiserid

    await user.save()

    console.log("first")
  } catch (error) {
    console.log(error)
  }
}

// organisation()

const InterestFetch = async () => {
  try {
    const inter = await Interest.find()
    const titles = inter.map((d) => {
      return (d.title)
    })

    // console.log(titles)

    const data = []

    for (let i = 0; i < titles.length; i++) {
      const community = await Community.find({ category: titles[i] })
      const cdata = {
        interest: titles[i],
        totalCommunity: community.length,
        communities: community.map((d) => d?.title)
      }
      data.push(cdata)
    }

    console.log(data)

  } catch (error) {
    console.log(error)
  }
}

// InterestFetch()

function formatDateTime(dateTime) {
  const date = new Date(dateTime);
  const padZero = (num) => num.toString().padStart(2, '0');

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1); // Months are zero-based
  const year = date.getFullYear();
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const seconds = padZero(date.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const communityFetchAcctoInter = async () => {
  try {
    const interest = "Gaming"
    const community = await Community.find({ category: interest })
    console.log(`We have total: ${community.length} no 0f communities for this ${interest}`)

    const data = []

    for (let i = 0; i < community.length; i++) {
      const lastPosts = await Post.findById(community[i].posts[community[i].posts?.length - 1])
      const user = await User.findById(community[i].creator)
      const datas = {
        id: community[i]._id,
        title: community[i].title,
        isuserreal: user.gr === 0 ? true : false,
        posts: community[i].posts?.length,
        lastPost: {
          title: lastPosts ? lastPosts?.title : null,
          createAt: lastPosts ? formatDateTime(lastPosts?.createdAt) : null,
        }
      }
      data.push(datas)
    }

    console.log(data, "data")

  } catch (error) {
    console.log(error)
  }
}

// communityFetchAcctoInter()