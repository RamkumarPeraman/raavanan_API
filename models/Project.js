const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    longDescription: { type: String, default: "" },
    image: { type: String, default: "" },
    gallery: [{ type: String }],
    status: {
      type: String,
      enum: ["ongoing", "completed", "planned"],
      default: "ongoing",
    },
    category: { type: String, required: true, trim: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    goal: { type: Number, min: 0, default: 0 },
    raised: { type: Number, min: 0, default: 0 },
    location: { type: String, default: "" },
    statesCovered: [{ type: String }],
    startDate: { type: Date },
    endDate: { type: Date },
    impact: {
      type: Map,
      of: Number,
      default: {},
    },
    livesImpacted: { type: Number, min: 0, default: 0 },
    volunteersEngaged: { type: Number, min: 0, default: 0 },
    objectives: [{ type: String }],
    achievements: [{ type: String }],
    partners: [{ type: String }],
    funding: [{ type: String }],
    reportUrl: { type: String, default: "" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);
