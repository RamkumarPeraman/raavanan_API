const mongoose = require("mongoose");

const AdminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    donationQrImage: { type: String, default: "" }, // base64 or URL
    bankDetails: {
      accountHolder: { type: String, default: "Partha Sarathi V" },
      bank: { type: String, default: "Canara Bank" },
      branch: { type: String, default: "Pattiveeranpatti" },
      accountNo: { type: String, default: "110301563866" },
      ifscCode: { type: String, default: "CNRB0008438" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminSettings || mongoose.model("AdminSettings", AdminSettingsSchema);
