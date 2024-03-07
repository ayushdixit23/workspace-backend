const mongoose = require("mongoose")
const Request = new mongoose.Schema({
	userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	type: { type: String, enum: ["store"], default: "store" },
	text: { type: String },
	status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
	storeDetails: {
		buildingno: { type: String },
		city: { type: String },
		state: { type: String },
		postal: { type: Number },
		landmark: { type: String },
		gst: { type: String },
		businesscategory: { type: String },
		documenttype: { type: String },
		documentfile: { type: String },
	},
	isverified: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = new mongoose.model("Request", Request)