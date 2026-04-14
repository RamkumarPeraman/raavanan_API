const AdminSettings = require("../models/AdminSettings");

const getAdminSettings = async (req, res) => {
  let settings = await AdminSettings.findOne({ key: "global" }).lean();
  if (!settings) {
    settings = await AdminSettings.create({ key: "global" });
    settings = settings.toObject();
  }
  return res.json({ success: true, data: settings });
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

  const settings = await AdminSettings.findOneAndUpdate(
    { key: "global" },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  return res.json({ success: true, data: settings, message: "Settings updated successfully." });
};

module.exports = { getAdminSettings, updateAdminSettings };
