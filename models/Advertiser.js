const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const AdvertiserSchema = new mongoose.Schema({
  firstname: { type: String },
  lastname: { type: String },
  type: {
    type: String,
    default: "Individual",
    enum: ["Individual", "Organization"],
  },
  email: { type: String, unique: true },
  phone: { type: String },
  organizationname: { type: String },
  pan: { type: String },
  panphoto: { type: String },
  gst: { type: String },
  gstphoto: { type: String },
  agencyDetails: {
    iscreatedbyagency: { type: Boolean, default: false },
    agencyuserid: { type: ObjectId, ref: "User" },
    agencyadvertiserid: { type: ObjectId, ref: "Advertiser" }
  },
  password: { type: String },
  retypepassword: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: Number },
  landmark: { type: String },
  ads: [{ type: ObjectId, ref: "Ads" }],
  currentbalance: { type: Number, default: 0 },
  transactions: [{ type: ObjectId, ref: "AdTransactions" }],
  popularity: { type: String },
  idstatus: { type: String, default: "active" },
  totalconversions: { type: String },
  amountspent: [{
    date: { type: String, default: Date.now().toString() },
    amount: { type: String },
    totalvisitors: { type: Number },
  },
  ],
  verificationstatus: { type: String, default: "unverified" },
  advertiserid: { type: String },
  image: { type: String },
  taxinfo: { type: String },
  editcount: [{
    date: { type: String, default: Date.now().toString() },
    number: { type: String, default: 0 },
  },
  ],
  logs: [
    {
      login: { type: String },
      logout: { type: String },
    },
  ],
  bank: {
    accno: { type: String },
    ifsc: { type: String },
    name: { type: String },
  },
  moneyearned: { type: Number, default: 0 },
  earningtype: [{ how: { type: String }, when: { type: Number } }],
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalspent: { type: Number, default: 0 },
  message: [{ type: String }],
  totalspent: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, default: 0 }
  }]
},
  { timestamps: true }
);

AdvertiserSchema.index({ title: "text" });

module.exports = mongoose.model("Advertiser", AdvertiserSchema);
