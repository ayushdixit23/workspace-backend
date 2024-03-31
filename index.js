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
app.use("/api/v1", prosRoutes)

//connect to DB
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.PRODDB).then(() => {
      console.log("DB is connected");
    });
    // mongoose.connect(process.env.DATABASE).then(() => {
    //   console.log("DB is connected");
    // });  
    // mongoose
    //   .connect(
    //     "mongodb+srv://fsayush100:shreyansh7@cluster0.mrnejwh.mongodb.net/your-database-name?retryWrites=true&w=majority"
    //   )
    //   .then(() => {
    //     console.log("DB is connected");
    //   });
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

const changeMembership = async () => {
  try {
    // const id = "65314cd99db37d9109914f3f"
    const users = await User.findById("65b68725750001cd4dc81483")

    const currentDate = new Date();
    const endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // const users = await User.find()
    // for (let i = 0; i < users.length; i++) {
    //   users[i].ismembershipactive = true
    //   users[i].memberships.membership = "65671e5204b7d0d07ef0e796"
    //   users[i].memberships.ending = "infinite"
    //   users[i].memberships.status = true
    //   await users[i].save()
    // // }
    users.ismembershipactive = true
    users.memberships.membership = "65671e5204b7d0d07ef0e796"
    users.memberships.ending = endDate
    users.memberships.status = true
    // users.isverified = true
    await users.save()
  } catch (error) {
    console.log(error)
  }
}
// changeMembership()

// const changeverfication = async () => {
//   try {
//     // const id = "65314cd99db37d9109914f3f"
//     const users = await User.find()

//     for (let i = 0; i < users.length; i++) {
//       users[i].isStoreVerified = false

//       await users[i].save()

//     }
//     console.log("done")
//   } catch (error) {
//     console.log(error)
//   }
// }


// changeverfication()

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

const latestUser = async () => {
  try {
    // const alluser = (await (await User.find()).reverse())
    const alluser = await User.find().sort({ _id: -1 });
    const user = alluser.slice(0, 10)
    console.log(user.map((d) => { return ({ id: d?._id, dp: d?.profilepic, name: d?.fullname, username: d?.username, phone: d?.phone, email: d?.email, passw: d?.passw, gr: d?.gr, address: d?.address }) }))

    console.log(user[0]._id)
  } catch (error) {
    console.log(error)
  }
}

// latestUser()
const picuser = async () => {
  try {
    const user = await User.find()
    for (let i = 10000; i < 11500; i++) {
      console.log(user[i].profilepic)
    }
  } catch (error) {

  }
}
// picuser()

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
// const pas = encryptaes("aryansh")
// console.log(pas)
// const adver = async () => {
//   try {
//     const advertiser = new Advertiser({
//       userid: "65a666a3e953a4573e6c7ecf",
//       firstname: "Grovyo",
//       lastname: "Ads",
//       type: "Individual",
//       phone: "1234567891",
//       email: "grovyoinc@gmail.com",
//       password: "12345678",
//       retypepassword: "12345678"
//     })
//     const ad = await advertiser.save()
//     const user = await User.findById("65a666a3e953a4573e6c7ecf")
//     user.advertiserid = ad._id
//     await user.save()

//     console.log("done")
//   } catch (error) {
//     console.log(error)
//   }
// }

// adver()

// exports.userInterest = async (req, res) => {
//   try {
//     const { id } = req.params
//     const user = await User.findById(id)
//     if (!user) {
//       return res.status(400).json({ success: false, message: "User not found" })
//     }
//     const interest = user.interest
//     res.status(200).json({ success: true, interest })
//   } catch (error) {
//     res.status(400).json({ success: false, message: "Something Went Wrong" })
//   }
// }

// router.get("/fetchinterest/:id", userInterest)

// const addres = async () => {
//   try {
//     const user = await User.findById("654fdd2a787d1b672bf37231")
//     if (user) {
//       const address = [{
//         buildingno: "Mall road",
//         city: "Kanpur",
//         state: "Uttar Pradesh",
//         postal: 208001,
//         landmark: "Gagan Plaza",
//         gst: "",
//         businesscategory: "Retail",
//         documenttype: "12345678",
//         documentfile: "1710834171653_3b247b84-ac78-4393-83ac-73ee52cb8a68_shopping.jpg",
//         coordinates: {
//           latitude: 20,
//           longitude: 21,
//           altitude: 100,
//         },
//       },]
//       user.storeAddress = address
//       await user.save()
//     }
//   } catch (error) {
//     console.log(error)
//   }
// }


// addres()

const members = async () => {
  try {
    // const s = new Membership({
    //   title: "Plus",
    //   productlimit: 5,
    //   topiclimit: 1,
    //   communitylimit: 1,
    //   collectionlimit: 1,
    //   deliverylimit: 10,
    // })

    const s = await Membership.findById("65671ded04b7d0d07ef0e794")
    s.productlimit = 10
    s.topiclimit = 3
    s.communitylimit = 3
    s.deliverylimit = 100
    s.collectionlimit = 3

    await s.save()
    console.log("done")
  } catch (error) {
    console.log(error)
  }
}
// members()

const ab = async () => {
  try {
    const post = await Post.findOne({ title: "test" })
    console.log("first", post.desc)
    await post.delete()
  } catch (error) {
    console.log(error)
  }
}


// ab()