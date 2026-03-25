const mongoose = require("mongoose");
const { normalizeRole } = require("../utils/userHelpers");

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  { _id: false }
);

const PreferencesSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    whatsappUpdates: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    volunteerOpportunities: { type: Boolean, default: true },
  },
  { _id: false }
);

const PrivacySchema = new mongoose.Schema(
  {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: true },
    showAddress: { type: Boolean, default: false },
    showDonations: { type: Boolean, default: true },
  },
  { _id: false }
);

const StatsSchema = new mongoose.Schema(
  {
    volunteerHours: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    donationsMade: { type: Number, default: 0 },
    totalDonated: { type: Number, default: 0 },
    projectsSupported: { type: Number, default: 0 },
    badges: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "volunteer_coordinator", "member", "volunteer", "donor"],
      default: "member",
      set: normalizeRole,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    department: { type: String, default: "" },
    location: { type: String, default: "" },
    profileImage: { type: String, default: null },
    bio: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    gender: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    address: { type: AddressSchema, default: () => ({}) },
    occupation: { type: String, default: "" },
    organization: { type: String, default: "" },
    joinDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
    membershipId: { type: String, unique: true, sparse: true },
    membershipType: { type: String, default: "Regular Member" },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    privacy: { type: PrivacySchema, default: () => ({}) },
    stats: { type: StatsSchema, default: () => ({}) },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
