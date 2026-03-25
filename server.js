require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const donationRoutes = require("./routes/donations");
const serviceRoutes = require("./routes/services");
const volunteerRoutes = require("./routes/volunteers");
const projectRoutes = require("./routes/projects");
const eventRoutes = require("./routes/events");
const blogRoutes = require("./routes/blogs");
const reportRoutes = require("./routes/reports");
const volunteerOpportunityRoutes = require("./routes/volunteerOpportunities");
const { store } = require("./data/store");
const { projectSeeds } = require("./data/projectSeeds");
const { eventSeeds, blogSeeds, volunteerOpportunitySeeds, reportSeeds } = require("./data/contentSeeds");
const { buildSwaggerSpec } = require("./docs/swagger");
const User = require("./models/User");
const Project = require("./models/Project");
const Event = require("./models/Event");
const Blog = require("./models/Blog");
const Report = require("./models/Report");
const VolunteerOpportunity = require("./models/VolunteerOpportunity");
const bcrypt = require("bcryptjs");
const { createMembershipId, resolveMembershipType } = require("./utils/userHelpers");

const app = express();
const PORT = process.env.PORT || 5000;
const swaggerSpec = buildSwaggerSpec(PORT);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Raavanan API is running.",
    database: process.env.MONGODB_URI ? "configured" : "in-memory",
  });
});

app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/volunteer-opportunities", volunteerOpportunityRoutes);
app.get("/api/testimonials", (req, res) => res.json({ success: true, data: store.testimonials }));
app.get("/api/merchandise", (req, res) => res.json({ success: true, data: store.merchandise }));

app.post("/api/contact", (req, res) => {
  res.status(201).json({ success: true, message: "Contact form submitted successfully.", data: req.body });
});

app.post("/api/feedback", (req, res) => {
  res.status(201).json({ success: true, message: "Feedback submitted successfully.", data: req.body });
});

app.post("/api/newsletter/subscribe", (req, res) => {
  res.status(201).json({ success: true, message: "Subscribed successfully.", email: req.body.email });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Uploaded image is too large. Please use a smaller image.",
    });
  }

  res.status(500).json({ success: false, message: "Internal server error." });
});

const seedUsers = async () => {
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0) {
    return;
  }

  const seedData = [
    ["superadmin@rtngo.org", "Super Admin", "super_admin", "admin123", "Administration"],
    ["admin@rtngo.org", "Admin User", "admin", "admin123", "Administration"],
    ["manager@rtngo.org", "Program Manager", "manager", "manager123", "Education"],
    ["coordinator@rtngo.org", "Volunteer Coordinator", "volunteer_coordinator", "coord123", "Volunteer Management"],
    ["volunteer@rtngo.org", "Volunteer User", "volunteer", "vol12345", "Environment"],
    ["donor@rtngo.org", "Donor User", "donor", "donor123", "Fundraising"],
    ["member@rtngo.org", "Member User", "member", "member123", "Education"],
  ];

  await User.insertMany(
    await Promise.all(
      seedData.map(async ([email, name, role, password, department]) => ({
        name,
        email,
        phone: "",
        role,
        status: "active",
        department,
        membershipId: createMembershipId(),
        membershipType: resolveMembershipType(role),
        passwordHash: await bcrypt.hash(password, 10),
        joinDate: new Date().toISOString().split("T")[0],
        lastActive: new Date(),
      }))
    )
  );
};

const seedProjects = async () => {
  const existingProjects = await Project.countDocuments();

  if (existingProjects > 0) {
    return;
  }

  await Project.insertMany(projectSeeds);
};

const seedCollection = async (Model, seedData) => {
  const existingCount = await Model.countDocuments();
  if (existingCount > 0) {
    return;
  }
  await Model.insertMany(seedData);
};

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }

  await connectDB();
  await seedUsers();
  await seedProjects();
  await seedCollection(Event, eventSeeds);
  await seedCollection(Blog, blogSeeds);
  await seedCollection(Report, reportSeeds);
  await seedCollection(VolunteerOpportunity, volunteerOpportunitySeeds);

  app.listen(PORT, () => {
    console.log(`Raavanan API listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
