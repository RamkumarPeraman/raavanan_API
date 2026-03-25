const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    occupation: { type: String, default: "" },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    availability: { type: mongoose.Schema.Types.Mixed, default: {} },
    hoursPerWeek: { type: String, default: "" },
    experience: { type: String, default: "" },
    motivation: { type: String, default: "" },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" },
    },
    hearAbout: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);
