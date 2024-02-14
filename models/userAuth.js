const mongoose = require("mongoose");
const crypto = require("crypto");
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      maxLength: 50,
    },
    hashed_password: {
      type: String,
    },
    passw: { type: String },
    otp: { type: String },
    salt: String,
    governmentid: { type: String },
    role: {
      type: String,
      default: "User",
    },
    resetPasswordLink: {
      data: String,
    },
    fullname: {
      type: String,
      maxLength: 30,
    },
    token: { type: String },
    phone: { type: String, trim: true },
    DOB: { type: String },
    username: {
      type: String,
      maxLength: 30,
      trim: true,
      unique: true,
    },
    profilepic: {
      type: String,
    },
    prositepic: { type: String },
    links: { type: [String] },
    linkstype: { type: [String] },
    interest: {
      type: [String],
      default: [],
    },
    puchase_history: [{ type: ObjectId, ref: "Order" }],
    puchase_products: [{ type: ObjectId, ref: "Product" }],
    subscriptions: [{ type: ObjectId, ref: "Subscriptions" }],
    cart_history: {
      type: [String],
      default: [],
    },
    notifications: {
      type: [String],
    },
    location: { type: String },
    isverified: {
      type: Boolean,
      default: false,
    },
    settings: {
      type: [String],
    },
    status: {
      type: String,
      default: "Unblock",
      enum: ["Unblock", "Block"],
      reason: { type: String },
    },
    desc: { type: String, maxLength: 500 },
    shortdesc: { type: String, maxLength: 150 },
    communityjoined: [{ type: ObjectId, ref: "Community", default: [] }],
    communitycreated: [{ type: ObjectId, ref: "Community", default: [] }],
    totalcom: { type: Number, default: 0 },
    likedposts: [{ type: ObjectId, ref: "Post", default: [] }],
    topicsjoined: [{ type: ObjectId, ref: "Topic", default: [] }],
    totaltopics: { type: Number, default: 0 },
    notifications: [{ type: ObjectId, ref: "Notification" }],
    notificationscount: { type: Number, default: 0 },
    purchasestotal: { type: Number, default: 0 },
    location: { type: String },
    ipaddress: { type: String },
    currentlogin: { type: String },
    popularity: { type: String, default: "0%" },
    totalmembers: { type: Number, default: 0 },
    badgescount: { type: Number, default: 0 },
    bank: {
      accno: { type: String },
      ifsc: { type: String },
      name: { type: String },
    },
    currentmoney: { type: Number, default: 0 },
    paymenthistory: [{ type: ObjectId, ref: "Payment" }],
    moneyearned: { type: Number, default: 0 },
    pendingpayments: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    cart: [{ type: ObjectId, ref: "Cart" }],
    cartproducts: [{ type: "String" }],
    web: { type: String },
    prositeid: { type: ObjectId, ref: "Prosite" },
    lastlogin: { type: [String] },
    location: { type: [String] },
    device: { type: [String] },
    accounttype: { type: String },
    organization: { type: String },
    contacts: [{ type: Array }],
    notificationtoken: { type: String },
    sessions: [
      {
        time: { type: String, default: Date.now().toString() },
        screen: { type: String },
        deviceinfo: { type: [Array] },
        location: { type: [Array] },
      },
    ],
    activity: [
      {
        time: { type: String, default: Date.now().toString() },
        type: { type: String },
        deviceinfo: { type: [Array] },
        location: { type: [Array] },
      },
    ],
    blockedcoms: [
      {
        time: { type: String, default: Date.now().toString() },
        comId: { type: ObjectId, ref: "Community" },
      },
    ],
    blockedpeople: [
      {
        time: { type: String, default: Date.now().toString() },
        id: { type: ObjectId, ref: "User" },
      },
    ],
    messagerequests: [
      {
        message: { type: String },
        id: { type: ObjectId, ref: "User" },
      },
    ],
    msgrequestsent: [
      {
        id: { type: ObjectId, ref: "User" },
      },
    ],
    conversations: [
      {
        type: String,
        timestamp: new Date(),
      },
    ],
    orders: [
      {
        type: ObjectId,
        ref: "Order",
        status: { type: String },
        timestamp: new Date(),
      },
    ],
    customers: [
      {
        id: { type: String },
      },
    ],
    collectionss: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collectionss" }],
    adid: { type: Number },
    advertiserid: { type: ObjectId, ref: "Advertiser" },
    address: {
      streetaddress: { type: String },
      state: { type: String },
      city: { type: String },
      landmark: { type: String },
      pincode: { type: Number },
      country: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
        altitude: { type: Number },
        provider: { type: String },
        accuracy: { type: Number },
        bearing: { type: Number },
      },
    },
    // ayush
    storeAddress: [
      {
        buildingno: { type: String },
        city: { type: String },
        state: { type: String },
        postal: { type: Number },
        landmark: { type: String },
        gst: { type: String },
        businesscategory: { type: String },
        documenttype: { type: String },
        documentfile: { type: String },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number },
          altitude: { type: Number },
          provider: { type: String },
          accuracy: { type: Number },
          bearing: { type: Number },
        },
      },
    ],
    totalStoreVisit: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    storeStats: [{
      Dates: { type: Date },
      Sales: { type: Number },
    }],
    storeDemographics: {
      age: {
        "18-24": { type: Number, default: 0 },
        "25-34": { type: Number, default: 0 },
        "35-44": { type: Number, default: 0 },
        "45-64": { type: Number, default: 0 },
        "65+": { type: Number, default: 0 },
      },
      gender: {
        male: { type: Number, default: 0 },
        female: { type: Number, default: 0 },
      },
    },
    storeLocation: {
      AndhraPradesh: { type: Number, default: 0 },
      ArunachalPradesh: { type: Number, default: 0 },
      Assam: { type: Number, default: 0 },
      Bihar: { type: Number, default: 0 },
      Chhattisgarh: { type: Number, default: 0 },
      Goa: { type: Number, default: 0 },
      Gujarat: { type: Number, default: 0 },
      Haryana: { type: Number, default: 0 },
      HimachalPradesh: { type: Number, default: 0 },
      Jharkhand: { type: Number, default: 0 },
      Karnataka: { type: Number, default: 0 },
      Kerala: { type: Number, default: 0 },
      MadhyaPradesh: { type: Number, default: 0 },
      Maharashtra: { type: Number, default: 0 },
      Manipur: { type: Number, default: 0 },
      Meghalaya: { type: Number, default: 0 },
      Mizoram: { type: Number, default: 0 },
      Nagaland: { type: Number, default: 0 },
      Odisha: { type: Number, default: 0 },
      Punjab: { type: Number, default: 0 },
      Rajasthan: { type: Number, default: 0 },
      Sikkim: { type: Number, default: 0 },
      TamilNadu: { type: Number, default: 0 },
      Telangana: { type: Number, default: 0 },
      Tripura: { type: Number, default: 0 },
      UttarPradesh: { type: Number, default: 0 },
      Uttarakhand: { type: Number, default: 0 },
      WestBengal: { type: Number, default: 0 },
    },
    // ---
    mesIds: [{ type: Number }],
    deliverypartners: [
      {
        time: { type: String, default: Date.now().toString() },
        id: { type: ObjectId, ref: "User" },
      },
    ],
    foodLicense: { type: String },
    memberships: {
      membership: { type: ObjectId, ref: "membership" },
      status: { type: Boolean, default: true },
      ending: { type: String },
      paymentdetails: {
        mode: { type: String },
        amount: { type: Number },
        gstamount: { type: Number },
      },
    },
    activeSubscription: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscriptions"
    }],
    bank: {
      bankname: { type: String },
      branchname: { type: String },
      accountno: { type: String },
      IFSCcode: {
        type: String
      }
    }
    // for workspace membership
  },

  { timestamps: true }
);

userSchema.index({ fullname: "text" });

//virtualfields

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

//virtual methods

userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

module.exports = mongoose.model("User", userSchema);
