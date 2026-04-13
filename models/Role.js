const mongoose = require("mongoose");

const AVAILABLE_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "roles:read",
  "roles:write",
  "roles:delete",
  "volunteers:read",
  "volunteers:write",
  "volunteers:delete",
  "projects:read",
  "projects:write",
  "projects:delete",
  "events:read",
  "events:write",
  "events:delete",
  "blogs:read",
  "blogs:write",
  "blogs:delete",
  "donations:read",
  "donations:write",
  "donations:delete",
  "reports:read",
  "reports:write",
  "reports:delete",
  "services:read",
  "services:write",
  "services:delete",
];

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    permissions: {
      type: [{ type: String, enum: AVAILABLE_PERMISSIONS }],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    color: {
      type: String,
      default: "#0d9488",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
module.exports.AVAILABLE_PERMISSIONS = AVAILABLE_PERMISSIONS;
