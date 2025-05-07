const Report = require("../models/Report.js");
const mongoose = require("mongoose");

exports.getUserReports = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    console.log("Fetching reports for user:", userId);

    const userIdString = String(userId);
    console.log("Querying reports for userId:", userIdString);

    const reports = await Report.find({ userId: userIdString });
    console.log("Reports found:", reports);

    if (!reports.length) {
      return res
        .status(200)
        .json({ success: true, message: "No reports found", data: [] });
    }

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reports" });
  }
};

exports.getTopVul = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    let query;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query = { userId: new mongoose.Types.ObjectId(userId) };
    } else {
      query = { userId: userId };
    }

    const reports = await Report.find(query, {
      "vulnerabilities.bug_name": 1,
      "vulnerabilities.severity": 1,
      _id: 0,
    });

    if (!reports.length) {
      return res
        .status(200)
        .json({ success: true, message: "No vulnerabilities found", data: [] });
    }

    // Flatten and transform the vulnerabilities array
    const vulnerabilities = reports.flatMap((report) =>
      (report.vulnerabilities || []).map((vuln) => ({
        bug_name: vuln.bug_name,
        severity: vuln.severity,
      }))
    );

    res.status(200).json({ success: true, data: vulnerabilities });
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch vulnerabilities" });
  }
};

exports.getMostVul = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    let query;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query = { userId: new mongoose.Types.ObjectId(userId) };
    } else {
      query = { userId: userId };
    }
    const reports = await Report.find(query, {
      "vulnerabilities.location": 1,
      "vulnerabilities.severity": 1,
      _id: 0,
    });

    if (!reports.length) {
      return res
        .status(200)
        .json({ success: true, message: "No vulnerabilities found", data: [] });
    }
    const vulnerabilities = reports.flatMap((report) =>
      (report.vulnerabilities || []).map((vuln) => ({
        location: vuln.location,
        severity: vuln.severity,
      }))
    );
    console.log(vulnerabilities);
    res.status(200).json({ success: true, data: vulnerabilities });
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch vulnerabilities" });
  }
};

exports.getVul = async (req, res) => {
  const { vulnId } = req.params;

  try {
    const report = await Report.findOne({
      "vulnerabilities._id": vulnId,
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Vulnerability not found" });
    }

    const vulnerability = report.vulnerabilities.find(
      (vuln) => vuln._id.toString() === vulnId
    );

    if (!vulnerability) {
      return res
        .status(404)
        .json({ success: false, message: "Vulnerability not found" });
    }

    const responseData = {
      name: vulnerability.bug_name,
      severity: vulnerability.severity,
      location: vulnerability.location,
      description: vulnerability.description,
      impact: vulnerability.impact,
      proofOfConcept: vulnerability.proof_of_concept,
      remediation: vulnerability.remediation,
      domain: report.domain,
      ip_address: report.ip_address,
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error fetching vulnerability details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vulnerability details",
      error,
    });
  }
};

exports.getVulnerabilitiesByYear = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const matchQuery = { userId };

    // Aggregate vulnerabilities by year using the 'year' field
    const vulnerabilitiesByYear = await Report.aggregate([
      { $match: matchQuery },
      { $unwind: "$vulnerabilities" },
      {
        $group: {
          _id: "$year",
          totalVulnerabilities: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          year: "$_id",
          totalVulnerabilities: 1,
          _id: 0,
        },
      },
    ]);

    // Aggregate total vulnerabilities count
    const totalVulnerabilities = await Report.aggregate([
      { $match: matchQuery },
      { $unwind: "$vulnerabilities" },
      { $count: "total" },
    ]);

    const total = totalVulnerabilities[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message:
        vulnerabilitiesByYear.length > 0
          ? "Vulnerabilities fetched successfully"
          : "No vulnerabilities found",
      data: vulnerabilitiesByYear,
      totalVulnerabilities: total,
    });
  } catch (error) {
    console.error("Error fetching vulnerabilities by year:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vulnerabilities by year",
    });
  }
};

exports.getCvssScoresOnly = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const userId = req.userId;
    const reports = await Report.find({ userId });

    if (!reports || reports.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No reports found for this user" });
    }

    const cvssScores = [];
    reports.forEach((report) => {
      report.vulnerabilities.forEach((vuln) => {
        if (vuln.cvss_score && vuln.cvss_score !== "") {
          cvssScores.push(parseFloat(vuln.cvss_score));
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: "CVSS scores fetched successfully",
      data: cvssScores,
    });
  } catch (error) {
    console.error("Error fetching CVSS scores:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
