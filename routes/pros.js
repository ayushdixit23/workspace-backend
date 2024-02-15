const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");
const User = require("../models/userAuth");
const uuid = require("uuid").v4;
const BUCKET_NAME = process.env.BUCKET_NAME;
// const POST_BUCKET = process.env.POST_BUCKET;

const s3 = new S3Client({
	region: process.env.BUCKET_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_KEY,
	},
});

router.post("/uploaddata/:id", upload.single("file"), async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		console.log(user, id);
		if (user) {
			const uuidString = uuid();
			const objectName = `${Date.now()}${uuidString}${req.file.originalname}`;
			const result = await s3.send(
				new PutObjectCommand({
					Bucket: BUCKET_NAME,
					Key: objectName,
					Body: req.file.buffer,
					ContentType: req.file.mimetype,
				})
			);
			await User.updateOne({ _id: id }, { $push: { contents: objectName } });
			const link = process.env.URL + objectName;
			res.status(200).json({ success: true, link });
		} else {
			res.status(404).json({ message: "User not found", success: false });
		}
	} catch (e) {
		res.status(409).json({
			message: e.message,
			success: false,
		});
	}
});

router.get("/uploaddata/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		if (user) {
			let links = [];
			for (let i = 0; i < user.contents.length; i++) {
				let a = process.env.URL + user.contents[i];
				links.push(a);
			}
			res.status(200).json({ links, success: true });
		} else {
			res.status(404).json({ message: "User not found!", success: false });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
});

router.post("/savetemplate/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id);
		console.log(user, id);
		if (user) {
			const { curr_template } = req.body;
			await User.updateOne(
				{ _id: id },
				{ $set: { prosite_template: curr_template } }
			);
			res.status(200).json({ success: true });
		} else {
			res.status(404).json({ message: "User not found", success: false });
		}
	} catch (e) {
		res.status(409).json({
			message: e.message,
			success: false,
		});
	}
});

router.post("/getprosite", async (req, res) => {
	try {
		const { username } = req.body;
		const atIndex = username.indexOf("@");

		if (atIndex === -1) {
			res
				.status(400)
				.json({ message: "Invalid username format", success: false });
			return;
		}
		const u = username.substring(atIndex + 1);

		const user = await User.findOne({ username: u });

		if (user) {
			res.status(200).json({ success: true, prosite: user.prosite_template });
		} else {
			res.status(404).json({ success: false, message: "User not found!" });
		}
	} catch (e) {
		console.log(e);
		res
			.status(400)
			.json({ message: "Something went wrong...", success: false });
	}
});

module.exports = router;
