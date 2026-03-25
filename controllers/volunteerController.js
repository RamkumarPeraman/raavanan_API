const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Volunteer = require("../models/Volunteer");

const VOLUNTEER_FIELDS = [
  "fullName",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
  "dateOfBirth",
  "occupation",
  "interests",
  "skills",
  "availability",
  "hoursPerWeek",
  "experience",
  "motivation",
  "emergencyContact",
  "hearAbout",
  "status",
];

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [];
};

const sanitizeVolunteerPayload = (payload = {}, { isUpdate = false } = {}) => {
  const sanitized = {};

  for (const field of VOLUNTEER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      sanitized[field] = payload[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "name") && !sanitized.fullName) {
    sanitized.fullName = payload.name;
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "email") && typeof sanitized.email === "string") {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "fullName") && typeof sanitized.fullName === "string") {
    sanitized.fullName = sanitized.fullName.trim();
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "phone") && typeof sanitized.phone === "string") {
    sanitized.phone = sanitized.phone.trim();
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "interests")) {
    sanitized.interests = toArray(sanitized.interests);
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "skills")) {
    sanitized.skills = toArray(sanitized.skills);
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "availability")) {
    sanitized.availability =
      sanitized.availability && typeof sanitized.availability === "object" && !Array.isArray(sanitized.availability)
        ? sanitized.availability
        : {};
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, "emergencyContact")) {
    sanitized.emergencyContact =
      sanitized.emergencyContact && typeof sanitized.emergencyContact === "object" && !Array.isArray(sanitized.emergencyContact)
        ? {
            name: sanitized.emergencyContact.name || "",
            phone: sanitized.emergencyContact.phone || "",
            relationship: sanitized.emergencyContact.relationship || "",
          }
        : { name: "", phone: "", relationship: "" };
  }

  if (!isUpdate && !sanitized.status) {
    sanitized.status = "pending";
  }

  return sanitized;
};

const serializeVolunteer = (volunteer) => {
  const data = volunteer.toObject ? volunteer.toObject() : volunteer;

  return {
    ...data,
    id: String(data._id),
  };
};

const listVolunteers = async (req, res) => {
  const query = {};

  if (req.query.status && req.query.status !== "all") {
    query.status = req.query.status;
  }

  if (req.query.search) {
    query.$or = [
      { fullName: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
      { city: { $regex: req.query.search, $options: "i" } },
      { state: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const volunteers = await Volunteer.find(query).sort({ createdAt: -1 }).lean();

  return res.json({
    success: true,
    data: volunteers.map(serializeVolunteer),
  });
};

const getVolunteerById = async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id).lean();

  if (!volunteer) {
    return res.status(404).json({ success: false, message: "Volunteer not found." });
  }

  return res.json({ success: true, data: serializeVolunteer(volunteer) });
};

const registerVolunteer = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const existingVolunteer = await Volunteer.findOne({ email }).lean();

  if (existingVolunteer) {
    return res.status(409).json({ success: false, message: "Volunteer already registered with this email." });
  }

  const volunteerPayload = sanitizeVolunteerPayload({ ...req.body, email }, { isUpdate: false });
  volunteerPayload.passwordHash = await bcrypt.hash(req.body.password || "volunteer123", 10);

  const volunteer = await Volunteer.create(volunteerPayload);

  return res.status(201).json({
    success: true,
    volunteerId: String(volunteer._id),
    message: "Volunteer registration submitted successfully.",
    data: serializeVolunteer(volunteer),
  });
};

const volunteerLogin = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const volunteer = await Volunteer.findOne({ email }).select("+passwordHash");

  if (!volunteer) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(req.body.password || "", volunteer.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const token = jwt.sign(
    { id: String(volunteer._id), email: volunteer.email, role: "volunteer" },
    process.env.JWT_SECRET || "raavanan-dev-secret",
    { expiresIn: "7d" }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: String(volunteer._id),
      name: volunteer.fullName,
      email: volunteer.email,
      role: "volunteer",
      status: volunteer.status,
    },
  });
};

const updateVolunteerStatus = async (req, res) => {
  const update = {};

  if (req.body.status) {
    update.status = req.body.status;
  }

  const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });

  if (!volunteer) {
    return res.status(404).json({ success: false, message: "Volunteer not found." });
  }

  return res.json({
    success: true,
    message: "Volunteer status updated successfully.",
    data: { id: String(volunteer._id), status: volunteer.status },
  });
};

module.exports = {
  listVolunteers,
  getVolunteerById,
  registerVolunteer,
  volunteerLogin,
  updateVolunteerStatus,
};
