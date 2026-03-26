const mongoose = require("mongoose");

const MessageReadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    readBy: { type: [MessageReadSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Message || mongoose.model("Message", MessageSchema);
