const mongoose = require("mongoose");
const Buttonss = new mongoose.Schema({
	link: String,
	name: String,
	fontFamily: { type: String },
	padding: { type: String },
	shadow: { type: String },
	gradient: { type: String },
	// linear-gradient(to right, #ff7e5f, #feb47b)
	imageAlign: { type: String, enum: ["left", "right"], default: "left" },
	borderRadius: { type: String },
	backgroundColor: { type: String },
	color: { type: String },
	borderTop: { type: String },
	borderBottom: { type: String },
	borderRight: { type: String },
	borderLeft: { type: String },
	borderRadiusTop: { type: String },
	image: { type: String },
	borderRadiusBottom: { type: String },
	borderRadiusRight: { type: String },
	borderRadiusLeft: { type: String },
	boxShadow: { type: String },
	fontBold: { type: String },
	premium: { type: Boolean, default: false },
});

module.exports = mongoose.model("Buttonss", Buttonss);
