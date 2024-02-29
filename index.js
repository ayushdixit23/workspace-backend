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
    mongoose.connect(process.env.DATABASE).then(() => {
      console.log("DB is connected");
    });
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

// function getRandomValue(min, max) {
//   return Math.floor(Math.random() * (max - min + 1) + min);
// }

// const data = async () => {
//   try {
//     const advertiser = await Ads.findById("65d495d11dacc2529fe383e5")
//     const adsDetails = Array.from({ length: 6 }, (_, index) => ({
//       time: Date.now() + index * 24 * 60 * 60 * 1000,
//       click: getRandomValue(2000, 4000),
//       impressions: getRandomValue(2000, 3000),
//       cpc: getRandomValue(1500, 2500),
//       cost: getRandomValue(4000, 5000)
//     }));

//     advertiser.adsDetails = adsDetails

//     const a = await advertiser.save()
//     console.log(a.adsDetails)
//   } catch (error) {
//     console.log(error)
//   }
// }

// data()

// const deleteCommunityPosts = async () => {
//   try {
//     const communityId = "65d0f8176a4e4ae4c6e8ff6f";
//     const community = await Community.findById(communityId).populate("posts");
//     const posts = community.posts;
//     for (const post of posts) {
//       if (post.kind === 'ad') {
//         await Posts.findByIdAndDelete(post._id);
//         console.log(`Deleted post with _id: ${post._id} ${post.title} ${post.kind}`);
//       }
//     }
//     console.log("Ad posts deleted successfully");
//   } catch (error) {
//     console.log(error);
//   }
// };

// deleteCommunityPosts()