const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["general", "education", "healthcare", "food", "shelter", "other"],
      default: "general"
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
