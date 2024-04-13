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

const userFInd = async () => {
  try {
    const users = await User.find({ fullname: "Ayush Dixit" })

    for (let i = 0; i < users.length; i++) {
      console.log(users[i]._id, users[i].username)
    }

  } catch (error) {
    console.log(error)
  }
}

// userFInd()

const userdelete = async () => {
  try {
    const users = await User.findById("660fd49e616bc2d9e31f732c")
    await users.remove()
  } catch (error) {
    console.log(error)
  }
}

// userdelete()

const findUser = async () => {
  try {
    const users = await User.find()
    const reverseusers = users.reverse()

    const onlyseven = reverseusers.slice(0, 7)
    for (let i = 0; i < onlyseven.length; i++) {
      const data = {
        fullname: onlyseven[i].fullname,
        id: onlyseven[i]._id,
        email: onlyseven[i].email,
        phone: onlyseven[i].phone,
      }
      console.log(data)
    }
  } catch (error) {
    console.log(error)
  }
}

// findUser()

const anan = async () => {
  try {


    const arr = ["64a7bd59c9aab1a5960083e0", "64b84197281876c462d40978", "65314cd99db37d9109914f3f", "65326e4893a673b9c7dc6020"]
    const arrs = ["65340d7f214aa8835254dc74", "6548e918c3e9b12274c1cca7"]
    const arrd = ["6548e918c3e9b12274c1cca7", "65314cd99db37d9109914f3f", "65326e4893a673b9c7dc6020"]


    const currentDate = new Date();
    for (let i = 8; i < 31; i++) {
      const futureDate = new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000);


      const analyticsData = {
        id: "65d0f8176a4e4ae4c6e8ff6f",
        date: futureDate.toISOString().slice(0, 10),
        Y1: Math.floor(Math.random() * 100),
        Y2: Math.floor(Math.random() * 100),
        Y3: Math.floor(Math.random() * 100),
        Sales: Math.floor(Math.random() * 1000),
        click: Math.floor(Math.random() * 100),
        impressions: Math.floor(Math.random() * 1000),
        cpc: Math.random() * 10,
        cost: Math.random() * 1000,
        creation: futureDate,
        views: Math.floor(Math.random() * 1000),
        activemembers: i % 2 === 0 ? arrs : arr,
        newmembers: i % 2 === 0 ? arrd : arr,
        paidmembers: i % 2 === 0 ? arr : arrs,
        newvisitor: i % 2 === 0 ? arr : arrd,
        returningvisitor: i % 2 === 0 ? arrd : arr,
      };

      // Save the generated data to MongoDB
      await Analytics.create(analyticsData);


    }

    console.log("first")
  } catch (error) {
    console.log(error)
  }
}

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
