const AdminSettings = require("../models/AdminSettings");

const sanitizeHeroNewsCarousel = (slides = []) =>
  Array.isArray(slides)
    ? slides
        .map((slide, index) => ({
          id: String(slide?.id || `hero-slide-${Date.now()}-${index}`),
          category: String(slide?.category || "Latest News").trim(),
          title: String(slide?.title || "").trim(),
          summary: String(slide?.summary || "").trim(),
          image: String(slide?.image || "").trim(),
          link: String(slide?.link || "").trim(),
          buttonLabel: String(slide?.buttonLabel || "Read more").trim(),
        }))
        .filter((slide) => slide.title || slide.summary || slide.image)
    : [];

const serializeAdminSettings = (settings = {}) => ({
  ...settings,
  donationQrImage: settings?.donationQrImage || "",
  bankDetails: {
    accountHolder: settings?.bankDetails?.accountHolder || "Partha Sarathi V",
    bank: settings?.bankDetails?.bank || "Canara Bank",
    branch: settings?.bankDetails?.branch || "Pattiveeranpatti",
    accountNo: settings?.bankDetails?.accountNo || "110301563866",
    ifscCode: settings?.bankDetails?.ifscCode || "CNRB0008438",
  },
  heroNewsCarousel: sanitizeHeroNewsCarousel(settings?.heroNewsCarousel),
});

const getAdminSettings = async (req, res) => {
  let settings = await AdminSettings.findOne({ key: "global" }).lean();
  if (!settings) {
    settings = await AdminSettings.create({ key: "global" });
    settings = settings.toObject();
  }
  return res.json({ success: true, data: serializeAdminSettings(settings) });
};

const updateAdminSettings = async (req, res) => {
  const update = {};

  if (req.body.donationQrImage !== undefined) {
    update.donationQrImage = req.body.donationQrImage;
  }

  if (req.body.bankDetails) {
    const bd = req.body.bankDetails;
    update["bankDetails.accountHolder"] = bd.accountHolder !== undefined ? bd.accountHolder : undefined;
    update["bankDetails.bank"] = bd.bank !== undefined ? bd.bank : undefined;
    update["bankDetails.branch"] = bd.branch !== undefined ? bd.branch : undefined;
    update["bankDetails.accountNo"] = bd.accountNo !== undefined ? bd.accountNo : undefined;
    update["bankDetails.ifscCode"] = bd.ifscCode !== undefined ? bd.ifscCode : undefined;

    // Remove undefined keys
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  }

  if (req.body.heroNewsCarousel !== undefined) {
    update.heroNewsCarousel = sanitizeHeroNewsCarousel(req.body.heroNewsCarousel);
  }

  const settings = await AdminSettings.findOneAndUpdate(
    { key: "global" },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  return res.json({ success: true, data: serializeAdminSettings(settings), message: "Settings updated successfully." });
};

module.exports = { getAdminSettings, updateAdminSettings };
