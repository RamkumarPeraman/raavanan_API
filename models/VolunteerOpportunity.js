const mongoose = require("mongoose");

const volunteerOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    commitment: { type: String, required: true, trim: true },
    spots: { type: Number, min: 1, default: 1 },
    description: { type: String, required: true, trim: true },
    requirements: [{ type: String }],
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VolunteerOpportunity || mongoose.model("VolunteerOpportunity", volunteerOpportunitySchema);
