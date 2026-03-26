const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { handleValidation } = require("../middleware/validation");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sanitizeUser } = require("../utils/userHelpers");

const router = express.Router();

router.use(authenticate);

const buildDirectKey = (userIds) => [...new Set(userIds.map((value) => String(value)))].sort().join(":");

const canManageGroup = (conversation, currentUser) =>
  String(conversation.createdBy) === String(currentUser.id) ||
  ["admin", "super_admin"].includes(String(currentUser.role || "").toLowerCase());

const conversationHasUser = (conversation, userId) =>
  conversation.participants.some((participant) => String(participant.user?._id || participant.user) === String(userId));

const formatConversation = async (conversation, currentUserId) => {
  const populatedConversation =
    typeof conversation.populate === "function"
      ? await conversation.populate("participants.user", "name email role profileImage lastActive")
      : conversation;

  const conversationObject =
    typeof populatedConversation.toObject === "function" ? populatedConversation.toObject() : populatedConversation;

  const otherParticipants = conversationObject.participants
    .map((participant) => participant.user)
    .filter(Boolean)
    .filter((participant) => String(participant._id || participant.id) !== String(currentUserId));

  const selfParticipant = conversationObject.participants.find(
    (participant) => String(participant.user?._id || participant.user) === String(currentUserId)
  );

  const unreadCount = await Message.countDocuments({
    conversation: conversationObject._id,
    sender: { $ne: currentUserId },
    createdAt: {
      $gt: selfParticipant?.lastReadAt || new Date(0),
    },
  });

  return {
    id: conversationObject._id.toString(),
    type: conversationObject.type,
    name:
      conversationObject.type === "group"
        ? conversationObject.name
        : otherParticipants.map((participant) => participant.name).join(", "),
    participants: conversationObject.participants.map((participant) => ({
      ...participant,
      user: sanitizeUser(participant.user),
    })),
    createdBy: conversationObject.createdBy?.toString?.() || conversationObject.createdBy,
    unreadCount,
    lastMessage: conversationObject.lastMessage?.text || "",
    lastMessageAt: conversationObject.lastMessage?.sentAt || conversationObject.updatedAt,
    lastMessageSenderId:
      conversationObject.lastMessage?.sender?._id?.toString?.() ||
      conversationObject.lastMessage?.sender?.toString?.() ||
      null,
  };
};

const formatMessage = (message) => {
  const messageObject = typeof message.toObject === "function" ? message.toObject() : message;

  return {
    id: messageObject._id.toString(),
    conversationId: messageObject.conversation?.toString?.() || messageObject.conversation,
    sender: sanitizeUser(messageObject.sender),
    content: messageObject.content,
    createdAt: messageObject.createdAt,
    updatedAt: messageObject.updatedAt,
    readBy: (messageObject.readBy || []).map((entry) => ({
      userId: entry.user?._id?.toString?.() || entry.user?.toString?.() || entry.userId,
      seenAt: entry.seenAt,
    })),
  };
};

const refreshConversationLastMessage = async (conversationId) => {
  const latestMessage = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });

  if (!latestMessage) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: {
          text: "",
          sender: null,
          sentAt: null,
        },
      },
    });
    return;
  }

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      lastMessage: {
        text: latestMessage.content,
        sender: latestMessage.sender,
        sentAt: latestMessage.createdAt,
      },
    },
  });
};

router.get("/contacts", async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user.id },
    status: "active",
  })
    .sort({ name: 1 })
    .select("name email role profileImage lastActive");

  return res.json({
    success: true,
    data: users.map((user) => sanitizeUser(user)),
  });
});

router.get("/conversations", async (req, res) => {
  const conversations = await Conversation.find({
    "participants.user": req.user.id,
  }).sort({ "lastMessage.sentAt": -1, updatedAt: -1 });

  const formatted = await Promise.all(conversations.map((conversation) => formatConversation(conversation, req.user.id)));

  return res.json({ success: true, data: formatted });
});

router.post(
  "/conversations/direct",
  [body("participantId").notEmpty().withMessage("Participant is required."), handleValidation],
  async (req, res) => {
    if (String(req.body.participantId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "You cannot start a direct conversation with yourself." });
    }

    const participant = await User.findById(req.body.participantId);

    if (!participant || participant.status !== "active") {
      return res.status(404).json({ success: false, message: "Participant not found." });
    }

    const directKey = buildDirectKey([req.user.id, req.body.participantId]);

    let conversation = await Conversation.findOne({ directKey });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        createdBy: req.user.id,
        directKey,
        participants: [
          { user: req.user.id, lastReadAt: new Date() },
          { user: req.body.participantId, lastReadAt: null },
        ],
      });
    }

    return res.status(201).json({
      success: true,
      data: await formatConversation(conversation, req.user.id),
    });
  }
);

router.post(
  "/conversations/group",
  [
    body("name").trim().notEmpty().withMessage("Group name is required."),
    body("participantIds").isArray({ min: 1 }).withMessage("At least one participant is required."),
    handleValidation,
  ],
  async (req, res) => {
    const participantIds = [...new Set([req.user.id, ...(req.body.participantIds || [])].map((value) => String(value)))];

    const participants = await User.find({
      _id: { $in: participantIds },
      status: "active",
    }).select("_id");

    if (participants.length !== participantIds.length) {
      return res.status(400).json({ success: false, message: "One or more selected users are invalid." });
    }

    const conversation = await Conversation.create({
      type: "group",
      name: req.body.name.trim(),
      createdBy: req.user.id,
      participants: participantIds.map((userId) => ({
        user: userId,
        lastReadAt: String(userId) === String(req.user.id) ? new Date() : null,
      })),
    });

    return res.status(201).json({
      success: true,
      data: await formatConversation(conversation, req.user.id),
    });
  }
);

router.get("/conversations/:id/messages", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !conversationHasUser(conversation, req.user.id)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .populate("sender", "name email role profileImage lastActive");

  return res.json({
    success: true,
    data: messages.map(formatMessage),
  });
});

router.get("/conversations/:id", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !conversationHasUser(conversation, req.user.id)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  return res.json({
    success: true,
    data: await formatConversation(conversation, req.user.id),
  });
});

router.post(
  "/conversations/:id/messages",
  [body("content").trim().notEmpty().withMessage("Message content is required."), handleValidation],
  async (req, res) => {
    const conversation = await Conversation.findById(req.params.id).populate("participants.user", "name email role profileImage");

    if (!conversation || !conversationHasUser(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: req.body.content.trim(),
      readBy: [{ user: req.user.id, seenAt: new Date() }],
    });

    conversation.lastMessage = {
      text: newMessage.content,
      sender: req.user.id,
      sentAt: newMessage.createdAt,
    };

    conversation.participants = conversation.participants.map((participant) => ({
      ...participant.toObject?.(),
      lastReadAt: String(participant.user?._id || participant.user) === String(req.user.id) ? newMessage.createdAt : participant.lastReadAt,
    }));

    await conversation.save();

    const senderName =
      conversation.participants.find((participant) => String(participant.user?._id || participant.user) === String(req.user.id))?.user?.name ||
      "New message";

    const recipients = conversation.participants
      .map((participant) => participant.user)
      .filter(Boolean)
      .filter((participant) => String(participant._id || participant) !== String(req.user.id));

    if (recipients.length > 0) {
      await Notification.insertMany(
        recipients.map((recipient) => ({
          user: recipient._id || recipient,
          type: conversation.type === "group" ? "group_message" : "direct_message",
          title: conversation.type === "group" ? `${senderName} in ${conversation.name}` : `New message from ${senderName}`,
          message: newMessage.content,
          conversation: conversation._id,
          relatedMessage: newMessage._id,
          sender: req.user.id,
        }))
      );
    }

    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name email role profileImage lastActive");

    return res.status(201).json({
      success: true,
      data: formatMessage(populatedMessage),
    });
  }
);

router.post("/conversations/:id/read", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !conversationHasUser(conversation, req.user.id)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const seenAt = new Date();

  conversation.participants = conversation.participants.map((participant) => ({
    ...participant.toObject?.(),
    lastReadAt: String(participant.user?._id || participant.user) === String(req.user.id) ? seenAt : participant.lastReadAt,
  }));
  await conversation.save();

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: req.user.id },
      "readBy.user": { $ne: req.user.id },
    },
    {
      $push: {
        readBy: {
          user: req.user.id,
          seenAt,
        },
      },
    }
  );

  await Notification.updateMany(
    {
      user: req.user.id,
      conversation: conversation._id,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    }
  );

  return res.json({ success: true, message: "Conversation marked as read." });
});

router.put(
  "/conversations/:id/group",
  [
    body("name").optional().trim().notEmpty().withMessage("Group name cannot be empty."),
    body("participantIds").optional().isArray({ min: 1 }).withMessage("At least one participant is required."),
    handleValidation,
  ],
  async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversationHasUser(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ success: false, message: "Only groups can be updated here." });
    }

    if (!canManageGroup(conversation, req.user)) {
      return res.status(403).json({ success: false, message: "Only a group admin can manage this group." });
    }

    if (typeof req.body.name === "string") {
      conversation.name = req.body.name.trim();
    }

    if (Array.isArray(req.body.participantIds)) {
      const requestedIds = [...new Set(req.body.participantIds.map((value) => String(value)))];
      const participantIds = [...new Set([String(req.user.id), ...requestedIds])];

      const participants = await User.find({
        _id: { $in: participantIds },
        status: "active",
      }).select("_id");

      if (participants.length !== participantIds.length) {
        return res.status(400).json({ success: false, message: "One or more selected users are invalid." });
      }

      const existingParticipantMap = new Map(
        conversation.participants.map((participant) => [
          String(participant.user?._id || participant.user),
          participant.toObject?.() || participant,
        ])
      );

      conversation.participants = participantIds.map((userId) => {
        const existingParticipant = existingParticipantMap.get(String(userId));

        return {
          user: userId,
          joinedAt: existingParticipant?.joinedAt || new Date(),
          lastReadAt:
            existingParticipant?.lastReadAt || (String(userId) === String(req.user.id) ? new Date() : null),
        };
      });
    }

    await conversation.save();

    return res.json({
      success: true,
      data: await formatConversation(conversation, req.user.id),
      message: "Group updated successfully.",
    });
  }
);

router.delete("/conversations/:id", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !conversationHasUser(conversation, req.user.id)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  const isDirectConversation = conversation.type === "direct";
  const isGroupAdmin = canManageGroup(conversation, req.user);

  if (!isDirectConversation && !isGroupAdmin) {
    return res.status(403).json({ success: false, message: "Only a group admin can delete this group." });
  }

  await Promise.all([
    Message.deleteMany({ conversation: conversation._id }),
    Notification.deleteMany({ conversation: conversation._id }),
    Conversation.findByIdAndDelete(conversation._id),
  ]);

  return res.json({ success: true, message: "Conversation deleted successfully." });
});

router.delete("/messages/:id", async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found." });
  }

  const conversation = await Conversation.findById(message.conversation);

  if (!conversation || !conversationHasUser(conversation, req.user.id)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  if (String(message.sender) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: "You can delete only your own messages." });
  }

  await Promise.all([
    Message.findByIdAndDelete(message._id),
    Notification.deleteMany({ relatedMessage: message._id }),
  ]);

  await refreshConversationLastMessage(conversation._id);

  return res.json({ success: true, message: "Message deleted successfully." });
});

router.get("/notifications", async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("sender", "name email role profileImage")
    .limit(100);

  return res.json({
    success: true,
    data: notifications.map((notification) => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      conversationId: notification.conversation?.toString?.() || null,
      sender: notification.sender ? sanitizeUser(notification.sender) : null,
    })),
  });
});

router.post("/notifications/read-all", async (req, res) => {
  await Notification.updateMany(
    {
      user: req.user.id,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );

  return res.json({ success: true, message: "Notifications marked as read." });
});

router.post("/notifications/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user.id,
    },
    {
      $set: { isRead: true },
    },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }

  return res.json({ success: true, message: "Notification marked as read." });
});

module.exports = router;
