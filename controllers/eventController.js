const Event = require("../models/Event");
const User = require("../models/User");

const serializeEvent = (event) => {
  const data = event.toObject ? event.toObject() : event;
  return {
    ...data,
    id: String(data._id),
    registered: typeof data.registered === "number" ? data.registered : Array.isArray(data.attendees) ? data.attendees.length : 0,
  };
};

const listEvents = async (req, res) => {
  const events = await Event.find().sort({ date: 1, createdAt: -1 }).lean();
  return res.json({ success: true, data: events.map(serializeEvent) });
};

const listMyRegisteredEvents = async (req, res) => {
  const events = await Event.find({ "attendees.userId": req.user.id }).sort({ date: 1, createdAt: -1 }).lean();
  return res.json({ success: true, data: events.map(serializeEvent) });
};

const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found." });
  }
  return res.json({ success: true, data: serializeEvent(event) });
};

const createEvent = async (req, res) => {
  const payload = {
    ...req.body,
    registered: Array.isArray(req.body.attendees) ? req.body.attendees.length : req.body.registered || 0,
  };
  const event = await Event.create(payload);
  return res.status(201).json({ success: true, message: "Event created successfully.", data: serializeEvent(event) });
};

const updateEvent = async (req, res) => {
  const payload = {
    ...req.body,
    registered:
      req.body.registered !== undefined
        ? req.body.registered
        : Array.isArray(req.body.attendees)
          ? req.body.attendees.length
          : undefined,
  };

  const event = await Event.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found." });
  }
  return res.json({ success: true, message: "Event updated successfully.", data: serializeEvent(event) });
};

const deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found." });
  }
  return res.json({ success: true, message: "Event deleted successfully." });
};

const registerForEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found." });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const alreadyRegistered = event.attendees.some((attendee) => String(attendee.userId) === String(req.user.id));
  if (alreadyRegistered) {
    return res.status(409).json({ success: false, message: "You are already registered for this event." });
  }

  if (event.capacity > 0 && event.attendees.length >= event.capacity) {
    return res.status(400).json({ success: false, message: "This event is already full." });
  }

  event.attendees.push({
    userId: user._id,
    name: user.name,
    email: user.email,
  });
  event.registered = event.attendees.length;
  await event.save();

  return res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      eventId: String(event._id),
      attendee: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
      },
      registered: event.registered,
    },
  });
};

module.exports = {
  listEvents,
  listMyRegisteredEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
};
