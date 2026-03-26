const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["direct_message", "group_message"], default: "direct_message" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    relatedMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
