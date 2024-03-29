const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const Approvals = new mongoose.Schema(
  {
    id: { type: String }, type: { type: String },
    status: {
      type: String, default: "pending",
      enum: ["pending", "approved", "rejected"]
    },
    bank: {
      bankname: { type: String },
      personname: { type: String },
      branchname: { type: String },
      accountno: { type: String },
      IFSCcode: {
        type: String,
      },
    },
    text: { type: String },
    reapplydate: { type: Date }
  },

  { timestamps: true }
);

Approvals.index({ title: "text" });

module.exports = mongoose.model("Approvals", Approvals);
