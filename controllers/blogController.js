const Blog = require("../models/Blog");

const serializeBlog = (blog) => {
  const data = blog.toObject ? blog.toObject() : blog;
  return { ...data, id: String(data._id) };
};

const listBlogs = async (req, res) => {
  const blogs = await Blog.find().sort({ date: -1, createdAt: -1 }).lean();
  return res.json({ success: true, data: blogs.map(serializeBlog) });
};

const getBlogById = async (req, res) => {
  const blog = await Blog.findById(req.params.id).lean();
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found." });
  }
  return res.json({ success: true, data: serializeBlog(blog) });
};

const createBlog = async (req, res) => {
  const blog = await Blog.create(req.body);
  return res.status(201).json({ success: true, message: "Blog created successfully.", data: serializeBlog(blog) });
};

const updateBlog = async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found." });
  }
  return res.json({ success: true, message: "Blog updated successfully.", data: serializeBlog(blog) });
};

const deleteBlog = async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    return res.status(404).json({ success: false, message: "Blog not found." });
  }
  return res.json({ success: true, message: "Blog deleted successfully." });
};

module.exports = {
  listBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};
