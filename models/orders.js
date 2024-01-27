const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const OrderSchema = new mongoose.Schema(
  {
    buyerId: { type: ObjectId, ref: "User" },
    productId: [{ type: ObjectId, ref: "Product" }],
    sellerId: [{ type: ObjectId, ref: "User" }],
    delivered: { type: Boolean, default: false },
    quantity: { type: Number, min: 1 },
    total: { type: Number, min: 0 },
    customername: { type: String },
    currentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "completed",
        "failed",
        "returned",
        "damaged",
        "success",
      ],
      default: "pending",
    },
    orderId: { type: String, unique: true },
    onlineorderid: { type: String },
    deliverycharges: { type: Number, min: 0 },
    taxes: { type: Number, min: 0 },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      default: "Cash",
    },
    stats: [{
      X: {type: Date}, 
      Y:  {type: Number},
    }],
    routes: {
      A: { type: String },
      B: { type: String },
      C: { type: String },
      D: { type: String },
    },
    discountamount: { type: Number, min: 0 },
    finalprice: { type: Number, min: 0 },
    paymentId: { type: String },
    topicId: { type: String },
    timing: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
