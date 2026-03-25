const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    readTime: { type: Number, min: 1, default: 1 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
