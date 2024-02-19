const mongoose = require("mongoose")

const backendData = new mongoose.Schema({
	NewLocations: Array,
	Newcategory: Array,
})

module.exports = mongoose.model("Adbyloccategory", backendData)