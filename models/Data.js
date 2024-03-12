// const mongoose = require("mongoose")

// const DataSchema = new mongoose.Schema({
// 	location: [
// 		{
// 			locationname: { type: String, default: "andra pradesh" },
// 			total: { type: Number, default: 0 },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{
// 			locationname: { type: String, default: "arunachal pradesh" },
// 			total: {
// 				type: Number, default: 0
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "assam" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "bihar" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: "chhattisgarh",
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{
// 			locationname: { type: String, default: "goa" },
// 			total:
// 				{ type: Number, default: 0 },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "gujarat" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "haryana" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},

// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "himachal pradesh" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "jharkhand" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "karnataka" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "kerala" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},

// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "madya pradesh" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "maharashtra" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "manipur" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "meghalaya"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "mizoram"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "nagaland"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: "odisha",
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "punjab" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "rajasthan" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "sikkim"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},

// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "tamil nadu"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "telangana"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "tripura" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},

// 		{
// 			total: { type: Number, default: 0 },
// 			locationname: {
// 				type: String, default: "uttar pradesh"
// 			},
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "uttarakhand" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 		{

// 			total: { type: Number, default: 0 },
// 			locationname: { type: String, default: "west bengal" },
// 			male: { type: Number, default: 0 },
// 			female: { type: Number, default: 0 }
// 		},
// 	]
// })

// module.exports = mongoose.model("LocationData", DataSchema)


const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
	location: [
		{
			name: String,
			total: { type: Number, default: 0 },
			male: { type: Number, default: 0 },
			female: { type: Number, default: 0 },
		},
	],
});

module.exports = mongoose.model("LocationData", DataSchema);