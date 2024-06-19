

const mongoose = require("mongoose");

const FontsssSchema = new mongoose.Schema({
	link: String,
	name: String,
	fontFamily: String,
	fontSize: String,
	fontWeight: String,
	fontStyle: String,
	textDecoration: String,
	lineHeight: String,
	letterSpacing: String,
	color: String,
	textAlign: String,
	premium: { type: Boolean, default: false }
});

module.exports = mongoose.model("Font", FontsssSchema);
