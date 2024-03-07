const mongoose = require("mongoose")

const Error = new mongoose.Schema({
	error: [{
		causedIn: { type: String },
		causedBy: { type: String }
	}],

})

module.exports = new mongoose.model("Error", Error)