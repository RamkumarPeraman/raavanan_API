const mongoose = require("mongoose");

const projectSummarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    beneficiaries: { type: String, default: "" },
    budget: { type: String, default: "" },
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    quote: { type: String, required: true },
  },
  { _id: false }
);

const financialSchema = new mongoose.Schema(
  {
    income: { type: String, default: "" },
    expenses: { type: String, default: "" },
    breakdown: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["annual", "quarterly", "impact", "financial", "project", "field_visit", "sustainability", "publication"],
      required: true,
    },
    category: { type: String, default: "" },
    year: { type: String, default: "" },
    period: { type: String, default: "" },
    publishedDate: { type: Date, required: true },
    description: { type: String, required: true },
    summary: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    pages: { type: Number, min: 0, default: 0 },
    downloads: { type: Number, min: 0, default: 0 },
    views: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    thumbnail: { type: String, default: "" },
    url: { type: String, default: "" },
    metrics: { type: Map, of: String, default: {} },
    highlights: { type: [String], default: [] },
    projects: { type: [projectSummarySchema], default: [] },
    testimonials: { type: [testimonialSchema], default: [] },
    financial: { type: financialSchema, default: undefined },
    gallery: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Report || mongoose.model("Report", reportSchema);
