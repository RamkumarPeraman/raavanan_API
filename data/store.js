const bcrypt = require("bcryptjs");

const createSeedUser = (overrides = {}) => {
  const password = overrides.password || "password123";

  return {
    id: overrides.id,
    name: overrides.name,
    email: overrides.email,
    phone: overrides.phone || "",
    role: overrides.role || "user",
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
};

const store = {
  users: [
    createSeedUser({
      id: "user_1",
      name: "Admin User",
      email: "admin@rtngo.org",
      phone: "9876543210",
      role: "admin",
      password: "admin123",
    }),
    createSeedUser({
      id: "user_2",
      name: "Member User",
      email: "member@rtngo.org",
      phone: "9876501234",
      role: "user",
      password: "member123",
    }),
  ],
  donations: [
    {
      id: "don_1",
      type: "one-time",
      amount: 5000,
      project: "education",
      paymentMethod: "upi",
      paymentStatus: "completed",
      name: "Priya Singh",
      email: "priya@example.com",
      phone: "9876543210",
      createdAt: new Date("2026-03-01").toISOString(),
    },
    {
      id: "don_2",
      type: "monthly",
      amount: 2500,
      project: "general",
      paymentMethod: "card",
      paymentStatus: "pending",
      name: "Anonymous",
      email: "anonymous@example.com",
      phone: "9000000000",
      createdAt: new Date("2026-03-10").toISOString(),
    },
  ],
  services: [
    {
      id: "srv_1",
      name: "Village Learning Support",
      email: "service@example.com",
      phone: "9123456780",
      category: "education",
      message: "Need educational material support for weekend classes.",
      status: "pending",
      createdAt: new Date("2026-03-05").toISOString(),
    },
  ],
  volunteers: [
    {
      id: "vol_1",
      fullName: "Arun Kumar",
      email: "volunteer@rtngo.org",
      phone: "9988776655",
      city: "Chennai",
      skills: ["Teaching", "Fundraising"],
      interests: ["Education", "Community Development"],
      availability: {
        weekdays: false,
        weekends: true,
        mornings: true,
        afternoons: false,
        evenings: true,
      },
      status: "active",
      passwordHash: bcrypt.hashSync("vol123", 10),
      createdAt: new Date("2026-03-12").toISOString(),
    },
  ],
  blogs: [
    {
      id: 1,
      title: "Community Education Drive Reaches New Districts",
      excerpt: "Our volunteers expanded weekend learning centers to three more districts.",
      content: "<p>Raavanan volunteers are building local momentum across new districts with focused education support.</p>",
      author: "Team Raavanan",
      date: "2026-03-01",
      category: "Impact Stories",
      image: "/assets/blogs/education.jpg",
      readTime: 4,
      tags: ["education", "community"],
    },
  ],
  events: [
    {
      id: 1,
      title: "Volunteer Orientation Camp",
      description: "Meet the team, learn the workflow, and get assigned to a service area.",
      date: "2026-04-05",
      time: "10:00 - 13:00",
      location: "Chennai",
      type: "Volunteer Training",
      capacity: 60,
      registered: 18,
      price: 0,
      speakers: ["Program Lead", "Volunteer Coordinator"],
      image: "/assets/events/orientation.jpg",
    },
  ],
  projects: [
    {
      id: 1,
      title: "Education for All",
      category: "Education",
      description: "Weekend learning support for underserved children.",
      status: "ongoing",
    },
  ],
  reports: [
    {
      id: 1,
      title: "Annual Report 2025-26",
      category: "Annual Report",
      publishedDate: "2026-03-20",
      pages: 32,
      downloads: 120,
      views: 450,
    },
  ],
  testimonials: [
    {
      id: 1,
      name: "Meena",
      role: "Volunteer",
      content: "The program structure makes it easy to contribute consistently.",
      rating: 5,
    },
  ],
  merchandise: [
    {
      id: 1,
      name: "Raavanan T-Shirt",
      price: 499,
      category: "Apparel",
      inStock: true,
    },
  ],
};

const nextId = (prefix) => `${prefix}_${Date.now()}`;

module.exports = { store, nextId };
