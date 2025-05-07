const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");
const ReportsController = require("../Controller/Reports.controller");

router.get("/reports", authMiddleware, ReportsController.getUserReports);
router.get("/topvul", authMiddleware, ReportsController.getTopVul);
router.get("/mostvul", authMiddleware, ReportsController.getMostVul);
router.get("/vulnerability/:vulnId", authMiddleware, ReportsController.getVul);
router.get(
  "/vulnerabilities-by-year",
  authMiddleware,
  ReportsController.getVulnerabilitiesByYear
);
router.get("/cvss-scores", authMiddleware, ReportsController.getCvssScoresOnly);

module.exports = router;
