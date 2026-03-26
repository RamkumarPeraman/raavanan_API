const mongoose = require("mongoose");

const ConversationParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: { type: Date, default: null },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    name: { type: String, trim: true, default: "" },
    participants: {
      type: [ConversationParticipantSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "A conversation needs at least two participants.",
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    directKey: { type: String, unique: true, sparse: true },
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      sentAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
