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
//Redis
// const redis = new Redis("redis://192.168.29.221:6379");
// const subscriber = new Redis("redis://192.168.29.221:6379");
// const publisher = new Redis("redis://192.168.29.221:6379");

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
const workspacev1 = require("./routes/WorkspaceV1");
const Community = require("./models/community");
// const Order = require("./models/orders");
const User = require("./models/userAuth");


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

// const add = async () => {
//   try {
//     const data = [
//       {
//         Dates: Date.now(),
//         Sales: 30
//       },
//       {
//         Dates: Date.now() + 19,
//         Sales: 130
//       },
//       {
//         Dates: Date.now() + 10,
//         Sales: 50
//       },
//       {
//         Dates: Date.now() + 20,
//         Sales: 30,
//       },
//       {
//         Dates: Date.now() + 80,
//         Sales: 45
//       },
//       {
//         Dates: Date.now() + 40,
//         Sales: 66,
//       },
//       {
//         Dates: Date.now() + 40,
//         Sales: 66,
//       },
//       {
//         Dates: Date.now() + 40,
//         Sales: 66,
//       },
//       {
//         Dates: Date.now() + 40,
//         Sales: 66,
//       },
//     ]
//     const user = await User.findById("64b84197281876c462d40978")
//     if (user) {
//       user.storeStats = data
//       await user.save()
//       console.log(user)
//     }
//   } catch (error) {
//     console.log(error)
//   }
// }

//connect to App

// const loca = async () => {
//   try {
//     const user = await User.findById("64b84197281876c462d40978")
//     if (user) {
//       const data = {
//         AndhraPradesh: 76,
//         ArunachalPradesh: 42,
//         Assam: 59,
//         Bihar: 23,
//         Chhattisgarh: 88,
//         Goa: 12,
//         Gujarat: 34,
//         Haryana: 67,
//         HimachalPradesh: 51,
//         Jharkhand: 78,
//         Karnataka: 91,
//         Kerala: 5,
//         MadhyaPradesh: 29,
//         Maharashtra: 89,
//         Manipur: 63,
//         Meghalaya: 17,
//         Mizoram: 72,
//         Nagaland: 95,
//         Odisha: 39,
//         Punjab: 54,
//         Rajasthan: 8,
//         Sikkim: 21,
//         TamilNadu: 63,
//         Telangana: 74,
//         UttarPradesh: 98,
//         Tripura: 31,
//         Uttarakhand: 47,
//         WestBengal: 66
//       }
//       user.storeLocation = data
//     }
//     const c = await user.save()
//     console.log(c)
//   } catch (error) {
//     console.log(error)
//   }
// }

const PORT = 7700;
const connectApp = () => {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};
connectApp();

//sockets
// const connectRedis = async () => {
//   try {
//     // Message can be either a string or a buffer
//     redis.publish("my-channel-1", JSON.stringify("message"));
//     redis.subscribe("my-channel-1", "my-channel-2", (err, count) => {
//       if (err) {
//         // Just like other commands, subscribe() can fail for some reasons,
//         // ex network issues.
//         console.error("Failed to subscribe: %s", err.message);
//       } else {
//         // `count` represents the number of channels this client are currently subscribed to.
//         console.log(
//           `Subscribed successfully! This client is currently subscribed to ${count} channels.`
//         );
//       }
//     });

//     redis.on("message", (channel, message) => {
//       console.log(`Received ${message} from ${channel}`);
//     });
//     console.log("Published %s to %s", "message");
//   } catch (err) {
//     console.log(err);
//   }
// };
// connectRedis();

// io.on("connection", (socket) => {
//   console.log(socket.id);

//   socket.on("join-redis", (a) => {
//     console.log(a);
//     socket.join("my-channel-1");
//   });

//   socket.on("chatMessage", (message) => {
//     console.log(message);
//     publisher.publish("my-channel-1", message);
//   });

//   subscriber.subscribe("my-channel-1", "my-channel-2", (err, count) => {
//     if (err) {
//       console.error("Failed to subscribe: %s", err.message);
//     } else {
//       console.log(
//         `Subscribed successfully! This client is currently subscribed to ${count} channels.`
//       );
//     }
//   });
//   subscriber.on("message", (channel, message) => {
//     socket.to(channel).emit("channel", message);
//     console.log(`Received ${message} from ${channel}`);
//   });
//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//     subscriber.unsubscribe("my-channel-1");
//     subscriber.quit();
//   });
// });

// http.listen(4300, function () {
//   console.log("Sockets on 4300");
// });
