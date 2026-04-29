const Donation = require("../models/Donation");

const serializeDonation = (donation) => {
  const data = donation.toObject ? donation.toObject() : donation;

  return {
    ...data,
    id: String(data._id),
  };
};

const listDonations = async (req, res) => {
  const query = {};

  if (req.query.status && req.query.status !== "all") {
    query.paymentStatus = req.query.status;
  }
  if (req.query.type && req.query.type !== "all") {
    query.type = req.query.type;
  }
  if (req.query.project && req.query.project !== "all") {
    query.project = req.query.project;
  }

  const donations = await Donation.find(query).sort({ createdAt: -1 }).lean();

  return res.json({ success: true, data: donations.map(serializeDonation) });
};

const getDonationById = async (req, res) => {
  const donation = await Donation.findById(req.params.id).lean();

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found." });
  }

  return res.json({ success: true, data: serializeDonation(donation) });
};

const createDonation = async (req, res) => {
  const donation = await Donation.create({
    type: req.body.type || "one-time",
    amount: Number(req.body.amount || 0),
    project: req.body.project || "general",
    paymentMethod: req.body.paymentMethod || "upi",
    paymentStatus: "pending",
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address || "",
    city: req.body.city || "",
    state: req.body.state || "",
    pincode: req.body.pincode || "",
    pan: req.body.pan || "",
    anonymous: Boolean(req.body.anonymous),
    transactionId: req.body.transactionId || "",
    paymentScreenshot: req.body.paymentScreenshot || "",
    message: req.body.message || "",
  });

  return res.status(201).json({
    success: true,
    donationId: String(donation._id),
    message: "Donation recorded successfully.",
    data: serializeDonation(donation),
  });
};

const updateDonation = async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found." });
  }

  const fields = [
    "name",
    "email",
    "phone",
    "amount",
    "type",
    "project",
    "paymentMethod",
    "paymentStatus",
    "address",
    "city",
    "state",
    "pincode",
    "pan",
    "paymentId",
    "transactionId",
    "paymentScreenshot",
    "message",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      donation[field] = field === "amount" ? Number(req.body[field] || 0) : req.body[field];
    }
  });

  if (req.body.anonymous !== undefined) {
    donation.anonymous = Boolean(req.body.anonymous);
  }

  await donation.save();

  return res.json({
    success: true,
    message: "Donation updated successfully.",
    data: serializeDonation(donation),
  });
};

const updateDonationStatus = async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found." });
  }

  donation.paymentStatus = req.body.paymentStatus || donation.paymentStatus;

  if (req.body.paymentId !== undefined) {
    donation.paymentId = req.body.paymentId || "";
  }

  await donation.save();

  return res.json({
    success: true,
    message: "Donation updated successfully.",
    data: serializeDonation(donation),
  });
};

const deleteDonation = async (req, res) => {
  const donation = await Donation.findByIdAndDelete(req.params.id);

  if (!donation) {
    return res.status(404).json({ success: false, message: "Donation not found." });
  }

  return res.json({
    success: true,
    message: "Donation deleted successfully.",
  });
};

const getDonationStats = async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [allStats, monthlyDonors, oneTimeDonors, monthlyStats] = await Promise.all([
    Donation.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalDonations: { $sum: 1 },
        },
      },
    ]),
    Donation.countDocuments({ type: "monthly" }),
    Donation.countDocuments({ type: { $ne: "monthly" } }),
    Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          thisMonthAmount: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  return res.json({
    success: true,
    data: {
      totalAmount: allStats[0]?.totalAmount || 0,
      totalDonations: allStats[0]?.totalDonations || 0,
      monthlyDonors,
      oneTimeDonors,
      thisMonthAmount: monthlyStats[0]?.thisMonthAmount || 0,
    },
  });
};

module.exports = {
  listDonations,
  getDonationById,
  createDonation,
  updateDonation,
  updateDonationStatus,
  getDonationStats,
  deleteDonation,
};
