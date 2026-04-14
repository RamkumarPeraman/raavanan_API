const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["one-time", "monthly"], default: "one-time" },
    project: { type: String, default: "general" },
    paymentMethod: { type: String, default: "upi" },
    paymentStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "failed"],
      default: "pending",
    },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    pan: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
    paymentId: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    paymentScreenshot: { type: String, default: "" }, // base64
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Donation || mongoose.model("Donation", DonationSchema);
