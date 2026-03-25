const express = require("express");
const { body } = require("express-validator");
const {
  listDonations,
  getDonationById,
  createDonation,
  updateDonationStatus,
  getDonationStats,
} = require("../controllers/donationController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidation } = require("../middleware/validation");

const router = express.Router();

router.get("/stats", authenticate, authorize("ADMIN", "SUPER_ADMIN"), getDonationStats);
router.get("/", authenticate, authorize("ADMIN", "SUPER_ADMIN"), listDonations);
router.get("/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), getDonationById);
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required."),
    body("phone").trim().notEmpty().withMessage("Phone number is required."),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero."),
    handleValidation,
  ],
  createDonation
);
router.put("/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), updateDonationStatus);

module.exports = router;

