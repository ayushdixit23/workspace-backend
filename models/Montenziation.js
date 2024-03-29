const mongoose = require("mongoose")

const Monetization = new mongoose.Schema({
	creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
	text: { type: String },
	status: {
		type: String,
		enum: ["pending", "approved", "rejected"],
		default: "pending",
	},
	reapplydate: { type: Date }
}, { timestamps: true })

module.exports = new mongoose.model("Monetization", Monetization)