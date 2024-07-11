const aesjs = require("aes-js");
const User = require("../models/userAuth");
const jwt = require("jsonwebtoken");
const Membership = require("../models/membership");
require("dotenv").config();
const Community = require("../models/community");
const Message = require("../models/message");
const Topic = require("../models/topic");
const Analytics = require("../models/Analytics");
const uuid = require("uuid").v4;
const Post = require("../models/post");
const Tag = require("../models/Tag");
const Admin = require("../models/admin");
const SellerOrder = require("../models/SellerOrder")
const Comment = require("../models/comment");
const sha256 = require("sha256")
const Conversation = require("../models/conversation");
const Notification = require("../models/notification");
const admin = require("../fireb");
const {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const Ads = require("../models/Ads");
const Minio = require("minio");
const Product = require("../models/product");
const Order = require("../models/orders");
const Cart = require("../models/Cart");
const Subscriptions = require("../models/Subscriptions");
const Report = require("../models/reports");
const { default: axios } = require("axios");

const BUCKET_NAME = process.env.BUCKET_NAME;
const PRODUCT_BUCKET = process.env.PRODUCT_BUCKET;
const POST_BUCKET = process.env.POST_BUCKET;
const Msgbucket = process.env.MSG_BUCKET;

const minioClient = new Minio.Client({
	endPoint: "minio.grovyo.xyz",

	useSSL: true,
	accessKey: "shreyansh379",
	secretKey: "shreyansh379",
});

function sumArray(arr) {
	let total = 0;
	for (let i = 0; i < arr.length; i++) {
		total += arr[i];
	}
	return total;
}

function calculateTotalDistance(coordinates) {
	let totalDistance = 0;

	for (let i = 1; i < coordinates.length; i++) {
		const coord1 = coordinates[i - 1];
		const coord2 = coordinates[i];
		totalDistance += geolib.getDistance(coord1, coord2);
	}

	return totalDistance / 1000;
}

function generateRandomNumber() {
	let min = 100000000;
	let max = 999999999;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
	const year = String(date.getFullYear()).slice(-2);

	return `${day}/${month}/${year}`;
}

//string matching function
function findBestMatch(inputString, stringArray) {
	let bestMatch = null;
	let bestScore = -1;

	stringArray.forEach((str) => {
		const distance = natural.LevenshteinDistance(inputString, str);
		const similarity = 1 - distance / Math.max(inputString.length, str.length);

		if (similarity > bestScore) {
			bestScore = similarity;
			bestMatch = str;
		}
	});

	return { bestMatch, bestScore };
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

const s3 = new S3Client({
	region: process.env.BUCKET_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_KEY,
	},
});

const decryptaes = async (data) => {
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
const encryptaes = async (data) => {
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

function generateAccessToken(data) {
	const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
		expiresIn: "31d",
	});
	return access_token;
}

function generateRefreshToken(data) {
	const refresh_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
		expiresIn: "31d",
	});
	return refresh_token;
}

exports.checkid = async (req, res) => {
	console.log(req.body)
	try {

		const { phone } = req.body;

		const user = await User.findOne({ phone });

		const memberships = await Membership.findById(user.memberships.membership);

		if (user) {
			const dp = process.env.URL + user.profilepic;
			const data = {
				dp,
				fullname: user.fullname,
				username: user.username,
				isverified: user?.isverified,
				id: user._id.toString(),
				memberships: memberships.title,
			};
			const access_token = generateAccessToken(data);
			const refresh_token = generateRefreshToken(data);

			res.status(200).json({
				access_token,
				refresh_token,
				data,
				userexists: true,
				success: true,
			});
		} else {
			res.status(204).json({ message: "User not found", success: true, userexists: false });
		}
	} catch (err) {
		console.log(err)
		res.status(400).json({ message: "Something Went Wrong", success: false });
	}
};

exports.checkemail = async (req, res) => {

	const { email, password } = req.body;
	const passw = await encryptaes(password);
	console.log(email, password)
	try {
		const user = await User.findOne({ email: email, passw: passw });
		if (!user) {
			return res
				.status(203)
				.json({ message: "User not found", success: true, userexists: false });
		} else {
			const memberships = await Membership.findById(
				user.memberships.membership
			);
			const dp = process.env.URL + user.profilepic;
			const data = {
				dp,
				fullname: user.fullname,
				username: user.username,
				id: user._id.toString(),
				isverified: user?.isverified,
				memberships: memberships.title,
			};
			const access_token = generateAccessToken(data);
			const refresh_token = generateRefreshToken(data);
			res.status(200).json({
				message: "Account exists",
				access_token,
				refresh_token,
				data,
				success: true,
				userexists: true,
			});
		}
	} catch (e) {
		console.log(e);
		res.status(500).json({
			message: "Something went wrong...",
			success: false,
		});
	}
}

exports.checkqr = async (req, res) => {
	try {
		const { id } = req.body;
		const user = await User.findById(id);

		const memberships = await Membership.findById(user.memberships.membership);

		if (user) {
			const dp = process.env.URL + user.profilepic;
			const data = {
				dp,
				fullname: user.fullname,
				username: user.username,
				isverified: user?.isverified,
				id: user._id.toString(),
				memberships: memberships.title,
			};
			const access_token = generateAccessToken(data);
			const refresh_token = generateRefreshToken(data);

			res.status(200).json({
				access_token,
				refresh_token,
				data,
				userexists: true,
				success: true,
			});
		} else {
			res.status(204).json({ message: "User not found", success: true, userexists: false });
		}
	} catch (err) {
		console.log(err)
		res.status(400).json({ message: "Something Went Wrong", success: false });
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
				let analytcis = await Analytics.findOne({
					date: formattedDate,
					id: community._id,
				});

				//Graph Stats
				if (analytcis) {
					await Analytics.updateOne(
						{ _id: analytcis._id },
						{
							$inc: {
								Y1: 1,
							},
						}
					);
				} else {
					const an = new Analytics({
						date: formattedDate,
						id: community._id,
						Y1: 1,
					});
					await an.save();
					//Community Stats
					if (!an?.newmembers?.includes(user._id)) {
						await Analytics.updateOne(
							{ _id: an._id },
							{
								$addToSet: { newmembers: user._id },
							}
						);
					}
				}

				let address = user?.address?.state
					?.toLocaleLowerCase()
					?.toString()
					?.trim();

				if (community.location[address]) {
					community.location[address]++;
				} else {
					community.location[address] = 1;
				}

				await community.save();

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

			await Community.updateOne(
				{ _id: comId },
				{ $pull: { notifications: { id: user._id } } }
			);

			//counting unjoin members in graph
			let today = new Date();

			let year = today.getFullYear();
			let month = String(today.getMonth() + 1).padStart(2, "0");
			let day = String(today.getDate()).padStart(2, "0");

			let formattedDate = `${day}/${month}/${year}`;

			let analytcis = await Analytics.findOne({
				date: formattedDate,
				id: community._id,
			});
			if (analytcis) {
				await Analytics.updateOne(
					{ _id: analytcis._id },
					{
						$inc: {
							Y3: 1,
						},
					}
				);
			} else {
				const an = new Analytics({
					date: formattedDate,
					id: community._id,
					Y3: 1,
				});
				await an.save();
			}

			for (let i = 0; i < community.topics?.length; i++) {
				const topic = await Topic.findById(community.topics[i]);
				if (topic) {
					await Topic.updateOne(
						{ _id: topic._id },
						{
							$pull: { members: user._id, notifications: { id: user._id } },
							$inc: { memberscount: -1 },
						}
					);
				}
				await User.updateMany(
					{ _id: userId },
					{
						$pull: { topicsjoined: topic._id },
						$inc: { totaltopics: -1 },
					}
				);
			}

			res.status(200).json({ success: true });
		}
	} catch (e) {
		res.status(400).json(e.message);
	}
};

// newfor you community.
exports.postanythings3 = async (req, res) => {
	const { userId, comId, topicId } = req.params;
	try {
		const { title, desc, tags, category, type } = req.body;
		const tag = tags.split(",");

		const user = await User.findById(userId);
		const community = await Community.findById(comId);
		const topic = await Topic.findById(topicId);

		if (user && community && topic && req.files.length > 0) {
			let pos = [];
			if (type === "video") {
				let thumbail = "";
				let video = "";
				for (let i = 0; i < req?.files?.length; i++) {
					const uuidString = uuid();
					const bucketName = "posts";
					const objectName = `${Date.now()}${uuidString}${req.files[i].originalname
						}`;

					const result = await s3.send(
						new PutObjectCommand({
							Bucket: POST_BUCKET,
							Key: objectName,
							Body: req.files[i].buffer,
							ContentType: req.files[i].mimetype,
						})
					);

					if (req.files[i].fieldname === "thumbnail") {
						thumbail = objectName;
					} else {
						video = objectName;
					}
				}
				pos.push({
					content: video,
					thumbnail: thumbail,
					type: "video/mp4",
				});
			} else {
				for (let i = 0; i < req?.files?.length; i++) {
					const uuidString = uuid();
					const bucketName = "posts";
					const objectName = `${Date.now()}${uuidString}${req.files[i].originalname
						}`;

					// await minioClient.putObject(
					//   bucketName,
					//   objectName,
					//   req.files[i].buffer
					//   // req.files[i].size,
					//   // req.files[i].mimetype
					// );
					const result = await s3.send(
						new PutObjectCommand({
							Bucket: POST_BUCKET,
							Key: objectName,
							Body: req.files[i].buffer,
							ContentType: req.files[i].mimetype,
						})
					);
					//  const result = await uploader(req.files[i].buffer);

					pos.push({ content: objectName, type: req.files[i].mimetype });
				}
			}
			const post = new Post({
				title,
				desc,
				community: comId,
				sender: userId,
				post: pos,
				tags: tag,
				topicId: topicId,
			});
			const savedpost = await post.save();

			//sending video to a queue for compression
			if (type === "video") {
				for (let i = 0; i < req.files.length; i++) {
					if (req.files[i].fieldname !== "thumbnail") {
						// const readableStream = new stream.PassThrough();
						// readableStream.end(req.files[i].buffer);
						// console.log(req.files[i].buffer, readableStream);
						// compressVideo(readableStream);
						const r = await compressqueue.add(
							"compress-pending",
							{ data: savedpost },
							{ removeOnComplete: true, removeOnFail: true }
						);
						console.log(r.id, "Added to compression queue...");
					}
				}
			}

			//updating tags and interests
			const int = await Interest.findOne({ title: category });

			for (let i = 0; i < tag?.length; i++) {
				const t = await Tag.findOne({ title: tag[i].toLowerCase() });

				if (t) {
					await Tag.updateOne(
						{ _id: t._id },
						{ $inc: { count: 1 }, $addToSet: { post: post._id } }
					);
					if (int) {
						await Interest.updateOne(
							{ _id: int._id },
							{ $inc: { count: 1 }, $addToSet: { post: post._id, tags: t._id } }
						);
					}
				} else {
					const newtag = new Tag({
						title: tag[i].toLowerCase(),
						post: post._id,
						count: 1,
					});
					await newtag.save();
					if (int) {
						await Interest.updateOne(
							{ _id: int._id },
							{
								$inc: { count: 1 },
								$addToSet: { post: post._id, tags: newtag._id },
							}
						);
					}
				}
			}

			await Community.updateOne(
				{ _id: comId },
				{ $push: { posts: savedpost._id }, $inc: { totalposts: 1 } }
			);
			await Topic.updateOne(
				{ _id: topic._id },
				{ $push: { posts: savedpost._id }, $inc: { postcount: 1 } }
			);

			let tokens = [];

			for (let u of community.members) {
				const user = await User.findById(u);

				if (user.notificationtoken && user._id.toString() !== userId) {
					if (user.notificationtoken) {
						tokens.push(user.notificationtoken);
					}
				}
			}

			if (tokens?.length > 0) {
				let link = process.env.POST_URL + post.post[0].content;
				const timestamp = `${new Date()}`
			};
			const msg = {
				notification: {
					title: `${community.title} - Posted!`,
					body: `${post.title}`,
				},
				data: {
					screen: "CommunityChat",
					sender_fullname: `${user?.fullname}`,
					sender_id: `${user?._id}`,
					text: `${post.title}`,
					comId: `${community?._id}`,
					createdAt: `${timestamp}`,
					type: "post",
					link,
				},
				tokens: tokens,
			};

			await admin
				.messaging()
				.sendMulticast(msg)
				.then((response) => {
					console.log("Successfully sent message");
				})
				.catch((error) => {
					console.log("Error sending message:", error);
				});
			res.status(200).json({ savedpost, success: true });
		} else {
			res.status(404).json({
				message:
					"User or Community or Topic not found or no files where there!",
				success: false,
			});
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

//new for you
exports.newfetchfeeds3 = async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);
		const dps = [];
		let current = [];
		const memdps = [];
		const subs = [];
		const liked = [];
		const ads = [];
		const urls = [];
		const content = [];
		const addp = [];

		//checking and removing posts with no communities
		// const p = await Post.find();

		// for (let i = 0; i < p.length; i++) {
		//   const com = await Community.findById(p[i].community);
		//   if (!com) {
		//     p[i].remove();
		//   }
		// }

		//fetching post
		const post = await Post.aggregate([
			{
				$lookup: {
					from: "communities",
					localField: "community",
					foreignField: "_id",
					as: "communityInfo",
				},
			},
			{
				$match: {
					"communityInfo.category": { $in: user.interest },
				},
			},
			{ $sample: { size: 30 } },
			{
				$lookup: {
					from: "users",
					localField: "sender",
					foreignField: "_id",
					as: "sender",
				},
			},
			{
				$lookup: {
					from: "communities",
					localField: "community",
					foreignField: "_id",
					as: "community",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "community.members",
					foreignField: "_id",
					as: "members",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "community.type",
					foreignField: "_id",
					as: "type",
				},
			},
			{
				$addFields: {
					sender: { $arrayElemAt: ["$sender", 0] },
					community: { $arrayElemAt: ["$community", 0] },
				},
			},
			{
				$addFields: {
					"community.members": {
						$map: {
							input: { $slice: ["$members", 0, 4] },
							as: "member",
							in: {
								_id: "$$member._id",
								fullname: "$$member.fullname",
								profilepic: "$$member.profilepic",
							},
						},
					},
				},
			},
			{
				$match: {
					"community.type": { $eq: "public" }, // Excluding posts with community type other than "public"
				},
			},
			{
				$project: {
					_id: 1,
					title: 1,
					createdAt: 1,
					status: 1,
					likedby: 1,
					likes: 1,
					dislike: 1,
					comments: 1,
					totalcomments: 1,
					tags: 1,
					view: 1,
					desc: 1,
					isverified: 1,
					post: 1,
					contenttype: 1,
					date: 1,
					sharescount: 1,
					sender: {
						_id: 1,
						fullname: 1,
						profilepic: 1,
					},
					community: {
						_id: 1,
						title: 1,
						dp: 1,
						members: 1,
						memberscount: 1,
						isverified: 1,
						type: 1,
					},
					topicId: 1,
				},
			},
		]);

		//fetching ads
		const firstad = await Ads.findOne({
			status: "active",
			$or: [{ type: "banner" }],
		})
			.populate({
				path: "postid",
				select:
					"desc post title kind likes likedby comments members community cta ctalink sender totalcomments adtype date createdAt",
				populate: [
					{
						path: "community",
						select: "dp title isverified memberscount members",
						populate: { path: "members", select: "profilepic" },
					},
					{ path: "sender", select: "profilepic fullname" },
				],
			})
			.limit(1);

		const infeedad = await Ads.find({
			status: "active",
			$or: [{ type: "infeed" }],
		}).populate({
			path: "postid",
			select:
				"desc post title kind likes comments community cta ctalink likedby sender totalcomments adtype date createdAt",
			populate: [
				{
					path: "community",
					select: "dp title isverified memberscount members",
					populate: { path: "members", select: "profilepic" },
				},
				{ path: "sender", select: "profilepic fullname" },
			],
		});

		function getRandomIndex() {
			const min = 6;
			return min + Math.floor(Math.random() * (post.length - min));
		}

		let feedad = [];
		for (let i = 0; i < infeedad.length; i++) {
			feedad.push(infeedad[i].postid);
		}

		//merging ads
		if (firstad) {
			post.unshift(firstad.postid);
		}

		if (
			feedad?.length > 0 &&
			(!feedad.includes(null) || !feedad.includes("null"))
		) {
			for (let i = 0; i < feedad.length; i++) {
				const randomIndex = getRandomIndex();
				post.splice(randomIndex, 0, feedad[i]);
			}
		}

		for (let i = 0; i < post.length; i++) {
			if (
				post[i].likedby?.some((id) => id.toString() === user._id.toString())
			) {
				liked.push(true);
			} else {
				liked.push(false);
			}
		}

		for (let k = 0; k < post.length; k++) {
			const coms = await Community.findById(post[k].community);

			if (coms?.members?.includes(user._id)) {
				subs.push("subscribed");
			} else {
				subs.push("unsubscribed");
			}
		}

		if (!post) {
			res.status(201).json({ message: "No post found", success: false });
		} else {
			//post
			for (let i = 0; i < post.length; i++) {
				const a = process.env.URL + post[i].community.dp;
				dps.push(a);
			}

			let ur = [];
			for (let i = 0; i < post?.length; i++) {
				for (let j = 0; j < post[i]?.post?.length; j++) {
					if (post[i].post[j].thumbnail) {
						const a =
							post[i].post[j].link === true
								? process.env.POST_URL + post[i].post[j].content + "640.mp4"
								: process.env.POST_URL + post[i].post[j].content;
						const t = process.env.POST_URL + post[i].post[j].thumbnail;

						ur.push({ content: a, thumbnail: t, type: post[i].post[j]?.type });
					} else {
						const a = process.env.POST_URL + post[i].post[j].content;
						ur.push({ content: a, type: post[i].post[j]?.type });
					}
				}
				urls.push(ur);
				ur = [];
			}

			for (let i = 0; i < post.length; i++) {
				for (
					let j = 0;
					j < Math.min(4, post[i].community.members.length);
					j++
				) {
					const a =
						process.env.URL + post[i]?.community?.members[j]?.profilepic;
					current.push(a);
				}

				memdps.push(current);
				current = [];
			}

			//post data
			const dpData = dps;
			const memdpData = memdps;
			const urlData = urls;
			const postData = post;
			const subData = subs;
			const likeData = liked;

			const mergedData = urlData.map((u, i) => ({
				dps: dpData[i],
				memdps: memdpData[i],
				urls: u,
				liked: likeData[i],
				subs: subData[i],
				posts: postData[i],
			}));

			res.status(200).json({
				mergedData,
				success: true,
			});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: err, success: false });
	}
};

//community feed
exports.joinedcomnews3 = async (req, res) => {
	const { userId } = req.params;
	const user = await User.findById(userId);

	try {
		const communities = await Community.find({
			members: { $in: user._id },
		})
			.populate("members", "profilepic")
			.populate("creator", "fullname");

		const ownedcoms = await Community.find({ creator: user._id.toString() });

		if (!communities || communities.length === 0) {
			res.status(200).json({ message: "No communities found", success: true });
			return;
		}

		const dps = [];
		const urls = [];
		const posts = [];
		const liked = [];
		let current = [];
		const memdps = [];

		// Sort communities based on whether they have a post and the latest post first
		communities.sort((a, b) => {
			const postA = a.posts.length > 0 ? a.posts[0].createdAt : 0;
			const postB = b.posts.length > 0 ? b.posts[0].createdAt : 0;
			return postB - postA;
		});

		for (const community of communities) {
			const post = await Post.find({
				community: community._id,
				type: "Post",
			})
				.populate("sender", "fullname")
				.sort({ createdAt: -1 })
				.limit(1);
			posts.push(post);

			for (let j = 0; j < Math.min(4, community.members.length); j++) {
				const a = process.env.URL + community.members[j].profilepic;

				current.push(a);
			}

			memdps.push(current);
			current = [];

			if (post.length > 0) {
				const like = post[0]?.likedby?.includes(user._id);
				liked.push(like);
			} else {
				liked.push(false);
			}

			let ur = [];
			for (let j = 0; j < post[0]?.post?.length; j++) {
				if (post[0].post[j].thumbnail) {
					const a =
						post[0].post[j].link === true
							? process.env.POST_URL + post[0].post[j].content + "640.mp4"
							: process.env.POST_URL + post[0].post[j].content;
					const t = process.env.POST_URL + post[0].post[j].thumbnail;

					ur.push({ content: a, thumbnail: t, type: post[0].post[j]?.type });
				} else {
					const a = process.env.POST_URL + post[0].post[j].content;

					ur.push({ content: a, type: post[0].post[j]?.type });
				}
			}

			urls.push(ur);
			const a = process.env.URL + community.dp;

			dps.push(a);
		}

		const dpData = dps;
		const memdpData = memdps;
		const urlData = urls;
		const postData = posts;
		const communityData = communities;
		const likeData = liked;

		const mergedData = communityData.map((c, i) => ({
			dps: dpData[i],
			memdps: memdpData[i],
			urls: urlData[i],
			liked: likeData[i],
			community: c,
			posts: postData[i],
		}));

		//arrange acc ot latest post first
		mergedData.sort((a, b) => {
			const timeA = a?.posts[0]?.createdAt || 0;
			const timeB = b?.posts[0]?.createdAt || 0;

			return timeB - timeA;
		});

		res.status(200).json({
			mergedData,
			success: true,
			cancreate: ownedcoms?.length >= 2 ? false : true,
		});
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

// chat feching collection
exports.fetchallchatsnew = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (user) {
			let reqcount = user?.messagerequests?.length;
			let conv = [];
			for (let i = 0; i < user.conversations.length; i++) {
				const convs = await Conversation.findById(
					user.conversations[i]
				).populate(
					"members",
					"fullname username profilepic isverified blockedpeople"
				);
				//if convs is null then remove it
				if (!convs) {
					await User.updateOne(
						{ _id: user._id },
						{ $pull: { conversations: user.conversations[i] } }
					);
				}
				const msg = await Message.find({
					conversationId: convs?._id,
					//status: "active",
					hidden: { $nin: [user._id.toString()] },
					deletedfor: { $nin: [user._id] },
				})
					.limit(1)
					.sort({ createdAt: -1 });

				for (let j = 0; j < convs?.members?.length; j++) {
					if (convs.members[j]._id?.toString() !== user._id.toString()) {
						const pi = process.env.URL + convs?.members[j]?.profilepic;

						//checking the blocking
						let isblocked = false;
						let other = await User.findById(convs.members[j]._id?.toString());
						if (other) {
							other.blockedpeople.forEach((p) => {
								if (p?.id?.toString() === id) {
									isblocked = true;
								}
							});
						}
						//counting unread msgs
						let unread = 0;
						const msgcount = await Message.find({
							conversationId: convs?._id,
							status: "active",
							deletedfor: { $nin: [user._id.toString()] },
							hidden: { $nin: [user._id.toString()] },
						})
							.limit(20)
							.sort({ createdAt: -1 });
						for (let k = 0; k < msgcount.length; k++) {
							if (
								!msgcount[k].readby?.includes(id) &&
								msgcount[k].sender?.toString() !== id
							) {
								unread++;
							}
						}

						let result = {
							convid: convs?._id,
							id: convs?.members[j]?._id,
							fullname: convs?.members[j]?.fullname,
							username: convs?.members[j]?.username,
							isverified: convs?.members[j]?.isverified,
							pic: pi,
							msgs: isblocked ? [] : msg,
							ismuted: user.muted?.includes(convs._id.toString()) || false,
							unread,
						};

						conv.push(result);
					} else {
						null;
					}
				}
			}
			conv.sort((c1, c2) => {
				const timeC1 = c1?.msgs[0]?.createdAt || 0;
				const timeC2 = c2?.msgs[0]?.createdAt || 0;
				return timeC2 - timeC1;
			});
			res.status(200).json({ success: true, reqcount, conv });
		} else {
			res.status(404).json({ message: "User not found", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

// particular coversation private - 
// exports.fetchconvs = async (req, res) => {
// 	try {
// 		const { id, convId, otherid } = req.params;

// 		const user = await User.findById(id);
// 		const otherperson = await User.findById(otherid);
// 		if (!user || !otherperson) {
// 			return res
// 				.status(404)
// 				.json({ message: "User not found", success: false });
// 		}
// 		//blocking/unblocking status
// 		//am i blocked

// 		const isMuted = user.muted.includes(convId);

// 		let isblocked = false;
// 		otherperson.blockedpeople.forEach((p) => {
// 			if (p?.id?.toString() === user._id.toString()) {
// 				isblocked = true;
// 			}
// 		});

// 		//can i block
// 		let canblock = true;
// 		user.blockedpeople.forEach((p) => {
// 			if (p?.id?.toString() === otherperson._id.toString()) {
// 				canblock = false;
// 			}
// 		});

// 		const msg = await Message.find({
// 			conversationId: convId,
// 			// status: "active",
// 			deletedfor: { $nin: [user._id.toString()] },
// 			hidden: { $nin: [user._id.toString()] },
// 		})
// 			.limit(20)
// 			.sort({ createdAt: -1 })
// 			.populate("sender", "profilepic fullname isverified");

// 		let messages = [];

// 		for (let i = 0; i < msg?.length; i++) {
// 			if (
// 				msg[i].typ === "image" ||
// 				msg[i].typ === "video" ||
// 				msg[i].typ === "doc" ||
// 				msg[i].typ === "glimpse"
// 			) {
// 				const url = process.env.MSG_URL + msg[i]?.content?.uri;

// 				messages.push({ ...msg[i].toObject(), url });
// 			} else if (msg[i].typ === "gif") {
// 				const url = msg[i]?.content?.uri;

// 				messages.push({ ...msg[i].toObject(), url });
// 			} else if (msg[i].typ === "post") {
// 				const url = process.env.POST_URL + msg[i]?.content?.uri;
// 				const post = await Post.findById(msg[i].forwardid);
// 				messages.push({
// 					...msg[i].toObject(),
// 					url,
// 					comId: post?.community,
// 				});
// 			} else if (msg[i].typ === "product") {
// 				const url = process.env.PRODUCT_URL + msg[i]?.content?.uri;

// 				messages.push({ ...msg[i].toObject(), url });
// 			} else {
// 				messages.push(msg[i].toObject());
// 			}
// 		}

// 		messages = messages.reverse();
// 		const msgids = messages.map((message) => message.mesId);
// 		await Message.updateMany(
// 			{ mesId: { $in: msgids } },
// 			{ $addToSet: { readby: user._id } }
// 		);

// 		const otheruserdetails = {
// 			id: otherperson._id,
// 			fullname: otherperson.fullname,
// 			username: otherperson.username,
// 			isverified: otherperson.isverified,
// 			profilepic: process.env.URL + otherperson.profilepic,
// 		}

// 		if (isblocked) {
// 			res.status(200).json({ canblock, isblocked, isMuted, otheruserdetails, messages, success: true });
// 		} else {
// 			res.status(200).json({ canblock, isblocked, isMuted, otheruserdetails, messages, success: true });
// 		}
// 	} catch (e) {
// 		console.error(e);
// 		res
// 			.status(500)
// 			.json({ message: "Something went wrong...", success: false });
// 	}
// };

exports.fetchconvs = async (req, res) => {
	try {
		const { id, convId, otherid } = req.params;

		const [user, otherperson] = await Promise.all([
			User.findById(id),
			User.findById(otherid),
		]);

		if (!user || !otherperson) {
			return res.status(404).json({ message: "User not found", success: false });
		}

		// Check mute and block statuses
		const isMuted = user.muted.includes(convId);
		const isblocked = otherperson.blockedpeople.some(p => p?.id?.toString() === user._id.toString());
		const canblock = !user.blockedpeople.some(p => p?.id?.toString() === otherperson._id.toString());

		// Fetch messages
		const msg = await Message.find({
			conversationId: convId,
			deletedfor: { $nin: [user._id.toString()] },
			hidden: { $nin: [user._id.toString()] },
		})
			.limit(20)
			.sort({ createdAt: -1 })
			.populate("sender", "profilepic fullname isverified");

		// Process messages
		const messages = await Promise.all(msg.map(async (message) => {
			let url = '';
			switch (message.typ) {
				case "image":
				case "video":
				case "doc":
				case "glimpse":
					url = process.env.MSG_URL + message?.content?.uri;
					break;
				case "gif":
					url = message?.content?.uri;
					break;
				case "post":
					url = process.env.POST_URL + message?.content?.uri;
					const post = await Post.findById(message.forwardid);
					return { ...message.toObject(), url, comId: post?.community };
				case "product":
					url = process.env.PRODUCT_URL + message?.content?.uri;
					break;
				default:
					return message.toObject();
			}
			return { ...message.toObject(), url };
		}));

		// Update read status
		const msgids = messages.map(message => message.mesId);
		await Message.updateMany({ mesId: { $in: msgids } }, { $addToSet: { readby: user._id } });

		// Construct other user details
		const otheruserdetails = {
			id: otherperson._id,
			fullname: otherperson.fullname,
			username: otherperson.username,
			isverified: otherperson.isverified,
			profilepic: process.env.URL + otherperson.profilepic,
		};

		// Send response
		res.status(200).json({ canblock, isblocked, isMuted, otheruserdetails, messages: messages.reverse(), success: true });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: "Something went wrong...", success: false });
	}
};

exports.compostfeed = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const { postId } = req.body;

		const [user, community] = await Promise.all([
			User.findById(id),
			Community.findById(comId)
				.populate("topics", "title type price nature")
				.populate("creator", "fullname username profilepic isverified")
		]);

		if (!user || !community) {
			return res.status(404).json({ message: "User or Community not found", success: false });
		}

		// Fetch members
		const memberIds = community.members.slice(0, 4);
		const members = await Promise.all(memberIds.map(async (memberId) => {
			const member = await User.findById(memberId);
			return {
				fullname: member?.fullname,
				dp: process.env.URL + member?.profilepic
			};
		}));

		const today = new Date();
		const formattedDate = today.toISOString().slice(0, 10).split('-').reverse().join('/');

		// Muted topics
		const muted = community.notifications?.filter((notification) =>
			notification.id?.toString() === user._id.toString()
		) || null;

		// Visitor count and analytics
		const analytcis = await Analytics.findOne({ date: formattedDate, id: community._id });

		if (analytcis) {
			await Analytics.updateOne({ _id: analytcis._id }, { $inc: { Y2: 1 } });
			const updateFields = analytcis.activemembers.includes(user._id)
				? { returningvisitor: user._id }
				: { activemembers: user._id, newvisitor: user._id };
			await Analytics.updateOne({ _id: analytcis._id }, { $addToSet: updateFields });
		} else {
			const newAnalytics = new Analytics({ date: formattedDate, id: community._id, Y2: 1 });
			await newAnalytics.save();
			const updateFields = newAnalytics.activemembers.includes(user._id)
				? { returningvisitor: user._id }
				: { activemembers: user._id, newvisitor: user._id };
			await Analytics.updateOne({ _id: newAnalytics._id }, { $addToSet: updateFields });
		}

		await Community.updateOne({ _id: community._id }, { $inc: { visitors: 1 } });

		// Creator data
		const creatordp = process.env.URL + community.creator.profilepic;

		// Community data
		const subs = [community.admins, community.moderators, community.members].some(group => group.includes(user._id));
		const canedit = ([community.admins, community.moderators].some(group => group.includes(user._id)) && community.memberscount > 150);
		const canpost = [community.admins, community.moderators].some(group => group.includes(user._id));
		const dp = process.env.URL + community.dp;

		// Post data
		const posts = await Post.find({ community: community._id }).populate("sender", "fullname profilepic username isverified");
		posts.reverse();

		const index = postId ? posts.findIndex(post => post._id.toString() === postId) : 0;

		// Comments and likes data
		const commentsPromises = posts.map(post =>
			Comment.find({ postId: post._id.toString() }).limit(1).sort({ createdAt: -1 })
		);
		const totalCommentsPromises = posts.map(post =>
			Comment.countDocuments({ postId: post._id })
		);
		const likedPromises = posts.map(post =>
			post.likedby?.some(id => id.toString() === user._id.toString())
		);

		const [comments, totalComments, liked] = await Promise.all([
			Promise.all(commentsPromises),
			Promise.all(totalCommentsPromises),
			Promise.all(likedPromises)
		]);

		// Post content and DP of the sender
		const urls = posts.map(post => post.post.map(content => ({
			content: process.env.POST_URL + content.content,
			type: content.type
		})));
		const dps = posts.map(post => process.env.URL + post.sender.profilepic);

		// Merge data
		const mergedData = posts.map((post, i) => ({
			dpdata: dps[i],
			urls: urls[i],
			liked: liked[i],
			posts: post,
			totalcomments: totalComments[i],
			comments: comments[i].length > 0 ? comments[i] : "no comment"
		}));

		// Check if member of private community
		const ismember = community.type !== "public" ? community.members.includes(user._id) : true;

		res.status(200).json({
			muted,
			mergedData,
			index,
			dp,
			members,
			community,
			creatordp,
			subs,
			canedit,
			canpost,
			ismember,
			category: community?.category,
			success: true,
		});
	} catch (e) {
		console.error(e);
		res.status(400).json({ message: "Something went wrong...", success: false });
	}
};


// exports.compostfeed = async (req, res) => {
// 	try {
// 		const { id, comId } = req.params;
// 		const { postId } = req.body;

// 		const user = await User.findById(id);
// 		const community = await Community.findById(comId)
// 			.populate("topics", "title type price nature")
// 			.populate("creator", "fullname username profilepic isverified")

// 		let members = []

// 		for (let i = 0; i < 4; i++) {
// 			const member = await User.findById(community?.members[i])

// 			const data = {
// 				fullname: member?.fullname,
// 				dp: process.env.URL + member?.profilepic
// 			}

// 			members.push(data)
// 		}

// 		let today = new Date();

// 		let year = today.getFullYear();
// 		let month = String(today.getMonth() + 1).padStart(2, "0");
// 		let day = String(today.getDate()).padStart(2, "0");

// 		let formattedDate = `${day}/${month}/${year}`;
// 		const incrementValue = 1;

// 		//muted and unmuted topics
// 		let muted = null;
// 		if (community?.notifications?.length > 0) {
// 			muted = community?.notifications?.filter((f, i) => {
// 				return f.id?.toString() === user._id.toString();
// 			});
// 		}

// 		if (user && community) {
// 			//visitor count
// 			let analytcis = await Analytics.findOne({
// 				date: formattedDate,
// 				id: community._id,
// 			});

// 			//Graph stats
// 			if (analytcis) {
// 				await Analytics.updateOne(
// 					{ _id: analytcis._id },
// 					{
// 						$inc: {
// 							Y2: 1,
// 						},
// 					}
// 				);
// 				//community based stats
// 				if (analytcis?.activemembers.includes(user._id)) {
// 					await Analytics.updateOne(
// 						{ _id: analytcis._id },
// 						{
// 							$addToSet: { returningvisitor: user._id },
// 						}
// 					);
// 				} else {
// 					await Analytics.updateOne(
// 						{ _id: analytcis._id },
// 						{
// 							$addToSet: { activemembers: user._id, newvisitor: user._id },
// 						}
// 					);
// 				}
// 			} else {
// 				const an = new Analytics({
// 					date: formattedDate,
// 					id: community._id,
// 					Y2: 1,
// 				});
// 				await an.save();
// 				//community based stats
// 				if (an?.activemembers.includes(user._id)) {
// 					await Analytics.updateOne(
// 						{ _id: an._id },
// 						{
// 							$addToSet: { returningvisitor: user._id },
// 						}
// 					);
// 				} else {
// 					await Analytics.updateOne(
// 						{ _id: an._id },
// 						{
// 							$addToSet: { activemembers: user._id, newvisitor: user._id },
// 						}
// 					);
// 				}
// 			}

// 			await Community.updateOne(
// 				{ _id: community._id },
// 				{
// 					$inc: {
// 						visitors: 1,
// 					},
// 				}
// 			);

// 			//creator data
// 			const creatordp = process.env.URL + community.creator.profilepic;

// 			//community data
// 			const subs =
// 				community.admins.includes(user._id) ||
// 				community.moderators.includes(user._id) ||
// 				community.members.includes(user._id);

// 			//can edit topics
// 			const canedit =
// 				(community.admins.includes(user._id) ||
// 					community.moderators.includes(user._id)) &&
// 				community?.memberscount > 150;

// 			//can post
// 			const canpost =
// 				community.admins.includes(user._id) ||
// 				community.moderators.includes(user._id);
// 			const dp = process.env.URL + community.dp;

// 			//post data
// 			const posts = await Post.find({ community: community._id }).populate(
// 				"sender",
// 				"fullname profilepic username isverified"
// 			);
// 			let index = -1;
// 			posts.reverse();

// 			//index of post that appears first
// 			for (let i = 0; i < posts.length; i++) {
// 				if (posts[i]._id.toString() === postId) {
// 					index = i;
// 					break;
// 				}
// 			}

// 			if (!postId) {
// 				index = 0;
// 			}

// 			//comments
// 			const comments = [];
// 			for (let i = 0; i < posts.length; i++) {
// 				const comment = await Comment.find({ postId: posts[i]._id.toString() })
// 					.limit(1)
// 					.sort({ createdAt: -1 });

// 				if (comment.length > 0) {
// 					comments.push(comment);
// 				} else {
// 					comments.push("no comment");
// 				}
// 			}

// 			const liked = [];
// 			const dps = [];
// 			const tc = [];
// 			let urls = [];

// 			//total comments of each post
// 			for (let i = 0; i < posts.length; i++) {
// 				const totalcomments = await Comment.find({ postId: posts[i]._id });
// 				tc.push(totalcomments.length);
// 			}

// 			//likes
// 			for (let i = 0; i < posts.length; i++) {
// 				if (
// 					posts[i].likedby?.some((id) => id.toString() === user._id.toString())
// 				) {
// 					liked.push(true);
// 				} else {
// 					liked.push(false);
// 				}
// 			}

// 			//post content
// 			let ur = [];
// 			for (let i = 0; i < posts?.length; i++) {
// 				for (let j = 0; j < posts[i]?.post?.length; j++) {
// 					const a = process.env.POST_URL + posts[i].post[j].content;

// 					ur.push({ content: a, type: posts[i].post[j]?.type });
// 				}
// 				urls.push(ur);
// 				ur = [];
// 			}

// 			//dp of the sender
// 			for (let i = 0; i < posts.length; i++) {
// 				const a = process.env.URL + posts[i].sender.profilepic;

// 				dps.push(a);
// 			}

// 			let ismember;
// 			//cheking if community is private if person is member
// 			if (community?.type !== "public") {
// 				if (community?.members?.includes(user._id)) {
// 					ismember = true;
// 				} else {
// 					ismember = false;
// 				}
// 			}

// 			//mergeing all the data
// 			const urlData = urls;
// 			const postData = posts;
// 			const likeData = liked;
// 			const dpsdata = dps;
// 			const commentscount = tc;
// 			const commentdata = comments;

// 			const mergedData = urlData.map((u, i) => ({
// 				dpdata: dpsdata[i],
// 				urls: u,
// 				liked: likeData[i],
// 				posts: postData[i],
// 				totalcomments: commentscount[i],
// 				comments: commentdata[i],
// 			}));

// 			res.status(200).json({
// 				muted,
// 				mergedData,
// 				index,
// 				dp,
// 				members,
// 				community,
// 				creatordp,
// 				subs,
// 				canedit,
// 				canpost,
// 				ismember,
// 				category: community?.category,
// 				success: true,
// 			});
// 		} else {
// 			res.status(404).json({ message: "User or Community not found" });
// 		}
// 	} catch (e) {
// 		console.log(e);
// 		res
// 			.status(400)
// 			.json({ message: "Something went wrong...", success: false });
// 	}
// };

// ya to post - 
exports.fetchallposts = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const { postId, topicId } = req.body;
		const user = await User.findById(id);
		const community = await Community.findById(comId);

		let topic;
		let feedad = [];
		let vidadarray = [];
		let post = [];
		if (!topicId) {
			topic = await Topic.findOne({
				title: "Posts",
				community: community._id.toString(),
			});
		} else {
			topic = await Topic.findById(topicId);
		}

		if (user && community) {
			const postold = await Post.find({ topicId: topic?._id }).populate(
				"sender",
				"fullname profilepic"
			);

			if (
				community.type === "public" &&
				topic.postcount > 0 &&
				community.ismonetized
			) {
				//removing un existing posts
				for (let i = 0; i < topic.posts.length; i++) {
					const post = await Post.findById(topic.posts[i]);
					if (!post) {
						await Topic.updateOne(
							{ _id: topic._id },
							{ $pull: { posts: topic.posts[i] }, $inc: { postcount: -1 } }
						);
					}
				}
				//fetching ads
				const infeedad = await Ads.find({
					status: "active",
					type: "infeed",
				}).populate({
					path: "postid",
					select:
						"desc post title kind likes comments community cta ctalink sender totalcomments adtype date createdAt",
					populate: [
						{ path: "community", select: "dp title isverified memberscount" },
						{ path: "sender", select: "profilepic fullname" },
					],
				});

				for (let i = 0; i < infeedad.length; i++) {
					feedad.push(infeedad[i].postid);
				}

				const vidad = await Ads.find({
					status: "active",
					$or: [{ type: "skipable" }, { type: "non-skipable" }],
				}).populate({
					path: "postid",
					select:
						"desc post title kind likes comments community cta ctalink sender totalcomments adtype date createdAt",
					populate: [
						{ path: "community", select: "dp title isverified memberscount" },
						{ path: "sender", select: "profilepic fullname" },
					],
				});

				for (let i = 0; i < vidad.length; i++) {
					let a = process.env.AD_URL + vidad[i].postid?.post[0].content;
					let comdp = process.env.URL + vidad[i].postid?.community?.dp;

					let final = {
						_id: vidad[i].postid?._id,
						likes: vidad[i].postid?.likes,
						comments: vidad[i].postid?.likes,
						totalcomments: vidad[i].postid?.totalcomments,
						title: vidad[i].postid?.title,
						desc: vidad[i].postid?.desc,
						community: vidad[i].postid?.community,
						sender: vidad[i].postid?.sender,
						post: vidad[i].postid?.post,
						kind: vidad[i].postid?.kind,
						date: vidad[i].postid?.date,
						adtype: vidad[i].postid?.adtype,
						cta: vidad[i].postid?.cta,
						ctalink: vidad[i].postid?.ctalink,
						createdAt: vidad[i].postid?.createdAt,
						desc: vidad[i].desc,
						headline: vidad[i].headline,
						url: a,
						comdp,
					};
					vidadarray.push(final);
				}
			}

			for (let i = 0; i < postold.length; i++) {
				//object of post
				let po = {
					_id: postold[i]._id,
					likedby: postold[i].likedby,
					likes: postold[i].likes,
					dislike: postold[i].dislike,
					dislikedby: postold[i].dislikedby,
					comments: postold[i].comments,
					totalcomments: postold[i].totalcomments,
					tags: postold[i].tags,
					views: postold[i].views,
					title: postold[i].title,
					desc: postold[i].desc,
					community: postold[i].community,
					sender: postold[i].sender,
					isverified: postold[i].isverified,
					kind: postold[i].kind,
					post: postold[i].post,
					votedby: postold[i].votedby,
					totalvotes: postold[i].totalvotes,
					contenttype: postold[i].contenttype,
					date: postold[i].date,
					status: postold[i].status,
					sharescount: postold[i].sharescount,
					type: postold[i].type,
					options: postold[i].options,
					createdAt: postold[i].createdAt,
					topicId: postold[i].topicId,
					forwardid: postold[i].forwardid,
				};
				post.push(po);
			}
			//mixing skipable and non-skipable ads with posts
			for (let j = 0; j < vidadarray.length; j++) {
				if (post.length > 0) {
					const randomIndex = getRandomIndexforad();
					if (post[randomIndex].post[0].type === "video/mp4") {
						post[randomIndex].ad = vidadarray[j];
					}
				}
			}

			//muted and unmuted topics
			let muted = null;
			if (topic?.notifications?.length > 0) {
				muted = topic?.notifications?.filter((f, i) => {
					return f.id?.toString() === user._id.toString();
				});
			}
			let index = -1;
			post.reverse();

			//mixing the infeed ad with posts
			function getRandomIndex() {
				return Math.floor(Math.random() * (Math.floor(post.length / 2) + 1));
			}
			function getRandomIndexforad() {
				return Math.floor(Math.random() * Math.floor(post.length / 2));
			}

			for (let i = 0; i < feedad.length; i++) {
				const randomIndex = getRandomIndex();
				post.splice(randomIndex, 0, feedad[i]);
			}
			//index of post that appears first
			for (let i = 0; i < post.length; i++) {
				if (post[i]._id.toString() === postId) {
					index = i;
					break;
				}
			}

			if (!postId) {
				index = 0;
			}

			//comments
			const comments = [];
			for (let i = 0; i < post.length; i++) {
				const comment = await Comment.find({ postId: post[i]._id.toString() })
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
			for (let i = 0; i < post.length; i++) {
				const totalcomments = await Comment.find({ postId: post[i]._id });
				tc.push(totalcomments.length);
			}

			//likes
			for (let i = 0; i < post.length; i++) {
				if (
					post[i].likedby?.some((id) => id.toString() === user._id.toString())
				) {
					liked.push(true);
				} else {
					liked.push(false);
				}
			}

			//post content
			let ur = [];
			for (let i = 0; i < post?.length; i++) {
				for (let j = 0; j < post[i]?.post?.length; j++) {
					if (post[i].post[j].thumbnail) {
						if (post[i].post[j].link === true) {
							const a =
								process.env.POST_URL + post[i].post[j].content + "640.mp4";
							const t = process.env.POST_URL + post[i].post[j].thumbnail;

							ur.push({
								content: a,
								thumbnail: t,
								type: post[i].post[j]?.type,
								link: true,
								links: {
									low: a,
									high: process.env.POST_URL + post[i].post[j].content,
								},
							});
						} else {
							const a = process.env.POST_URL + post[i].post[j].content;
							const t = process.env.POST_URL + post[i].post[j].thumbnail;

							ur.push({
								content: a,
								thumbnail: t,
								type: post[i].post[j]?.type,
							});
						}
					} else if (post[i].forwardid) {
						const a = process.env.PRODUCT_URL + post[i].post[j].content;
						ur.push({ content: a, type: post[i].post[j]?.type });
					} else {
						const a = process.env.POST_URL + post[i].post[j].content;
						ur.push({ content: a, type: post[i].post[j]?.type });
					}
				}
				urls.push(ur);
				ur = [];
			}

			//dp of the sender
			for (let i = 0; i < post.length; i++) {
				let a;
				if (post[i].kind === "ad") {
					a = process.env.URL + post[i].community.dp;
				} else {
					a = process.env.URL + post[i].sender.profilepic;
				}
				dps.push(a);
			}

			//merging all the data
			const urlData = urls;
			const postData = post;
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

			if (!community.members.includes(user._id)) {
				res.status(203).json({
					message: "You are not the member of the Community",
					success: true,
					topicjoined: false,
					mergedData,
				});
			} else {
				//checking if brought topic is valid
				let purchaseindex = topic.purchased.findIndex(
					(f, i) => f.id?.toString() === user._id?.toString()
				);

				const timestamp = topic.purchased[purchaseindex]?.broughton || 0;
				const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

				const currentTimestamp = Date.now();

				const difference = currentTimestamp - timestamp;

				const isWithin30Days =
					topic?.title === "Posts" ? true : difference <= thirtyDaysInMs;
				let topicdetail = {
					id: topic?._id,
					price: topic?.price,
					desc: topic?.message,
					members: topic?.memberscount,
					name: topic?.title,
				};

				if (
					topic.type !== "paid" &&
					topic?.members.some((memberId) => memberId.equals(user?._id))
				) {
					res.status(200).json({
						muted,
						mergedData,
						index,
						success: true,
						topicjoined: true,
					});
				} else {
					if (topic?.type === "paid") {
						if (
							topic.purchased.some(
								(memberId) => memberId.id.equals(user?._id) && isWithin30Days
							)
						) {
							res.status(200).json({
								muted,
								mergedData,
								index,
								success: true,
								topicjoined: true,
							});
						} else {
							res.status(203).json({
								messages: "Not joined",
								success: true,
								topicjoined: false,
								topic: topicdetail,
								mergedData,
							});
						}
					} else {
						res.status(200).json({
							muted,
							mergedData,
							index,
							success: true,
							topicjoined: true,
						});
					}
				}
			}

			// res.status(200).json({ success: true, mergedData, index });
		} else {
			res
				.status(404)
				.json({ success: false, message: "Something went wrong..." });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

// ya topic mesg fetch honge 
exports.gettopicmessages = async (req, res) => {
	try {
		const { id, topicId } = req.params;
		const user = await User.findById(id);
		const topic = await Topic.findById(topicId);
		const community = await Community.find({ topics: { $in: [topic._id] } });
		if (community && topic && user) {
			const msg = await Message.find({
				topicId: topicId,
				// status: "active",
				deletedfor: { $nin: [user._id.toString()] },
			})
				.limit(20)
				.sort({ createdAt: -1 })
				.populate("sender", "profilepic fullname isverified");

			let messages = [];

			for (let i = 0; i < msg?.length; i++) {
				if (
					msg[i].typ === "image" ||
					msg[i].typ === "video" ||
					msg[i].typ === "doc" ||
					msg[i].typ === "glimpse"
				) {
					const url = process.env.MSG_URL + msg[i]?.content?.uri;

					messages.push({ ...msg[i].toObject(), url, dp: process.env.URL + msg[i].sender.profilepic, });
				} else if (msg[i].typ === "gif") {
					const url = msg[i]?.content?.uri;

					messages.push({ ...msg[i].toObject(), url, dp: process.env.URL + msg[i].sender.profilepic, });
				} else if (msg[i].typ === "post") {
					const url = process.env.POST_URL + msg[i]?.content?.uri;
					const post = await Post.findById(msg[i].forwardid);
					messages.push({
						...msg[i].toObject(),
						url,
						dp: process.env.URL + msg[i].sender.profilepic,
						comId: post?.community,
					});
				} else if (msg[i].typ === "product") {
					const url = process.env.PRODUCT_URL + msg[i]?.content?.uri;

					messages.push({ ...msg[i].toObject(), url, dp: process.env.URL + msg[i].sender.profilepic, });
				} else {
					messages.push({ ...msg[i].toObject(), dp: process.env.URL + msg[i].sender.profilepic });
				}
			}

			messages.reverse();

			//muted and unmuted topics
			let muted = null;
			if (topic?.notifications?.length > 0) {
				muted = topic?.notifications?.filter((f, i) => {
					return f.id?.toString() === user._id.toString();
				});
			}

			if (!community[0].members.includes(user._id)) {
				res.status(203).json({
					message: "You are not the member of the Community",
					success: true,
					topicjoined: false,
				});
			} else {
				//checking if brought topic is valid
				let purchaseindex = topic.purchased.findIndex(
					(f, i) => f.id?.toString() === user._id?.toString()
				);

				const timestamp = topic.purchased[purchaseindex]?.broughton || 0;
				const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

				const currentTimestamp = Date.now();

				const difference = currentTimestamp - timestamp;

				const isWithin30Days = difference <= thirtyDaysInMs;
				let topicdetail = {
					id: topic?._id,
					price: topic?.price,
					desc: topic?.message,
					members: topic?.memberscount,
					name: topic?.title,
					type: topic?.type
				};

				if (
					topic.type !== "paid" &&
					topic.members.some((memberId) => memberId.equals(user?._id))
				) {
					res.status(200).json({
						muted,
						messages,
						success: true,
						topicjoined: true,
					});
				} else {
					if (topic?.type === "paid") {
						if (
							topic.purchased.some((memberId) =>
								memberId.id.equals(user?._id)
							) &&
							isWithin30Days
						) {
							res.status(200).json({
								muted,
								messages,
								success: true,
								topicjoined: true,
							});
						} else {
							res.status(203).json({
								// messages: ["Not joined"],
								messages: [],
								// messages: "Not joined",
								success: true,
								topicjoined: false,
								topic: topicdetail,
							});
						}
					} else {
						res.status(200).json({
							muted,
							messages,
							success: true,
							topicjoined: true,
						});
					}
				}
			}
		} else {
			res.status(404).json({ message: "Something not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

// saerch com
exports.searchcoms = async (req, res) => {
	const { id } = req.params;
	const { query } = req.query;
	try {
		if (!query) {
			res.status(400).json({ success: false });
		} else {
			const dps = [];
			const creatordps = [];
			const coms = await Community.find({
				title: { $regex: `.*${query}.*`, $options: "i" },
				type: "public",
				blocked: { $nin: id }
			})
				.populate("creator", "fullname username profilepic isverified")
				.select("title createdAt dp memberscount")
				.limit(100)
				.lean()
				.exec();
			for (let i = 0; i < coms.length; i++) {
				const a = process.env.URL + coms[i].dp;

				dps.push(a);
			}
			for (let i = 0; i < coms.length; i++) {
				const a = process.env.URL + coms[i].creator.profilepic;

				creatordps.push(a);
			}
			res.status(200).json({ data: { coms, dps, creatordps }, success: true });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

// search pros
exports.searchpros = async (req, res) => {
	const { query } = req.query;
	try {
		if (!query) {
			res.status(400).json({ success: false });
		} else {
			const dps = [];
			const pros = await User.find({
				fullname: { $regex: `.*${query}.*`, $options: "i" }
			})
				.select("fullname profilepic username isverified createdAt")
				.lean()
				.limit(100)
				.exec();

			for (let i = 0; i < pros.length; i++) {
				const a = process.env.URL + pros[i].profilepic;

				dps.push(a);
			}
			res.status(200).json({ data: { pros, dps, success: true } });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.loadmorechatmsgs = async (req, res) => {
	try {
		const { id } = req.params;
		const { convId, sequence } = req.body;
		const user = await User.findById(id);

		if (user) {
			let gt = parseInt(sequence) - 1;
			let lt = gt - 10;

			const msg = await Message.find({
				conversationId: convId,
				sequence: { $gte: lt >= 1 ? lt : 1, $lte: gt },
				deletedfor: { $nin: [user._id] },
				hidden: { $nin: [user._id.toString()] },
				//status: "active",
			})
				.limit(20)
				.sort({ sequence: 1 })
				.populate("sender", "profilepic fullname isverified");

			let messages = [];

			for (let i = 0; i < msg?.length; i++) {
				if (
					msg[i].typ === "image" ||
					msg[i].typ === "video" ||
					msg[i].typ === "doc"
				) {
					const url = process.env.MSG_URL + msg[i]?.content?.uri;
					messages.push({ ...msg[i].toObject(), url });
				} else if (msg[i].typ === "gif") {
					const url = msg[i]?.content?.uri;

					messages.push({ ...msg[i].toObject(), url });
				} else {
					messages.push(msg[i].toObject());
				}
			}

			res.status(200).json({ messages, success: true });
		} else {
			res.status(404).json({ messgae: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

exports.sendchatfile = async (req, res) => {
	try {

		const data = JSON.parse(req.body.data);
		let pos = {};
		if (data?.typ !== "gif") {
			const uuidString = uuid();
			const bucketName = "messages";
			const objectName = `${Date.now()}${uuidString}${req.files[0]?.originalname}`;
			const result = await s3.send(
				new PutObjectCommand({
					Bucket: Msgbucket,
					Key: objectName,
					Body: req.files[0]?.buffer,
					ContentType: req.files[0]?.mimetype,
				})
			);
			pos.uri = objectName;
			pos.type = req.files[0].mimetype;
			pos.name = data?.content?.name;
			pos.size = req.files[0].size;
		} else {
			pos.uri = data?.url;
			pos.type = "image/gif";
		}

		const message = new Message({
			text: data?.text,
			sender: data?.sender_id,
			conversationId: data?.convId,
			typ: data?.typ,
			mesId: data?.mesId,
			reply: data?.reply,
			dissapear: data?.dissapear,
			isread: data?.isread,
			sequence: data?.sequence,
			timestamp: data?.timestamp,
			content: pos,
			comId: data?.comId,
			topicId: data?.sendtopicId,
		});
		await message.save();

		let a;
		if (data?.typ !== "gif") {
			a = process.env.MSG_URL + message?.content?.uri;
		} else {
			a = process.env.URL + message?.content?.uri;
		}

		res.status(200).json({ success: true, link: a });
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

// library

// exports.fetchapplause = async (req, res) => {
// 	const { userId } = req.params;
// 	try {
// 		const user = await User.findById(userId);
// 		if (!user) {
// 			res.status(404).json({ message: "No user found", success: false });
// 		} else {
// 			const post = await Post.find({ likedby: user._id })
// 				.populate("community", "title isverified dp")
// 				.populate("sender", "fullname");
// 			if (post) {
// 				const url = [];
// 				for (let i = 0; i < post.length; i++) {
// 					const urls = await generatePresignedUrl(
// 						"posts",
// 						post[i].post[0].toString(),
// 						60 * 60
// 					);
// 					url.push(urls);
// 				}
// 				const dp = [];
// 				for (let i = 0; i < post.length; i++) {
// 					const a = await generatePresignedUrl(
// 						"images",
// 						post[i].community.dp.toString(),
// 						60 * 60
// 					);
// 					dp.push(a);
// 				}
// 				res.status(200).json({ post, url, dp, success: true });
// 			} else {
// 				res.status(203).json({ success: false });
// 			}
// 		}
// 	} catch (e) {
// 		res.status(400).json({ message: e.message, success: false });
// 	}
// };

//fetch orders
exports.fetchorders = async (req, res) => {
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ message: "No user found", success: false });
		} else {
			const orders = [];

			for (let i = 0; i < user.puchase_history.length; i++) {
				const order = await Order.findById(user.puchase_history[i].toString())
					.populate(
						"productId",
						"name brandname creator images inclusiveprice price percentoff sellername totalstars"
					)
					.populate("sellerId", "isverified fullname");

				if (order?.productId && order?.sellerId) {
					orders.push(order);
				} else {
					order?.remove();
					await User.updateOne(
						{ _id: user._id },
						{ $pull: { puchase_history: order?._id } }
					);
				}
			}

			const image = [];
			if (orders) {
				for (let j = 0; j < orders.length; j++) {

					if (orders[j].productId[0]) {
						const a =
							process.env.PRODUCT_URL +
							orders[j].productId[0].images[0].content;

						image.push(a);
					} else {
						orders[j].remove();
					}
				}
			}

			const merge = orders?.reverse()?.map((orders, i) => ({
				orders,
				image: image[i],
			}));
			res
				.status(200)
				.json({ data: merge, address: user.location, success: true });
		}
	} catch (e) {

		res.status(400).json({ message: e.message, success: false });
	}
};

//fetch cart
exports.fetchcart = async (req, res) => {
	const { userId } = req.params;
	try {
		const user = await User.findById(userId).populate({
			path: "cart",
			populate: {
				path: "product",
				model: "Product",
			},
		});
		if (!user) {
			res.status(404).json({ message: "No user found", success: false });
		} else {
			const ids = [];
			const image = [];
			for (let j = 0; j < user.cart.length; j++) {
				ids.push(user?.cart[j]?.product?._id);
			}

			if (user) {
				for (let j = 0; j < user.cart.length; j++) {
					//  console.log(user.cart[j].product.images);
					if (user.cart[j].product?.isvariant) {
						const a = user.cart[j].conf.pic;

						image.push(a);
					} else {
						if (user.cart[j]?.product?.images?.length > 0) {
							const a =
								process.env.PRODUCT_URL +
								user.cart[j].product?.images[0].content;

							image.push(a);
						}
					}
				}
			}

			const total = [];
			const discountedTotal = [];
			const totalqty = [];
			let count = 0;
			let countdis = 0;
			let qty = 0;
			for (let i = 0; i < user.cart.length; i++) {
				if (user.cart[i].product?.isvariant) {
					const t = user.cart[i].conf.price * user?.cart[i].quantity;
					count += t;
					const d = user.cart[i].conf.discountedprice * user?.cart[i].quantity;
					countdis += d;
				} else {
					const t = user.cart[i].product?.price * user?.cart[i].quantity;
					count += t;
					const d =
						user.cart[i].product?.discountedprice * user?.cart[i].quantity;
					countdis += d;
				}

				const q = user?.cart[i].quantity;
				qty += q;
			}
			total.push(count);
			discountedTotal.push(countdis);
			totalqty.push(qty);
			const discount = [];
			let dis = 0;
			for (let i = 0; i < user.cart.length; i++) {
				const t = user.cart[i].product?.percentoff;
				dis += t;
			}
			discount.push(dis);

			const cart = user.cart;
			const imgs = image;

			const merge = cart?.map((c, i) => ({ c, image: imgs[i] }));

			res.status(200).json({
				totalqty: totalqty,
				total: total,
				discountedtotal: discountedTotal,
				data: merge,
				discount: discount,
				address: user.address,
				success: true,
				ids,
			});
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: e.message, success: false });
	}
};

//add to cart
exports.addtocart = async (req, res) => {

	const { userId, productId } = req.params;
	const { quantity, cartId, action, cat } = req.body;
	try {
		const user = await User.findById(userId);
		const prod = await Product.findById(productId);
		if (!user) {
			res.status(404).json({ message: "No user found", success: false });
		} else {
			const cart = await Cart.findById(cartId);
			if (!cart) {
				let c;
				if (cat) {
					console.log(cat);
					c = new Cart({
						product: productId,
						quantity: quantity,
						conf: cat,
					});
					await c.save();
				} else {
					let cate = {
						variant: prod?.variants[0]?.name,
						category: prod?.variants[0]?.category[0]?.name,
						pic:
							process?.env?.PRODUCT_URL +
							prod?.variants[0]?.category[0]?.content,
						price: prod?.variants[0]?.category[0]?.price,
						discountedprice: prod?.variants[0]?.category[0]?.discountedprice,
					};
					c = new Cart({
						product: productId,
						quantity: quantity,
						conf: cate,
					});
					await c.save();
				}
				await User.updateOne({ _id: userId }, { $push: { cart: c._id } });
				await User.updateOne(
					{ _id: userId },
					{ $push: { cartproducts: productId } }
				);
				res.status(200).json({ c, success: true });
			} else {
				if (action === "inc") {
					await Cart.updateOne({ _id: cart._id }, { $inc: { quantity: 1 } });
				} else {
					if (action === "dec") {
						await Cart.updateOne({ _id: cart._id }, { $inc: { quantity: -1 } });
					} else {
						await Cart.deleteOne({ _id: cart._id });
						await User.updateOne(
							{ _id: userId },
							{ $pull: { cart: cart._id } }
						);
						await User.updateOne(
							{ _id: userId },
							{ $pull: { cartproducts: productId } }
						);
					}
				}
				res.status(200).json({ success: true });
			}
		}
	} catch (e) {
		console.log(e)
		res.status(400).json({ message: e.message, success: false });
	}
};

//update quantity
exports.updatequantity = async (req, res) => {
	const { userId, cartId } = req.params;
	const { quantity } = req.body;

	try {
		const user = await User.findById(userId);
		const cart = await user.cart.includes(cartId);
		if (!user || !cart) {
			res.status(404).json({ message: "Not found", success: false });
		} else {
			await Cart.updateOne({ _id: cartId }, { $set: { quantity: quantity } });
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e)
		res.status(400).json({ message: e.message, success: false });
	}
};

//remove from cart
exports.removecartorder = async (req, res) => {

	try {
		const { id, cartId, productId } = req.params;
		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({ message: "User or Product not found" });
		} else {
			await User.updateOne(
				{ _id: user._id },
				{
					$pull: {
						cartproducts: productId,
						cart: cartId,
					},
				}
			);
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

//udpate address
exports.updateaddress = async (req, res) => {
	const { userId } = req.params;
	const {
		streetaddress,
		state,
		city,
		landmark,
		pincode,
		latitude,
		longitude,
		altitude,
		provider,
		accuracy,
		bearing,
		phone,
	} = req.body;

	try {
		const address = {
			streetaddress: streetaddress,
			state: state,
			city: city,
			landmark: landmark,
			pincode: pincode,
			coordinates: {
				latitude: latitude,
				longitude: longitude,
				altitude: altitude,
				provider: provider,
				accuracy: accuracy,
				bearing: bearing,
			},
		};
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ message: "No user found", success: false });
		} else {
			if (phone) {
				await User.updateOne(
					{ _id: userId },
					{ $set: { address: address, phone: phone } }
				);
			} else {
				await User.updateOne({ _id: userId }, { $set: { address: address } });
			}
			res.status(200).json({ success: true });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

//fetch subscriptions
exports.fetchallsubscriptions = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (user) {
			const subs = await Subscriptions.find({
				purchasedby: user._id.toString(),
			});
			let status = [];
			for (let i = 0; i < subs.length; i++) {
				//checking if brought topic is valid
				let topic = await Topic.findById(subs[i].topic).populate(
					"community",
					"title dp"
				);

				if (!topic) {
					subs[i].remove();
					topic?.remove();
				} else {
					let purchaseindex = topic?.purchased.findIndex(
						(f, i) => f.id?.toString() === user._id?.toString()
					);

					const timestamp = topic?.purchased[purchaseindex]?.broughton || 0;
					const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

					const currentTimestamp = Date.now();

					const difference = currentTimestamp - timestamp;

					const isWithin30Days = difference <= thirtyDaysInMs;
					status.push({
						topic: topic?.title,
						community: topic?.community?.title,
						validity: isWithin30Days ? "Active" : "Expired",
						dp: process.env.URL + topic?.community?.dp,
					});
				}
			}
			let merged = subs.map((s, i) => ({
				s,
				status: status[i],
			}));
			res.status(200).json({ success: true, merged });
		} else {
			res.status(404).json({ message: "Something went wrong", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false, message: "Something went wrong" });
	}
};

exports.addsubs = async (req, res) => {
	const { userId, topicId } = req.params;
	const { validity } = req.body;
	try {
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ message: "No user found", success: false });
		} else {
			const s = new Subscriptions({ topic: topicId, validity: validity });
			await s.save();
			await User.updateOne(
				{ _id: userId },
				{ $push: { subscriptions: s._id } }
			);
			res.status(200).json({ success: true });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.recentSearch = async (req, res) => {
	console.log(req.body)
	try {
		let users = []
		if (req.body.length > 0) {
			for (let i = 0; i < req.body.length; i++) {
				const id = await decryptaes(req.body[i])
				console.log(id)
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
		const { sId } = req.body;
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}
		user.recentPrositeSearches = user.recentPrositeSearches.filter(
			(searchId) => searchId.toString() !== sId
		);

		await user.save();
		return res
			.status(200)
			.json({ success: true, message: "Search Prosite removed successfully" });
	} catch (error) {
		return res.status(400).json({ message: error.message, success: false });
	}
};

exports.removeRecentSearchCommunity = async (req, res) => {
	try {
		const { sId } = req.body;
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}
		user.recentCommunitySearches = user.recentCommunitySearches.filter(
			(searchId) => searchId.toString() !== sId
		);
		await user.save();
		return res.status(200).json({
			success: true,
			message: "Search Community removed successfully",
		});
	} catch (error) {
		res.status(400).json({ message: error.message, success: false });
	}
};

exports.addRecentSearchCommunity = async (req, res) => {
	try {
		const { sId } = req.body;
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}
		if (!user.recentCommunitySearches.includes(sId)) {
			user.recentCommunitySearches.push(sId);
			await user.save();
			return res.status(201).json({ success: true, message: "Added!" });
		} else {
			return res
				.status(200)
				.json({ success: true, message: "Already Present!" });
		}
	} catch (error) {
		res.status(400).json({ message: error.message, success: false });
	}
};

exports.addRecentSearchProsite = async (req, res) => {
	try {
		const { sId } = req.body;
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found" });
		}

		if (!user.recentPrositeSearches.includes(sId)) {
			user.recentPrositeSearches.push(sId);
			await user.save();
			return res.status(201).json({ success: true, message: "Added!" });
		} else {
			return res
				.status(200)
				.json({ success: true, message: "Already Present!" });
		}
	} catch (error) {
		res.status(400).json({ message: error.message, success: false });
	}
};

exports.mobileSearch = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "User not found!" });
		}
		const recentSearchesProsites = [];
		const recentSearchesCommunity = [];

		for (let i = 0; i < user.recentPrositeSearches.length; i++) {
			const anotherUsers = await User.findById(user.recentPrositeSearches[i]);
			const data = {
				id: anotherUsers?._id,
				fullname: anotherUsers.fullname,
				username: anotherUsers.username,
				dp: process.env.URL + anotherUsers.profilepic,
				isverified: anotherUsers.isverified,
			};
			recentSearchesProsites.push(data);
		}
		for (let i = 0; i < user.recentCommunitySearches.length; i++) {
			const anotherCommunity = await Community.findById(
				user.recentCommunitySearches[i]
			);
			const data = {
				id: anotherCommunity?._id,
				title: anotherCommunity?.title,
				dp: process.env.URL + anotherCommunity?.dp,
				member: anotherCommunity?.memberscount,
				isverified: anotherCommunity?.isverified,
			};

			recentSearchesCommunity.push(data);
		}
		res
			.status(200)
			.json({ success: true, recentSearchesCommunity: recentSearchesCommunity.reverse(), recentSearchesProsites: recentSearchesProsites.reverse() });
	} catch (error) {
		console.log(error);
		res.status(400).json({ success: false, message: "Something Went Wrong!" });
	}
};

exports.fetchmoredata = async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);
		const dps = [];
		let current = [];
		const memdps = [];
		const subs = [];
		const liked = [];
		const ads = [];
		const urls = [];
		const content = [];
		const addp = [];

		//checking and removing posts with no communities
		// const p = await Post.find();

		// for (let i = 0; i < p.length; i++) {
		//   const com = await Community.findById(p[i].community);
		//   if (!com) {
		//     p[i].remove();
		//   }
		// }

		//fetching post
		const post = await Post.aggregate([
			{
				$lookup: {
					from: "communities",
					localField: "community",
					foreignField: "_id",
					as: "communityInfo",
				},
			},
			{
				$match: {
					"communityInfo.category": { $in: user.interest },
				},
			},
			{ $sample: { size: 30 } },
			{
				$lookup: {
					from: "users",
					localField: "sender",
					foreignField: "_id",
					as: "sender",
				},
			},
			{
				$lookup: {
					from: "communities",
					localField: "community",
					foreignField: "_id",
					as: "community",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "community.members",
					foreignField: "_id",
					as: "members",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "community.type",
					foreignField: "_id",
					as: "type",
				},
			},
			{
				$addFields: {
					sender: { $arrayElemAt: ["$sender", 0] },
					community: { $arrayElemAt: ["$community", 0] },
				},
			},
			{
				$addFields: {
					"community.members": {
						$map: {
							input: { $slice: ["$members", 0, 4] },
							as: "member",
							in: {
								_id: "$$member._id",
								fullname: "$$member.fullname",
								profilepic: "$$member.profilepic",
							},
						},
					},
				},
			},
			{
				$match: {
					"community.type": { $eq: "public" }, // Excluding posts with community type other than "public"
				},
			},
			{
				$project: {
					_id: 1,
					title: 1,
					createdAt: 1,
					status: 1,
					likedby: 1,
					likes: 1,
					dislike: 1,
					comments: 1,
					totalcomments: 1,
					tags: 1,
					view: 1,
					desc: 1,
					isverified: 1,
					post: 1,
					contenttype: 1,
					date: 1,
					sharescount: 1,
					sender: {
						_id: 1,
						fullname: 1,
						profilepic: 1,
					},
					community: {
						_id: 1,
						title: 1,
						dp: 1,
						members: 1,
						memberscount: 1,
						isverified: 1,
						type: 1,
					},
					topicId: 1,
				},
			},
		]);

		//fetching ads
		const firstad = await Ads.findOne({
			status: "active",
			$or: [{ type: "banner" }],
		})
			.populate({
				path: "postid",
				select:
					"desc post title kind likes likedby comments members community cta ctalink sender totalcomments adtype date createdAt",
				populate: [
					{
						path: "community",
						select: "dp title isverified memberscount members",
						populate: { path: "members", select: "profilepic" },
					},
					{ path: "sender", select: "profilepic fullname" },
				],
			})
			.limit(1);

		const infeedad = await Ads.find({
			status: "active",
			$or: [{ type: "infeed" }],
		}).populate({
			path: "postid",
			select:
				"desc post title kind likes comments community cta ctalink likedby sender totalcomments adtype date createdAt",
			populate: [
				{
					path: "community",
					select: "dp title isverified memberscount members",
					populate: { path: "members", select: "profilepic" },
				},
				{ path: "sender", select: "profilepic fullname" },
			],
		});

		function getRandomIndex() {
			const min = 6;
			return min + Math.floor(Math.random() * (post.length - min));
		}

		let feedad = [];
		for (let i = 0; i < infeedad.length; i++) {
			feedad.push(infeedad[i].postid);
		}

		//merging ads
		if (firstad) {
			post.unshift(firstad.postid);
		}

		if (
			feedad?.length > 0 &&
			(!feedad.includes(null) || !feedad.includes("null"))
		) {
			for (let i = 0; i < feedad.length; i++) {
				const randomIndex = getRandomIndex();
				post.splice(randomIndex, 0, feedad[i]);
			}
		}

		for (let i = 0; i < post.length; i++) {
			if (
				post[i].likedby?.some((id) => id.toString() === user._id.toString())
			) {
				liked.push(true);
			} else {
				liked.push(false);
			}
		}

		for (let k = 0; k < post.length; k++) {
			const coms = await Community.findById(post[k].community);

			if (coms?.members?.includes(user._id)) {
				subs.push("subscribed");
			} else {
				subs.push("unsubscribed");
			}
		}

		if (!post) {
			res.status(201).json({ message: "No post found", success: false });
		} else {
			//post
			for (let i = 0; i < post.length; i++) {
				const a = process.env.URL + post[i].community.dp;
				dps.push(a);
			}

			let ur = [];
			for (let i = 0; i < post?.length; i++) {
				for (let j = 0; j < post[i]?.post?.length; j++) {
					if (post[i].post[j].thumbnail) {
						const a =
							post[i].post[j].link === true
								? process.env.POST_URL + post[i].post[j].content + "640.mp4"
								: process.env.POST_URL + post[i].post[j].content;
						const t = process.env.POST_URL + post[i].post[j].thumbnail;

						ur.push({ content: a, thumbnail: t, type: post[i].post[j]?.type });
					} else {
						const a = process.env.POST_URL + post[i].post[j].content;
						ur.push({ content: a, type: post[i].post[j]?.type });
					}
				}
				urls.push(ur);
				ur = [];
			}

			for (let i = 0; i < post.length; i++) {
				for (
					let j = 0;
					j < Math.min(4, post[i].community.members.length);
					j++
				) {
					const a =
						process.env.URL + post[i]?.community?.members[j]?.profilepic;
					current.push(a);
				}

				memdps.push(current);
				current = [];
			}

			//post data
			const dpData = dps;
			const memdpData = memdps;
			const urlData = urls;
			const postData = post;
			const subData = subs;
			const likeData = liked;

			const mergedData = urlData.map((u, i) => ({
				dps: dpData[i],
				memdps: memdpData[i],
				urls: u,
				liked: likeData[i],
				subs: subData[i],
				posts: postData[i],
			}));

			res.status(200).json({
				mergedData,
				success: true,
			});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: err, success: false });
	}
}

exports.hideconvmsg = async (req, res) => {
	try {
		const { id } = req.params;
		const { msgid } = req.body;

		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			await Message.updateMany(
				{ mesId: { $in: msgid } },
				{ $push: { hidden: user?._id } }
			);
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

//unhide conv message
exports.unhideconvmsg = async (req, res) => {
	try {
		const { id } = req.params;
		const { msgid } = req.body;

		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			await Message.updateMany(
				{ mesId: { $in: msgid } },
				{ $pull: { hidden: user?._id } }
			);
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

exports.fetchhiddenconv = async (req, res) => {
	try {
		const { id, convId } = req.params;
		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			const msg = await Message.find({
				conversationId: convId,
				status: "active",
				hidden: { $in: [user._id.toString()] },
				deletedfor: { $nin: [user._id] },
			})
				.limit(20)
				.sort({ createdAt: -1 })
				.populate("sender", "profilepic fullname isverified");

			let messages = [];

			for (let i = 0; i < msg?.length; i++) {
				if (
					msg[i].typ === "image" ||
					msg[i].typ === "video" ||
					msg[i].typ === "doc" ||
					msg[i].typ === "glimpse"
				) {
					const url = process.env.MSG_URL + msg[i]?.content?.uri;

					messages.push({ ...msg[i].toObject(), url });
				} else {
					messages.push(msg[i].toObject());
				}
			}

			messages = messages.reverse();

			res.status(200).json({ messages: messages, success: true });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

exports.fetchmorehiddenconv = async (req, res) => {
	try {
		const { id } = req.params;
		const { convId, sequence } = req.body;
		const user = await User.findById(id);
		if (user) {
			let gt = parseInt(sequence) - 1;
			let lt = gt - 10;
			const msg = await Message.find({
				conversationId: convId,
				status: "active",
				hidden: { $in: [user._id.toString()] },
				deletedfor: { $nin: [user._id] },
				sequence: { $gte: lt, $lte: gt },
			})
				.limit(20)
				.sort({ sequence: 1 })
				.populate("sender", "profilepic fullname isverified");

			let messages = [];

			for (let i = 0; i < msg?.length; i++) {
				if (
					msg[i].typ === "image" ||
					msg[i].typ === "video" ||
					msg[i].typ === "doc"
				) {
					const url = process.env.MSG_URL + msg[i]?.content?.uri;
					messages.push({ ...msg[i].toObject(), url });
				} else {
					messages.push(msg[i].toObject());
				}
			}

			res.status(200).json({ messages, success: true });
		} else {
			res.status(404).json({ messgae: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

exports.deletemessages = async (req, res) => {
	try {
		const { id } = req.params;
		const { convId, msgIds, action } = req.body;

		const user = await User.findById(id);
		// const rec = await User.findById(recId);
		if (user) {
			if (action === "everyone") {
				await Message.updateMany(
					{ mesId: { $in: msgIds }, conversationId: convId },
					{ $set: { status: "deleted" } }
				);
			} else {
				await Message.updateMany(
					{ mesId: { $in: msgIds }, conversationId: convId },
					{ $push: { deletedfor: user._id } }
				);
			}
			res.status(200).json({ success: true });
		} else {
			res.status(404).json({ message: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

exports.reporting = async (req, res) => {
	try {
		console.log("first")
		const { userid } = req.params;
		const { data, id, type } = req.body;

		const user = await User.findById(userid);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			const report = new Report({
				senderId: user._id,
				desc: data,
				reportedid: { id: id, what: type },
			});
			await report.save();
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false, message: "Something went wrong" });
	}
};

exports.blockpeople = async (req, res) => {
	try {
		const { id } = req.params;
		const { userid, time } = req.body;
		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			const userblock = await User.findById(userid);
			if (!userblock) {
				console.log("1")
				res
					.status(404)
					.json({ message: "No blockable User found", success: false });
			} else {
				let isBlocked = false;
				console.log("5")
				for (const blockedUser of user.blockedpeople) {
					if (blockedUser.id.toString() === userid) {
						console.log("4")
						isBlocked = true;
						break;
					}
				}

				if (isBlocked) {
					console.log("2")
					await User.updateOne(
						{ _id: id },
						{
							$pull: {
								blockedpeople: { id: userid },
							},
						}
					);
					res.status(200).json({ success: true });
				} else {
					const block = {
						id: userid,
						time: time,
					};
					await User.updateOne(
						{ _id: id },
						{
							$addToSet: {
								blockedpeople: block,
							},
						}
					);
					console.log("3")
					res.status(200).json({ success: true });
				}
			}
		}
	} catch (e) {
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

exports.fetchallmsgreqs = async (req, res) => {
	const { id } = req.params;
	try {
		const user = await User.findById(id).populate({
			path: "messagerequests.id",
			select: "fullname username isverified profilepic",
		});
		if (!user) {
			res.status(404).json({
				success: false,
				message: "User not found",
			});
		} else {
			let dps = [];
			for (let i = 0; i < user.messagerequests.length; i++) {
				const pic = process.env.URL + user?.messagerequests[i].id?.profilepic;

				dps.push(pic);
			}

			res.status(200).json({ reqs: user.messagerequests, dps, success: true });
		}
	} catch (e) {
		res.status(500).json({ message: e.message, success: false });
	}
};

exports.acceptorrejectmesgreq = async (req, res) => {
	const { sender, status, reciever } = req.body;
	try {
		const conv = await Conversation.findOne({
			members: { $all: [sender, reciever] },
		});
		const user = await User.findById(reciever);
		if (conv) {
			res.status(203).json({ success: false, covId: conv._id });
		} else if (!user) {
			res.status(404).json({
				success: false,
				message: "User not found",
			});
		} else {
			if (status === "accept") {
				await User.updateOne(
					{ _id: reciever },
					{
						$pull: {
							messagerequests: { id: sender },
						},
					}
				);
				await User.updateOne(
					{ _id: sender },
					{
						$pull: {
							msgrequestsent: { id: reciever },
						},
					}
				);
				const conv = new Conversation({
					members: [sender, reciever],
				});
				const savedconv = await conv.save();
				await User.updateOne(
					{ _id: sender },
					{
						$push: {
							conversations: savedconv?._id,
						},
					}
				);
				await User.updateOne(
					{ _id: reciever },
					{
						$push: {
							conversations: savedconv?._id,
						},
					}
				);
				res.status(200).json({ savedconv, success: true });
			} else {
				await User.updateOne(
					{ _id: reciever },
					{
						$pull: {
							messagerequests: { id: sender },
						},
					}
				);
				await User.updateOne(
					{ _id: sender },
					{
						$pull: {
							msgrequestsent: { id: reciever },
						},
					}
				);
				res.status(200).json({ success: true });
			}
		}
	} catch (e) {
		console.log(e);
		res.status(500).json({ message: e.message, success: false });
	}
};

exports.likepost = async (req, res) => {
	const { userId, postId } = req.params;
	const user = await User.findById(userId);
	const post = await Post.findById(postId).populate("sender", "fullname");
	if (!post) {
		res.status(400).json({ message: "No post found" });
	} else if (post.likedby.includes(user._id)) {
		try {
			await Post.updateOne(
				{ _id: postId },
				{ $pull: { likedby: user._id }, $inc: { likes: -1 } }
			);
			await User.updateOne(
				{ _id: userId },
				{ $pull: { likedposts: post._id } }
			);
			res.status(200).json({ success: true });
		} catch (e) {
			res.status(400).json({ message: e.message });
		}
	} else {
		try {
			await Post.updateOne(
				{ _id: postId },
				{ $push: { likedby: user._id }, $inc: { likes: 1, views: 4 } }
			);
			await User.updateOne(
				{ _id: userId },
				{ $push: { likedposts: post._id } }
			);

			if (user._id.toString() !== post.sender._id.toString()) {
				const not = new Notification({
					senderId: user._id,
					recId: post.sender,
					text: user.fullname + " liked your post",
				});
				await not.save();
				await User.updateOne(
					{ _id: not.recId },
					{ $push: { notifications: not._id }, $inc: { notificationscount: 1 } }
				);
				console.log("noti");
			} else if (user._id.toString() === post.sender._id.toString()) {
				null;
				console.log("no noti");
			}
			res.status(200).json({ success: true });
		} catch (e) {
			res.status(400).json({ message: e.message });
			console.log(e)
		}
	}
};

exports.createtopicporder = async (req, res) => {
	try {
		const { id, topicId } = req.params;
		const { path } = req.body

		const user = await User.findById(id);
		const topic = await Topic.findById(topicId);

		if (!user && !topic) {
			return res.status(404).json({ message: "User or topic not found" });
		} else {
			const currentValidity = new Date();
			const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
			const newValidity = new Date(
				currentValidity.getTime() + thirtyDaysInMillis
			).toISOString();
			let oi = Math.floor(Math.random() * 9000000) + 1000000;
			//a new subscription is created
			const subscription = new Subscriptions({
				topic: topic._id,
				community: topic.community,
				validity: newValidity,
				amount: topic.price,
				orderId: oi,
				paymentMode: "UPI",
				currentStatus: "pending",
			});
			const tId = await subscription.save();

			//upating subscription of customers
			await User.updateOne(
				{ _id: id },
				{ $push: { subscriptions: tId._id } }
			);

			let payload = {
				merchantId: process.env.TEST_MERCHANT_ID,
				merchantTransactionId: tId._id,
				merchantUserId: user._id,
				amount: topic.price * 100,
				redirectUrl: `http://localhost:3000/${path}`,
				redirectMode: "REDIRECT",
				callbackUrl: `https://work.grovyo.xyz/api/v1/finalisetopicorder/${user._id}/${tId._id}/${topic._id}`,
				paymentInstrument: {
					type: "PAY_PAGE",
				},
			};
			let bufferObj = Buffer.from(JSON.stringify(payload), "utf8");

			let base64string = bufferObj.toString("base64");

			let string = base64string + "/pg/v1/pay" + process.env.TEST_PHONE_PAY_KEY;
			let shaString = sha256(string);

			let checkSum = shaString + "###" + process.env.keyIndex;

			await axios
				.post(
					// "https://api.phonepe.com/apis/hermes/pg/v1/pay",
					`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay`,

					{ request: base64string },
					{
						headers: {
							"Content-Type": "application/json",
							"X-VERIFY": checkSum,
							accept: "application/json",
						},
					}
				)
				.then((response) => {
					console.log(
						response.data,
						response.data.data.instrumentResponse.redirectInfo.url
					);
					res.status(200).json({
						success: true,
						url: response.data.data.instrumentResponse.redirectInfo.url,
					});
				})
				.catch((err) => {
					console.log(err);
					return res.status({ success: false, message: err.message });
				});

		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

//finalising the topic order
exports.finalisetopicorder = async (req, res) => {
	try {
		const { id, ordId, topicId } = req.params;
		const user = await User.findById(id);
		const topic = await Topic.findById(topicId);
		const community = await Community.findById(topic?.community);
		if (!user) {
			return res.status(404).json({ message: "User or Product not found" });
		} else {

			function generateChecksum(
				merchantId,
				merchantTransactionId,
				saltKey,
				saltIndex
			) {
				const stringToHash =
					`/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
				const shaHash = sha256(stringToHash).toString();
				const checksum = shaHash + "###" + saltIndex;

				return checksum;
			}
			const sId = await Subscriptions.findById(ordId)

			const checksum = generateChecksum(
				process.env.TEST_MERCHANT_ID,
				sId._id,
				process.env.TEST_PHONE_PAY_KEY,
				process.env.keyIndex
			);
			const response = await axios.get(
				`https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${process.env.TEST_MERCHANT_ID}/${sId._id}`,
				// `https://api.phonepe.com/apis/hermes/pg/v1/status/${process.env.MERCHANT_ID}/${tid}`,
				{
					headers: {
						"Content-Type": "application/json",
						"X-VERIFY": checksum,
						"X-MERCHANT-ID": process.env.TEST_MERCHANT_ID,
					},
				}
			);
			if (response.data.code === "PAYMENT_SUCCESS") {
				console.log("Payment Successful");
				let purchase = { id: user._id, broughton: Date.now() };
				await Subscriptions.updateOne(
					{ _id: ordId },
					{
						$set: {
							currentStatus: "success",
							purchasedby: user?._id,
						},
					}
				);
				await Topic.updateOne(
					{ _id: topic._id },
					{
						$addToSet: {
							purchased: purchase,
							members: user._id,
							notifications: user?._id,
						},
						$inc: { memberscount: 1, earnings: topic.price },
					}
				);
				//updating paid members count
				await Community.updateOne(
					{ _id: user._id },
					{ $inc: { paidmemberscount: 1 } }
				);
				//person who brought status update
				await User.updateOne(
					{ _id: user._id },
					{ $addToSet: { topicsjoined: topic._id }, $inc: { totaltopics: 1 } }
				);
				//person who created the topic gets money
				await User.updateOne(
					{ _id: community?.creator },
					{
						$inc: { moneyearned: topic.price, topicearning: topic.price },
						$addToSet: {
							earningtype: {
								how: "Topic Purchase",
								when: Date.now(),
							},
							subscriptions: ordId,
						},
					}
				);

				//stats increase
				let today = new Date();

				let year = today.getFullYear();
				let month = String(today.getMonth() + 1).padStart(2, "0");
				let day = String(today.getDate()).padStart(2, "0");

				let formattedDate = `${day}/${month}/${year}`;

				let analytcis = await Analytics.findOne({
					date: formattedDate,
					id: community._id,
				});

				//Graph Stats
				if (!analytcis.paidmembers.includes(user._id)) {
					await Analytics.updateOne(
						{ _id: analytcis._id },
						{
							$addToSet: { paidmembers: user._id },
						}
					);
				}
				res.status(200).json({ success: true });
			} else if (response.data.code === "PAYMENT_ERROR") {
				console.log("payment false")
				await Subscriptions.updateOne(
					{ _id: ordId },
					{ $set: { currentStatus: "failed" } }
				);

				res.status(200).json({ success: true });
			}
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

exports.muting = async (req, res) => {
	try {
		const { id, convId } = req.body;
		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ success: false, message: "User not found!" });
		} else {
			const exists = user.muted.includes(convId);

			if (exists) {
				await User.updateOne({ _id: user._id }, { $pull: { muted: convId } });
			} else {
				await User.updateOne(
					{ _id: user._id },
					{ $addToSet: { muted: convId } }
				);
			}
			res.status(200).json({ success: true });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
};

exports.removeconversation = async (req, res) => {
	try {
		const { id } = req.params;
		const { convId } = req.body;
		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			await User.updateOne(
				{ _id: id },
				{
					$pull: {
						conversations: convId,
					},
				}
			);
			res.status(200).json({ success: true });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.deletemessagestopic = async (req, res) => {

	try {
		const { id } = req.params;
		const { topicId, msgIds, action } = req.body;
		const user = await User.findById(id);
		const topic = await Topic.findById(topicId)

		if (user) {
			if (action === "everyone") {
				await Message.updateMany(
					{ mesId: { $in: msgIds }, topicId: topicId },
					{ $set: { status: "deleted" } }
				);
			} else {
				await Message.updateMany(
					{ mesId: { $in: msgIds }, topicId: topicId },
					{ $push: { deletedfor: user._id } }
				);
			}
			res.status(200).json({ success: true });
		} else {
			res.status(404).json({ message: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ success: false });
	}
};

exports.createcomment = async (req, res) => {
	const { userId, postId } = req.params;
	const { text } = req.body;
	const post = await Post.findById(postId);
	if (!post) {
		res.status(404).json({ message: "Post not found" });
	} else {
		try {
			const newComment = new Comment({
				senderId: userId,
				postId: postId,
				text: text,
			});
			await newComment.save();
			await Post.updateOne(
				{ _id: postId },
				{ $push: { comments: newComment._id }, $inc: { totalcomments: 1 } }
			);
			res.status(200).json({ success: true, newComment });
		} catch (e) {
			res.status(400).json(e.message);
		}
	}
};

exports.fetchallcomments = async (req, res) => {
	const { userId, postId } = req.params;
	try {
		const user = await User.findById(userId);
		const comment = await Comment.find({ postId: postId })
			.populate("senderId", "fullname profilepic username")
			.limit(50)
			.sort({ createdAt: -1 });

		if (!comment) {
			res.status(404).json({ success: false });
		} else {
			const liked = [];
			for (let i = 0; i < comment.length; i++) {
				if (comment[i].likedby.includes(user._id)) {
					liked.push("liked");
				} else {
					liked.push("not liked");
				}
			}
			const dps = [];
			for (let i = 0; i < comment.length; i++) {
				const a = process.env.URL + comment[i].senderId.profilepic;
				dps.push(a);
			}

			//merging all the data
			const merged = dps?.map((dp, i) => ({
				dp,
				comments: comment[i],
				likes: liked[i],
			}));
			res.status(200).json({ success: true, merged });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.mutecom = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const user = await User.findById(id);
		const com = await Community.findById(comId);

		if (!user || !com) {
			return res
				.status(404)
				.json({ message: "User or Community not found", success: false });
		}

		//muting the whole community
		if (com.notifications?.length > 0) {
			const notificationIndex = com.notifications.findIndex(
				(notification) => notification.id.toString() === user._id.toString()
			);

			if (notificationIndex !== -1) {
				com.notifications[notificationIndex].muted =
					!com.notifications[notificationIndex].muted;
				await com.save();
			}
		}

		//muting topics individually
		for (let i = 0; i < com.topics.length; i++) {
			const topic = await Topic.findById(com.topics[i]);

			if (topic) {
				const notificationIndex = topic.notifications.findIndex(
					(notification) => notification.id?.toString() === user._id?.toString()
				);

				if (notificationIndex !== -1) {
					topic.notifications[notificationIndex].muted =
						!topic.notifications[notificationIndex].muted;
					await topic.save();
				}
			}
		}

		res.status(200).json({ success: true });
	} catch (e) {
		console.error(e);
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.setcomtype = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const user = await User.findById(id);
		const com = await Community.findById(comId);
		if (user && com) {
			console.log(com.type);
			await Community.updateOne(
				{ _id: comId },
				{
					$set: { type: com.type === "public" ? "private" : "public" },
				}
			);

			res.status(200).json({ success: true });
		} else {
			res.status(404).json({ message: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ success: false, message: "Something went wrong..." });
	}
};

exports.getallmembers = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const user = await User.findById(id);
		if (!user) {
			res.status(404).json({ message: "User not found", success: false });
		} else {
			const community = await Community.findById(comId)
				.populate({
					path: "members",
					select: "fullname pic isverified username profilepic",
					options: { limit: 150 },
				})
				.populate({
					path: "admins",
					model: "User",
					select: "fullname pic isverified username profilepic",
				})
				.populate({
					path: "blocked",
					model: "User",
					select: "fullname pic isverified username profilepic",
				});

			if (!community) {
				res
					.status(404)
					.json({ message: "Community not found", success: false });
			} else {
				let dps = [];

				let isadmin =
					community?.admins[0]._id?.toString === user._id?.toString();
				const admindp = process.env.URL + community?.admins[0].profilepic;

				for (let j = 0; j < community?.members?.length; j++) {
					const a = process.env.URL + community.members[j].profilepic;

					dps.push(a);
				}

				let block = [];
				community?.members?.some((blockedId) =>
					community.blocked?.some((b, i) => {
						block.push(blockedId?._id?.toString() === b?._id?.toString());
					})
				);

				const nonBlockedMembers = community.members?.map((c, i) => ({
					c,
					dp: dps[i],
					blocked: block[i],
				}));

				const members = nonBlockedMembers?.filter(
					(member) => member.c._id?.toString() !== community.creator.toString()
				);

				res.status(200).json({
					success: true,
					members,
					admin: community?.admins[0],
					admindp,
					isadmin,
				});
			}
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.removecomwithposts = async (req, res) => {
	try {
		const { id, comId } = req.params;
		const user = await User.findById(id);
		if (user) {
			const community = await Community.findById(comId);
			new DeleteObjectCommand({
				Bucket: BUCKET_NAME,
				Key: community?.dp,
			});
			if (community) {
				for (let i = 0; i < community.posts.length; i++) {
					const post = await Post.findById(community.posts[i]);
					if (post) {
						for (let j = 0; j < post.post.length; j++) {
							const result = await s3.send(
								new DeleteObjectCommand({
									Bucket: POST_BUCKET,
									Key: post.post[j].content,
								})
							);
						}
						post.remove();
					}
				}
				//remove all topics of community
				const topics = await Topic.find({ community: community._id });
				if (topics?.length > 0) {
					for (let i = 0; i < topics.length; i++) {
						await User.findByIdAndUpdate(
							{ _id: user._id },
							{ $pull: { topicsjoined: topics[i]._id } }
						);
						topics[i].remove();
					}
				}

				await User.findByIdAndUpdate(
					{ _id: user._id },
					{
						$pull: {
							communityjoined: community?._id,
							communitycreated: community?._id,
						},
						$inc: { totaltopics: -topics?.length, totalcom: 1 },
					}
				);

				community.remove();
			}
			res.status(200).json({ success: true });
		} else {
			res.status(404).json({ message: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

exports.createcartorder = async (req, res) => {
	const { userId } = req.params;
	const { quantity, deliverycharges, productId, total } = req.body;

	try {
		const user = await User.findById(userId);
		const product = await Product.findById(productId).populate(
			"creator",
			"storeAddress"
		);
		let oi = Math.floor(Math.random() * 9000000) + 1000000;

		if (!user && !product) {
			return res.status(404).json({ message: "User or Product not found" });
		} else {
			//a new order is created
			const order = new Order({
				buyerId: userId,
				productId: productId,
				quantity: quantity,
				total: total,
				orderId: oi,
				paymentMode: "Cash",
				currentStatus: "success",
				deliverycharges: deliverycharges,
				timing: "Tommorow, by 7:00 pm",
			});
			await order.save();
			//upating order in customers purchase history
			await User.updateOne(
				{ _id: userId },
				{ $push: { puchase_history: order._id } }
			);
			await User.updateOne(
				{ _id: user._id },
				{ $unset: { cart: [], cartproducts: [] } }
			);

			//assigning the delivery to the nearest driver
			const cuslat = user.address.coordinates.latitude;
			const cuslong = user.address.coordinates.longitude;

			//business address
			const businessaddress = product?.creator;

			const locs = await Locations.find();
			const custcity = user.address.city;

			let checkeddistance;
			//checking distance btw customer and business
			const checkdistance = async () => {
				const businesslatlong = product?.creator?.storeAddress[0]?.coordinates;
				const ispointinrange = geolib.isPointWithinRadius(
					{ latitude: cuslat, longitude: cuslong },
					businesslatlong,
					10000
				);

				checkeddistance = ispointinrange;
			};
			checkdistance();

			// if business and custmer location are near each other i.e. within range of 10km to be exact
			if (checkeddistance) {
				let firstresult;
				for (let i = 0; i < locs.length; i++) {
					const titleArray = Array.isArray(locs[i]?.title)
						? locs[i]?.title
						: [locs[i]?.title];
					firstresult = findBestMatch(
						businessaddress?.storeAddress[0]?.city.toLowerCase().trim() ||
						businessaddress?.storeAddress[0]?.city.toLowerCase(),
						titleArray
					);
				}
				const assigntodriver = async () => {
					let storedlocs = [];
					const cityofbusiness = await Locations.findOne({
						title: firstresult?.bestMatch,
					});
					for (let i = 0; i < cityofbusiness.stores.length; i++) {
						storedlocs.push({
							latitude: cityofbusiness.stores[i].address.coordinates.latitude,
							longitude: cityofbusiness.stores[i].address.coordinates.longitude,
							storeid: cityofbusiness.stores[i].storeid,
						});
					}

					const neareststore = geolib.findNearest(
						{ latitude: cuslat, longitude: cuslong },
						storedlocs
					);

					const storeuser = await Deluser.findById(neareststore?.storeid);
					let eligibledriver = [];

					for (let i = 0; i < storeuser?.deliverypartners?.length; i++) {
						const deliverypartner = await Deluser.findById(
							storeuser?.deliverypartners[i]?.id
						);

						if (
							deliverypartner &&
							deliverypartner.accstatus !== "blocked" &&
							deliverypartner.accstatus !== "review" &&
							deliverypartner.deliveries?.length < 21 &&
							deliverypartner?.balance?.amount < 3000
						) {
							let driverloc = {
								latitude: deliverypartner.currentlocation?.latitude,
								longitude: deliverypartner.currentlocation?.longitude,
								id: deliverypartner?._id,
							};
							eligibledriver.push(driverloc);
						}
					}

					if (eligibledriver?.length > 0) {
						const nearestpartner = geolib.findNearest(
							{ latitude: cuslat, longitude: cuslong },
							eligibledriver
						);

						if (nearestpartner) {
							const driver = await Deluser?.findById(nearestpartner?.id);

							let droppingaddress = {
								streetaddress: user?.address?.streetaddress,
								landmark: user?.address?.landmark,
								city: user?.address?.city,
								pincode: user?.address?.pincode,
								state: user?.address?.state,
								country: user?.address?.country,
								coordinates: {
									latitude: user?.address?.coordinates?.latitude,
									longitude: user?.address?.coordinates?.longitude,
									accuracy: user?.address?.coordinates?.accuracy,
									provider: user?.address?.coordinates?.provider,
									bearing: user?.address?.coordinates?.bearing,
									altitude: user?.address?.coordinates?.altitude,
								},
							};
							let pickupaddress = {
								streetaddress: businessaddress?.storeAddress[0]?.streetaddress,
								landmark: businessaddress?.storeAddress[0]?.landmark,
								city: businessaddress?.storeAddress[0]?.city,
								pincode: businessaddress?.storeAddress[0]?.pincode,
								state: businessaddress?.storeAddress[0]?.state,
								country: businessaddress?.storeAddress[0]?.country,
								coordinates: {
									latitude:
										businessaddress?.storeAddress[0]?.coordinates?.latitude,
									longitude:
										businessaddress?.storeAddress[0]?.coordinates?.longitude,
									accuracy:
										businessaddress?.storeAddress[0]?.coordinates?.accuracy,
									provider:
										businessaddress?.storeAddress[0]?.coordinates?.provider,
									bearing: businessaddress?.storeAddress[0]?.coordinates?.bearing,
									altitude:
										businessaddress?.storeAddress[0]?.coordinates?.altitude,
								},
							};

							//checking current time
							const currentHour = new Date().getHours();
							if (currentHour >= 15) {
								const newDeliveries = new Delivery({
									title: product?.name,
									amount: total,
									orderId: oi,
									type: "pick & drop",
									pickupaddress: pickupaddress,
									droppingaddress: droppingaddress,
									partner: driver?._id,
									status: "Not Started",
									timing: "Today, by 7:00pm",
									phonenumber: user?.phone,
								});
								await newDeliveries.save();

								const data = {
									name: user?.fullname,
									pickupaddress: pickupaddress,
									droppingaddress: droppingaddress,
									amount: total,
									id: newDeliveries?._id,
									status: "Not Started",
									timing: "Today, by 7:00pm",
									phonenumber: user?.phone,
									type: "pick & drop",
								};

								await Deluser.updateOne(
									{ _id: driver?._id },
									{
										$push: { deliveries: data },
									}
								);

								const msg = {
									notification: {
										title: "A new order has arrived.",
										body: `From ${user?.fullname} Total ₹${total}`,
									},
									data: {},
									tokens: [
										// user?.notificationtoken,
										driver?.notificationtoken,
										storeuser?.notificationtoken,
									],
								};

								await admin
									.messaging()
									.sendEachForMulticast(msg)
									.then((response) => {
										console.log("Successfully sent message");
									})
									.catch((error) => {
										console.log("Error sending message:", error);
									});
							}
						}
					} else {
						console.log("No delivery partner is available at the moment!");
					}
				};
				assigntodriver();
			}
			// if business and customer are away from each other i.e. out of 10km range
			else {
				//getting the nearest affiliatestore of business
				let firstresult;
				for (let i = 0; i < locs.length; i++) {
					const titleArray = Array.isArray(locs[i]?.title)
						? locs[i]?.title
						: [locs[i]?.title];
					firstresult = findBestMatch(
						businessaddress?.storeAddress[0]?.city.toLowerCase().trim() ||
						businessaddress?.storeAddress[0]?.city.toLowerCase(),
						titleArray
					);
				}
				const assigntodriver = async () => {
					let storedlocs = [];
					const cityofbusiness = await Locations.findOne({
						title: firstresult?.bestMatch,
					});
					for (let i = 0; i < cityofbusiness.stores.length; i++) {
						storedlocs.push({
							latitude: cityofbusiness.stores[i].address.coordinates.latitude,
							longitude: cityofbusiness.stores[i].address.coordinates.longitude,
							storeid: cityofbusiness.stores[i].storeid,
						});
					}

					const neareststore = geolib.findNearest(
						{ latitude: cuslat, longitude: cuslong },
						storedlocs
					);

					const storeuser = await Deluser.findById(neareststore?.storeid);
					let eligibledriver = [];

					for (let i = 0; i < storeuser?.deliverypartners?.length; i++) {
						const deliverypartner = await Deluser.findById(
							storeuser?.deliverypartners[i]?.id
						);

						if (
							deliverypartner &&
							deliverypartner.accstatus !== "blocked" &&
							deliverypartner.accstatus !== "review" &&
							deliverypartner.deliveries?.length < 21 &&
							deliverypartner?.balance?.amount < 3000
						) {
							let driverloc = {
								latitude: deliverypartner.currentlocation?.latitude,
								longitude: deliverypartner.currentlocation?.longitude,
								id: deliverypartner?._id,
							};
							eligibledriver.push(driverloc);
						}
					}

					if (eligibledriver?.length > 0) {
						const nearestpartner = geolib.findNearest(
							{ latitude: cuslat, longitude: cuslong },
							eligibledriver
						);

						if (nearestpartner) {
							const driver = await Deluser?.findById(nearestpartner?.id);

							let droppingaddress = {
								streetaddress: storeuser?.address?.streetaddress,
								landmark: storeuser?.address?.landmark,
								city: storeuser?.address?.city,
								pincode: storeuser?.address?.pincode,
								state: storeuser?.address?.state,
								country: storeuser?.address?.country,
								coordinates: {
									latitude: storeuser?.address?.coordinates?.latitude,
									longitude: storeuser?.address?.coordinates?.longitude,
									accuracy: storeuser?.address?.coordinates?.accuracy,
									provider: storeuser?.address?.coordinates?.provider,
									bearing: storeuser?.address?.coordinates?.bearing,
									altitude: storeuser?.address?.coordinates?.altitude,
								},
							};
							let pickupaddress = {
								streetaddress: businessaddress?.storeAddress[0]?.streetaddress,
								landmark: businessaddress?.storeAddress[0]?.landmark,
								city: businessaddress?.storeAddress[0]?.city,
								pincode: businessaddress?.storeAddress[0]?.pincode,
								state: businessaddress?.storeAddress[0]?.state,
								country: businessaddress?.storeAddress[0]?.country,
								coordinates: {
									latitude:
										businessaddress?.storeAddress[0]?.coordinates?.latitude,
									longitude:
										businessaddress?.storeAddress[0]?.coordinates?.longitude,
									accuracy:
										businessaddress?.storeAddress[0]?.coordinates?.accuracy,
									provider:
										businessaddress?.storeAddress[0]?.coordinates?.provider,
									bearing: businessaddress?.storeAddress[0]?.coordinates?.bearing,
									altitude:
										businessaddress?.storeAddress[0]?.coordinates?.altitude,
								},
							};

							//checking current time
							const currentHour = new Date().getHours();
							if (currentHour >= 15) {
								const newDeliveries = new Delivery({
									title: product?.name,
									amount: total,
									orderId: oi,
									type: "pickup",
									pickupaddress: pickupaddress,
									droppingaddress: droppingaddress,
									partner: driver?._id,
									status: "Not Started",
									timing: "Today, by 7:00pm",
									phonenumber: user?.phone,
								});
								await newDeliveries.save();

								const data = {
									name: user?.fullname,
									pickupaddress: pickupaddress,
									droppingaddress: droppingaddress,
									amount: total,
									id: newDeliveries?._id,
									status: "Not Started",
									timing: "Today, by 7:00pm",
									phonenumber: user?.phone,
									type: "pickup",
								};

								await Deluser.updateOne(
									{ _id: driver?._id },
									{
										$push: { deliveries: data },
									}
								);

								const msg = {
									notification: {
										title: "A new order has arrived.",
										body: `From ${user?.fullname} Total ₹${total}`,
									},
									data: {},
									tokens: [
										// user?.notificationtoken,
										driver?.notificationtoken,
										storeuser?.notificationtoken,
									],
								};

								await admin
									.messaging()
									.sendEachForMulticast(msg)
									.then((response) => {
										console.log("Successfully sent message");
									})
									.catch((error) => {
										console.log("Error sending message:", error);
									});
							}
						}
					} else {
						console.log("No delivery partner is available at the moment!");
					}
				};
				assigntodriver();
			}

			res.status(200).json({ orderId: order._id, success: true });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.updatecartorder = async (req, res) => {
	const { userId, orderId } = req.params;
	const { paymentId, success, paymentmode } = req.body;
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		} else {
			const o = await Order.findById(orderId);
			await Order.updateOne(
				{ _id: o._id },
				{
					$set: {
						currentStatus: success,
						paymentId: paymentId,
						paymentMode: paymentmode,
					},
				}
			);
			if (success) {
				await User.updateOne({ _id: user._id }, { $unset: { cart: [] } });
			}
			await res.status(200).json({ success: true });
		}
	} catch (e) {
		res.status(400).json({ message: e.message, success: false });
	}
};

exports.changeAddress = async (req, res) => {
	try {
		const { id } = req.params
		const { streetaddress, city, state, pincode, landmark, country } = req.body

		console.log(req.body, "req")

		const user = await User.findById(id)

		if (!user) {
			return res.status(404).json({ message: "User or Product not found", success: false });
		}

		user.address = {
			coordinates: {}, streetaddress, city, country, landmark, pincode, state
		}

		const savedUser = await user.save()

		res.status(200).json({ success: true, address: savedUser.address })

	} catch (error) {
		console.log(error)
		res.status(400).json({ success: false, message: "Something Went Wrong!" })
	}
}

const credeli = async ({ id, storeids, oid, total, instant }) => {
	try {
		const user = await User.findById(id);
		const order = await Order.findOne({ orderId: oid });
		let foodadmount = 7;
		let usualamount = 5;

		if (instant) {
			let coordinates = [];
			for (let storeid of storeids) {
				const store = await User.findById(storeid);
				coordinates.push({
					latitude: store.storeAddress.coordinates.latitude,
					longitude: store.storeAddress.coordinates.longitude,
					address: store.storeAddress,
					id: store._id,
				});
			}

			//sorting locations
			const sortedCoordinates = geolib.orderByDistance(
				{
					latitude: user.address.coordinates.latitude,
					longitude: user.address.coordinates.longitude,
				},
				coordinates
			);

			//finding the nearest driver from the last location
			let partners = [];

			const deliverypartners = await Deluser.find({
				accounttype: "partner",
				primaryloc: user.address.city,
			});
			for (let deliverypartner of deliverypartners) {
				if (
					deliverypartner &&
					deliverypartner.accstatus !== "banned" &&
					deliverypartner.accstatus !== "review" &&
					deliverypartner.deliveries?.length < 21 &&
					deliverypartner.totalbalance < 3000
				) {
					let driverloc = {
						latitude: deliverypartner.currentlocation?.latitude,
						longitude: deliverypartner.currentlocation?.longitude,
						id: deliverypartner?._id,
					};
					partners.push(driverloc);
				}
			}

			let eligiblepartner = geolib.findNearest(
				sortedCoordinates[sortedCoordinates.length - 1],
				partners
			);

			if (eligiblepartner) {
				const driver = await Deluser?.findById(eligiblepartner?.id);

				const finalcoordinates = [
					{
						latitude: user.address.coordinates.latitude,
						longitude: user.address.coordinates.longitude,
					},
					...sortedCoordinates.map((coord) => ({
						latitude: coord.latitude,
						longitude: coord.longitude,
					})),
					{
						latitude: eligiblepartner.latitude,
						longitude: eligiblepartner.longitude,
					},
				];
				//total distance travelled
				const totalDistance = calculateTotalDistance(finalcoordinates);
				//earning of driver
				const earning = totalDistance * foodadmount;

				//markings
				let marks = [
					{
						latitude: eligiblepartner.latitude,
						longitude: eligiblepartner.longitude,
					},
				];

				for (let final of sortedCoordinates) {
					marks.push({ latitude: final.latitude, longitude: final.longitude });
				}

				marks.push({
					latitude: user.address.coordinates.latitude,
					longitude: user.address.coordinates.longitude,
				});

				const newDeliveries = new Delivery({
					title: user?.fullname,
					amount: total,
					orderId: oid,
					pickupaddress: sortedCoordinates[0].address,
					partner: driver?._id,
					droppingaddress: user?.address,
					phonenumber: user.phone,
					mode: order.paymentMode ? order?.paymentMode : "Cash",
					marks: marks,
					earning: earning,
					where: "customer",
				});
				await newDeliveries.save();

				//pushing delivery for driver
				await Deluser.updateOne(
					{ _id: driver._id },
					{ $push: { deliveries: newDeliveries._id } }
				);

				const msg = {
					notification: {
						title: "A new delivery has arrived.",
						body: `From ${user?.fullname} OrderId #${oid}`,
					},
					data: {},
					tokens: [
						driver?.notificationtoken,
						// user?.notificationtoken,
						// store?.notificationtoken, //person who selles this item
					],
				};

				await admin
					.messaging()
					.sendEachForMulticast(msg)
					.then((response) => {
						console.log("Successfully sent message");
					})
					.catch((error) => {
						console.log("Error sending message:", error);
					});
				console.log("Booked Instant");
			} else {
				console.log("No drivers available at the moment!");
			}
		} else {
			//all stores
			let coordinates = [];
			for (let storeid of storeids) {
				const store = await User.findById(storeid);
				coordinates.push({
					latitude: store.storeAddress.coordinates.latitude,
					longitude: store.storeAddress.coordinates.longitude,
					address: store.storeAddress,
					id: store._id,
				});
			}

			//checking if any store is more than 40kms away from customer

			let check;
			for (let store of coordinates) {
				check = geolib.isPointWithinRadius(
					{
						latitude: user?.address?.coordinates?.latitude,
						longitude: user?.address?.coordinates?.longitude,
					},
					{
						latitude: store?.latitude,
						longitude: store?.longitude,
					},
					40000
				);
			}

			if (!check) {
				//stores are away then first all items will go to affiliate

				//assign all the deliveries to all the partners
				let partners = [];

				const deliverypartners = await Deluser.find({
					accounttype: "partner",
					primaryloc: user.address.city,
				});
				for (let deliverypartner of deliverypartners) {
					if (
						deliverypartner &&
						deliverypartner.accstatus !== "banned" &&
						deliverypartner.accstatus !== "review" &&
						deliverypartner.deliveries?.length < 21 &&
						deliverypartner.totalbalance < 3000
					) {
						let driverloc = {
							latitude: deliverypartner.currentlocation?.latitude,
							longitude: deliverypartner.currentlocation?.longitude,
							id: deliverypartner?._id,
						};
						partners.push(driverloc);
					}
				}

				//finding an affiliate store near customer loc

				let storecoordinates = [];

				const affiliatestore = await Deluser.find({
					accounttype: "affiliate",
					primaryloc: user.address.city,
				});

				for (let store of affiliatestore) {
					storecoordinates.push({
						latitude: store.address.coordinates.latitude,
						longitude: store.address.coordinates.longitude,
						address: store.address,
						id: store._id,
					});
				}

				const neareststore = geolib.findNearest(
					{
						latitude: user?.address?.coordinates?.latitude,
						longitude: user?.address?.coordinates?.longitude,
					},
					storecoordinates
				);

				for (let storeid of storeids) {
					const seller = await User.findById(storeid);

					//finding delivery partner near seller
					let eligiblepartner = geolib.findNearest(
						{
							latitude: seller.address.coordinates.latitude,
							longitude: seller.address.coordinates.longitude,
						},
						partners
					);

					const driver = await Deluser?.findById(eligiblepartner?.id);

					//sorted locations
					const marks = [
						{
							latitude: eligiblepartner.latitude,
							longitude: eligiblepartner.longitude,
						},
						{
							latitude: seller.storeAddress.coordinates.latitude,
							longitude: seller.storeAddress.coordinates.longitude,
						},
						{
							latitude: neareststore.address.coordinates.latitude,
							longitude: neareststore.address.coordinates.longitude,
						},
					];

					const finalcoordinates = [
						{
							latitude: eligiblepartner.latitude,
							longitude: eligiblepartner.longitude,
						},
						{
							latitude: seller.storeAddress.coordinates.latitude,
							longitude: seller.storeAddress.coordinates.longitude,
						},
						{
							latitude: neareststore.address.coordinates.latitude,
							longitude: neareststore.address.coordinates.longitude,
						},
					];

					//total distance travelled
					const totalDistance = calculateTotalDistance(finalcoordinates);
					//earning of driver
					const earning = totalDistance * usualamount;

					const newDeliveries = new Delivery({
						title: user?.fullname,
						//amount: total,
						orderId: oid,
						pickupaddress: seller.address,
						partner: driver?._id,
						droppingaddress: neareststore.address,
						phonenumber: user.phone,
						//  mode: order.paymentMode ? order?.paymentMode : "Cash",
						marks: marks,
						earning: earning,
						where: "affiliate",
					});
					await newDeliveries.save();

					//pushing delivery for driver
					await Deluser.updateOne(
						{ _id: driver._id },
						{ $push: { deliveries: newDeliveries._id } }
					);

					const msg = {
						notification: {
							title: "A new delivery has arrived.",
							body: `From ${user?.fullname} OrderId #${oid}`,
						},
						data: {},
						tokens: [
							driver?.notificationtoken,
							// user?.notificationtoken,
							// store?.notificationtoken, //person who selles this item
						],
					};

					await admin
						.messaging()
						.sendEachForMulticast(msg)
						.then((response) => {
							console.log("Successfully sent message");
						})
						.catch((error) => {
							console.log("Error sending message:", error);
						});
					console.log("Booked affiliate");
				}
			} else {
				//stores are near then usually deliver all items

				//sorting locations
				const sortedCoordinates = geolib.orderByDistance(
					{
						latitude: user.address.coordinates.latitude,
						longitude: user.address.coordinates.longitude,
					},
					coordinates
				);

				//finding the nearest driver from the last location
				let partners = [];

				const deliverypartners = await Deluser.find({
					accounttype: "partner",
					primaryloc: user.address.city,
				});
				for (let deliverypartner of deliverypartners) {
					if (
						deliverypartner &&
						deliverypartner.accstatus !== "banned" &&
						deliverypartner.accstatus !== "review" &&
						deliverypartner.deliveries?.length < 21 &&
						deliverypartner.totalbalance < 3000
					) {
						let driverloc = {
							latitude: deliverypartner.currentlocation?.latitude,
							longitude: deliverypartner.currentlocation?.longitude,
							id: deliverypartner?._id,
						};
						partners.push(driverloc);
					}
				}
				let eligiblepartner = geolib.findNearest(
					sortedCoordinates[sortedCoordinates.length - 1],
					partners
				);

				if (eligiblepartner) {
					//markings
					let marks = [
						{
							latitude: eligiblepartner.latitude,
							longitude: eligiblepartner.longitude,
						},
					];

					for (let final of sortedCoordinates) {
						marks.push({
							latitude: final.latitude,
							longitude: final.longitude,
						});
					}

					marks.push({
						latitude: user.address.coordinates.latitude,
						longitude: user.address.coordinates.longitude,
					});

					const driver = await Deluser?.findById(eligiblepartner?.id);

					const finalcoordinates = [
						{
							latitude: user.address.coordinates.latitude,
							longitude: user.address.coordinates.longitude,
						},
						...sortedCoordinates.map((coord) => ({
							latitude: coord.latitude,
							longitude: coord.longitude,
						})),
						{
							latitude: eligiblepartner.latitude,
							longitude: eligiblepartner.longitude,
						},
					];
					//total distance travelled
					const totalDistance = calculateTotalDistance(finalcoordinates);
					//earning of driver
					const earning = totalDistance * usualamount;

					const newDeliveries = new Delivery({
						title: user?.fullname,
						amount: total,
						orderId: oid,
						pickupaddress: sortedCoordinates[0].address,
						partner: driver?._id,
						droppingaddress: user?.address,
						phonenumber: user.phone,
						mode: order.paymentMode ? order?.paymentMode : "Cash",
						marks: marks,
						earning: earning,
						where: "customer",
					});
					await newDeliveries.save();

					//pushing delivery for driver
					await Deluser.updateOne(
						{ _id: driver._id },
						{ $push: { deliveries: newDeliveries._id } }
					);

					const msg = {
						notification: {
							title: "A new delivery has arrived.",
							body: `From ${user?.fullname} OrderId #${oid}`,
						},
						data: {},
						tokens: [
							driver?.notificationtoken,
							// user?.notificationtoken,
							// store?.notificationtoken, //person who selles this item
						],
					};

					await admin
						.messaging()
						.sendEachForMulticast(msg)
						.then((response) => {
							console.log("Successfully sent message");
						})
						.catch((error) => {
							console.log("Error sending message:", error);
						});
					console.log("Booked Usual");
				} else {
					console.log("Delivery Partner not available for usual");
				}
			}
		}
	} catch (e) {
		console.log(e, "Cannot assign delivery");
	}
};

exports.cod = async (req, res) => {
	try {
		const { userId } = req.params;
		const { quantity, deliverycharges, productId, total } = req.body;
		const orderno = await Order.countDocuments();
		const user = await User.findById(userId).populate(
			"cart",
			"quantity product"
		);
		const products = await Product.find({ _id: { $in: productId } })
			.populate("creator", "storeAddress")
			.populate("collectionss", "category");

		let fast = [];
		let slow = [];

		//generating mesId
		function msgid() {
			return Math.floor(100000 + Math.random() * 900000);
		}

		if (user && products.length > 0) {
			for (let product of products) {
				//seperating food and grocery

				if (
					product.collectionss &&
					product.collectionss.category === "Food and Grocery"
				) {
					fast.push(product._id);
				} else {
					slow.push(product._id);
				}
			}

			let finalmaindata = [];

			//processing orders seprately

			//for F&G
			if (fast.length > 0) {
				let sellers = [];
				let maindata = [];
				let qty = [];
				let prices = [];
				let oi = Math.floor(Math.random() * 9000000) + 1000000;

				//checking for products in fast
				let matchedObjects = [];
				user.cart.forEach((obj1) => {
					let matchingObj = fast.find(
						(obj2) => obj2.toString() === obj1.product.toString()
					);

					if (matchingObj) {
						matchedObjects.push(obj1);
					}
				});

				for (let i = 0; i < matchedObjects.length; i++) {
					const product = await Product.findById(
						matchedObjects[i].product
					).populate("creator", "storeAddress");
					prices.push(product?.discountedprice);
					sellers.push(product?.creator?._id);
					qty.push(matchedObjects[i].quantity);
					maindata.push({
						product: product._id,
						seller: product?.creator?._id,
						price: product?.discountedprice,
						qty: matchedObjects[i].quantity,
					});

					finalmaindata.push({
						product: product._id,
						seller: product?.creator?._id,
						price: product?.discountedprice,
						qty: matchedObjects[i].quantity,
					});
				}

				let finalqty = sumArray(qty);
				let finalamount = sumArray(prices);

				//a new order is created
				const order = new Order({
					buyerId: user._id,
					productId: fast,
					quantity: finalqty,
					total: finalamount,
					orderId: oi,
					paymentMode: "Cash",
					currentStatus: "success",
					deliverycharges: deliverycharges,
					timing: "Arriving Soon!",
					orderno: orderno + 1,
					data: maindata,
					sellerId: sellers,
				});
				await order.save();

				//upating order in customers purchase history
				await User.updateOne(
					{ _id: user._id },
					{ $push: { puchase_history: order._id } }
				);

				//sending notfication to sellers
				for (let i = 0; i < maindata.length; i++) {
					const sellerorder = new SellerOrder({
						buyerId: user._id,
						productId: maindata[i].product,
						quantity: maindata[i].qty,
						total: maindata[i].price,
						orderId: oi,
						paymentMode: "Cash",
						currentStatus: "processing",
						deliverycharges: deliverycharges,
						timing: "Delivery Soon!",
						sellerId: maindata[i].seller,
						orderno: parseInt((await Order.countDocuments()) + 1),
					});
					await sellerorder.save();

					//commission taken by company until membership is purchased by the creator (10%)
					const product = await Product.findById(maindata[i].product).populate(
						"creator",
						"storeAddress ismembershipactive memberships"
					);

					let deduction = 0; //10% amount earned by company and substracted from creator as fees

					if (
						product.creator?.ismembershipactive === false ||
						product.creator?.memberships?.membership?.toString() ===
						"65671e5204b7d0d07ef0e796"
					) {
						deduction = product.discountedprice * 0.1;
					}

					//earning distribution
					let today = new Date();

					let year = today.getFullYear();
					let month = String(today.getMonth() + 1).padStart(2, "0");
					let day = String(today.getDate()).padStart(2, "0");

					let formattedDate = `${day}/${month}/${year}`;

					if (deduction > 0) {
						//admin earning
						let earned = {
							how: "Sales Commission",
							amount: deduction,
							when: Date.now(),
							id: order._id,
						};

						await Admin.updateOne(
							{ date: formattedDate },
							{
								$inc: { todayearning: deduction },
								$push: { earningtype: earned },
							}
						);
					}

					//creator earning
					let storeearning = product.discountedprice - deduction;

					let earning = { how: "product", when: Date.now() };
					await User.updateOne(
						{ _id: product?.creator?._id },
						{
							$addToSet: { customers: user._id, earningtype: earning },
							$inc: { storeearning: storeearning },
						}
					);
					await Product.updateOne(
						{ _id: product._id },
						{ $inc: { itemsold: 1 } }
					);
				}

				//sending notification to each store creator that a new order has arrived
				const workspace = await User.findById("65f5539d09dbe77dea51400d");
				for (const sell of sellers) {
					const seller = await User.findById(sell);
					const convs = await Conversation.findOne({
						members: { $all: [seller?._id, workspace._id] },
					});
					const senderpic = process.env.URL + workspace.profilepic;
					const recpic = process.env.URL + seller.profilepic;
					const timestamp = `${new Date()}`;
					const mesId = msgid();

					if (convs) {
						let data = {
							conversationId: convs._id,
							sender: workspace._id,
							text: `A new order with orderId ${oi} has arrived.`,
							mesId: mesId,
						};
						const m = new Message(data);
						await m.save();

						if (seller?.notificationtoken) {
							const msg = {
								notification: {
									title: `Workspace`,
									body: `A new order with orderId ${oi} has arrived.`,
								},
								data: {
									screen: "Conversation",
									sender_fullname: `${workspace?.fullname}`,
									sender_id: `${workspace?._id}`,
									text: `A new order with orderId ${oi} has arrived.`,
									convId: `${convs?._id}`,
									createdAt: `${timestamp}`,
									mesId: `${mesId}`,
									typ: `message`,
									senderuname: `${workspace?.username}`,
									senderverification: `${workspace.isverified}`,
									senderpic: `${senderpic}`,
									reciever_fullname: `${seller.fullname}`,
									reciever_username: `${seller.username}`,
									reciever_isverified: `${seller.isverified}`,
									reciever_pic: `${recpic}`,
									reciever_id: `${seller._id}`,
								},
								token: seller?.notificationtoken,
							};

							await admin
								.messaging()
								.send(msg)
								.then((response) => {
									console.log("Successfully sent message");
								})
								.catch((error) => {
									console.log("Error sending message:", error);
								});
						}
					} else {
						const conv = new Conversation({
							members: [workspace._id, seller._id],
						});
						const savedconv = await conv.save();
						let data = {
							conversationId: conv._id,
							sender: workspace._id,
							text: `A new order with orderId ${oi} has arrived.`,
							mesId: mesId,
						};
						await User.updateOne(
							{ _id: workspace._id },
							{
								$addToSet: {
									conversations: savedconv?._id,
								},
							}
						);
						await User.updateOne(
							{ _id: seller._id },
							{
								$addToSet: {
									conversations: savedconv?._id,
								},
							}
						);

						const m = new Message(data);
						await m.save();

						const msg = {
							notification: {
								title: `Workspace`,
								body: `A new order with orderId ${oi} has arrived.`,
							},
							data: {
								screen: "Conversation",
								sender_fullname: `${seller?.fullname}`,
								sender_id: `${seller?._id}`,
								text: `A new order with orderId ${oi} has arrived.`,
								convId: `${convs?._id}`,
								createdAt: `${timestamp}`,
								mesId: `${mesId}`,
								typ: `message`,
								senderuname: `${seller?.username}`,
								senderverification: `${seller.isverified}`,
								senderpic: `${recpic}`,
								reciever_fullname: `${workspace.fullname}`,
								reciever_username: `${workspace.username}`,
								reciever_isverified: `${workspace.isverified}`,
								reciever_pic: `${senderpic}`,
								reciever_id: `${workspace._id}`,
							},
							token: seller?.notificationtoken,
						};

						await admin
							.messaging()
							.send(msg)
							.then((response) => {
								console.log("Successfully sent message");
							})
							.catch((error) => {
								console.log("Error sending message:", error);
							});
					}
				}

				//sending notification to admin
				let flashid = "655e189fb919c70bf6895485";
				const flash = await User.findById(flashid);
				const mainuser = await User.findById("65314cd99db37d9109914f3f");
				const timestamp = `${new Date()}`;

				const senderpic = process.env.URL + flash.profilepic;
				const recpic = process.env.URL + mainuser.profilepic;

				const mesId = msgid();
				const convs = await Conversation.findOne({
					members: { $all: [mainuser?._id, flash._id] },
				});

				let data = {
					conversationId: convs._id,
					sender: flash._id,
					text: `A new order with orderId ${oi} has arrived.`,
					mesId: mesId,
				};
				const m = new Message(data);
				await m.save();
				if (mainuser?.notificationtoken) {
					const msg = {
						notification: {
							title: `Grovyo Flash`,
							body: `A new order with orderId ${oi} has arrived.`,
						},
						data: {
							screen: "Conversation",
							sender_fullname: `${mainuser?.fullname}`,
							sender_id: `${mainuser?._id}`,
							text: `A new order with orderId ${oi} has arrived.`,
							convId: `${convs?._id}`,
							createdAt: `${timestamp}`,
							mesId: `${mesId}`,
							typ: `message`,
							senderuname: `${mainuser?.username}`,
							senderverification: `${mainuser.isverified}`,
							senderpic: `${recpic}`,
							reciever_fullname: `${flash.fullname}`,
							reciever_username: `${flash.username}`,
							reciever_isverified: `${flash.isverified}`,
							reciever_pic: `${senderpic}`,
							reciever_id: `${flash._id}`,
						},
						token: mainuser?.notificationtoken,
					};

					await admin
						.messaging()
						.send(msg)
						.then((response) => {
							console.log("Successfully sent message");
						})
						.catch((error) => {
							console.log("Error sending message:", error);
						});
				}

				//creating delivery
				credeli({
					oid: order.orderId,
					id: user._id,
					storeids: sellers,
					total: order.total,
					instant: true,
				});
			}

			//for Usual
			if (slow.length > 0) {
				let sellers = [];
				let maindata = [];
				let qty = [];
				let prices = [];
				let oi = Math.floor(Math.random() * 9000000) + 1000000;

				//checking for products in fast
				let matchedObjects = [];
				user.cart.forEach((obj1) => {
					let matchingObj = slow.find(
						(obj2) => obj2.toString() === obj1.product.toString()
					);

					if (matchingObj) {
						matchedObjects.push(obj1);
					}
				});

				for (let i = 0; i < matchedObjects.length; i++) {
					const product = await Product.findById(
						matchedObjects[i].product
					).populate("creator", "storeAddress");
					prices.push(product?.discountedprice);
					sellers.push(product?.creator?._id);
					qty.push(matchedObjects[i].quantity);
					maindata.push({
						product: product._id,
						seller: product?.creator?._id,
						price: product?.discountedprice,
						qty: matchedObjects[i].quantity,
					});

					finalmaindata.push({
						product: product._id,
						seller: product?.creator?._id,
						price: product?.discountedprice,
						qty: matchedObjects[i].quantity,
					});
				}

				let finalqty = sumArray(qty);

				let finalamount = sumArray(prices);

				//a new order is created
				const order = new Order({
					buyerId: user._id,
					productId: slow,
					quantity: finalqty,
					total: finalamount,
					orderId: oi,
					paymentMode: "Cash",
					currentStatus: "success",
					deliverycharges: deliverycharges,
					timing: "Tommorow, by 7:00 pm",
					orderno: orderno + 1,
					data: maindata,
					sellerId: sellers,
				});
				await order.save();

				//upating order in customers purchase history
				await User.updateOne(
					{ _id: user._id },
					{ $push: { puchase_history: order._id } }
				);

				//sending notfication to sellers
				for (let i = 0; i < maindata.length; i++) {
					const sellerorder = new SellerOrder({
						buyerId: user._id,
						productId: maindata[i].product,
						quantity: maindata[i].qty,
						total: maindata[i].price,
						orderId: oi,
						paymentMode: "Cash",
						currentStatus: "processing",
						deliverycharges: deliverycharges,
						timing: "Delivery Soon!",
						sellerId: maindata[i].seller,
						orderno: parseInt((await Order.countDocuments()) + 1),
					});
					await sellerorder.save();

					//commission taken by company until membership is purchased by the creator (10%)
					const product = await Product.findById(maindata[i].product).populate(
						"creator",
						"storeAddress ismembershipactive memberships"
					);

					let deduction = 0; //10% amount earned by company and substracted from creator as fees

					if (
						product.creator?.ismembershipactive === false ||
						product.creator?.memberships?.membership?.toString() ===
						"65671e5204b7d0d07ef0e796"
					) {
						deduction = product.discountedprice * 0.1;
					}

					//earning distribution
					let today = new Date();

					let year = today.getFullYear();
					let month = String(today.getMonth() + 1).padStart(2, "0");
					let day = String(today.getDate()).padStart(2, "0");

					let formattedDate = `${day}/${month}/${year}`;

					if (deduction > 0) {
						//admin earning
						let earned = {
							how: "Sales Commission",
							amount: deduction,
							when: Date.now(),
							id: order._id,
						};

						await Admin.updateOne(
							{ date: formattedDate },
							{
								$inc: { todayearning: deduction },
								$push: { earningtype: earned },
							}
						);
					}

					//creator earning
					let storeearning = product.discountedprice - deduction;

					let earning = { how: "product", when: Date.now() };
					await User.updateOne(
						{ _id: product?.creator?._id },
						{
							$addToSet: { customers: user._id, earningtype: earning },
							$inc: { storeearning: storeearning },
						}
					);
					await Product.updateOne(
						{ _id: product._id },
						{ $inc: { itemsold: 1 } }
					);
				}

				//sending notification to each store creator that a new order has arrived
				const workspace = await User.findById("65f5539d09dbe77dea51400d");
				for (const sell of sellers) {
					const seller = await User.findById(sell);
					const convs = await Conversation.findOne({
						members: { $all: [seller?._id, workspace._id] },
					});
					const senderpic = process.env.URL + workspace.profilepic;
					const recpic = process.env.URL + seller.profilepic;
					const timestamp = `${new Date()}`;
					const mesId = msgid();

					if (convs) {
						let data = {
							conversationId: convs._id,
							sender: workspace._id,
							text: `A new order with orderId ${oi} has arrived.`,
							mesId: mesId,
						};
						const m = new Message(data);
						await m.save();

						if (seller?.notificationtoken) {
							const msg = {
								notification: {
									title: `Workspace`,
									body: `A new order with orderId ${oi} has arrived.`,
								},
								data: {
									screen: "Conversation",
									sender_fullname: `${workspace?.fullname}`,
									sender_id: `${workspace?._id}`,
									text: `A new order with orderId ${oi} has arrived.`,
									convId: `${convs?._id}`,
									createdAt: `${timestamp}`,
									mesId: `${mesId}`,
									typ: `message`,
									senderuname: `${workspace?.username}`,
									senderverification: `${workspace.isverified}`,
									senderpic: `${senderpic}`,
									reciever_fullname: `${seller.fullname}`,
									reciever_username: `${seller.username}`,
									reciever_isverified: `${seller.isverified}`,
									reciever_pic: `${recpic}`,
									reciever_id: `${seller._id}`,
								},
								token: seller?.notificationtoken,
							};

							await admin
								.messaging()
								.send(msg)
								.then((response) => {
									console.log("Successfully sent message");
								})
								.catch((error) => {
									console.log("Error sending message:", error);
								});
						}
					} else {
						const conv = new Conversation({
							members: [workspace._id, seller._id],
						});
						const savedconv = await conv.save();
						let data = {
							conversationId: conv._id,
							sender: workspace._id,
							text: `A new order with orderId ${oi} has arrived.`,
							mesId: mesId,
						};
						await User.updateOne(
							{ _id: workspace._id },
							{
								$addToSet: {
									conversations: savedconv?._id,
								},
							}
						);
						await User.updateOne(
							{ _id: seller._id },
							{
								$addToSet: {
									conversations: savedconv?._id,
								},
							}
						);

						const m = new Message(data);
						await m.save();

						const msg = {
							notification: {
								title: `Workspace`,
								body: `A new order with orderId ${oi} has arrived.`,
							},
							data: {
								screen: "Conversation",
								sender_fullname: `${seller?.fullname}`,
								sender_id: `${seller?._id}`,
								text: `A new order with orderId ${oi} has arrived.`,
								convId: `${convs?._id}`,
								createdAt: `${timestamp}`,
								mesId: `${mesId}`,
								typ: `message`,
								senderuname: `${seller?.username}`,
								senderverification: `${seller.isverified}`,
								senderpic: `${recpic}`,
								reciever_fullname: `${workspace.fullname}`,
								reciever_username: `${workspace.username}`,
								reciever_isverified: `${workspace.isverified}`,
								reciever_pic: `${senderpic}`,
								reciever_id: `${workspace._id}`,
							},
							token: seller?.notificationtoken,
						};

						await admin
							.messaging()
							.send(msg)
							.then((response) => {
								console.log("Successfully sent message");
							})
							.catch((error) => {
								console.log("Error sending message:", error);
							});
					}
				}

				//sending notification to admin
				let flashid = "655e189fb919c70bf6895485";
				const flash = await User.findById(flashid);
				const mainuser = await User.findById("65314cd99db37d9109914f3f");
				const timestamp = `${new Date()}`;

				const senderpic = process.env.URL + flash.profilepic;
				const recpic = process.env.URL + mainuser.profilepic;

				const mesId = msgid();
				const convs = await Conversation.findOne({
					members: { $all: [mainuser?._id, flash._id] },
				});

				let data = {
					conversationId: convs._id,
					sender: flash._id,
					text: `A new order with orderId ${oi} has arrived.`,
					mesId: mesId,
				};
				const m = new Message(data);
				await m.save();
				if (mainuser?.notificationtoken) {
					const msg = {
						notification: {
							title: `Grovyo Flash`,
							body: `A new order with orderId ${oi} has arrived.`,
						},
						data: {
							screen: "Conversation",
							sender_fullname: `${mainuser?.fullname}`,
							sender_id: `${mainuser?._id}`,
							text: `A new order with orderId ${oi} has arrived.`,
							convId: `${convs?._id}`,
							createdAt: `${timestamp}`,
							mesId: `${mesId}`,
							typ: `message`,
							senderuname: `${mainuser?.username}`,
							senderverification: `${mainuser.isverified}`,
							senderpic: `${recpic}`,
							reciever_fullname: `${flash.fullname}`,
							reciever_username: `${flash.username}`,
							reciever_isverified: `${flash.isverified}`,
							reciever_pic: `${senderpic}`,
							reciever_id: `${flash._id}`,
						},
						token: mainuser?.notificationtoken,
					};

					await admin
						.messaging()
						.send(msg)
						.then((response) => {
							console.log("Successfully sent message");
						})
						.catch((error) => {
							console.log("Error sending message:", error);
						});
				}
				credeli({
					oid: order.orderId,
					id: user._id,
					storeids: sellers,
					total: order.total,
					instant: false,
				});
			}

			await User.updateOne(
				{ _id: user._id },
				{ $unset: { cart: [], cartproducts: [] } }
			);

			res.status(200).json({ success: true });
		} else {
			res
				.status(404)
				.json({ message: "User or Product not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res.status(400).json({ message: "Something went wrong", success: false });
	}
};

exports.getprofileinfo = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (user) {

			const dp = process.env.URL + user.profilepic;
			const data = {
				name: user?.fullname,
				email: user?.email,
				phone: user?.phone,
				username: user?.username,

				image: dp,
				date: user.DOB,
				bio: user.desc,
			};
			res.status(200).json({ success: true, data });
		} else {
			res.status(400).json({ success: false, message: "User Not Found" });
		}
	} catch (err) {
		res.status(400).json({ message: "Internal Server Error" });
	}
};


// exports.searchall = async (req, res) => {
// 	const { query } = req.query;
// 	const { id } = req.params;
// 	try {
// 		if (!query) {
// 			return res.status(400).json({ success: false, message: "Query is required" });
// 		}

// 		const processedQuery = query.trim().toLowerCase();

// 		// Posts
// 		const posts = await Post.find({
// 			$or: [
// 				{ title: { $regex: `.*${processedQuery}.*`, $options: "i" } },
// 				{ desc: { $regex: `.*${processedQuery}.*`, $options: "i" } }
// 			],
// 			status: "Unblock"
// 		})
// 			.select("title desc post topicId community sender")
// 			.limit(5)
// 			.populate("community", "dp title createdAt")
// 			.populate("sender", "fullname")
// 			.lean()
// 			.exec();

// 		const imgs = posts.map(post => {
// 			if (post.post[0].type === "image/jpg") {
// 				return process.env.POST_URL + post.post[0].content;
// 			} else {
// 				return process.env.POST_URL + (post.post[0].thumbnail || post.post[0].content);
// 			}
// 		});

// 		const dp = posts.map(post => post.community ? process.env.URL + post.community.dp : process.env.URL + "default.png");

// 		const mergedposts = posts.map((p, i) => ({
// 			...p,
// 			img: imgs[i],
// 			dps: dp[i]
// 		}));

// 		// Communities
// 		const coms = await Community.find({
// 			title: { $regex: `.*${processedQuery}.*`, $options: "i" },
// 			type: "public",
// 			blocked: { $nin: id }
// 		})
// 			.populate("creator", "fullname username profilepic isverified")
// 			.select("title createdAt dp memberscount")
// 			.limit(5)
// 			.lean()
// 			.exec();

// 		const pics = coms.map(com => process.env.URL + com.dp);
// 		const creatordps = coms.map(com => process.env.URL + com.creator.profilepic);

// 		const mergedcoms = coms.map((p, i) => ({
// 			...p,
// 			img: pics[i],
// 			dps: creatordps[i]
// 		}));

// 		// Users
// 		const pros = await User.find({
// 			$or: [
// 				{ fullname: { $regex: `.*${processedQuery}.*`, $options: "i" } },
// 				{ username: { $regex: `.*${processedQuery}.*`, $options: "i" } }
// 			]
// 		})
// 			.select("fullname profilepic username isverified createdAt")
// 			.lean()
// 			.limit(5)
// 			.exec();

// 		const prosDps = pros.map(pro => process.env.URL + pro.profilepic);

// 		const mergedpros = pros.map((p, i) => ({
// 			...p,
// 			dps: prosDps[i]
// 		}));

// 		console.log(mergedpros, "mergedpros")
// 		console.log(mergedcoms, "mergedcoms")
// 		console.log(mergedposts, "mergedposts")

// 		return res.status(200).json({ success: true, mergedpros, mergedcoms, mergedposts });
// 	} catch (e) {
// 		console.error(e);
// 		return res.status(400).json({ success: false, message: e.message });
// 	}
// };


exports.searchall = async (req, res) => {
	const { query } = req.query;
	const { id } = req.params;

	if (!query) {
		return res.status(400).json({ success: false, message: "Query is required" });
	}

	const processedQuery = query.trim().toLowerCase();

	try {
		// Fetch public communities and their IDs
		const publicCommunities = await Community.find({ type: "public" }).select("_id").lean();
		const publicCommunityIds = publicCommunities.map(community => community._id);

		// Fetch posts from public communities
		const posts = await Post.find({
			$or: [
				{ title: { $regex: `.*${processedQuery}.*`, $options: "i" } },
				{ desc: { $regex: `.*${processedQuery}.*`, $options: "i" } }
			],
			community: { $in: publicCommunityIds },
			status: "Unblock"
		})
			.select("title desc post topicId community sender")
			.limit(5)
			.populate("community", "dp title createdAt")
			.populate("sender", "fullname")
			.lean();

		const mergedPosts = posts.map(post => ({
			...post,
			img: process.env.POST_URL + (post.post[0].type === "image/jpg" ? post.post[0].content : (post.post[0].thumbnail || post.post[0].content)),
			dps: post.community ? process.env.URL + post.community.dp : process.env.URL + "default.png"
		}));

		// Fetch public communities matching the query
		const communities = await Community.find({
			title: { $regex: `.*${processedQuery}.*`, $options: "i" },
			type: "public",
			blocked: { $nin: id }
		})
			.populate("creator", "fullname username profilepic isverified")
			.select("title createdAt dp memberscount")
			.limit(5)
			.lean();

		const mergedCommunities = communities.map(com => ({
			...com,
			img: process.env.URL + com.dp,
			dps: process.env.URL + com.creator.profilepic
		}));

		// Fetch users matching the query
		const users = await User.find({
			$or: [
				{ fullname: { $regex: `.*${processedQuery}.*`, $options: "i" } },
				{ username: { $regex: `.*${processedQuery}.*`, $options: "i" } }
			]
		})
			.select("fullname profilepic username isverified createdAt")
			.lean()
			.limit(5);

		const mergedUsers = users.map(user => ({
			...user,
			dps: process.env.URL + user.profilepic
		}));

		return res.status(200).json({ success: true, mergedpros: mergedUsers || [], mergedcoms: mergedCommunities || [], mergedposts: mergedPosts || [], });
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, message: error.message });
	}
};

exports.searchposts = async (req, res) => {
	const { query } = req.query;

	if (!query) {
		return res.status(400).json({ success: false, message: "Query is required" });
	}

	const processedQuery = query.trim().toLowerCase();

	try {
		// Fetch public communities and their IDs
		const publicCommunities = await Community.find({ type: "public" }).select("_id").lean();
		const publicCommunityIds = publicCommunities.map(community => community._id);

		// Fetch posts from public communities
		const posts = await Post.find({
			$or: [
				{ title: { $regex: `.*${processedQuery}.*`, $options: "i" } },
				{ desc: { $regex: `.*${processedQuery}.*`, $options: "i" } }
			],
			community: { $in: publicCommunityIds },
			status: "Unblock"
		})
			.select("title desc post topicId community sender")
			.limit(100)
			.populate("community", "dp title createdAt")
			.populate("sender", "fullname")
			.lean();

		// Merging posts with their corresponding images and display pictures
		const mergedPosts = posts.map(post => ({
			...post,
			img: process.env.POST_URL + (post.post[0].type === "image/jpg" ? post.post[0].content : (post.post[0].thumbnail || post.post[0].content)),
			dp: post.community ? process.env.URL + post.community.dp : process.env.URL + "default.png"
		}));

		console.log(mergedPosts, "mergedPosts");

		return res.status(200).json({ success: true, posts: mergedPosts });
	} catch (e) {
		console.error(e);
		return res.status(400).json({ success: false, message: e.message });
	}
};
